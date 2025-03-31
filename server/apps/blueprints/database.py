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
        create_user_account_table = '''
        CREATE TABLE IF NOT EXISTS USER_ACCOUNT (
            userID VARCHAR(12) NOT NULL,
            userName VARCHAR(255) NOT NULL,
            userEmail VARCHAR(100) NOT NULL,
            userType INT(2) DEFAULT 1 NOT NULL,
            userPassword VARCHAR(255),
            userPhoto LONGBLOB,
            userStatus INT(2) DEFAULT 0,
            createAt DATETIME,
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
            CREATE TRIGGER IF NOT EXISTS USER_ACCOUNT_TRIGGER
            BEFORE INSERT ON USER_ACCOUNT
            FOR EACH ROW
            BEGIN
                INSERT INTO `{schemaName}`.USER_ACCOUNT_SEQ VALUES (NULL);
                SET NEW.userID = CONCAT('U-', LPAD(LAST_INSERT_ID(), 5, '0'));
            END
        '''
        try:
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
            CREATE TRIGGER IF NOT EXISTS CONTENT_SLIDESHOW_TRIGGER
            BEFORE INSERT ON CONTENT_SLIDESHOW
            FOR EACH ROW
            BEGIN
                INSERT INTO `{schemaName}`.CONTENT_SLIDESHOW_SEQ VALUES (NULL);
                SET NEW.slideshowID = CONCAT('S-', LPAD(LAST_INSERT_ID(), 5, '0'));
            END
        '''
        try:
            cursor.execute(create_content_slideshow_trigger)
            connection.commit()
        except mysql.connector.Error as err:
            print(f"Error creating trigger: {err}")
    
    # Calling function for creating sub module table.      
    create_user_account()
    create_content_slideshow()

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