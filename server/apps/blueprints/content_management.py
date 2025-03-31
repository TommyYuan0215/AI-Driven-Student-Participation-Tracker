from flask import Blueprint, request, jsonify, session
from apps.services.db_helper import get_db_connection
import base64

contentManagement_route = Blueprint('contentmanagement', __name__)

@contentManagement_route.route('/get_slideshow_data')
def get_slideshow():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Fetch all slideshows from database
        cursor.execute("SELECT * FROM CONTENT_SLIDESHOW")
        
        slideshows = cursor.fetchall()
        
        # Process each slideshow's image data
        for slideshow in slideshows:
            if slideshow['slideshowImage']:
                # Convert image data to base64 string if it's not already
                slideshow['slideshowImage'] = base64.b64encode(slideshow['slideshowImage']).decode('utf-8')
                

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

@contentManagement_route.route('/add_slideshow', methods=['POST'])
def add_slideshow():
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
        slideshowImage_data = slideshowImage.read()
        
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
        
@contentManagement_route.route('/edit_slideshow', methods=['POST'])
def edit_slideshow():
    data = request.form
    
    slideshowID = data.get('slideshowID')
    slideshowTitle = data.get('slideshowTitle')
    slideshowDesc = data.get('slideshowDesc')
    slideshowImage = request.files.get('slideshowImage')
    
    errors = []
    
    # Validate inputs
    if not slideshowID:
        errors.append("Slideshow ID is required.")
    if not slideshowTitle:
        errors.append("Slideshow title is required.")
    if not slideshowDesc:
        errors.append("Slideshow description is required.")
        
    # Validate image file type if provided
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
        if slideshowImage:
            # Update with new image
            slideshowImage_data = slideshowImage.read()
            cursor.execute(
                "UPDATE CONTENT_SLIDESHOW SET slideshowTitle = %s, slideshowDescription = %s, slideshowImage = %s WHERE slideshowID = %s", 
                (slideshowTitle, slideshowDesc, slideshowImage_data, slideshowID)
            )
        else:
            # Update without changing image
            cursor.execute(
                "UPDATE CONTENT_SLIDESHOW SET slideshowTitle = %s, slideshowDescription = %s WHERE slideshowID = %s", 
                (slideshowTitle, slideshowDesc, slideshowID)
            )
        
        if cursor.rowcount == 0:
            return jsonify({"status": "error", "message": "Slideshow not found."}), 404
            
        connection.commit()
        return jsonify({
            "status": "success",
            "message": "Slideshow updated successfully."
        }), 200
        
    except Exception as e:
        connection.rollback()
        return jsonify({
            "status": "error",
            "message": f"Error updating slideshow: {str(e)}"
        }), 500
    
    finally:
        cursor.close()
        connection.close()
        
@contentManagement_route.route('/delete_slideshow', methods=['POST'])
def delete_slideshow():
    data = request.get_json()
    slideshowID = data.get('slideshowID')
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Delete slideshow from database
        cursor.execute(
            "DELETE FROM CONTENT_SLIDESHOW WHERE slideshowID = %s", 
            (slideshowID,)
        )
        
        connection.commit()
        return jsonify({
            "status": "success",
            "message": "Slideshow deleted successfully."
        }), 200
    
    except Exception as e:
        connection.rollback()
        return jsonify({
            "status": "error",
            "message": f"Error deleting slideshow: {str(e)}"
        }), 500
    
    finally:
        cursor.close()
        connection.close()
        
# --------------------------------------------------------------------
@contentManagement_route.route('/get_announcement_data')
def get_announcement():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Fetch all slideshows from database
        cursor.execute("SELECT * FROM CONTENT_ANNOUNCEMENT")
        
        announcement = cursor.fetchall()        

        return jsonify({
            "status": "success",
            "data": announcement,
            "message": "Slideshows fetched successfully"
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error fetching annoucement: {str(e)}"
        }), 500

    finally:
        cursor.close()
        connection.close()
        
@contentManagement_route.route('/update_announcement_status', methods=['POST'])
def update_announcement_status():
    data = request.get_json()
    announcementId = data.get('announcementId')
    announcementStatus = data.get('announcementStatus')

    if announcementId is None or announcementStatus is None:
        return jsonify({"success": False, "message": "Announcement ID and status are required"}), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            "UPDATE CONTENT_ANNOUNCEMENT SET announcementStatus = %s WHERE announcementID = %s",
            (announcementStatus, announcementId)
        )
        connection.commit()

        return jsonify({"success": True, "message": "Announcement status updated successfully."})
    except Exception as e:
        connection.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500
    finally:
        cursor.close()
        connection.close()
        
@contentManagement_route.route('/add_announcement', methods=['POST'])
def add_announcement():
    data = request.form
    
    announcementDesc = data.get('announcementDesc')
    
    errors = []
    
    # Validate inputs
    if not announcementDesc:
        errors.append("Slideshow description is required.")
            
    if errors:
        return jsonify({"status": "error", "message": " ".join(errors)}), 400
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Insert into database
        cursor.execute(
            "INSERT INTO CONTENT_ANNOUNCEMENT (announcementDescription) VALUES (%s)",
            (announcementDesc,) 
        )
        
        connection.commit()
        return jsonify({
            "status": "success",
            "message": "Announcement added successfully."
        }), 200
    
    except Exception as e:
        connection.rollback()
        return jsonify({
            "status": "error",
            "message": f"Error adding announcement: {str(e)}"
        }), 500
    
    finally:
        cursor.close()
        connection.close()
        