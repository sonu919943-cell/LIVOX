from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from routes.auth_routes import auth

app = Flask(__name__)

CORS(app)

app.secret_key = "12345"

app.config["JWT_SECRET_KEY"] = "your-secret-key-change-this"

JWTManager(app)

app.register_blueprint(auth)

@app.route("/")
def home():
    return {
        "message": "LIVOX Backend Running"
    }

if __name__ == "__main__":
    app.run(debug=True)