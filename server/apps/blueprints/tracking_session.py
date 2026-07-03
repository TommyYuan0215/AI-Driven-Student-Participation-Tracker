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
        
@tracking_session_route.route("/get_tracking_session_public", methods=["GET"])
def get_tracking_session_public():
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
            e.privacyStatus = '1' AND ua.userID != %s
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
        
@tracking_session_route.route("/get_tracking_session_admin", methods=["GET"])
def get_tracking_session_admin():
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
        ORDER BY
            t.sessionStart DESC
        '''
        cursor.execute(get_sessions_query)
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
    elapsed_time = data.get('sessionElapsedTime')
    
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
        
# ----------------------------------------------

@tracking_session_route.route("/tracking_emotion", methods=["POST"])
def tracking_emotion():
    data = request.get_json()

    session_id = data.get("sessionID")
    timestamp = data.get("timestamp")
    interested_count = int(data.get('interestedCount', 0))
    bored_count = int(data.get('boredCount', 0))
    lacking_focus_count = int(data.get('lackingFocusCount', 0))

    if not session_id or not timestamp:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # First check if session exists and is active
        check_query = """
            SELECT sessionID FROM TRACKING_SESSION 
            WHERE sessionID = %s AND sessionEnd IS NULL
        """
        cursor.execute(check_query, (session_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Invalid or ended session"}), 400

        # Insert the tracking data
        insert_query = """
            INSERT INTO TRACKING_SESSION_DETAILS 
            (sessionID, timestamp, interested, bored, lackingfocus)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (
            session_id, 
            timestamp, 
            interested_count, 
            bored_count, 
            lacking_focus_count
        ))

        connection.commit()
        return jsonify({"message": "Emotion data inserted successfully!"}), 200

    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
        
@tracking_session_route.route("/get_tracking_emotion", methods=["GET"])
def get_tracking_emotion():
    session_id = request.args.get("sessionID")
    
    if not session_id:
        return jsonify({"error": "sessionID is required"}), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        # Fetch the tracking data for the given sessionID
        select_query = """
            SELECT ts.sessionID, ts.sessionStart, ts.sessionEnd, tsd.timestamp,
                SUM(tsd.interested) AS interestedCount, 
                SUM(tsd.bored) AS boredCount, 
                SUM(tsd.lackingfocus) AS lackingFocusCount
            FROM TRACKING_SESSION_DETAILS tsd
            INNER JOIN TRACKING_SESSION ts ON tsd.sessionID = ts.sessionID
            WHERE tsd.sessionID = %s
            GROUP BY ts.sessionID, ts.sessionStart, ts.sessionEnd, tsd.timestamp;
        """
        
        cursor.execute(select_query, (session_id,))
        tracking_data = cursor.fetchall()

        return jsonify(tracking_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        connection.close()

@tracking_session_route.route("/delete_all_sessions", methods=["POST"])
def delete_all_sessions():
    data = request.get_json()
    user_id = data.get("userID")
    if not user_id:
        return jsonify({"success": False, "message": "userID is required"}), 400

    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        # Get educatorID from userID
        cursor.execute("SELECT educatorID FROM EDUCATOR WHERE userID = %s", (user_id,))
        educator = cursor.fetchone()
        if not educator:
            return jsonify({"success": False, "message": "Educator not found for this userID"}), 404
        educator_id = educator[0] if isinstance(educator, (list, tuple)) else educator["educatorID"]

        # Get all sessionIDs for this educator
        cursor.execute("SELECT sessionID FROM TRACKING_SESSION WHERE educatorID = %s", (educator_id,))
        session_ids = [row[0] if isinstance(row, (list, tuple)) else row["sessionID"] for row in cursor.fetchall()]

        if session_ids:
            # Delete from TRACKING_SESSION_DETAILS first (FK constraint)
            format_strings = ','.join(['%s'] * len(session_ids))
            cursor.execute(f"DELETE FROM TRACKING_SESSION_DETAILS WHERE sessionID IN ({format_strings})", tuple(session_ids))
            # Delete from TRACKING_SESSION
            cursor.execute(f"DELETE FROM TRACKING_SESSION WHERE sessionID IN ({format_strings})", tuple(session_ids))
            connection.commit()
            return jsonify({"success": True, "message": "All session data deleted."})
        else:
            return jsonify({"success": True, "message": "No sessions found to delete."})
    except Exception as e:
        connection.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        connection.close()
