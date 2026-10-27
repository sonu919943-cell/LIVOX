from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from db import get_db_connection

emergency_contacts = Blueprint("emergency_contacts", __name__)


def _connection():
    conn = get_db_connection()
    if conn is None:
        return None, (jsonify({"message": "Database connection failed"}), 500)
    return conn, None


@emergency_contacts.route("/emergency-contacts", methods=["GET", "POST"])
@jwt_required()
def contacts_collection():
    user_id = get_jwt_identity()
    conn, error = _connection()
    if error:
        return error
    cursor = conn.cursor(dictionary=True)
    try:
        if request.method == "GET":
            cursor.execute("""
                SELECT id, name, phone, relationship
                FROM emergency_contacts WHERE user_id = %s ORDER BY id ASC
            """, (user_id,))
            return jsonify({"contacts": cursor.fetchall()}), 200

        data = request.get_json(silent=True) or {}
        name = str(data.get("name", "")).strip()
        phone = str(data.get("phone", "")).strip()
        relationship = str(data.get("relationship", "")).strip()
        if not name or not phone or not relationship:
            return jsonify({"message": "Name, phone, and relationship are required"}), 400
        if len(name) > 100 or len(phone) > 20 or len(relationship) > 50:
            return jsonify({"message": "One or more contact fields are too long"}), 400
        cursor.execute("""
            INSERT INTO emergency_contacts (user_id, name, phone, relationship)
            VALUES (%s, %s, %s, %s)
        """, (user_id, name, phone, relationship))
        conn.commit()
        return jsonify({
            "message": "Emergency contact added successfully",
            "contact": {"id": cursor.lastrowid, "name": name, "phone": phone, "relationship": relationship}
        }), 201
    finally:
        cursor.close()
        conn.close()


@emergency_contacts.route("/emergency-contacts/<int:contact_id>", methods=["PUT", "DELETE"])
@jwt_required()
def contact_item(contact_id):
    user_id = get_jwt_identity()
    conn, error = _connection()
    if error:
        return error
    cursor = conn.cursor()
    try:
        if request.method == "DELETE":
            cursor.execute("DELETE FROM emergency_contacts WHERE id = %s AND user_id = %s", (contact_id, user_id))
            if cursor.rowcount == 0:
                return jsonify({"message": "Emergency contact not found"}), 404
            conn.commit()
            return jsonify({"message": "Emergency contact deleted"}), 200

        data = request.get_json(silent=True) or {}
        name = str(data.get("name", "")).strip()
        phone = str(data.get("phone", "")).strip()
        relationship = str(data.get("relationship", "")).strip()
        if not name or not phone or not relationship:
            return jsonify({"message": "Name, phone, and relationship are required"}), 400
        cursor.execute("""
            UPDATE emergency_contacts
            SET name = %s, phone = %s, relationship = %s
            WHERE id = %s AND user_id = %s
        """, (name, phone, relationship, contact_id, user_id))
        if cursor.rowcount == 0:
            cursor.execute("SELECT id FROM emergency_contacts WHERE id = %s AND user_id = %s", (contact_id, user_id))
            if not cursor.fetchone():
                return jsonify({"message": "Emergency contact not found"}), 404
        conn.commit()
        return jsonify({"message": "Emergency contact updated"}), 200
    finally:
        cursor.close()
        conn.close()
