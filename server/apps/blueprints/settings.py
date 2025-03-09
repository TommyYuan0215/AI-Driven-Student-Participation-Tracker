from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
import base64
from apps.services.db_helper import get_db_connection

settings_route = Blueprint('settings', __name__)

"""Helper function to verify the current password"""  
def verify_password(user_id, current_password):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
        
    try:
        cursor.execute(
            "SELECT userPassword FROM USER_ACCOUNT WHERE userID = %s",
            (user_id,)
        )
        
        user = cursor.fetchone()
        print(user)
        
        if not user:
            return False, "User not found"
            
        if not check_password_hash(user['userPassword'], current_password):
            return False, "Current password is incorrect"
            
        return True, "Password verified"
        
    except Exception as e:
        return False, f"Database error: {str(e)}"
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@settings_route.route('/update_account', methods=['POST'])
def update_account():
    data = request.form
    user_id = data.get('id')
    user_name = data.get('name')
    user_email = data.get('email')
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')
    confirm_password = data.get('confirmPassword')
    profile_image = request.files.get('profileImage')
    
    # Validate again all the mandatory field first
    if not all([user_id, user_name, user_email, current_password]):
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    # Verify new password match if provided
    if new_password:
        if not confirm_password:
            return jsonify({"success": False, "message": "Please confirm your new password"}), 400
        if new_password != confirm_password:
            return jsonify({"success": False, "message": "New password and confirm password do not match"}), 400
    
    # Verify password first
    is_valid, message = verify_password(user_id, current_password)
    if not is_valid:
        return jsonify({"success": False, "message": message}), 400
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        if new_password and profile_image:
            # Update all fields
            cursor.execute(
                "UPDATE USER_ACCOUNT SET userName = %s, userEmail = %s, userPassword = %s, userPhoto = %s WHERE userID = %s",
                (user_name, user_email, generate_password_hash(new_password), profile_image.read(), user_id)
            )
        elif new_password:
            # Update with new password
            cursor.execute(
                "UPDATE USER_ACCOUNT SET userName = %s, userEmail = %s, userPassword = %s WHERE userID = %s",
                (user_name, user_email, generate_password_hash(new_password), user_id)
            )
        elif profile_image:
            # Update with new image
            cursor.execute(
                "UPDATE USER_ACCOUNT SET userName = %s, userEmail = %s, userPhoto = %s WHERE userID = %s",
                (user_name, user_email, profile_image.read(), user_id)
            )
        else:
            # Update basic info only
            cursor.execute(
                "UPDATE USER_ACCOUNT SET userName = %s, userEmail = %s WHERE userID = %s",
                (user_name, user_email, user_id)
            )
            
        connection.commit()
        
        # After successful update, refresh session data
        session['user_name'] = user_name
        session['user_email'] = user_email
        if profile_image:
            session['user_photo'] = profile_image.read()

        # Fetch the latest user data for response
        cursor.execute(
            "SELECT * FROM USER_ACCOUNT WHERE userID = %s",
            (user_id,)
        )
        latest_user = cursor.fetchone()
        
        # Convert photo to base64 if it exists
        user_photo = latest_user.get('userPhoto')
        user_photo_base64 = None
        if user_photo:
            user_photo_base64 = base64.b64encode(user_photo).decode('utf-8')

        return jsonify({
            "success": True,
            "message": "Account settings updated successfully",
            "user": {
                'userID': latest_user['userID'],
                'userName': latest_user['userName'],
                'userEmail': latest_user['userEmail'],
                'userPhoto': user_photo_base64
            }
        })
        
    except Exception as e:
        connection.rollback()
        return jsonify({"success": False, "message": f"Error updating account: {str(e)}"}), 500
        
    finally:
        cursor.close()
        connection.close()
        
@settings_route.route('reset_account_photo', methods=['POST'])
def reset_account_photo():
    data = request.form
    user_id = data.get('id')
    current_password = data.get('currentPassword')
    
    # Verify password first
    is_valid, message = verify_password(user_id, current_password)
    if not is_valid:
        return jsonify({
            "success": False, 
            "message": message
        }), 400
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Reset photo to NULL
        cursor.execute(
            "UPDATE USER_ACCOUNT SET userPhoto = NULL WHERE userID = %s",
            (user_id,)
        )
            
        connection.commit()
        
        # Clear photo from session
        if 'user_photo' in session:
            session.pop('user_photo')
        
        # Fetch updated user data
        cursor.execute(
            "SELECT userID, userName, userEmail FROM USER_ACCOUNT WHERE userID = %s",
            (user_id,)
        )
        user = cursor.fetchone()
        
        return jsonify({
            "success": True,
            "message": "Profile photo reset successfully",
            "user": {
                'userID': user['userID'],
                'userName': user['userName'],
                'userEmail': user['userEmail'],
                'userPhoto': None
            }
        })
        
    except Exception as e:
        connection.rollback()
        return jsonify({
            "success": False,
            "message": f"Error resetting photo: {str(e)}"
        }), 500
        
    finally:
        cursor.close()
        connection.close()