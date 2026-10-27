import math
import os
from datetime import timedelta

import requests
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from db import get_db_connection

features = Blueprint("features", __name__, url_prefix="/api")


def _db_or_error():
    conn = get_db_connection()
    if conn is None:
        return None, (jsonify({"message": "Database connection failed"}), 500)
    return conn, None


def ensure_feature_tables():
    """Create small feature tables for existing installations if permissions allow."""
    conn = get_db_connection()
    if conn is None:
        return
    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_settings (
                user_id INT PRIMARY KEY,
                health_notifications BOOLEAN NOT NULL DEFAULT TRUE,
                emergency_qr_sharing BOOLEAN NOT NULL DEFAULT FALSE,
                monthly_review_reminder BOOLEAN NOT NULL DEFAULT TRUE,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS blood_donors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                blood_group VARCHAR(10) NOT NULL,
                city VARCHAR(120) NOT NULL,
                phone VARCHAR(30) NOT NULL,
                available BOOLEAN NOT NULL DEFAULT TRUE,
                consent BOOLEAN NOT NULL DEFAULT FALSE,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_donor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        conn.commit()
    except Exception as exc:
        print(f"Feature table setup warning: {exc}")
    finally:
        if cursor:
            cursor.close()
        conn.close()


def _normalise_user_id(value):
    # JWT identities are strings in this project; DB ids are integers.
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


@features.route("/account", methods=["GET", "PUT"])
@jwt_required()
def account():
    user_id = _normalise_user_id(get_jwt_identity())
    if not user_id:
        return jsonify({"message": "Invalid account token"}), 401

    conn, error = _db_or_error()
    if error:
        return error
    cursor = conn.cursor(dictionary=True)
    try:
        if request.method == "GET":
            cursor.execute(
                "SELECT id, name, email, phone, created_at FROM users WHERE id = %s",
                (user_id,),
            )
            user = cursor.fetchone()
            if not user:
                return jsonify({"message": "Account not found"}), 404
            if user.get("created_at") and hasattr(user["created_at"], "isoformat"):
                user["created_at"] = user["created_at"].isoformat()
            return jsonify({"user": user}), 200

        data = request.get_json(silent=True) or {}
        name = str(data.get("name", "")).strip()
        phone = str(data.get("phone", "")).strip()
        if not name or not phone:
            return jsonify({"message": "Name and phone are required"}), 400
        if len(name) > 100 or len(phone) > 20:
            return jsonify({"message": "Name or phone is too long"}), 400

        cursor.execute(
            "UPDATE users SET name = %s, phone = %s WHERE id = %s",
            (name, phone, user_id),
        )
        if cursor.rowcount == 0:
            cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
            if not cursor.fetchone():
                return jsonify({"message": "Account not found"}), 404
        conn.commit()
        cursor.execute(
            "SELECT id, name, email, phone, created_at FROM users WHERE id = %s",
            (user_id,),
        )
        user = cursor.fetchone()
        if user.get("created_at") and hasattr(user["created_at"], "isoformat"):
            user["created_at"] = user["created_at"].isoformat()
        return jsonify({"message": "Account updated", "user": user}), 200
    finally:
        cursor.close()
        conn.close()


@features.route("/settings", methods=["GET", "PUT"])
@jwt_required()
def settings():
    user_id = _normalise_user_id(get_jwt_identity())
    if not user_id:
        return jsonify({"message": "Invalid account token"}), 401
    conn, error = _db_or_error()
    if error:
        return error
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            INSERT IGNORE INTO user_settings (user_id) VALUES (%s)
        """, (user_id,))
        conn.commit()

        if request.method == "GET":
            cursor.execute("""
                SELECT health_notifications, emergency_qr_sharing, monthly_review_reminder
                FROM user_settings WHERE user_id = %s
            """, (user_id,))
            row = cursor.fetchone()
            return jsonify({"settings": {
                "notify": bool(row["health_notifications"]),
                "share": bool(row["emergency_qr_sharing"]),
                "reminder": bool(row["monthly_review_reminder"]),
            }}), 200

        data = request.get_json(silent=True) or {}
        cursor.execute("""
            UPDATE user_settings
            SET health_notifications = %s,
                emergency_qr_sharing = %s,
                monthly_review_reminder = %s
            WHERE user_id = %s
        """, (
            bool(data.get("notify", True)),
            bool(data.get("share", False)),
            bool(data.get("reminder", True)),
            user_id,
        ))
        conn.commit()
        return jsonify({"message": "Settings saved"}), 200
    finally:
        cursor.close()
        conn.close()


@features.route("/dashboard/stats", methods=["GET"])
@jwt_required()
def dashboard_stats():
    user_id = _normalise_user_id(get_jwt_identity())
    if not user_id:
        return jsonify({"message": "Invalid account token"}), 401
    conn, error = _db_or_error()
    if error:
        return error
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT COUNT(*) AS count FROM medical_reports WHERE user_id = %s", (user_id,))
        reports = cursor.fetchone()["count"]
        cursor.execute("SELECT COUNT(*) AS count FROM emergency_contacts WHERE user_id = %s", (user_id,))
        contacts = cursor.fetchone()["count"]
        cursor.execute("SELECT name, dob, bloodgroup, phone, address, Allergies, Existing_conditions, Current_medications FROM medical_profile WHERE user_id = %s", (user_id,))
        profile = cursor.fetchone()
        fields = ["name", "dob", "bloodgroup", "phone", "address"]
        complete = sum(1 for key in fields if profile and profile.get(key))
        return jsonify({
            "stats": {
                "reports": reports,
                "contacts": contacts,
                "profile_completion": round((complete / len(fields)) * 100),
                "has_profile": bool(profile),
            }
        }), 200
    finally:
        cursor.close()
        conn.close()


@features.route("/donors", methods=["GET", "POST", "DELETE"])
@jwt_required()
def donors():
    user_id = _normalise_user_id(get_jwt_identity())
    if not user_id:
        return jsonify({"message": "Invalid account token"}), 401
    conn, error = _db_or_error()
    if error:
        return error
    cursor = conn.cursor(dictionary=True)
    try:
        if request.method == "POST":
            data = request.get_json(silent=True) or {}
            blood_group = str(data.get("blood_group", "")).strip().upper()
            city = str(data.get("city", "")).strip()
            phone = str(data.get("phone", "")).strip()
            available = bool(data.get("available", True))
            consent = bool(data.get("consent", False))
            valid_groups = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
            if blood_group not in valid_groups or not city or not phone:
                return jsonify({"message": "Valid blood group, city, and phone are required"}), 400
            if len(city) > 120 or len(phone) > 30:
                return jsonify({"message": "City or phone is too long"}), 400
            cursor.execute("""
                INSERT INTO blood_donors (user_id, blood_group, city, phone, available, consent)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE blood_group = VALUES(blood_group),
                    city = VALUES(city), phone = VALUES(phone),
                    available = VALUES(available), consent = VALUES(consent)
            """, (user_id, blood_group, city, phone, available, consent))
            conn.commit()
            return jsonify({"message": "Donor profile saved"}), 200

        if request.method == "DELETE":
            cursor.execute("DELETE FROM blood_donors WHERE user_id = %s", (user_id,))
            conn.commit()
            return jsonify({"message": "Donor profile removed"}), 200

        group = str(request.args.get("blood_group", "")).strip().upper()
        city = str(request.args.get("city", "")).strip()
        query = """
            SELECT d.id, d.blood_group, d.city, d.phone, d.updated_at
            FROM blood_donors d
            WHERE d.available = TRUE AND d.consent = TRUE
        """
        params = []
        valid_groups = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
        if group:
            if group not in valid_groups:
                return jsonify({"message": "Invalid blood group"}), 400
            query += " AND d.blood_group = %s"
            params.append(group)
        if city:
            query += " AND LOWER(d.city) LIKE LOWER(%s)"
            params.append(f"%{city}%")
        query += " ORDER BY d.updated_at DESC LIMIT 100"
        cursor.execute(query, tuple(params))
        results = cursor.fetchall()
        for row in results:
            if row.get("updated_at") and hasattr(row["updated_at"], "isoformat"):
                row["updated_at"] = row["updated_at"].isoformat()
        return jsonify({"donors": results}), 200
    finally:
        cursor.close()
        conn.close()


@features.route("/hospitals/nearby", methods=["GET"])
@jwt_required()
def nearby_hospitals():
    try:
        lat = float(request.args.get("lat", ""))
        lon = float(request.args.get("lon", ""))
        radius = min(max(int(request.args.get("radius", "10000")), 1000), 25000)
    except (TypeError, ValueError):
        return jsonify({"message": "Valid lat and lon coordinates are required"}), 400
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return jsonify({"message": "Coordinates are out of range"}), 400

    query = f"""
    [out:json][timeout:20];
    (
      node["amenity"~"^(hospital|clinic)$"](around:{radius},{lat},{lon});
      way["amenity"~"^(hospital|clinic)$"](around:{radius},{lat},{lon});
      relation["amenity"~"^(hospital|clinic)$"](around:{radius},{lat},{lon});
    );
    out center tags;
    """
    try:
        response = requests.post(
            "https://overpass-api.de/api/interpreter",
            data={"data": query},
            headers={"User-Agent": "LIVOX-Student-Project/1.0 (hospital finder)"},
            timeout=25,
        )
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException:
        return jsonify({"message": "Hospital map service is temporarily unavailable"}), 502

    def distance_km(a_lat, a_lon):
        earth = 6371.0
        p1, p2 = math.radians(lat), math.radians(a_lat)
        dp = math.radians(a_lat - lat)
        dl = math.radians(a_lon - lon)
        value = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
        return earth * 2 * math.atan2(math.sqrt(value), math.sqrt(max(0, 1 - value)))

    places = []
    seen = set()
    for item in payload.get("elements", []):
        tags = item.get("tags", {})
        name = tags.get("name")
        coords = item if "lat" in item and "lon" in item else item.get("center", {})
        if not name or "lat" not in coords or "lon" not in coords:
            continue
        key = (name, round(coords["lat"], 5), round(coords["lon"], 5))
        if key in seen:
            continue
        seen.add(key)
        places.append({
            "name": name,
            "type": tags.get("amenity", "medical facility"),
            "lat": coords["lat"],
            "lon": coords["lon"],
            "distance_km": round(distance_km(coords["lat"], coords["lon"]), 2),
            "address": ", ".join(x for x in [tags.get("addr:street"), tags.get("addr:city")] if x),
            "phone": tags.get("phone", ""),
        })
    places.sort(key=lambda item: item["distance_km"])
    return jsonify({"hospitals": places[:50], "source": "OpenStreetMap contributors"}), 200


@features.route("/assistant/chat", methods=["POST"])
@jwt_required()
def assistant_chat():
    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()
    if not message:
        return jsonify({"message": "Please enter a question"}), 400
    if len(message) > 4000:
        return jsonify({"message": "Message is too long (maximum 4000 characters)"}), 400

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return jsonify({"message": "AI assistant is not configured. Add GEMINI_API_KEY to backend/.env."}), 503

    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
    prompt = (
        "You are LIVOX, a general health-information assistant. Give cautious, "
        "plain-language educational information only. Do not diagnose, prescribe, "
        "or recommend changing medication. For possible life-threatening symptoms, "
        "tell the user to contact local emergency services immediately. Encourage "
        "professional medical advice and do not claim to replace a clinician.\n\n"
        f"User question: {message}"
    )
    try:
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            params={"key": api_key},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 700},
            },
            timeout=30,
        )
        if response.status_code >= 400:
            return jsonify({"message": "AI provider rejected the request. Check GEMINI_API_KEY and GEMINI_MODEL."}), 502
        body = response.json()
        answer = "".join(
            part.get("text", "")
            for candidate in body.get("candidates", [])
            for part in candidate.get("content", {}).get("parts", [])
        ).strip()
        if not answer:
            return jsonify({"message": "The AI assistant returned an empty response. Please try again."}), 502
        return jsonify({"reply": answer}), 200
    except requests.RequestException:
        return jsonify({"message": "AI assistant is temporarily unavailable"}), 502
