from flask import Blueprint, request, jsonify, session
from apps.services.db_helper import get_db_connection

trendAnalysis_route = Blueprint('trend', __name__)

@trendAnalysis_route.route('/fetch_user_trend')
def method_name():
    pass()
