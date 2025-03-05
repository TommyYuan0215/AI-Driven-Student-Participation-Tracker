from flask import Blueprint, request, jsonify, session
from apps.services.db_helper import get_db_connection
import base64

contentManagement_route = Blueprint('contentmanagement', __name__)

@contentManagement_route.route('/get_slideshow_data')
def get_slideshow_data():
    # Check connection status
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM CONTENT_SLIDESHOW")
    slideshow = cursor.fetchall()
    
    # Return user data as JSON response
    return jsonify(slideshow), 200

@contentManagement_route.route('/add_slideshow', methods=['POST'])
def addSlideshow():
    data = request.form
    
    slideshowTitle = data.get('slideshowTitle')
    slideshowDesc = data.get('slideshowDesc')
    slideshowImage = request.files.get('slideshowImage')
    
    errors = []
    
    # Validate inputs
    if not slideshowTitle:
        errors.append("Slideshow title is required.")
    if not slideshowDesc:
        errors.append("Slideshow description is required.")
    if not slideshowImage:
        errors.append("Slideshow image is required.")
        
    # Validate image file type
    if slideshowImage:
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
        file_extension = slideshowImage.filename.rsplit('.', 1)[1].lower() if '.' in slideshowImage.filename else ''
        if file_extension not in allowed_extensions:
            errors.append("Invalid image format. Allowed formats: PNG, JPG, JPEG, GIF")
            
    if errors:
        return jsonify({"status": "error", "message": errors}), 400
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Process image
        slideshowImage_data = base64.b64encode(slideshowImage.read()).decode('utf-8')
        
        # Insert into database
        cursor.execute(
            "INSERT INTO CONTENT_SLIDESHOW (slideshowTitle, slideshowDescription, slideshowImage) VALUES (%s, %s, %s)",
            (slideshowTitle, slideshowDesc, slideshowImage_data)
        )
        
        connection.commit()
        return jsonify({
            "status": "success",
            "message": "Slideshow added successfully."
        }), 200
    
    except Exception as e:
        connection.rollback()
        return jsonify({
            "status": "error",
            "message": f"Error adding slideshow: {str(e)}"
        }), 500
    
    finally:
        cursor.close()
        connection.close()
        
@contentManagement_route.route('/get_slideshows', methods=['GET'])
def getSlideshows():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Fetch all slideshows from database
        cursor.execute("""
            SELECT 
                slideshowID as _id,
                slideshowTitle as title,
                slideshowDescription as description,
                slideshowImage as image
            FROM CONTENT_SLIDESHOW
        """)
        
        slideshows = cursor.fetchall()
        
        # Process each slideshow's image data
        for slideshow in slideshows:
            if slideshow['image']:
                # Convert image data to base64 string if it's not already
                slideshow['image'] = base64.b64encode(slideshow['image']).decode('utf-8')
                
                # Add data URL prefix for direct use in img src
                slideshow['image'] = f"data:image/jpeg;base64,{slideshow['image']}"
                

        return jsonify({
            "status": "success",
            "data": slideshows,
            "message": "Slideshows fetched successfully"
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error fetching slideshows: {str(e)}"
        }), 500

    finally:
        cursor.close()
        connection.close()