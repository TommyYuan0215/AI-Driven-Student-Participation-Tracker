from flask import jsonify
import mysql.connector
from mysql.connector import Error
from apps.services.config import get_db_config, get_db_config_init

# Set up database connection (with database selected)
def get_db_connection():
    try:
        connection = mysql.connector.connect(**get_db_config())
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Database connection error: {e}")
        return None  # Return None if the connection fails

# Set up database connection (no database selected, for init)
def get_db_connection_init():
    try:
        connection = mysql.connector.connect(**get_db_config_init())
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Database connection error: {e}")
        return None  # Return None if the connection fails
    
