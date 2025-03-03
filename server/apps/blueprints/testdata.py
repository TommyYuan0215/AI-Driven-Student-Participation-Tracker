from flask import Blueprint
import datetime

# Create a Blueprint for the routes
test_route = Blueprint('test', __name__)

x = datetime.datetime.now()

@test_route.route('/')
def get_time():
    return {
        'Name':"geek", 
        "Age":"22",
        "Date":x, 
        "programming":"python"
    }

