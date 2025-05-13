from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
import base64
from apps.services.db_helper import get_db_connection

settings_route = Blueprint('settings', __name__)

# ------------------General Settings------------------ #
@settings_route.route('/get_privacy_status', methods=['GET'])
def get_privacy_status():
    user_id = session.get('user_id')  # Assuming the user ID is stored in session
    if not user_id:
        return jsonify({"success": False, "message": "User not logged in"}), 400
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT privacyStatus FROM EDUCATOR WHERE userID = %s",
            (user_id,)
        )
        user_privacy = cursor.fetchone()

        if not user_privacy:
            return jsonify({"success": False, "message": "Privacy status not found"}), 404

        return jsonify({
            "success": True,
            "privacyStatus": user_privacy['privacyStatus']
        })

    except Exception as e:
        return jsonify({"success": False, "message": f"Error retrieving privacy status: {str(e)}"}), 500
    finally:
        cursor.close()
        connection.close()
        
@settings_route.route('/update_privacy_settings', methods=['POST'])
def update_privacy_settings():
    data = request.get_json()
    user_id = data.get('id')
    privacy_status = data.get('privacyStatus')  # 1 for public, 0 for private
    
    # Validate required fields
    if not all([user_id, privacy_status is not None]):
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    # Validate privacy status value (should be either 0 or 1)
    if privacy_status not in [0, 1]:
        return jsonify({"success": False, "message": "Invalid privacy status "}), 400
    
    # Convert to integer (0 or 1)
    privacy_status = int(privacy_status)
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Update privacyStatus in the EDUCATOR table
        cursor.execute(
            "UPDATE EDUCATOR SET privacyStatus = %s WHERE userID = %s",
            (privacy_status, user_id)
        )
        
        connection.commit()

        # Fetch the updated privacy status to return in the response
        cursor.execute(
            "SELECT privacyStatus FROM EDUCATOR WHERE userID = %s",
            (user_id,)
        )
        updated_privacy = cursor.fetchone()

        return jsonify({
            "success": True,
            "message": "Privacy settings updated successfully",
            "privacyStatus": updated_privacy['privacyStatus']
        })

    except Exception as e:
        connection.rollback()
        return jsonify({"success": False, "message": f"Error updating privacy settings: {str(e)}"}), 500

    finally:
        cursor.close()
        connection.close()
        
@settings_route.route('/get_emotion_save_interval', methods=['GET'])
def get_emotion_save_interval():
    user_id = session.get('user_id')  # Assuming the user ID is stored in session
    if not user_id:
        return jsonify({"success": False, "message": "User not logged in"}), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT emotionSaveInterval FROM EDUCATOR WHERE userID = %s",
            (user_id,)
        )
        result = cursor.fetchone()

        if not result:
            return jsonify({"success": False, "message": "Emotion save interval not found"}), 404

        return jsonify({
            "success": True,
            "emotionSaveInterval": result['emotionSaveInterval']
        })

    except Exception as e:
        return jsonify({"success": False, "message": f"Error retrieving interval: {str(e)}"}), 500
    finally:
        cursor.close()
        connection.close()
        
@settings_route.route('/update_emotion_save_interval', methods=['POST'])
def update_emotion_save_interval():
    data = request.get_json()
    user_id = data.get('id')
    emotion_save_interval = data.get('emotionSaveInterval')
    
    # Validate required fields
    if not all([user_id, emotion_save_interval is not None]):
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    # Validate interval value (should be between 30 and 300 seconds)
    if not (30 <= emotion_save_interval <= 300):
        return jsonify({"success": False, "message": "Invalid interval value. Must be between 30 and 300 seconds."}), 400
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    # Convert to integer
    emotion_save_interval = int(emotion_save_interval)

    try:
        # Update emotionalSaveInterval in the EDUCATOR table
        cursor.execute(
            "UPDATE EDUCATOR SET emotionSaveInterval = %s WHERE userID = %s",
            (emotion_save_interval, user_id)
        )
        
        connection.commit()

        # Fetch the updated interval to return in the response
        cursor.execute(
            "SELECT emotionSaveInterval FROM EDUCATOR WHERE userID = %s",
            (user_id,)
        )
        updated_interval = cursor.fetchone()

        return jsonify({
            "success": True,
            "message": "Emotion save interval updated successfully",
            "emotionSaveInterval": updated_interval['emotionSaveInterval']
        })

    except Exception as e:
        connection.rollback()
        return jsonify({"success": False, "message": f"Error updating emotion save interval: {str(e)}"}), 500

    finally:
        cursor.close()
        connection.close()
        
@settings_route.route('/get_thresholds', methods=['GET'])
def get_thresholds():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "User not logged in"}), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT thresholdLackingFocus, thresholdBored FROM EDUCATOR WHERE userID = %s",
            (user_id,)
        )
        result = cursor.fetchone()
        if not result:
            return jsonify({"success": False, "message": "Thresholds not found"}), 404
        return jsonify({"success": True, "thresholds": result})
    finally:
        cursor.close()
        connection.close()
        
@settings_route.route('/update_thresholds', methods=['POST'])
def update_thresholds():
    user_id = session.get('user_id')
    data = request.get_json()
    lacking = data.get('thresholdLackingFocus')
    bored = data.get('thresholdBored')
    if not user_id or lacking is None or bored is None:
        return jsonify({"success": False, "message": "Missing data"}), 400

    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            "UPDATE EDUCATOR SET thresholdLackingFocus = %s, thresholdBored = %s WHERE userID = %s",
            (lacking, bored, user_id)
        )
        connection.commit()
        return jsonify({"success": True, "message": "Thresholds updated"})
    finally:
        cursor.close()
        connection.close()

# ------------------Account Settings------------------ #
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

    # Validate required fields
    if not all([user_id, user_name, user_email, current_password]):
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    # Verify new password match if provided
    if new_password:
        if not confirm_password:
            return jsonify({"success": False, "message": "Please confirm your new password"}), 400
        if new_password != confirm_password:
            return jsonify({"success": False, "message": "New password and confirm password do not match"}), 400

    # Verify current password
    is_valid, message = verify_password(user_id, current_password)
    if not is_valid:
        return jsonify({"success": False, "message": message}), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        profile_photo_data = None
        if profile_image:
            profile_photo_data = profile_image.read()  # Read only once

        # Update SQL query based on provided data
        if new_password and profile_photo_data:
            query = "UPDATE USER_ACCOUNT SET userName = %s, userEmail = %s, userPassword = %s, userPhoto = %s WHERE userID = %s"
            values = (user_name, user_email, generate_password_hash(new_password), profile_photo_data, user_id)
        elif new_password:
            query = "UPDATE USER_ACCOUNT SET userName = %s, userEmail = %s, userPassword = %s WHERE userID = %s"
            values = (user_name, user_email, generate_password_hash(new_password), user_id)
        elif profile_photo_data:
            query = "UPDATE USER_ACCOUNT SET userName = %s, userEmail = %s, userPhoto = %s WHERE userID = %s"
            values = (user_name, user_email, profile_photo_data, user_id)
        else:
            query = "UPDATE USER_ACCOUNT SET userName = %s, userEmail = %s WHERE userID = %s"
            values = (user_name, user_email, user_id)

        cursor.execute(query, values)
        connection.commit()

        # ✅ Update session values
        session['user_name'] = user_name
        session['user_email'] = user_email
        if profile_photo_data:
            session['user_photo'] = profile_photo_data

        session.modified = True  # ✅ Ensure Flask updates the session

        # Fetch latest user data for response
        cursor.execute("SELECT * FROM USER_ACCOUNT WHERE userID = %s", (user_id,))
        latest_user = cursor.fetchone()

        # Convert image to Base64 if it exists
        user_photo_base64 = None
        if latest_user.get('userPhoto'):
            user_photo_base64 = base64.b64encode(latest_user['userPhoto']).decode('utf-8')

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