from datetime import datetime
import pytz

# Change default timestamp (GMT+0) to Asia/Kuala_Lumpur
def convert_to_timezone(mysql_timestamp, timezone="Asia/Kuala_Lumpur"):
    if not mysql_timestamp:
        return None

    # If already a datetime object, use it directly
    if isinstance(mysql_timestamp, datetime):
        utc_time = mysql_timestamp
    else:
        utc_time = datetime.strptime(mysql_timestamp, "%Y-%m-%d %H:%M:%S")

    target_timezone = pytz.timezone(timezone)

    return utc_time.replace(tzinfo=pytz.utc).astimezone(target_timezone).strftime("%Y-%m-%d, %I:%M %p")