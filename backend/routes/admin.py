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
    
@admin_bp.route("/users", methods=["GET"])
def get_users():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            id,
            name,
            email,
            mobile,
            address
        FROM users
        WHERE role='user'
        ORDER BY id DESC
    """)

    users = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(users)

@admin_bp.route("/analytics", methods=["GET"])
def analytics():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT COUNT(*) total FROM complaints"
    )
    total = cursor.fetchone()["total"]

    cursor.execute(
        """
        SELECT COUNT(*) total
        FROM complaints
        WHERE status='Pending'
        """
    )
    pending = cursor.fetchone()["total"]

    cursor.execute(
        """
        SELECT COUNT(*) total
        FROM complaints
        WHERE status='Resolved'
        """
    )
    resolved = cursor.fetchone()["total"]

    cursor.execute(
        """
        SELECT COUNT(*) total
        FROM complaints
        WHERE status='Rejected'
        """
    )
    rejected = cursor.fetchone()["total"]
    cursor.execute("""
    SELECT COUNT(*) total
    FROM users
    WHERE role='user'
""")

    total_users = cursor.fetchone()["total"]

    cursor.execute("""
        SELECT category,
        COUNT(*) count
        FROM complaints
        GROUP BY category
    """)

    department_stats = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
    "total": total,
    "pending": pending,
    "resolved": resolved,
    "rejected": rejected,
    "totalUsers": total_users,
    "departmentStats": department_stats
})

@admin_bp.route(
    "/complaints/<int:complaint_id>",
    methods=["GET"]
)
def get_complaint_details(complaint_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            complaints.id,
            complaints.complaint_id,
            complaints.category,
            complaints.subject,
            complaints.description,
            complaints.location,
            complaints.status,
            complaints.created_at,
            users.name,
            users.email
        FROM complaints
        JOIN users
        ON complaints.user_id = users.id
        WHERE complaints.id = %s
        """,
        (complaint_id,)
    )

    complaint = cursor.fetchone()

    cursor.close()
    conn.close()

    if complaint:

        return jsonify(complaint)

    return jsonify({
        "message": "Complaint Not Found"
    }), 404