from flask import Blueprint, request, jsonify
from db import get_db_connection
from flask_jwt_extended import jwt_required, get_jwt_identity

medical = Blueprint("medical", __name__)

def row_to_profile(row):
    return {
        "name": row[0],
        "dob": row[1].isoformat() if row[1] else "",
        "blood_group": row[2],
        "phone": row[3],
        "address": row[4],
        "allergies": row[5],
        "existing_conditions": row[6],
        "current_medications": row[7],
        "user_id": row[8],
    }

@medical.route("/medical-profile", methods=["GET", "POST"])
@jwt_required()
def get_medical_records():
    user_id = get_jwt_identity()

    conn = get_db_connection()

    if conn is None:
        return jsonify({
            "message": "Database connection failed"
        }), 500

    cursor = conn.cursor()

    if request.method == "GET":

        cursor.execute("""
            SELECT name, dob, bloodgroup, phone, address, Allergies,
                   Existing_conditions, Current_medications, user_id
            FROM medical_profile
            WHERE user_id = %s
        """, (user_id,))

        records = [row_to_profile(row) for row in cursor.fetchall()]

        cursor.close()
        conn.close()

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
        existing_conditions = data.get("existing_conditions")
        allergies = data.get("allergies")
        current_medications = data.get("current_medications")

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
            (user_id, bloodgroup, name, dob,Allergies, phone, address,Existing_conditions, Current_medications)
            VALUES (%s, %s, %s, %s, %s,%s, %s, %s, %s)
            """, 
            (user_id, blood_group, name, dob, allergies, phone, address, existing_conditions, current_medications))

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Medical record added successfully"
        }), 201
