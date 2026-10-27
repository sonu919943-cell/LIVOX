from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import get_db_connection

emergency_contacts = Blueprint("emergency_contacts", __name__)

@emergency_contacts.route("/emergency-contacts", methods=["GET", "POST"])
@jwt_required()
def get_emergency_contacts():
    user_id = get_jwt_identity()

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        if request.method == "GET":
            cursor.execute("""
                SELECT id, name, phone, relationship
                FROM emergency_contacts
                WHERE user_id = %s
            """, (user_id,))
            contacts = cursor.fetchall()
            return jsonify({
                "message": "Emergency contacts retrieved successfully",
                "contacts": contacts
            }), 200

        if request.method == "POST":
            data = request.get_json() or {}
            name = data.get("name")
            phone = data.get("phone")
            relationship = data.get("relationship")

            if not name or not phone or not relationship:
                return jsonify({"message": "Name, phone, and relationship are required"}), 400

            cursor.execute("""
                INSERT INTO emergency_contacts (user_id, name, phone, relationship)
                VALUES (%s, %s, %s, %s)
            """, (user_id, name, phone, relationship))
            conn.commit()

            return jsonify({
                "message": "Emergency contact added successfully",
                "contact": {
                    "id": cursor.lastrowid,
                    "name": name,
                    "phone": phone,
                    "relationship": relationship
                }
            }), 201
    finally:
        cursor.close()
        conn.close()


@emergency_contacts.route("/emergency-contacts/<int:contact_id>", methods=["DELETE"])
@jwt_required()
def delete_emergency_contact(contact_id):
    user_id = get_jwt_identity()

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            DELETE FROM emergency_contacts
            WHERE id = %s AND user_id = %s
            """,
            (contact_id, user_id),
        )
        if cursor.rowcount == 0:
            return jsonify({"message": "Emergency contact not found"}), 404

        conn.commit()
        return jsonify({"message": "Emergency contact deleted successfully"}), 200
    finally:
        cursor.close()
        conn.close()
