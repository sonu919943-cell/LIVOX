import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from routes.auth_routes import auth
from routes.medical_routes import medical
from routes.qr_routes import qr
from routes.report_routes import report
from routes.emergency_contacts import emergency_contacts

app = Flask(__name__)

CORS(app)

app.secret_key = os.getenv(
    "FLASK_SECRET_KEY", "dev-only-change-me-livox-default-32-byte-secret-key"
)

app.config["JWT_SECRET_KEY"] = os.getenv(
    "JWT_SECRET_KEY", "dev-only-change-me-livox-default-32-byte-jwt-secret"
)


JWTManager(app)

app.register_blueprint(auth)
app.register_blueprint(medical)
app.register_blueprint(qr, url_prefix="/api/qr")
app.register_blueprint(report, url_prefix="/api/reports")
app.register_blueprint(emergency_contacts)

@app.route("/")
def home():
    return {
        "message": "LIVOX Backend Running",
        "routes": {
            "signup": "/signup",
            "login": "/login",
            "medical_profile": "/medical-profile",
            "emergency_contacts": "/emergency-contacts",
            "generate_qr": "/api/qr/generate",
            "qr_user": "/api/qr/user/<user_id>",
            "qr_image": "/api/qr/image/<user_id>",
            "reports_list": "/api/reports",
            "reports_upload": "/api/reports/upload",
            "reports_view": "/api/reports/<id>/view",
            "reports_download": "/api/reports/<id>/download",
            "reports_delete": "/api/reports/<id>",
        },
    }


if __name__ == "__main__":
    app.run(debug=True)