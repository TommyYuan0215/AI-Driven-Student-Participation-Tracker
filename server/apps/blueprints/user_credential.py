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

        user_photo = session.get('user_photo')
        user_photo_base64 = base64.b64encode(user_photo).decode('utf-8') if user_photo else None

        return jsonify({
            'logged_in': True,
            'userID': session['user_id'],
            'userType': session['user_type'],
            'userName': session['user_name'],
            'userEmail': session['user_email'],
            'userPhoto': user_photo_base64,
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
            # Set session variables
            session['logged_in'] = True
            session['user_id'] = user['userID']  # Use userID as a unique identifier
            session['user_type'] = user['userType']
            session['user_email'] = user['userEmail']
            session['user_name'] = user['userName']
            session['user_photo'] = user['userPhoto']
            
            if user['userType'] == 0:
                session['redirect'] = "/views/admin/dashboard"
            else:
                session['redirect'] = "/views/educator/dashboard"
            
            return jsonify({"status": "success", "message": "Login successful", "userName": user['userName'], "redirect": session['redirect']})
        else:
            return jsonify({"status": "error", "message": "This account is not authorized yet, please contact the administrators for assistance."}), 401
    else:
        return jsonify({"status": "error", "message": "Invalid credentials, Please make sure this account is in system"}), 401
    
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