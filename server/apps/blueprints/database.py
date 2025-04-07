from flask import Blueprint, jsonify
from werkzeug.security import generate_password_hash
from apps.services.config import db_config
import mysql.connector
from apps.services.db_helper import get_db_connection, get_db_connection_init

# Create a Blueprint for the routes
databases_route = Blueprint('database', __name__)

# Supportive Databases for AISPT
schemaName = db_config['database'] + "_system_data"

def initialize_database():
    # Initialize the database and table when the app starts
    create_database_if_not_exists()
    create_table_if_not_exists()
    create_admin_account_if_not_exists()

# Function to create a database if it doesn't exist
def create_database_if_not_exists():
    # Establish a connection to the server (no database specified)
    connection = get_db_connection_init()
    if not connection:
            raise Exception("Failed to establish database connection")
        
    cursor = connection.cursor(dictionary=True)

    # SQL query to create the database if it doesn't exist
    create_db_query = f"CREATE DATABASE IF NOT EXISTS {db_config['database']}"
    cursor.execute(create_db_query)
    connection.commit()
    
    # SQL query to create the database if it doesn't exist
    create_db_schema_query = f"CREATE DATABASE IF NOT EXISTS {schemaName}"
    cursor.execute(create_db_schema_query)
    connection.commit()

    cursor.close()
    connection.close()
    
# Function to create a table if it doesn't exist
def create_table_if_not_exists():
    # Establish a connection to the database
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    def create_user_account():
        # Create Sequence Table for User Account
        create_user_account_seq = f'''
        CREATE TABLE IF NOT EXISTS `{schemaName}`.USER_ACCOUNT_SEQ (
            userID INT NOT NULL AUTO_INCREMENT PRIMARY KEY
        )
        '''
        try:
            cursor.execute(create_user_account_seq)
            connection.commit()
            
        except mysql.connector.Error as err:
            print(f"Error creating USER_ACCOUNT_SEQ table: {err}")

        # SQL query to create the user_account_table if it doesn't exist
        create_user_account_table = f'''
        CREATE TABLE IF NOT EXISTS USER_ACCOUNT (
            userID VARCHAR(12) NOT NULL,
            userName VARCHAR(255) NOT NULL,
            userEmail VARCHAR(100) NOT NULL,
            userType INT(2) DEFAULT 1 NOT NULL,
            userPassword VARCHAR(255),
            userPhoto LONGBLOB,
            userStatus INT(2) DEFAULT 0,
            createAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (userID),
            UNIQUE (userEmail)
        )
        '''
        try:
            cursor.execute(create_user_account_table)
            connection.commit()
            
        except mysql.connector.Error as err:
            print(f"Error creating USER_ACCOUNT table: {err}")
            
        # Create Trigger for User Account Table
        create_user_account_trigger = f'''
            CREATE TRIGGER USER_ACCOUNT_TRIGGER
            BEFORE INSERT ON USER_ACCOUNT
            FOR EACH ROW
            BEGIN
                INSERT INTO `{schemaName}`.USER_ACCOUNT_SEQ VALUES (NULL);
                SET NEW.userID = CONCAT('U-', LPAD(LAST_INSERT_ID(), 5, '0'));
            END
            '''
        try:
            drop_trigger_query = f"DROP TRIGGER IF EXISTS `{schemaName}`.USER_ACCOUNT_TRIGGER"
            cursor.execute(drop_trigger_query)
            connection.commit()

            cursor.execute(create_user_account_trigger)
            connection.commit()

        except mysql.connector.Error as err:
            print(f"Error creating trigger: {err}")
            
    def create_content_slideshow():
        # Create Sequence Table for User Account
        create_content_slideshow_seq = f'''
        CREATE TABLE IF NOT EXISTS `{schemaName}`.CONTENT_SLIDESHOW_SEQ (
            slideshowID INT NOT NULL AUTO_INCREMENT PRIMARY KEY
        )
        '''
        try:
            cursor.execute(create_content_slideshow_seq)
            connection.commit()
            
        except mysql.connector.Error as err:
            print(f"Error creating CONTENT_SLIDESHOW_SEQ table: {err}")
        
        # SQL query to create the content_slideshow table if it doesn't exist
        create_content_slideshow_table = '''
        CREATE TABLE IF NOT EXISTS CONTENT_SLIDESHOW (
            slideshowID VARCHAR(12) NOT NULL,
            slideshowTitle VARCHAR(255) NOT NULL,
            slideshowDescription TEXT,
            slideshowImage LONGBLOB,
            slideshowStatus INT(2) DEFAULT 0,
            PRIMARY KEY (slideshowID)
        )
        '''
        try:
            cursor.execute(create_content_slideshow_table)
            connection.commit()
            
        except mysql.connector.Error as err:
            print(f"Error creating CONTENT_SLIDESHOW table: {err}")
            
        # Create Trigger for Content Slideshow Table
        create_content_slideshow_trigger = f'''
            CREATE TRIGGER CONTENT_SLIDESHOW_TRIGGER
            BEFORE INSERT ON CONTENT_SLIDESHOW
            FOR EACH ROW
            BEGIN
                INSERT INTO `{schemaName}`.CONTENT_SLIDESHOW_SEQ VALUES (NULL);
                SET NEW.slideshowID = CONCAT('CS-', LPAD(LAST_INSERT_ID(), 5, '0'));
            END
        '''
        try:
            drop_trigger_query = f"DROP TRIGGER IF EXISTS `{schemaName}`.CONTENT_SLIDESHOW_TRIGGER"
            cursor.execute(drop_trigger_query)
            connection.commit()

            cursor.execute(create_content_slideshow_trigger)
            connection.commit()

        except mysql.connector.Error as err:
            print(f"Error creating trigger: {err}")
            
    def create_content_announcement():
        # Create Sequence Table for Announcement
        create_content_announcement_seq = f'''
        CREATE TABLE IF NOT EXISTS `{schemaName}`.CONTENT_ANNOUNCEMENT_SEQ (
            announcementID INT NOT NULL AUTO_INCREMENT PRIMARY KEY
        )
        '''
        try:
            cursor.execute(create_content_announcement_seq)
            connection.commit()
            
        except mysql.connector.Error as err:
            print(f"Error creating CONTENT_ANNOUNCEMENT_SEQ table: {err}")
        
        # SQL query to create the content_slideshow table if it doesn't exist
        create_content_announcement_table = '''
        CREATE TABLE IF NOT EXISTS CONTENT_ANNOUNCEMENT (
            announcementID VARCHAR(12) NOT NULL,
            announcementTitle VARCHAR(255),
            announcementDescription TEXT,
            announcementStatus INT(2) DEFAULT 1,
            createAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (announcementID)
        )
        '''
        try:
            cursor.execute(create_content_announcement_table)
            connection.commit()
            
        except mysql.connector.Error as err:
            print(f"Error creating CONTENT_ANNOUNCEMENT table: {err}")
            
        # Create Trigger for Content Slideshow Table
        create_content_announcement_trigger = f'''
            CREATE TRIGGER CONTENT_ANNOUNCEMENT_TRIGGER
            BEFORE INSERT ON CONTENT_ANNOUNCEMENT
            FOR EACH ROW
            BEGIN
                INSERT INTO `{schemaName}`.CONTENT_ANNOUNCEMENT_SEQ VALUES (NULL);
                SET NEW.announcementID = CONCAT('CA-', LPAD(LAST_INSERT_ID(), 5, '0'));
            END
        '''
        try:
            drop_trigger_query = f"DROP TRIGGER IF EXISTS `{schemaName}`.CONTENT_ANNOUNCEMENT_TRIGGER"
            cursor.execute(drop_trigger_query)
            connection.commit()

            cursor.execute(create_content_announcement_trigger)
            connection.commit()

        except mysql.connector.Error as err:
            print(f"Error creating trigger: {err}")
            
    def create_educator():
        # Create Sequence Table for Educator
        create_educator_seq = f'''
        CREATE TABLE IF NOT EXISTS `{schemaName}`.EDUCATOR_SEQ (
            educatorID INT NOT NULL AUTO_INCREMENT PRIMARY KEY
        )
        '''
        try:
            cursor.execute(create_educator_seq)
            connection.commit()
            
        except mysql.connector.Error as err:
            print(f"Error creating EDUCATOR_SEQ table: {err}")
        
        # SQL query to create the educator table if it doesn't exist
        create_educator_table = '''
        CREATE TABLE IF NOT EXISTS EDUCATOR (
            educatorID VARCHAR(12) NOT NULL,
            userID VARCHAR(12) NOT NULL,
            privacyStatus INT(2) DEFAULT 0,
            thresholdLackingFocus INT DEFAULT 0,
            thresholdBored INT DEFAULT 0,
            emotionSaveInterval INT DEFAULT 60,
            PRIMARY KEY (educatorID),
            FOREIGN KEY (userID) REFERENCES USER_ACCOUNT(userID) ON DELETE CASCADE ON UPDATE CASCADE
        )
        '''
        try:
            cursor.execute(create_educator_table)
            connection.commit()
            
        except mysql.connector.Error as err:
            print(f"Error creating EDUCATOR table: {err}")
            
        # Create Trigger for Educator Table
        create_educator_trigger = f'''
            CREATE TRIGGER EDUCATOR_TRIGGER
            BEFORE INSERT ON EDUCATOR
            FOR EACH ROW
            BEGIN
                INSERT INTO `{schemaName}`.EDUCATOR_SEQ VALUES (NULL);
                SET NEW.educatorID = CONCAT('E-', LPAD(LAST_INSERT_ID(), 5, '0'));
            END
        '''
        try:
            drop_trigger_query = f"DROP TRIGGER IF EXISTS `{schemaName}`.EDUCATOR_TRIGGER"
            cursor.execute(drop_trigger_query)
            connection.commit()

            cursor.execute(create_educator_trigger)
            connection.commit()

        except mysql.connector.Error as err:
            print(f"Error creating trigger: {err}")
            
    def create_tracking_session():
        # Create Tracking Session Table
        create_tracking_session_table = '''
        CREATE TABLE IF NOT EXISTS TRACKING_SESSION (
            sessionID CHAR(36) NOT NULL,
            educatorID VARCHAR(12) NOT NULL,
            sessionStart DATETIME DEFAULT CURRENT_TIMESTAMP,
            sessionEnd DATETIME,
            PRIMARY KEY (sessionID),
            FOREIGN KEY (educatorID) REFERENCES EDUCATOR(educatorID) ON DELETE CASCADE ON UPDATE CASCADE
        )
        '''
        try:
            cursor.execute(create_tracking_session_table)
            connection.commit()
            
        except mysql.connector.Error as err:
            print(f"Error creating TRACKING_SESSION table: {err}")
            
    def create_tracking_session_details():
        # Create Tracking Session Details Table
        create_tracking_session_details_table = '''
        CREATE TABLE IF NOT EXISTS TRACKING_SESSION_DETAILS (
            sessionID CHAR(36) NOT NULL,
            educatorID VARCHAR(12) NOT NULL,
            timestamp DATETIME,
            interested INT,
            bored INT,
            lackingfocus INT,
            PRIMARY KEY (sessionID, educatorID, timestamp),
            FOREIGN KEY (sessionID) REFERENCES TRACKING_SESSION(sessionID) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (educatorID) REFERENCES TRACKING_SESSION(educatorID) ON DELETE CASCADE ON UPDATE CASCADE
        )
        '''
        
        try:
            cursor.execute(create_tracking_session_details_table)
            connection.commit()
        
        except mysql.connector.Error as err:
            print(f"Error creating TRACKING_SESSION_DETAILS table: {err}")
            
    
    # Calling function for creating sub module table.      
    create_user_account()
    create_content_slideshow()
    create_content_announcement()
    create_educator()
    create_tracking_session()
    create_tracking_session_details()

    cursor.close()
    connection.close()
    
def create_admin_account_if_not_exists():
    # Establish a connection to the database
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    # Admin email and password
    email_admin = "admin@aispt.com"
    password_admin = "admin"
    
    # Hash password before storing it in the database
    hashed_password = generate_password_hash(password_admin)
    
    try:
        query_add_admin_account = '''
                INSERT IGNORE INTO USER_ACCOUNT (userName, userEmail, userType, userPassword, userStatus) 
                VALUES (%s, %s, %s, %s, %s)
            '''
        cursor.execute(query_add_admin_account, ('Administrator', email_admin, 0, hashed_password, 1))
        connection.commit()
        
    except Exception as e:
        connection.rollback()
        return jsonify({"status": "error", "message": "Database error occurred"}), 500
    
    finally:
        cursor.close()
        connection.close()

initialize_database()

@databases_route.route('/')
def home():
    # Establish a connection
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    # Query the database
    cursor.execute("SELECT * FROM USER_ACCOUNT")
    results = cursor.fetchall()

    # Close the connection
    cursor.close()
    connection.close()

    return {"data": results}