from flask import Blueprint, request, jsonify, session
import re
from werkzeug.security import generate_password_hash, check_password_hash
import base64
from apps.services.db_helper import get_db_connection

accountSettings_route = Blueprint('accountsettings', __name__)

@accountSettings_route.route('/basic_info', methods=['POST'])
def basic_info():
    data = request.get_json()
    userId = data.get('userId')
    userName = data.get('userName')
    userEmail = data.get('userEmail')
    
    errors = []
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute(
            "UPDATE USER_ACCOUNT SET userName = %s, userEmail = %s WHERE userID = %s", 
            (userName, userEmail, userId)
        )
        connection.commit()

        return jsonify({"success": True, "message": "User account updated successfully."})
    except Exception as e:
        connection.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500
    finally:
        cursor.close()
        connection.close()