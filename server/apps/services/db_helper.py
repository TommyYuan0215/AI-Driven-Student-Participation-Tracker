from flask import jsonify
import mysql.connector
from mysql.connector import Error
from apps.services.config import db_config, db_config_init

# Set up database connection intial
def get_db_connection_init():
    try:
        connection = mysql.connector.connect(**db_config_init)
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Database connection error: {e}")
        return None  # Return None if the connection fails

# Set up database connection
def get_db_connection():
    try:
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Database connection error: {e}")
        return None  # Return None if the connection fails
    

