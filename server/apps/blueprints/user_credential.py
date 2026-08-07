from flask import Blueprint, request, jsonify, session
import re
from werkzeug.security import generate_password_hash, check_password_hash
import base64
from apps.services.db_helper import get_db_connection
from datetime import datetime
from apps import SESSION_TIMEOUT

# Create a Blueprint for the routes
userCredential_route = Blueprint('credential', __name__)

@userCredential_route.route('/get_user_session')
def get_user_session():
    if 'logged_in' in session:
        # Check if session expired
        if "last_activity" in session:
            last_active = datetime.fromisoformat(session["last_activity"])
            if datetime.utcnow() - last_active > SESSION_TIMEOUT:
                session.clear()
                return jsonify({"logged_in": False, "message": "Session expired"}), 401

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT userPhoto, user2FA FROM USER_ACCOUNT WHERE userID = %s", (session['user_id'],))
        user = cursor.fetchone()
        user_photo = user['userPhoto'] if user else None
        user_2fa = user['user2FA'] if user else 1
        cursor.close()
        connection.close()

        user_photo_base64 = base64.b64encode(user_photo).decode('utf-8') if user_photo else None

        return jsonify({
            'logged_in': True,
            'userID': session['user_id'],
            'userType': session['user_type'],
            'userName': session['user_name'],
            'userEmail': session['user_email'],
            'userPhoto': user_photo_base64,
            'user2FA': user_2fa,
            'createAt': session.get('create_at'),
            'redirect': session['redirect']
        })
    else:
        return jsonify({'logged_in': False})

@userCredential_route.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    errors = []
    
    # Backend validation
    if not email:
        return jsonify({"status": "error", "message": "An email is required."}), 400
    elif not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"status": "error", "message": "Email is not valid."}), 400
    
    if not password:
       return jsonify({"status": "error", "message": "A password is required."}), 400
    if errors:
        return jsonify({"status": "error", "message": errors}), 400 

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM USER_ACCOUNT WHERE userEmail = %s", (email,))
    user = cursor.fetchone()

    if user and check_password_hash(user['userPassword'], password):   
        if user['userStatus'] == 1:
            if user['userType'] == 0 or user.get('user2FA', 1) == 0:
                # Admin account or 2FA disabled: bypass OTP and log in immediately
                session['logged_in'] = True
                session['user_id'] = user['userID']
                session['user_type'] = user['userType']
                session['user_email'] = user['userEmail']
                session['user_name'] = user['userName']
                session['create_at'] = str(user['createAt']) if user.get('createAt') else None
                
                session['redirect'] = "/admin/"
                
                user_photo_base64 = base64.b64encode(user['userPhoto']).decode('utf-8') if user.get('userPhoto') else None
                
                cursor.close()
                connection.close()
                
                return jsonify({
                    "status": "success", 
                    "message": "Login successful", 
                    "userID": user['userID'],
                    "userName": user['userName'],
                    "userEmail": user['userEmail'],
                    "userType": user['userType'],
                    "userPhoto": user_photo_base64,
                    "redirect": session['redirect']
                })

            # Educator account: require OTP verification
            # Generate 6-digit numeric OTP
            import secrets
            otp_code = "".join(secrets.choice("0123456789") for _ in range(6))
            
            # Save OTP to database
            from datetime import timedelta
            expires_at = datetime.utcnow() + timedelta(minutes=5)
            
            cursor.execute("DELETE FROM USER_OTP WHERE userID = %s", (user['userID'],))
            connection.commit()
            
            cursor.execute(
                "INSERT INTO USER_OTP (userID, otpCode, expiresAt) VALUES (%s, %s, %s)",
                (user['userID'], otp_code, expires_at)
            )
            connection.commit()
            
            # Log the OTP code to server console for local testing and debugging convenience
            print(f"[SECURITY] Generated OTP code for user {user['userEmail']}: {otp_code}", flush=True)
            
            # Store temporary OTP pending state in session
            session['otp_pending_user_id'] = user['userID']
            
            # Send Email
            from apps.services.email_helper import send_otp_email
            email_sent = send_otp_email(user['userEmail'], user['userName'], otp_code)
            
            email_message = "Verification code sent to your email." if email_sent else "Verification code generated (fallback: check server logs)."
            
            cursor.close()
            connection.close()
            
            return jsonify({
                "status": "otp_required",
                "message": email_message
            })
        else:
            cursor.close()
            connection.close()
            return jsonify({"status": "error", "message": "This account is not authorized yet, please contact the administrators for assistance."}), 401
    else:
        cursor.close()
        connection.close()
        return jsonify({"status": "error", "message": "Invalid credentials, Please make sure this account is in system"}), 401

@userCredential_route.route('/verify_otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    otp_code = data.get('otpCode')
    
    if not otp_code:
        return jsonify({"status": "error", "message": "Verification code is required."}), 400
        
    user_id = session.get('otp_pending_user_id')
    if not user_id:
        return jsonify({"status": "error", "message": "Session expired or invalid login attempt."}), 401
        
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    cursor.execute(
        "SELECT * FROM USER_OTP WHERE userID = %s AND otpCode = %s AND expiresAt > %s",
        (user_id, otp_code, datetime.utcnow())
    )
    otp_record = cursor.fetchone()
    
    if not otp_record:
        cursor.close()
        connection.close()
        return jsonify({"status": "error", "message": "Invalid or expired verification code."}), 401
        
    # Valid OTP! Clean it up from database
    cursor.execute("DELETE FROM USER_OTP WHERE userID = %s", (user_id,))
    connection.commit()
    
    # Get the user info to finalize login
    cursor.execute("SELECT * FROM USER_ACCOUNT WHERE userID = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()
    connection.close()
    
    if not user:
        return jsonify({"status": "error", "message": "User not found."}), 404
        
    # Promote session from OTP pending to fully logged in
    session['logged_in'] = True
    session['user_id'] = user['userID']
    session['user_type'] = user['userType']
    session['user_email'] = user['userEmail']
    session['user_name'] = user['userName']
    session['create_at'] = str(user['createAt']) if user.get('createAt') else None
    
    if user['userType'] == 0:
        session['redirect'] = "/admin/"
    else:
        session['redirect'] = "/educator/"
        
    # Clear OTP pending variables
    session.pop('otp_pending_user_id', None)
    
    user_photo_base64 = base64.b64encode(user['userPhoto']).decode('utf-8') if user.get('userPhoto') else None
    
    return jsonify({
        "status": "success", 
        "message": "Login successful", 
        "userID": user['userID'],
        "userName": user['userName'],
        "userEmail": user['userEmail'],
        "userType": user['userType'],
        "userPhoto": user_photo_base64,
        "redirect": session['redirect']
    })
    
@userCredential_route.route('/signup', methods=['POST'])
def signup():
    data = request.form  # Use `form` to get form data

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    confirm_password = data.get('confirmPassword')
    # Get the current timestamp
    current_timestamp = datetime.now()
    
    # Check if image was uploaded
    image = request.files.get('image')  # `image` is expected as a file field

    errors = []

    # Backend validation
    if not name or not email or not password or not confirm_password:
        return jsonify({"status": "error", "message": "All fields are required."}), 400
    elif password != confirm_password:
        return jsonify({"status": "error", "message": "Passwords do not match."}), 400
    elif not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"status": "error", "message": "Invalid email format."}), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("SELECT * FROM USER_ACCOUNT WHERE userEmail = %s", (email,))
    existing_user = cursor.fetchone()

    if existing_user:
        return jsonify({"status": "error", "message": "This email is already registered. Please use a different email."}), 409

    # Hash password before saving
    hashed_password = generate_password_hash(password)

    try:
        if image:
            # Handle image upload
            image_data = image.read()
            
            # Insert with image data
            cursor.execute(
                "INSERT INTO USER_ACCOUNT (userName, userEmail, userPassword, userPhoto, createAt) VALUES (%s, %s, %s, %s, %s)",
                (name, email, hashed_password, image_data, current_timestamp)
            )
        else:
            # Insert without image data
            cursor.execute(
                "INSERT INTO USER_ACCOUNT (userName, userEmail, userPassword, createAt) VALUES (%s, %s, %s, %s)",
                (name, email, hashed_password, current_timestamp)
            )

        # Commit the changes for USER_ACCOUNT table first
        connection.commit()

        # Now, insert into the EDUCATOR table
        # Assuming you want to associate this user with an educator role (userType = 0)
        cursor.execute(
            "INSERT INTO EDUCATOR (userID) VALUES ((SELECT userID FROM USER_ACCOUNT WHERE userEmail = %s))",
            (email,)
        )

        # Commit the changes for EDUCATOR table
        connection.commit()
        
        return jsonify({"status": "success", "message": "Sign up successful!"})

    except Exception as e:
        connection.rollback()
        return jsonify({"status": "error", "message": "Database error occurred"}), 500

    finally:
        cursor.close()
        connection.close()

    
@userCredential_route.route('/logout', methods=['POST'])
def logout():
    # Clear all session data
    session.clear()
    return jsonify({"status": "success", "message": "Logged out successfully", "redirect": "/"})

@userCredential_route.route('/forgot_password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({"status": "error", "message": "Email is required."}), 400
        
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM USER_ACCOUNT WHERE userEmail = %s", (email,))
    user = cursor.fetchone()
    
    if not user:
        # For security reasons, don't reveal if the user exists or not, but return success
        cursor.close()
        connection.close()
        return jsonify({"status": "success", "message": "If the email is registered in our system, you will receive a reset link shortly."})
        
    # Generate secure reset token
    import secrets
    reset_token = secrets.token_urlsafe(32)
    
    # Store token in USER_PASSWORD_RESET with 15 minutes expiration
    from datetime import datetime, timedelta
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    cursor.execute("DELETE FROM USER_PASSWORD_RESET WHERE userEmail = %s", (email,))
    connection.commit()
    
    cursor.execute(
        "INSERT INTO USER_PASSWORD_RESET (userEmail, token, expiresAt) VALUES (%s, %s, %s)",
        (email, reset_token, expires_at)
    )
    connection.commit()
    
    # Log the reset token to server console for testing convenience
    print(f"[SECURITY] Generated Reset Token for user {email}: {reset_token}", flush=True)
    
    # Send reset link email
    from apps.services.email_helper import send_reset_email
    email_sent = send_reset_email(email, user['userName'], reset_token)
    
    email_message = "If the email is registered in our system, you will receive a reset link shortly."
    if not email_sent:
        email_message = "Reset token generated (fallback: check server logs for reset link)."
        
    cursor.close()
    connection.close()
    
    return jsonify({"status": "success", "message": email_message})

@userCredential_route.route('/reset_password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')
    
    if not token or not new_password:
        return jsonify({"status": "error", "message": "Token and password are required."}), 400
        
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    cursor.execute(
        "SELECT * FROM USER_PASSWORD_RESET WHERE token = %s AND expiresAt > %s",
        (token, datetime.utcnow())
    )
    reset_record = cursor.fetchone()
    
    if not reset_record:
        cursor.close()
        connection.close()
        return jsonify({"status": "error", "message": "Invalid or expired password reset link."}), 400
        
    email = reset_record['userEmail']
    hashed_password = generate_password_hash(new_password)
    
    try:
        # Update user password
        cursor.execute(
            "UPDATE USER_ACCOUNT SET userPassword = %s WHERE userEmail = %s",
            (hashed_password, email)
        )
        connection.commit()
        
        # Clean up token
        cursor.execute("DELETE FROM USER_PASSWORD_RESET WHERE token = %s", (token,))
        connection.commit()
        
        return jsonify({"status": "success", "message": "Your password has been reset successfully. You can now log in."})
        
    except Exception as e:
        connection.rollback()
        return jsonify({"status": "error", "message": f"Database error: {e}"}), 500
        
    finally:
        cursor.close()
        connection.close()