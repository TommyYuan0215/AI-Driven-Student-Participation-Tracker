import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "react-bootstrap";

const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#4CAF50", "#9966FF"];

function EmotionStatistics({ studentStats, isTracking }) {
  const data = Object.entries(studentStats).map(([emotion, count], index) => ({
    name: emotion,
    value: count,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="h-100 text-white p-4 d-flex flex-column justify-content-between">
      <div>
        <h4 className="text-center">Emotion Statistics</h4>
        <hr />
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" layout="horizontal" />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted text-center mt-3">
            Start tracking to see statistics
          </p>
        )}

        <div className="mt-4">
          {data.map((entry) => (
            <>
              <p className="fw-bold text-center">Emotion Distribution</p>
              <div
                key={entry.name}
                className="d-flex justify-content-between my-2"
              >
                <span>{entry.name}:</span>
                <span className="badge bg-primary">{entry.value}</span>
              </div>
            </>
          ))}
        </div>
      </div>
      <div>
        <hr />
        {isTracking && (
          <div className="mt-auto p-1 bg-success text-center rounded">
            Tracking Active
          </div>
        )}
      </div>
    </div>
  );
}

export default EmotionStatistics;
