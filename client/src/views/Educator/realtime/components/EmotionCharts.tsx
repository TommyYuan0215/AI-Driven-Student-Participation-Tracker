import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useSession from "../../../../hooks/useSession";

const EMOTION_COLORS = {
  'Interested': '#4CAF50',      // Vibrant Green
  'Bored': '#FFC107',           // Amber/Yellow
  'Lacking_Focus': '#F44336',    // Soft Red
  'default': '#2196F3'          // Blue
};

function EmotionStatistics({ studentStats, isTracking }) {
  const emotions = ['Interested', 'Bored', 'Lacking_Focus'];

  const displayData = emotions.map(emotion => ({
    name: emotion.replace('_', ' '),
    key: emotion,
    value: studentStats[emotion] || 0,
    color: EMOTION_COLORS[emotion]
  }));

  const total = displayData.reduce((sum, item) => sum + item.value, 0);

  // Calculate Engagement/Focus Score (0-100)
  // Interested = 100%, Lacking Focus = 40%, Bored = 10%
  const focusScore = total > 0
    ? Math.round(((studentStats['Interested'] || 0) * 100 + (studentStats['Lacking_Focus'] || 0) * 40 + (studentStats['Bored'] || 0) * 10) / total)
    : 0;

  // Determine Insight/Recommendation
  const getInsight = () => {
    if (total === 0) return { text: "No data captured yet.", icon: "⏳", color: "#888" };
    if (focusScore > 80) return { text: "Class is highly focused!", icon: "🚀", color: "#4CAF50" };
    if (studentStats['Bored'] > total * 0.4) return { text: "Engagement is dropping. Try a quick quiz!", icon: "💡", color: "#FFC107" };
    if (studentStats['Lacking_Focus'] > total * 0.3) return { text: "Focus levels low. Check for distractions.", icon: "⚠️", color: "#F44336" };
    return { text: "Stable classroom atmosphere.", icon: "✅", color: "#2196F3" };
  };

  const insight = getInsight();

  return (
    <div className="h-100 text-white p-3 d-flex flex-column shadow-sm" style={{ backgroundColor: 'rgba(15, 15, 15, 0.7)', backdropFilter: 'blur(20px)' }}>
      {/* Header */}
      <div className="mb-3">
        <h5 className="text-uppercase letter-spacing-2 fw-bold text-center mb-1" style={{ fontSize: '0.8rem', color: '#888' }}>
          Live Monitor
        </h5>
        <div className="d-flex align-items-center justify-content-center">
          <div className={`status-dot ${isTracking ? 'active' : ''}`} style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isTracking ? '#4CAF50' : '#555',
            marginRight: '8px',
            boxShadow: isTracking ? '0 0 10px #4CAF50' : 'none',
            animation: isTracking ? 'pulse 2s infinite' : 'none'
          }}></div>
          <span style={{ fontSize: '0.7rem', color: isTracking ? '#4CAF50' : '#888', fontWeight: '700', letterSpacing: '0.5px' }}>
            {isTracking ? 'SYSTEM ACTIVE' : 'SYSTEM STANDBY'}
          </span>
        </div>
      </div>

      {/* Donut Chart on Top */}
      <div className="position-relative d-flex justify-content-center align-items-center mb-4" style={{ height: '150px' }}>
        <div style={{ width: '100%', height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData.filter(d => d.value > 0).length > 0 ? displayData : [{ value: 1, color: '#333' }]}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={total > 0 ? 5 : 0}
                dataKey="value"
                stroke="none"
              >
                {displayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={total > 0 ? entry.color : '#333'} opacity={total > 0 ? 1 : 0.2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Center Text for Total Students */}
        <div className="position-absolute text-center" style={{ pointerEvents: 'none' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', lineHeight: '1', color: total > 0 ? '#fff' : '#444' }}>{total}</div>
          <div style={{ fontSize: '0.55rem', color: '#666', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px' }}>Students</div>
        </div>
      </div>

      {/* Focus Score Metric */}
      <div className="mb-4 text-center p-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Overall Focus Score</div>
        <div style={{ fontSize: '1.4rem', fontWeight: '900', color: focusScore > 70 ? '#4CAF50' : focusScore > 40 ? '#FFC107' : '#F44336' }}>
          {focusScore}%
        </div>
        <div className="progress mx-auto mt-1" style={{ height: '3px', width: '80%', backgroundColor: '#333' }}>
          <div className="progress-bar" style={{ width: `${focusScore}%`, backgroundColor: focusScore > 70 ? '#4CAF50' : focusScore > 40 ? '#FFC107' : '#F44336', transition: 'width 1s ease-in-out' }}></div>
        </div>
      </div>

      {/* Smart Insights */}
      <div className="mb-4">
        <div style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '700' }}>Smart Insight</div>
        <div className="p-2 rounded d-flex align-items-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderLeft: `3px solid ${insight.color}` }}>
          <span className="me-2" style={{ fontSize: '1.1rem' }}>{insight.icon}</span>
          <span style={{ fontSize: '0.75rem', lineHeight: '1.2', color: '#ddd' }}>{insight.text}</span>
        </div>
      </div>

      {/* Fixed Emotion List */}
      <div className="flex-grow-1 overflow-auto pe-1">
        {displayData.map((entry) => (
          <div
            key={entry.key}
            className="d-flex align-items-center justify-content-between mb-2 p-2 rounded"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderLeft: `3px solid ${total > 0 && entry.value > 0 ? entry.color : '#222'}`
            }}
          >
            <div className="d-flex flex-column">
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: total > 0 && entry.value > 0 ? '#eee' : '#444' }}>
                {entry.name}
              </span>
            </div>
            <div className="text-end">
              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: total > 0 && entry.value > 0 ? entry.color : '#333' }}>
                {entry.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2 border-top border-secondary border-opacity-25">
        <div className="d-flex justify-content-center opacity-40" style={{ fontSize: '0.6rem' }}>
          <span>FocusTrack AI Engine V1.01</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default EmotionStatistics;
