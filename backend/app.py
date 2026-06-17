from flask import Flask
from flask_cors import CORS

from database import get_db_connection
from routes.auth import auth_bp
from routes.complaints import complaints_bp

app = Flask(__name__)
CORS(app)

# Register Auth Routes
app.register_blueprint(
    auth_bp,
    url_prefix="/api/auth"
)

app.register_blueprint(
    complaints_bp,
    url_prefix="/api/complaints"
)


# Home Route
@app.route("/")
def home():
    return {
        "message": "Public Complaint Resolution Portal Backend Running"
    }


# Backend Test Route
@app.route("/api/test")
def test():
    return {
        "message": "Backend Connected Successfully"
    }


# Database Test Route
@app.route("/api/db-test")
def db_test():

    try:
        conn = get_db_connection()

        if conn.is_connected():
            conn.close()

            return {
                "status": "success",
                "message": "Database Connected Successfully"
            }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


if __name__ == "__main__":
    app.run(debug=True)