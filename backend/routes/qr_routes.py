import os
import secrets
from pathlib import Path

import qrcode
from flask import Blueprint, jsonify, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required

from db import get_db_connection

qr = Blueprint("qr", __name__)
QR_FOLDER = Path(__file__).resolve().parent.parent / "qr_codes"
QR_FOLDER.mkdir(parents=True, exist_ok=True)
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")


def ensure_qr_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS emergency_qr_tokens (
            user_id INT PRIMARY KEY,
            public_token CHAR(64) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_qr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)


@qr.route("/generate", methods=["POST"])
@jwt_required()
def generate_qr():
    user_id = get_jwt_identity()
    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        ensure_qr_table(cursor)
        cursor.execute(
            "SELECT emergency_qr_sharing FROM user_settings WHERE user_id = %s",
            (user_id,),
        )
        sharing_setting = cursor.fetchone()
        if not sharing_setting or not sharing_setting["emergency_qr_sharing"]:
            return jsonify({"message": "Enable emergency QR sharing in Settings before generating your QR card."}), 403

        cursor.execute("""
            SELECT user_id FROM medical_profile WHERE user_id = %s
        """, (user_id,))
        profile = cursor.fetchone()
        if not profile:
            return jsonify({"message": "Save your medical profile before generating a QR code"}), 404

        cursor.execute("SELECT public_token FROM emergency_qr_tokens WHERE user_id = %s", (user_id,))
        token_row = cursor.fetchone()
        if token_row:
            public_token = token_row["public_token"]
        else:
            public_token = secrets.token_urlsafe(32)
            cursor.execute("""
                INSERT INTO emergency_qr_tokens (user_id, public_token)
                VALUES (%s, %s)
            """, (user_id, public_token))
            conn.commit()

        web_url = f"{FRONTEND_BASE_URL}/emergency/{public_token}"
        image_path = QR_FOLDER / f"user_{int(user_id)}.png"
        qrcode.make(web_url).save(image_path)
        return jsonify({
            "message": "Emergency QR code generated successfully",
            "web_url": web_url,
            "qr_url": web_url,
            "image_url": f"/api/qr/image/{public_token}",
        }), 200
    except Exception as exc:
        conn.rollback()
        print(f"QR generation error: {exc}")
        return jsonify({"message": "Could not generate emergency QR code"}), 500
    finally:
        cursor.close()
        conn.close()


@qr.route("/user/<string:public_token>", methods=["GET"])
def get_emergency_profile(public_token):
    """Public endpoint for the unguessable token embedded in the QR URL."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        ensure_qr_table(cursor)
        cursor.execute("""
            SELECT mp.name, mp.dob, mp.phone, mp.bloodgroup AS blood_group,
                   mp.Allergies AS allergies,
                   mp.Existing_conditions AS existing_conditions,
                   mp.Current_medications AS current_medications
            FROM emergency_qr_tokens q
            JOIN medical_profile mp ON mp.user_id = q.user_id
            JOIN user_settings us ON us.user_id = q.user_id
            WHERE q.public_token = %s AND us.emergency_qr_sharing = TRUE
        """, (public_token,))
        profile = cursor.fetchone()
        if not profile:
            return jsonify({"message": "Emergency profile not found or QR code revoked"}), 404
        if profile.get("dob") and hasattr(profile["dob"], "isoformat"):
            profile["dob"] = profile["dob"].isoformat()
        cursor.execute("""
            SELECT ec.name, ec.phone, ec.relationship
            FROM emergency_contacts ec
            JOIN emergency_qr_tokens q ON q.user_id = ec.user_id
            WHERE q.public_token = %s
            ORDER BY ec.id ASC
        """, (public_token,))
        profile["emergency_contacts"] = cursor.fetchall()
        return jsonify({"profile": profile}), 200
    finally:
        cursor.close()
        conn.close()


@qr.route("/image/<string:public_token>", methods=["GET"])
def get_qr_image(public_token):
    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    try:
        ensure_qr_table(cursor)
        cursor.execute(
            "SELECT user_id FROM emergency_qr_tokens WHERE public_token = %s",
            (public_token,),
        )
        row = cursor.fetchone()
        if not row:
            return jsonify({"message": "QR code not found"}), 404
        file_path = QR_FOLDER / f"user_{int(row['user_id'])}.png"
        if not file_path.exists():
            return jsonify({"message": "QR image is not generated yet"}), 404
        return send_file(str(file_path), mimetype="image/png", max_age=0)
    finally:
        cursor.close()
        conn.close()
