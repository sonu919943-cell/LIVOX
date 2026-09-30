import os
from flask import Blueprint, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import qrcode

from db import get_db_connection

qr = Blueprint("qr", __name__)

QR_FOLDER = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "qr_codes")
)
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")

os.makedirs(QR_FOLDER, exist_ok=True)


@qr.route("/generate", methods=["POST"])
@jwt_required()
def generate_qr():
    user_id = get_jwt_identity()

    conn = get_db_connection()

    if conn is None:
        return jsonify({
            "message": "Database connection failed"
        }), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                user_id,
                name,
                dob,
                phone,
                bloodgroup,
                Allergies,
                Existing_conditions,
                Current_medications
            FROM medical_profile
            WHERE user_id = %s
        """, (user_id,))

        profile = cursor.fetchone()

    finally:
        cursor.close()
        conn.close()

    if not profile:
        return jsonify({
            "message": "Medical profile not found"
        }), 404

    # This must point to the public frontend in deployed environments.
    web_url = f"{FRONTEND_BASE_URL}/emergency/{profile['user_id']}"

    # Generate QR containing the webpage URL
    qr_image = qrcode.make(web_url)

    os.makedirs(QR_FOLDER, exist_ok=True)

    file_path = os.path.join(
        QR_FOLDER,
        f"user_{profile['user_id']}.png"
    )

    qr_image.save(file_path)

    return jsonify({
        "message": "QR code generated successfully",
        "user_id": profile["user_id"],
        "qr_url": web_url,
        "web_url": web_url,
        "image_url": f"/api/qr/image/{profile['user_id']}"
    }), 200

@qr.route("/user/<int:user_id>", methods=["GET"])
def get_emergency_profile(user_id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({
            "message": "Database connection failed"
        }), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                user_id,
                name,
                dob,
                phone,
                bloodgroup AS blood_group,
                Allergies AS allergies,
                Existing_conditions AS existing_conditions,
                Current_medications AS current_medications
            FROM medical_profile
            WHERE user_id = %s
        """, (user_id,))
        profile = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

    if not profile:
        return jsonify({
            "message": "Emergency profile not found"
        }), 404

    if profile.get("dob") and hasattr(profile["dob"], "isoformat"):
        profile["dob"] = profile["dob"].isoformat()

    return jsonify({
        "profile": profile
    }), 200


@qr.route("/image/<int:user_id>", methods=["GET"])
def get_qr_image(user_id):
    file_path = os.path.join(
        QR_FOLDER,
        f"user_{user_id}.png"
    )

    if not os.path.exists(file_path):
        return jsonify({
            "message": "QR code not found"
        }), 404

    return send_file(
        file_path,
        mimetype="image/png"
    )
