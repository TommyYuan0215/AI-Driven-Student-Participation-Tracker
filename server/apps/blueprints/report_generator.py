import csv
from flask import Blueprint, send_file, request, jsonify
from reportlab.lib.pagesizes import A4, letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch, mm
from base64 import b64decode
from reportlab.lib.utils import ImageReader
from io import BytesIO
from datetime import datetime
import traceback

report_generator_route = Blueprint("report_generator", __name__)

@report_generator_route.route("/generate-report", methods=["POST"])
def generate_report():
    try:
        data = request.json
        format = request.args.get("format", "pdf") 
        session_id = data.get("session_id", "Unknown Session")
        trend_data = data.get("trend_data", [])
        summary_data = data.get("summary_data", {})
        chart_image_base64 = data.get("chartImage")

        if not trend_data:
            return jsonify({"error": "No trend data provided"}), 400

        if format == "pdf":
            buffer_pdf = BytesIO()
            pdf = canvas.Canvas(buffer_pdf, pagesize=A4)
            width, height = A4
            
            # Define consistent margins and spacing
            margin = 50
            top_margin = height - 50
            section_spacing = 30
            line_spacing = 20
            
            # Header Section
            y = top_margin
            
            # Title with background
            pdf.setFillColorRGB(0.2, 0.4, 0.6)  # Dark blue background
            pdf.rect(margin, y-40, width - (2*margin), 50, fill=1, stroke=0)
            
            pdf.setFont("Helvetica-Bold", 24)
            pdf.setFillColorRGB(1, 1, 1)  # White text
            pdf.drawCentredString(width/2, y-25, "Student Participation Report")
            
            # Session info
            y -= 60
            pdf.setFillColorRGB(0, 0, 0)  # Black text
            pdf.setFont("Helvetica-Bold", 12)
            pdf.drawString(margin, y, f"Session ID: {session_id}")
            y -= line_spacing
            
            pdf.setFont("Helvetica", 10)
            pdf.drawString(margin, y, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            y -= section_spacing * 2
            
            # Chart Image Section
            if chart_image_base64:
                try:
                    if chart_image_base64.startswith("data:image"):
                        chart_image_base64 = chart_image_base64.split(",")[1]

                    chart_bytes = BytesIO(b64decode(chart_image_base64))
                    chart_image = ImageReader(chart_bytes)

                    # Calculate image dimensions to maintain aspect ratio
                    img_width, img_height = chart_image.getSize()
                    aspect_ratio = img_width / img_height
                    
                    # Set maximum dimensions
                    max_width = width - (2 * margin)
                    max_height = 300
                    
                    # Calculate dimensions maintaining aspect ratio
                    if aspect_ratio > 1:
                        image_width = min(max_width, img_width)
                        image_height = image_width / aspect_ratio
                    else:
                        image_height = min(max_height, img_height)
                        image_width = image_height * aspect_ratio

                    # Center the image horizontally
                    x_position = (width - image_width) / 2
                    
                    # Add chart title
                    pdf.setFont("Helvetica-Bold", 14)
                    pdf.drawString(margin, y, "Engagement Trend Chart")
                    y -= line_spacing
                    
                    # Draw image with border
                    pdf.setStrokeColorRGB(0.8, 0.8, 0.8)
                    pdf.rect(x_position-5, y-image_height-5, image_width+10, image_height+10, stroke=1, fill=0)
                    pdf.drawImage(chart_image, x_position, y-image_height, width=image_width, height=image_height)
                    y -= (image_height + section_spacing)
                except Exception as e:
                    print(f"Error processing chart image: {str(e)}")
                    # Continue without the chart if there's an error

            # Summary Section
            pdf.setFont("Helvetica-Bold", 14)
            pdf.drawString(margin, y, "Engagement Summary")
            y -= line_spacing
            
            # Initialize counters
            total_interested = 0
            total_bored = 0
            total_lacking_focus = 0
            
            # Count occurrences in trend data
            for row in trend_data:
                total_interested += int(row['interested'])
                total_bored += int(row['bored'])
                total_lacking_focus += int(row['lacking_focus'])
            
            # Create summary with actual counts
            cumulative_totals = {
                "Cummulative Interested": total_interested,
                "Cummulative Bored": total_bored,
                "Cummulative Lacking Focus": total_lacking_focus
            }

            # Create summary table with cumulative totals
            summary_table_data = [
                ["Cummulative Emotion State", "Count"]  # Add header row
            ]
            for key, value in cumulative_totals.items():
                summary_table_data.append([key, str(value)])

            # Draw summary table
            col_widths = [200, 100]
            table = Table(summary_table_data, colWidths=col_widths)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),  # Header background
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),  # Bold header
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ]))
            
            table.wrapOn(pdf, width - (2 * margin), height)
            table.drawOn(pdf, margin, y - table._height)
            y -= (table._height + section_spacing)
            
            # Trend Data Section
            pdf.setFont("Helvetica-Bold", 14)
            pdf.drawString(margin, y, "Detailed Trend Data")
            y -= line_spacing

            # Create trend data table
            trend_table_data = [["Timestamp", "Interested", "Bored", "Lacking Focus"]]
            for row in trend_data:
                trend_table_data.append([
                    str(row['timestamp']),
                    str(row['interested']),
                    str(row['bored']),
                    str(row['lacking_focus'])
                ])

            # Calculate column widths for trend table
            trend_col_widths = [200, 100, 100, 100]
            trend_table = Table(trend_table_data, colWidths=trend_col_widths)
            trend_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))

            # Handle pagination for trend table
            available_height = y - margin  # Available space on current page
            trend_table.wrapOn(pdf, width - (2 * margin), height)
            
            # Calculate if we need multiple pages
            if trend_table._height > available_height:
                # Split the table into chunks that fit on each page
                rows_per_page = int(available_height / 20)  # Approximate rows that fit per page
                total_rows = len(trend_table_data)
                current_row = 0
                page_num = 1
                
                while current_row < total_rows:
                    # Start new page if not first page
                    if current_row > 0:
                        pdf.showPage()
                        # Add header to new page
                        pdf.setFont("Helvetica-Bold", 14)
                        pdf.drawString(margin, height - margin, "Detailed Trend Data (continued)")
                        y = height - margin - line_spacing
                    
                    # Calculate rows for this page
                    end_row = min(current_row + rows_per_page, total_rows)
                    page_data = trend_table_data[current_row:end_row]
                    
                    # Create table for this page
                    page_table = Table(page_data, colWidths=trend_col_widths)
                    page_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 10),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                        ('GRID', (0, 0), (-1, -1), 1, colors.black),
                        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
                        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
                    ]))
                    
                    # Draw table on current page
                    page_table.wrapOn(pdf, width - (2 * margin), height)
                    page_table.drawOn(pdf, margin, y - page_table._height)
                    
                    # Add page number
                    pdf.setFont("Helvetica", 8)
                    pdf.drawRightString(width - margin, margin/2, f"Page {page_num}")
                    
                    current_row = end_row
                    page_num += 1
            else:
                # If table fits on one page
                trend_table.drawOn(pdf, margin, y - trend_table._height)
                # Add page number
                pdf.setFont("Helvetica", 8)
                pdf.drawRightString(width - margin, margin/2, "Page 1")
            
            pdf.save()
            buffer_pdf.seek(0)

            response = send_file(
                buffer_pdf, 
                as_attachment=True, 
                download_name=f"trend_report_{session_id}.pdf", 
                mimetype="application/pdf"
            )
            
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
            
            return response

        elif format == "csv":
            try:
                # Create CSV in memory
                buffer_csv = BytesIO()
                csv_writer = csv.writer(buffer_csv)
                
                # Write report header
                csv_writer.writerow(["Student Participation Report"])
                csv_writer.writerow([f"Session ID: {session_id}"])
                csv_writer.writerow([f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"])
                csv_writer.writerow([])  # Empty row for spacing
                
                # Write engagement summary
                csv_writer.writerow(["Engagement Summary"])
                csv_writer.writerow(["Cummulative Emotion State", "Count"])
                
                # Calculate cumulative totals
                total_interested = sum(int(row['interested']) for row in trend_data)
                total_bored = sum(int(row['bored']) for row in trend_data)
                total_lacking_focus = sum(int(row['lacking_focus']) for row in trend_data)
                
                # Write summary data
                summary_data = [
                    ["Cummulative Interested", total_interested],
                    ["Cummulative Bored", total_bored],
                    ["Cummulative Lacking Focus", total_lacking_focus]
                ]
                csv_writer.writerows(summary_data)
                csv_writer.writerow([])  # Empty row for spacing
                
                # Write trend data header
                csv_writer.writerow(["Detailed Trend Data"])
                csv_writer.writerow(["Timestamp", "Interested", "Bored", "Lacking Focus"])
                
                # Write trend data
                for row in trend_data:
                    try:
                        csv_writer.writerow([
                            str(row['timestamp']),
                            str(row['interested']),
                            str(row['bored']),
                            str(row['lacking_focus'])
                        ])
                    except KeyError as e:
                        print(f"Warning: Missing key in trend data: {e}")
                        continue
                    except Exception as e:
                        print(f"Warning: Error processing row: {e}")
                        continue
                
                # Get the CSV content as bytes
                csv_content = buffer_csv.getvalue()
                buffer_csv.seek(0)
                
                response = send_file(
                    BytesIO(csv_content), 
                    as_attachment=True, 
                    download_name=f"trend_report_{session_id}.csv", 
                    mimetype="text/csv"
                )
                
                # Add headers to avoid client-side blocking
                response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
                response.headers["Pragma"] = "no-cache"
                response.headers["Expires"] = "0"
                
                return response
                
            except Exception as e:
                error_details = traceback.format_exc()
                print(f"Error generating CSV: {error_details}")
                return jsonify({"error": f"Failed to generate CSV: {str(e)}"}), 500

        else:
            return jsonify({"error": "Invalid format. Please choose either 'pdf' or 'csv'."}), 400
    except Exception as e:
        error_details = traceback.format_exc()
        print(f"Detailed error: {error_details}")  # Detailed error log
        return jsonify({"error": str(e)}), 500