import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function EmotionChart({ data }) {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Emotion Count",
        data: [],
        fill: false,
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.1,
      },
    ],
  });

  useEffect(() => {
    if (data) {
      const updatedLabels = Object.keys(data);
      const updatedData = Object.values(data);

      setChartData({
        labels: updatedLabels,
        datasets: [
          {
            label: "Emotion Count",
            data: updatedData,
            fill: false,
            borderColor: "rgba(75, 192, 192, 1)",
            tension: 0.1,
          },
        ],
      });
    }
  }, [data]);

  return (
    <div>
      <h5>Emotion Statistics Chart</h5>
      <Line data={chartData} options={{ responsive: true }} />
    </div>
  );
}

export default EmotionChart;