import os
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import qrcode

from db import get_db_connection

qr = Blueprint("qr", __name__)

QR_FOLDER = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "qr_codes")
)

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
            SELECT user_id, name, dob, phone, bloodgroup, Allergies, Existing_conditions, Current_medications
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

    qr_data = f"{request.host_url}api/qr/user/{profile['user_id']}"

    qr_image = qrcode.make(qr_data)

    file_path = os.path.join(
        QR_FOLDER,
        f"user_{profile['user_id']}.png"
    )

    qr_image.save(file_path)

    return jsonify({
        "message": "QR code generated successfully",
        "user_id": profile["user_id"],
        "qr_url": qr_data,
        "image_url": f"/api/qr/image/{profile['user_id']}"
    }), 200


@qr.route("/user/<int:user_id>", methods=["GET"])
def get_user_by_qr(user_id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({
            "message": "Database connection failed"
        }), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT users.id, users.name, users.phone, users.email,
                   medical_profile.dob, medical_profile.bloodgroup,
                   medical_profile.address, medical_profile.Allergies,
                   medical_profile.Existing_conditions,
                   medical_profile.Current_medications
            FROM users
            INNER JOIN medical_profile
                ON medical_profile.user_id = users.id
            WHERE users.id = %s
        """, (user_id,))
        user = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

    if not user:
        return jsonify({
            "message": "Medical profile not found"
        }), 404

    if user.get("dob") and hasattr(user["dob"], "isoformat"):
        user["dob"] = user["dob"].isoformat()

    return jsonify({
        "message": "User information",
        "user": user
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
