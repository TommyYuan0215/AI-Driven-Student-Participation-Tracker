from flask import Blueprint, request, jsonify, session
from apps.services.db_helper import get_db_connection
from werkzeug.security import generate_password_hash
from datetime import datetime

userManagement_route = Blueprint('usermanagement', __name__)

@userManagement_route.route('/get_user_data')
def get_userData():
    # Check connection status
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    cursor.execute(
        "SELECT userID, userName, userEmail, userStatus, createAt FROM USER_ACCOUNT WHERE userType NOT IN ('0')"
    )
    user = cursor.fetchall()
    
    # Return user data as JSON response
    return jsonify(user), 200

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
        
# @userManagement_route.route('/add_user', methods=['POST'])
# def add_user():
#     data = request.form
    
#     userName = data.get('userName')
#     userEmail = data.get('userEmail')
#     userPassword = data.get('userPassword')  # Ensure the password is included
#     userType = data.get('userType', 1)  # Default userType to 1 (Educator)
#     userStatus = data.get('userStatus', 0)  # Default status to 0 (Not Authorized)
#     current_timestamp = datetime.now()

#     errors = []
    
#     if not userName:
#         errors.append("User name is required.")
#     if not userEmail:
#         errors.append("User email is required.")
#     if not userPassword:
#         errors.append("User password is required.")
        
#     if errors:
#         return jsonify({"success": False, "message": " ".join(errors)}), 400

#     connection = get_db_connection()
#     cursor = connection.cursor(dictionary=True)

#     # Check if email already exists
#     cursor.execute("SELECT * FROM USER_ACCOUNT WHERE userEmail = %s", (userEmail,))
#     existing_user = cursor.fetchone()

#     if existing_user:
#         return jsonify({"success": False, "message": "This email is already registered."}), 409

#     # Hash the password before storing it
#     hashed_password = generate_password_hash(userPassword)

#     try:
#         cursor.execute(
#             "INSERT INTO USER_ACCOUNT (userName, userEmail, userPassword, userType, userStatus, createAt) VALUES (%s, %s, %s, %s, %s, %s)", 
#             (userName, userEmail, hashed_password, userType, userStatus, current_timestamp)
#         )
#         connection.commit()

#         return jsonify({"success": True, "message": "User account created successfully."}), 201
#     except Exception as e:
#         connection.rollback()
#         return jsonify({"success": False, "message": f"Error: {e}"}), 500
#     finally:
#         cursor.close()
#         connection.close()

        
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
    
    
    
    
    