from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from routes.auth_routes import auth
from routes.medical_routes import medical

app = Flask(__name__)

CORS(app)

app.secret_key = "12345"

app.config["JWT_SECRET_KEY"] = "54321"

JWTManager(app)

app.register_blueprint(auth)
app.register_blueprint(medical)

@app.route("/")
def home():
    return {
        "message": "LIVOX Backend Running"
    }

if __name__ == "__main__":
    app.run(debug=True)