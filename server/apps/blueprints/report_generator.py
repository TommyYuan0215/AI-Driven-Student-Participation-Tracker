import csv
from flask import Blueprint, send_file, request, jsonify
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from base64 import b64decode
from reportlab.lib.utils import ImageReader
from io import BytesIO
from datetime import datetime

report_generator_route = Blueprint("report_generator", __name__)

@report_generator_route.route("/generate-report", methods=["POST"])
def generate_report():
    try:
        data = request.json
        format = request.args.get("format", "pdf") 
        session_id = data.get("session_id", "Unknown Session")
        trend_data = data.get("trend_data", [])
        summary_data = data.get("summary_data", {})

        if format == "pdf":
            buffer_pdf = BytesIO()
            pdf = canvas.Canvas(buffer_pdf, pagesize=A4)
            width, height = A4
            y = height - 50

            # Header
            pdf.setFont("Helvetica-Bold", 16)
            pdf.drawString(50, y, "AI-Driven Student Participation Tracker")
            y -= 30
            pdf.setFont("Helvetica", 12)
            pdf.drawString(50, y, f"Trend Data Report - Session ID: {session_id}")
            y -= 20
            pdf.drawString(50, y, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            y -= 40
            
            # Chart Image Section
            chart_image_base64 = data.get("chartImage")
            if chart_image_base64:
                if chart_image_base64.startswith("data:image"):
                    chart_image_base64 = chart_image_base64.split(",")[1]

                chart_bytes = BytesIO(b64decode(chart_image_base64))
                chart_image = ImageReader(chart_bytes)

                image_width = 400
                image_height = 250
                pdf.drawImage(chart_image, 50, y - image_height, width=image_width, height=image_height)
                y -= (image_height + 20)

            # Summary Section
            pdf.setFont("Helvetica-Bold", 12)
            pdf.drawString(50, y, "Engagement Summary:")
            y -= 20
            pdf.setFont("Helvetica", 10)
            for key, value in summary_data.items():
                pdf.drawString(60, y, f"{key}: {value}")
                y -= 15

            y -= 20
            pdf.setFont("Helvetica-Bold", 12)
            pdf.drawString(50, y, "Trend Data Table:")
            y -= 20
            pdf.setFont("Helvetica", 9)
            pdf.drawString(60, y, "Timestamp       Interested     Bored     Lacking Focus")
            y -= 15

            for row in trend_data:
                if y < 50:  # Add new page if needed
                    pdf.showPage()
                    y = height - 50
                pdf.drawString(60, y, f"{row['timestamp']}         {row['interested']}              {row['bored']}           {row['lacking_focus']}")
                y -= 15

            pdf.save()
            buffer_pdf.seek(0)

            response = send_file(
                buffer_pdf, 
                as_attachment=True, 
                download_name=f"trend_report_{session_id}.pdf", 
                mimetype="application/pdf"
            )
            
            # Add headers to avoid client-side blocking
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
            
            return response

        elif format == "csv":
            # Create CSV in memory
            buffer_csv = BytesIO()
            csv_writer = csv.writer(buffer_csv)
            
            # Write headers
            csv_writer.writerow(["Timestamp", "Interested", "Bored", "Lacking Focus"])
            
            # Write trend data
            for row in trend_data:
                csv_writer.writerow([row['timestamp'], row['interested'], row['bored'], row['lacking_focus']])
            
            # Add the summary data at the end (without seeking to 0 first)
            if summary_data:
                csv_writer.writerow([])  # Empty row
                csv_writer.writerow(["Summary"])
                for key, value in summary_data.items():
                    csv_writer.writerow([key, value])
            
            # Now seek to the beginning only once, after all data is written
            buffer_csv.seek(0)
            
            response = send_file(
                buffer_csv, 
                as_attachment=True, 
                download_name=f"trend_report_{session_id}.csv", 
                mimetype="text/csv"
            )
            
            return response

        else:
            return jsonify({"error": "Invalid format. Please choose either 'pdf' or 'csv'."}), 400
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Detailed error: {error_details}")  # Detailed error log
        return jsonify({"error": str(e)}), 500