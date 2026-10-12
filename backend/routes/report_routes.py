import os
import time
import uuid
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, decode_token
from werkzeug.utils import secure_filename

from db import get_db_connection

report = Blueprint("report", __name__)

REPORT_FOLDER = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "upload", "report")
)
os.makedirs(REPORT_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "webp", "doc", "docx", "txt"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def ensure_reports_table():
    """Ensure medical_reports table exists."""
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS medical_reports (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    file_name VARCHAR(255) NOT NULL,
                    file_path VARCHAR(255) NOT NULL,
                    file_type VARCHAR(100) DEFAULT 'Lab result',
                    file_size INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            """)
            conn.commit()
        except Exception:
            pass
        finally:
            cursor.close()
            conn.close()


# Ensure table exists on import
ensure_reports_table()


def get_token_identity():
    """Extract and verify user_id from Authorization header or ?token= query parameter."""
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1].strip()
    elif request.args.get("token"):
        token = request.args.get("token").strip()

    if not token:
        return None

    try:
        decoded = decode_token(token)
        return decoded.get("sub")
    except Exception:
        return None


@report.route("", methods=["GET"])
@report.route("/", methods=["GET"])
@jwt_required()
def list_reports():
    user_id = get_jwt_identity()

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, user_id, file_name, file_path, file_type, file_size, created_at
            FROM medical_reports
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))
        rows = cursor.fetchall()

        reports = []
        for row in rows:
            created_at = row["created_at"]
            date_str = created_at.strftime("%d %b %Y") if hasattr(created_at, "strftime") else str(created_at)

            reports.append({
                "id": row["id"],
                "name": row["file_name"],
                "type": row["file_type"] or "Medical report",
                "size": row["file_size"],
                "date": date_str,
                "created_at": created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at),
                "view_url": f"/api/reports/{row['id']}/view",
                "download_url": f"/api/reports/{row['id']}/download",
            })

        return jsonify({
            "message": "Reports retrieved successfully",
            "reports": reports
        }), 200
    finally:
        cursor.close()
        conn.close()


@report.route("/upload", methods=["POST"])
@report.route("", methods=["POST"])
@report.route("/", methods=["POST"])
@jwt_required()
def upload_report():
    user_id = get_jwt_identity()

    if "file" not in request.files:
        return jsonify({"message": "No file uploaded. Please attach a file under 'file'."}), 400

    file = request.files["file"]

    if not file or not file.filename or file.filename.strip() == "":
        return jsonify({"message": "No file selected."}), 400

    if not allowed_file(file.filename):
        return jsonify({
            "message": f"File type not allowed. Supported extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        }), 400

    raw_filename = secure_filename(file.filename)
    if not raw_filename:
        raw_filename = f"report_{int(time.time())}.pdf"

    # Distinguish stored file name from user display name
    extension = raw_filename.rsplit(".", 1)[1].lower() if "." in raw_filename else "pdf"
    stored_filename = f"user_{user_id}_{int(time.time())}_{uuid.uuid4().hex[:8]}.{extension}"
    file_path = os.path.join(REPORT_FOLDER, stored_filename)

    file.save(file_path)
    file_size = os.path.getsize(file_path)

    display_name = request.form.get("name") or file.filename
    report_type = request.form.get("type") or request.form.get("report_type") or "Lab result"

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            INSERT INTO medical_reports (user_id, file_name, file_path, file_type, file_size)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, display_name, stored_filename, report_type, file_size))
        conn.commit()
        report_id = cursor.lastrowid

        return jsonify({
            "message": "Report uploaded successfully",
            "report": {
                "id": report_id,
                "name": display_name,
                "type": report_type,
                "size": file_size,
                "date": "Today",
                "view_url": f"/api/reports/{report_id}/view",
                "download_url": f"/api/reports/{report_id}/download",
            }
        }), 201
    finally:
        cursor.close()
        conn.close()


@report.route("/<int:report_id>/view", methods=["GET"])
def view_report(report_id):
    """View report inline in browser (supports ?token= query param or Authorization header)."""
    user_id = get_token_identity()
    if not user_id:
        return jsonify({"message": "Unauthorized. Token is missing or invalid."}), 401

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, user_id, file_name, file_path
            FROM medical_reports
            WHERE id = %s
        """, (report_id,))
        doc = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

    if not doc:
        return jsonify({"message": "Report not found"}), 404

    # Ensure requesting user owns this report (string comparison handles JWT identity types)
    if str(doc["user_id"]) != str(user_id):
        return jsonify({"message": "Forbidden. You do not have access to this document."}), 403

    disk_path = os.path.join(REPORT_FOLDER, doc["file_path"])
    if not os.path.exists(disk_path):
        return jsonify({"message": "File not found on server storage."}), 404

    return send_from_directory(
        REPORT_FOLDER,
        doc["file_path"],
        download_name=doc["file_name"],
        as_attachment=False
    )


@report.route("/<int:report_id>/download", methods=["GET"])
def download_report(report_id):
    """Download report file as attachment."""
    user_id = get_token_identity()
    if not user_id:
        return jsonify({"message": "Unauthorized. Token is missing or invalid."}), 401

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, user_id, file_name, file_path
            FROM medical_reports
            WHERE id = %s
        """, (report_id,))
        doc = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

    if not doc:
        return jsonify({"message": "Report not found"}), 404

    if str(doc["user_id"]) != str(user_id):
        return jsonify({"message": "Forbidden. You do not have access to this document."}), 403

    disk_path = os.path.join(REPORT_FOLDER, doc["file_path"])
    if not os.path.exists(disk_path):
        return jsonify({"message": "File not found on server storage."}), 404

    return send_from_directory(
        REPORT_FOLDER,
        doc["file_path"],
        download_name=doc["file_name"],
        as_attachment=True
    )


@report.route("/<int:report_id>", methods=["DELETE"])
@jwt_required()
def delete_report(report_id):
    user_id = get_jwt_identity()

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, user_id, file_path
            FROM medical_reports
            WHERE id = %s AND user_id = %s
        """, (report_id, user_id))
        doc = cursor.fetchone()

        if not doc:
            return jsonify({"message": "Report not found or not owned by user."}), 404

        # Delete physical file
        disk_path = os.path.join(REPORT_FOLDER, doc["file_path"])
        if os.path.exists(disk_path):
            try:
                os.remove(disk_path)
            except OSError:
                pass

        # Delete DB row
        cursor.execute("DELETE FROM medical_reports WHERE id = %s", (report_id,))
        conn.commit()

        return jsonify({"message": "Report deleted successfully"}), 200
    finally:
        cursor.close()
        conn.close()
