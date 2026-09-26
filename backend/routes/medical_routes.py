from flask import Blueprint, request, jsonify
from db import get_db_connection
from flask_jwt_extended import jwt_required, get_jwt_identity

medical = Blueprint("medical", __name__)

@medical.route("/medical-profile", methods=["GET", "POST"])
@jwt_required()
def get_medical_records():
    user_id = get_jwt_identity()

    conn = get_db_connection()
    if conn is None:
        return jsonify({
            "message": "Database connection failed"
        }), 500

    cursor = conn.cursor(dictionary=True)
    try:
        if request.method == "GET":
            cursor.execute("""
                SELECT name, dob, bloodgroup AS blood_group, phone, address,
                       Allergies AS allergies,
                       Existing_conditions AS existing_conditions,
                       Current_medications AS current_medications,
                       user_id
                FROM medical_profile
                WHERE user_id = %s
            """, (user_id,))

            rows = cursor.fetchall()
            records = []
            for row in rows:
                if row.get("dob") and hasattr(row["dob"], "isoformat"):
                    row["dob"] = row["dob"].isoformat()
                records.append(row)

            return jsonify({
                "message": "Medical records retrieved successfully",
                "records": records
            }), 200

        if request.method == "POST":
            data = request.get_json() or {}

            blood_group = data.get("blood_group")
            name = data.get("name")
            dob = data.get("dob")
            phone = data.get("phone")
            address = data.get("address")
            allergies = data.get("allergies", "")
            existing_conditions = data.get("existing_conditions", "")
            current_medications = data.get("current_medications", "")

            if not blood_group or not name or not dob or not phone or not address:
                return jsonify({
                    "message": "Blood group, Full name, Date of birth, Phone, and Address are required"
                }), 400

            cursor.execute("""
                DELETE FROM medical_profile
                WHERE user_id = %s
            """, (user_id,))

            cursor.execute("""
                INSERT INTO medical_profile 
                (user_id, bloodgroup, name, dob, Allergies, phone, address, Existing_conditions, Current_medications)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (user_id, blood_group, name, dob, allergies, str(phone), address, existing_conditions, current_medications))

            conn.commit()

            return jsonify({
                "message": "Medical record added successfully"
            }), 201
    finally:
        cursor.close()
        conn.close()
