from flask import Blueprint, request, jsonify, session
from datetime import datetime
from apps.services.db_helper import get_db_connection
from werkzeug.security import generate_password_hash
from apps.services.timezone_helper import convert_to_timezone

userManagement_route = Blueprint('usermanagement', __name__)


@userManagement_route.route('/get_user_data')
def get_userData():
    # Check connection status
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    cursor.execute(
        "SELECT userID, userName, userEmail, userStatus, createAt FROM USER_ACCOUNT WHERE userType NOT IN ('0')"
    )
    users = cursor.fetchall()
    
    for user in users:
        user["createAt"] = convert_to_timezone(user["createAt"])
    
    # Return user data as JSON response
    return jsonify(users), 200

@userManagement_route.route('/authorized_user', methods=['POST'])
def authorized_user():
    data = request.get_json()
    userEmail = data.get('userEmail')
    userStatus = data.get('userStatus')
    
    errors = []
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute(
            "UPDATE USER_ACCOUNT SET userStatus = %s WHERE userEmail = %s", 
            (userStatus, userEmail)
        )
        connection.commit()

        return jsonify({"success": True, "message": "User status updated successfully."})
    except Exception as e:
        connection.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500
    finally:
        cursor.close()
        connection.close()
        
@userManagement_route.route('/add_user', methods=['POST'])
def add_user():
    import secrets
    import string

    data = request.form

    userName = data.get('userName')
    userEmail = data.get('userEmail')
    userType = data.get('userType', 1)   # Default: 1 (Educator)
    userStatus = data.get('userStatus', 0)  # Default: 0 (Not Authorized)
    current_timestamp = datetime.now()

    errors = []

    if not userName:
        errors.append("User name is required.")
    if not userEmail:
        errors.append("User email is required.")

    if errors:
        return jsonify({"success": False, "message": " ".join(errors)}), 400

    # Generate a 10-character password using the Base64 alphabet (A-Z, a-z, 0-9, +, /)
    base64_alphabet = string.ascii_letters + string.digits + "+/"
    userPassword = "".join(secrets.choice(base64_alphabet) for _ in range(10))

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    # Check if email already exists
    cursor.execute("SELECT * FROM USER_ACCOUNT WHERE userEmail = %s", (userEmail,))
    existing_user = cursor.fetchone()

    if existing_user:
        cursor.close()
        connection.close()
        return jsonify({"success": False, "message": "This email is already registered."}), 409

    # Hash the password before storing it
    hashed_password = generate_password_hash(userPassword)

    try:
        cursor.execute(
            "INSERT INTO USER_ACCOUNT (userName, userEmail, userPassword, userType, userStatus, createAt) VALUES (%s, %s, %s, %s, %s, %s)",
            (userName, userEmail, hashed_password, userType, userStatus, current_timestamp)
        )
        connection.commit()
        return jsonify({
            "success": True, 
            "message": "User account created successfully.",
            "password": userPassword
        }), 201
    except Exception as e:
        connection.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500
    finally:
        cursor.close()
        connection.close()

        
@userManagement_route.route('/update_user', methods=['POST'])
def update_user():
    data = request.form
    
    userId = data.get('userId')
    userName = data.get('userName')
    userEmail = data.get('userEmail')
    
    errors = []
    
    if not userId:
        errors.append("User ID is required.")
    if not userName:
        errors.append("User name is required.")
    if not userEmail:
        errors.append("User email is required.")
        
    if errors:
        return jsonify({"success": False, "message": " ".join(errors)}), 400
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute(
            "UPDATE USER_ACCOUNT SET userName = %s, userEmail = %s WHERE userID = %s", 
            (userName, userEmail, userId)
        )
        connection.commit()

        return jsonify({"success": True, "message": "User account updated successfully."}), 200
    except Exception as e:
        connection.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500
    finally:
        cursor.close()
        connection.close()
        
@userManagement_route.route('/delete_user', methods=['POST'])
def delete_user():
    data = request.get_json()
    userId = data.get('userId')
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute(
            "DELETE FROM USER_ACCOUNT WHERE userId = %s",
            (userId,)
        )
        connection.commit()

        return jsonify({"success": True, "message": "User deleted successfully."})
    except Exception as e:
        connection.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500
    finally:
        cursor.close()
        connection.close()
    
    
    
    
    