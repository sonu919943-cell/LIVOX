from flask import Blueprint, request,jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_db_connection
from flask_jwt_extended import create_access_token

auth = Blueprint("auth",__name__)

@auth.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "message": "Email and password are required"
        }), 400

    conn = get_db_connection()

    if conn is None:
        return jsonify({
            "message": "Database connection failed"
        }), 500

    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM users
        WHERE email = %s
    """, (email,))

    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user:
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    if not check_password_hash(user[3], password):
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    access_token = create_access_token(
        identity=str(user[0])
    )

    return jsonify({
        "message": "Login Successful",
        "token": access_token,
        "user": {
            "id": user[0],
            "username": user[1],
            "email": user[2]
        }
    }), 200

