import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <PieChart width={180} height={200}>
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
            </PieChart>
            <div style={{ marginLeft: 16 }}>
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="left"
                payload={data.map((item, index) => ({
                  id: item.name,
                  type: "circle",
                  value: (
                    <span style={{ color: item.color, fontWeight: "bold" }}>
                      {item.name}
                    </span>
                  ),
                  color: item.color,
                }))}
              />
            </div>
          </div>
        ) : (
          <p className="text-muted text-center mt-3">
            Start tracking to see statistics
          </p>
        )}

        <div className="mt-4">
          <p className="fw-bold text-center">Emotion Distribution</p>
          {data.map((entry) => (
            <div
              key={entry.name}
              className="d-flex justify-content-between my-2"
            >
              <span>{entry.name}:</span>
              <span className="badge bg-primary">{entry.value}</span>
            </div>
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
