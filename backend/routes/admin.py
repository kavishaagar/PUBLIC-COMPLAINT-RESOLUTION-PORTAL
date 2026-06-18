from flask import Blueprint, jsonify, request
from database import get_db_connection

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/dashboard-summary", methods=["GET"])
def dashboard_summary():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Total complaints
    cursor.execute(
        "SELECT COUNT(*) total FROM complaints"
    )
    total_complaints = cursor.fetchone()["total"]

    # Pending
    cursor.execute(
        """
        SELECT COUNT(*) total
        FROM complaints
        WHERE status='Pending'
        """
    )
    pending = cursor.fetchone()["total"]

    # Resolved
    cursor.execute(
        """
        SELECT COUNT(*) total
        FROM complaints
        WHERE status='Resolved'
        """
    )
    resolved = cursor.fetchone()["total"]

    # Users
    cursor.execute(
        """
        SELECT COUNT(*) total
        FROM users
        WHERE role='user'
        """
    )
    users = cursor.fetchone()["total"]

    cursor.close()
    conn.close()

    return jsonify({
        "totalComplaints": total_complaints,
        "pendingComplaints": pending,
        "resolvedComplaints": resolved,
        "totalUsers": users
    })

@admin_bp.route("/complaints", methods=["GET"])
def get_all_complaints():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            complaints.id,
            complaints.complaint_id,
            complaints.category,
            complaints.subject,
            complaints.status,
            complaints.created_at,
            users.name,
            users.email
        FROM complaints
        JOIN users
        ON complaints.user_id = users.id
        ORDER BY complaints.created_at DESC
    """)

    complaints = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(complaints)

@admin_bp.route(
    "/complaints/<int:complaint_id>",
    methods=["PUT"]
)
def update_complaint_status(complaint_id):

    try:

        data = request.json

        new_status = data.get("status")

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE complaints
            SET status=%s
            WHERE id=%s
            """,
            (
                new_status,
                complaint_id
            )
        )

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message":
            "Complaint status updated"
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500