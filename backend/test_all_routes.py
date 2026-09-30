import os
import json
import time
from app import app
from db import get_db_connection

def run_tests():
    print("=" * 60)
    print("LIVOX BACKEND ROUTE & CONNECTION INTEGRATION TEST")
    print("=" * 60)

    # 1. Test Direct DB Connection
    print("\n[TEST 1] Database Connection...")
    conn = get_db_connection()
    if conn and conn.is_connected():
        print("  -> SUCCESS: MySQL connected successfully!")
        cursor = conn.cursor()
        cursor.execute("SELECT DATABASE();")
        current_db = cursor.fetchone()[0]
        print(f"  -> Connected to Database: {current_db}")
        cursor.close()
        conn.close()
    else:
        print("  -> FAILED: Could not connect to MySQL database.")
        return False

    client = app.test_client()

    # 2. Test Root Home Route
    print("\n[TEST 2] GET / (Root Health Check & Route Directory)...")
    res = client.get("/")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.get_json()
    print("  -> Response:", data)
    assert "message" in data and "routes" in data
    print("  -> SUCCESS: Root route is working!")

    # 3. Test Signup Route
    test_email = f"testuser_{int(time.time())}@livox.health"
    test_password = "Password123!"
    test_name = "Dr. Test User"
    test_phone = "9876543210"

    print(f"\n[TEST 3] POST /signup (New user: {test_email})...")
    # 3a. Validation error check
    res = client.post("/signup", json={"email": test_email})
    assert res.status_code == 400, f"Expected 400 for missing fields, got {res.status_code}"
    print("  -> Missing fields correctly rejected with 400")

    # 3b. Successful signup
    res = client.post("/signup", json={
        "name": test_name,
        "email": test_email,
        "phone": test_phone,
        "password": test_password
    })
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.get_json()}"
    print("  -> SUCCESS:", res.get_json())

    # 3c. Duplicate signup prevention
    res = client.post("/signup", json={
        "name": test_name,
        "email": test_email,
        "phone": test_phone,
        "password": test_password
    })
    assert res.status_code == 409, f"Expected 409 for duplicate email, got {res.status_code}"
    print("  -> Duplicate registration correctly rejected with 409")

    # 4. Test Login Route
    print("\n[TEST 4] POST /login...")
    # 4a. Bad password
    res = client.post("/login", json={"email": test_email, "password": "WrongPassword"})
    assert res.status_code == 401, f"Expected 401 for wrong password, got {res.status_code}"
    print("  -> Invalid credentials correctly rejected with 401")

    # 4b. Successful login
    res = client.post("/login", json={"email": test_email, "password": test_password})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    login_data = res.get_json()
    token = login_data.get("token")
    user_id = login_data.get("user", {}).get("id")
    assert token, "JWT token missing from login response"
    print(f"  -> SUCCESS: Logged in! User ID: {user_id}, Token received.")

    auth_headers = {"Authorization": f"Bearer {token}"}

    # 5. Test Medical Profile Routes
    print("\n[TEST 5] GET & POST /medical-profile...")
    # 5a. Unauthorized without token
    res = client.get("/medical-profile")
    assert res.status_code == 401, f"Expected 401 without auth token, got {res.status_code}"
    print("  -> Protected route correctly blocked unauthenticated request with 401")

    # 5b. Initial GET should be empty list
    res = client.get("/medical-profile", headers=auth_headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print("  -> Initial GET /medical-profile returned:", res.get_json())

    # 5c. POST valid medical profile
    profile_payload = {
        "name": test_name,
        "dob": "1995-05-15",
        "blood_group": "O+",
        "phone": test_phone,
        "address": "123 Healthcare Boulevard, Tech City",
        "allergies": "Penicillin",
        "existing_conditions": "Asthma",
        "current_medications": "Albuterol inhaler"
    }
    res = client.post("/medical-profile", headers=auth_headers, json=profile_payload)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.get_json()}"
    print("  -> SUCCESS: Medical profile created:", res.get_json())

    # 5d. GET to verify stored data
    res = client.get("/medical-profile", headers=auth_headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    records = res.get_json().get("records", [])
    assert len(records) > 0, "Expected at least 1 record"
    saved = records[0]
    assert saved["blood_group"] == "O+", f"Expected O+, got {saved['blood_group']}"
    assert saved["phone"] == test_phone
    print("  -> SUCCESS: Verified saved medical record for user:", saved["name"])

    # 6. Test QR Generation & Retrieval Routes
    print("\n[TEST 6] POST /api/qr/generate & QR retrieval...")
    res = client.post("/api/qr/generate", headers=auth_headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.get_json()}"
    qr_data = res.get_json()
    print("  -> SUCCESS: Generated QR Code:", qr_data)
    assert "qr_url" in qr_data and "image_url" in qr_data

    # 6a. GET /api/qr/user/<user_id>
    print(f"\n[TEST 7] GET /api/qr/user/{user_id}...")
    res = client.get(f"/api/qr/user/{user_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    user_info = res.get_json()
    print("  -> SUCCESS: QR User Info fetched:", user_info)
    assert user_info["profile"]["blood_group"] == "O+"

    # 6b. GET /api/qr/image/<user_id>
    print(f"\n[TEST 8] GET /api/qr/image/{user_id}...")
    res = client.get(f"/api/qr/image/{user_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert res.content_type == "image/png"
    assert len(res.data) > 0
    print(f"  -> SUCCESS: QR image downloaded ({len(res.data)} bytes, PNG format).")
    res.close()

    qr_path = os.path.join("qr_codes", f"user_{user_id}.png")
    if os.path.exists(qr_path):
        os.remove(qr_path)

    # Clean up test user and profile
    print("\n[CLEANUP] Removing test user data...")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM medical_profile WHERE user_id = %s;", (user_id,))
    cursor.execute("DELETE FROM users WHERE id = %s;", (user_id,))
    conn.commit()
    cursor.close()
    conn.close()
    print("  -> Cleaned up test records cleanly.")

    print("\n" + "=" * 60)
    print("ALL ROUTES & DATABASE CONNECTIONS ARE 100% OPERATIONAL!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    run_tests()
