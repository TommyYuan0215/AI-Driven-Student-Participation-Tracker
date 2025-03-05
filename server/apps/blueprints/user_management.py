from flask import Blueprint, request, jsonify, session
from apps.services.db_helper import get_db_connection

userManagement_route = Blueprint('usermanagement', __name__)

@userManagement_route.route('/get_user_data')
def get_userData():
    # Check connection status
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    cursor.execute("SELECT userID, userName, userEmail, userStatus FROM USER_ACCOUNT WHERE userType NOT IN ('0')")
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
        query = "UPDATE USER_ACCOUNT SET userStatus = %s WHERE userEmail = %s"
        cursor.execute(query, (userStatus, userEmail))
        connection.commit()

        return jsonify({"success": True, "message": "User status updated successfully."})
    except Exception as e:
        connection.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500
    finally:
        cursor.close()
        connection.close()
        
@userManagement_route.route('/update_user', methods=['POST'])
def update_user():
    data = request.get_json()
    userId = data.get('userId')
    userName = data.get('userName')
    userEmail = data.get('userEmail')
    
    errors = []
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        query = "UPDATE USER_ACCOUNT SET userName = %s, userEmail = %s WHERE userID = %s"
        cursor.execute(query, (userName, userEmail, userId))
        connection.commit()

        return jsonify({"success": True, "message": "User account updated successfully."})
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
    
    errors = []
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        query = "DELETE FROM USER_ACCOUNT WHERE userId = %s"
        cursor.execute(query, (userId,))
        connection.commit()

        return jsonify({"success": True, "message": "User deleted successfully."})
    except Exception as e:
        connection.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500
    finally:
        cursor.close()
        connection.close()
    
    
    
    
    