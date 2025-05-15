import os

# MySQL remote connection configuration
db_config_remote_init = {
    'host': 'aispt-tanjunlin0215-aispt.h.aivencloud.com',
    'port': 12100,
    'user': 'avnadmin',
    'password': 'AVNS_C9D2eUJ0PchDTyo53ND',
    'ssl_ca': 'services/ca.pem'
}

db_config_remote = {
    'host': 'aispt-tanjunlin0215-aispt.h.aivencloud.com',
    'port': 12100,
    'user': 'avnadmin',
    'password': 'AVNS_C9D2eUJ0PchDTyo53ND',
    'database': 'defaultdb',
    'ssl_ca': 'services/ca.pem'
}

# MySQL local connection configuration
db_config_local_init = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'root'
}

db_config_local = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'root',
    'database': 'AISPT'
}

# Get the database configuration based on the environment
def get_db_config():
    mode = os.environ.get('DB_MODE', 'local')
    if mode == 'remote':
        return db_config_remote
    else:
        return db_config_local

def get_db_config_init():
    mode = os.environ.get('DB_MODE', 'local')
    if mode == 'remote':
        return db_config_remote_init
    else:
        return db_config_local_init
