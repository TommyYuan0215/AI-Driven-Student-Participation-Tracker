import uuid
from flask import Blueprint, request, jsonify
from apps.services.db_helper import get_db_connection
from apps.services.timezone_helper import convert_to_timezone

tracking_session_route = Blueprint("tracking_session", __name__)

@tracking_session_route.route("/get_tracking_session", methods=["GET"])
def get_tracking_session():
    user_id = request.args.get("userID")  # Get userID from query params
    
    if not user_id:
        return jsonify({"error": "userID is required"}), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        get_sessions_query = '''
        SELECT 
            t.sessionID, 
            t.educatorID, 
            t.sessionStart, 
            t.sessionEnd, 
            ua.userName
        FROM 
            TRACKING_SESSION t
        INNER JOIN 
            EDUCATOR e ON t.educatorID = e.educatorID
        INNER JOIN 
            USER_ACCOUNT ua ON e.userID = ua.userID
        WHERE 
            ua.userID = %s
        ORDER BY
            t.sessionStart DESC
        '''
        cursor.execute(get_sessions_query, (user_id,))
        trackingsessions = cursor.fetchall()
        
        for session in trackingsessions:
            session["sessionStart"] = convert_to_timezone(session["sessionStart"])
            session["sessionEnd"] = convert_to_timezone(session["sessionEnd"])

        return jsonify(trackingsessions), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        connection.close()


@tracking_session_route.route("/create_tracking_session", methods=["POST"])
def create_tracking_session():
    data = request.get_json() 
    
    user_id = data.get('userID')
    
    if not user_id:
        return jsonify({"error": "userID is required"}), 400
    
    session_id = str(uuid.uuid4())  # Create a unique session ID
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # First get the educatorID from the EDUCATOR table
        get_educator_query = '''
        SELECT educatorID FROM EDUCATOR WHERE userID = %s
        '''
        cursor.execute(get_educator_query, (user_id,))
        educator_result = cursor.fetchone()
        
        if not educator_result:
            return jsonify({"error": "Educator not found for this user"}), 404
        
        educator_id = educator_result['educatorID']
        
        # Insert the tracking session
        insert_query = '''
        INSERT INTO TRACKING_SESSION (sessionID, educatorID)
        VALUES (%s, %s)
        '''
        cursor.execute(insert_query, (session_id, educator_id))
        connection.commit()
        
        return jsonify({"sessionID": session_id}), 201
    
    except Exception as e:
        connection.rollback()
        return jsonify({"error": str(e)}), 500
    
    finally:
        cursor.close()
        connection.close()
        
@tracking_session_route.route("/end_tracking_session", methods=["POST"])
def end_tracking_session():
    # Get data from the request
    data = request.get_json()
    session_id = data.get('sessionID')
    elapsed_time = data.get('elapsedTime')
    
    if not session_id:
        return jsonify({"error": "sessionID is required"}), 400
    
    # Get a DB connection
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # First check if the session exists and is not already ended
        check_query = '''
        SELECT sessionID, sessionStart FROM TRACKING_SESSION 
        WHERE sessionID = %s AND sessionEnd IS NULL
        '''
        cursor.execute(check_query, (session_id,))
        session = cursor.fetchone()
        
        if not session:
            return jsonify({"error": "Session not found or already ended"}), 404
        
        # Update the session with an end time
        update_query = '''
        UPDATE TRACKING_SESSION 
        SET sessionEnd = DATE_ADD(sessionStart, INTERVAL %s SECOND)
        WHERE sessionID = %s
        '''
        cursor.execute(update_query, (elapsed_time, session_id))
        connection.commit()
        
        return jsonify({
            "success": True,
            "message": "Session ended successfully",
        }), 200
    
    except Exception as e:
        connection.rollback()
        return jsonify({"error": str(e)}), 500
    
    finally:
        cursor.close()
        connection.close()
