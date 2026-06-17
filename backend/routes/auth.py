from flask import Blueprint, request, jsonify
from database import get_db_connection
import bcrypt

auth_bp = Blueprint("auth", __name__)

# ==========================
# USER REGISTRATION
# ==========================

@auth_bp.route("/register", methods=["POST"])
def register():

    try:
        data = request.json

        name = data.get("name")
        email = data.get("email")
        mobile = data.get("mobile")
        address = data.get("address")
        password = data.get("password")

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check existing email
        cursor.execute(
            "SELECT id FROM users WHERE email=%s",
            (email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:

            print("EMAIL ALREADY EXISTS:", email)

            return jsonify({
                "status": "error",
                "message": "Email already registered"
            }), 400
        # Hash password
        hashed_password = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        )

        cursor.execute("""
            INSERT INTO users
            (name,email,mobile,address,password)
            VALUES (%s,%s,%s,%s,%s)
        """, (
            name,
            email,
            mobile,
            address,
            hashed_password.decode("utf-8")
        ))

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Registration Successful"
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    
# ==========================
# USER LOGIN
# ==========================

@auth_bp.route("/login", methods=["POST"])
def login():

    try:
        data = request.json

        email = data.get("email")
        password = data.get("password")

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM users WHERE email=%s",
            (email,)
        )

        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if not user:

            return jsonify({
                "status": "error",
                "message": "User not found"
            }), 404

        stored_password = user["password"]

        password_match = bcrypt.checkpw(
            password.encode("utf-8"),
            stored_password.encode("utf-8")
        )

        if not password_match:

            return jsonify({
                "status": "error",
                "message": "Invalid Password"
            }), 401

        return jsonify({
            "status": "success",
            "message": "Login Successful",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"]
            }
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500