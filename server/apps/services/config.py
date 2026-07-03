import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Use os.getenv to check the .env file first, then use the second string as a fallback
LOCAL_DB_NAME = os.getenv('DATABASE_NAME', 'AISPT')
DATABASE_HOST = os.getenv('DATABASE_HOST', 'mysql')
DATABASE_USER = os.getenv('DATABASE_USER', 'root')
DATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD', 'root')

db_config_local_init = {
    'host': DATABASE_HOST,
    'port': 3306,
    'user': DATABASE_USER,
    'password': DATABASE_PASSWORD
}

db_config_local = {
    **db_config_local_init, 
    'database': LOCAL_DB_NAME
}

def get_db_config():
    return db_config_local

def get_db_config_init():
    return db_config_local_init