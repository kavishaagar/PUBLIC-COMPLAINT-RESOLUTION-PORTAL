from flask import Blueprint, request, jsonify
from database import get_db_connection
import random

complaints_bp = Blueprint("complaints", __name__)

# ==========================

# CREATE COMPLAINT

# ==========================

@complaints_bp.route("", methods=["POST"])
def create_complaint():
  try:

    data = request.json

    complaint_id = "CP-" + str(
        random.randint(1000, 9999)
    )

    user_id = data.get("user_id")
    category = data.get("category")
    subject = data.get("subject")
    description = data.get("description")
    location = data.get("location")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO complaints
        (
            complaint_id,
            user_id,
            category,
            subject,
            description,
            location
        )
        VALUES
        (%s,%s,%s,%s,%s,%s)
    """, (
        complaint_id,
        user_id,
        category,
        subject,
        description,
        location
    ))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "status": "success",
        "complaint_id": complaint_id,
        "message": "Complaint Submitted"
    })

  except Exception as e:

    return jsonify({
        "status": "error",
        "message": str(e)
    }), 500 
  
@complaints_bp.route("/my-stats", methods=["GET"])
def my_stats():
    
    user_id = request.args.get("user_id")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT COUNT(*) total FROM complaints WHERE user_id=%s",
        (user_id,)
    )

    total = cursor.fetchone()["total"]

    cursor.execute(
        """
        SELECT COUNT(*) total
        FROM complaints
        WHERE user_id=%s
        AND status='Pending'
        """,
        (user_id,)
    )

    pending = cursor.fetchone()["total"]

    cursor.execute(
        """
        SELECT COUNT(*) total
        FROM complaints
        WHERE user_id=%s
        AND status='Resolved'
        """,
        (user_id,)
    )

    resolved = cursor.fetchone()["total"]

    cursor.close()
    conn.close()

    return jsonify({
        "total": total,
        "pending": pending,
        "resolved": resolved
    })

@complaints_bp.route("", methods=["GET"])
def get_complaints():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT *
        FROM complaints
        ORDER BY created_at DESC
        """
    )

    complaints = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(complaints)

@complaints_bp.route("/track/<complaint_id>", methods=["GET"])
def track_complaint(complaint_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT *
        FROM complaints
        WHERE complaint_id=%s
        """,
        (complaint_id,)
    )

    complaint = cursor.fetchone()

    cursor.close()
    conn.close()

    if complaint:

        return jsonify(complaint)

    return jsonify({
        "message":
        "Complaint Not Found"
    }), 404


@complaints_bp.route("/user/<int:user_id>", methods=["GET"])
def get_user_complaints(user_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT *
        FROM complaints
        WHERE user_id=%s
        ORDER BY created_at DESC
        """,
        (user_id,)
    )

    complaints = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(complaints)