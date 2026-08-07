from flask import Flask, render_template, redirect, request, session, flash, jsonify

from routes.auth_routes import auth


app =Flask(__name__)
app.secret_key="12345"


app.register_blueprint(auth)



@app.route("/")
def home():
     return jsonify({"message": "Login Successful"})

if __name__ =="__main__":
    app.run(debug=True) 