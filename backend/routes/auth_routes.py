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
        SELECT *
        FROM users
        WHERE email = %s
    """, (email,))

    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user:
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    if not check_password_hash(user[4], password):
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    # Create JWT token
    access_token = create_access_token(
        identity=str(user[0])
    )

    return jsonify({
        "message": "Login Successful",
        "token": access_token,
        "user": {
            "id": user[0],
            "name": user[1],
            "email": user[2],
            "phone": user[3]
        }
    }), 200

@auth.route("/signup",methods =["POST"])
def signup():

    data = request.get_json()

    name = data.get("name")
    phone = data.get("phone")
    email = data.get("email")
    password = data.get("password")

    if not name or not phone or not email or not password:
        return jsonify({
            "message":"All field are required !"
        }),400

    conn = get_db_connection()

    if conn is None:
        return jsonify({
            "message": "Database connection failed"
        }), 500

    cursor = conn.cursor()

    cursor.execute("""
        SELECT id FROM 
        users WHERE 
        email =%s
    """,(email,))

    existing_user = cursor.fetchone()

    if existing_user:
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Email id already registered"
        })

    password =  generate_password_hash(password)

    cursor.execute("""
        INSERT INTO users 
        (name,email,phone,password)
        VALUES (%s,%s,%s,%s)
        """,(name,email,phone,password)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "message": "Account created successfully"
    }), 201