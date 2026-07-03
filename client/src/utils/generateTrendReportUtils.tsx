import axios from "./axiosUtils";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";

export const generateTrendReport = async (
  sessionID,
  trendData,
  chartRef,
  format = "pdf"
) => {
  if (!trendData || trendData.length === 0) {
    toast.warn("No data available to generate report.");
    return;
  }

  try {
    // Capture chart image
    let chartImage = null;
    if (chartRef && chartRef.current) {
      try {
        // Wait for the next render cycle to ensure chart is rendered
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get the chart container
        const chartContainer = chartRef.current;
        if (chartContainer && document.body.contains(chartContainer)) {
          const canvas = await html2canvas(chartContainer, {
            useCORS: true,
            allowTaint: true,
            scale: 2, // Higher quality
            logging: false,
            backgroundColor: '#ffffff'
          });
          chartImage = canvas.toDataURL("image/png");
        } else {
          console.warn("Chart container not found in document");
        }
      } catch (error) {
        console.error("Error capturing chart:", error);
        // Continue without chart image
      }
    }

    const summaryData = trendData.reduce(
      (acc, row) => {
        acc.Interested += row.Interested;
        acc.Bored += row.Bored;
        acc.LackingFocus += row.LackingFocus;
        return acc;
      },
      { Interested: 0, Bored: 0, LackingFocus: 0 }
    );

    const response = await axios.post(
      `/report_generator/generate-report?format=${format}`,
      {
        session_id: sessionID,
        trend_data: trendData.map((entry) => ({
          timestamp: new Date(entry.timestamp).toLocaleString(),
          interested: entry.Interested,
          bored: entry.Bored,
          lacking_focus: entry.LackingFocus,
        })),
        summary_data: summaryData,
        chartImage: chartImage
      },
      {
        responseType: "blob",
      }
    );

    // Check if the response is actually an error JSON disguised as a blob
    if (response.data.size < 100) {
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const jsonResponse = JSON.parse(reader.result as string);
          if (jsonResponse.error) {
            console.error("Server error:", jsonResponse.error);
            toast.error(`Error: ${jsonResponse.error}`);
            return;
          }
        } catch (e) {
          // Not a JSON error, continue with normal blob handling
        }
      };
      reader.readAsText(response.data);
    }

    const blobType = format === "csv" ? "text/csv" : "application/pdf";
    const blob = new Blob([response.data], { type: blobType });
    const filename = `trend_report_${sessionID}.${format}`;

    // Use a safer download approach
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    link.style.display = "none";
    document.body.appendChild(link);

    // Add a slight delay before clicking
    setTimeout(() => {
      link.click();
      // Clean up after download starts
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    }, 300);

    toast.success(`Report (${format.toUpperCase()}) downloaded successfully!`);
  } catch (err) {
    // Improved error handling
    if (err.response && err.response.data) {
      // Try to read the error response
      if (err.response.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = function () {
          try {
            const errorJson = JSON.parse(reader.result as string);
            console.error("Server error details:", errorJson);
            toast.error(errorJson.error || "Failed to generate report");
          } catch (e) {
            console.error("Error parsing error response:", e);
            console.error("Raw error response:", reader.result);
            toast.error("Failed to generate report");
          }
        };
        reader.readAsText(err.response.data);
      } else {
        console.error("Error generating report:", err.response.data);
        toast.error(err.response.data.error || "Failed to generate report");
      }
    } else {
      console.error("Error generating report:", err.message);
      toast.error("Failed to generate report");
    }
  }
};
