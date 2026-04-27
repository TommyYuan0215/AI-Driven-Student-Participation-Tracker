import React from "react";
import useSession from "../../../../hooks/useSession";

function ControlBar({
  sessionElapsedTime,
  trackingElapsedTime,
  formatElapsedTime,
  isCameraOn,
  isShareScreen,
  isTracking,
  handleCamera,
  handleShareScreen,
  handleTracking,
  handleEndMonitoringSession,
}) {
  const { userData } = useSession();

  return (
    <div className="fixed-bottom d-flex justify-content-center pb-4" style={{ pointerEvents: 'none' }}>
      <div className="glass-dock px-3 py-2 rounded-pill d-flex align-items-center gap-3 shadow-lg" style={{ 
        background: 'rgba(30, 30, 30, 0.9)', 
        backdropFilter: 'blur(25px)',
        border: '1px solid rgba(255,255,255,0.1)',
        pointerEvents: 'auto',
        animation: 'slideUpDock 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* User Profile - New Integration */}
        {userData && (
            <div className="d-flex align-items-center pe-3 border-end border-secondary border-opacity-25 ms-1">
                <img
                    className="rounded-circle border border-2 border-primary"
                    src={userData.userPhoto ? `data:image/jpeg;base64,${userData.userPhoto}` : "/profile.jpg"}
                    alt="user"
                    style={{ width: "30px", height: "30px", objectFit: "cover" }}
                />
                <div className="ms-2 d-none d-lg-block">
                    <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap' }}>{userData.userName}</div>
                    <div style={{ fontSize: '0.5rem', color: '#888', textTransform: 'uppercase' }}>Educator</div>
                </div>
            </div>
        )}

        {/* Session Timer */}
        <div className="d-flex flex-column pe-3 border-end border-secondary border-opacity-25" style={{ minWidth: '70px' }}>
            <span style={{ fontSize: '0.55rem', color: '#888', textTransform: 'uppercase', fontWeight: '700' }}>Session</span>
            <span className="text-white fw-bold" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{formatElapsedTime(sessionElapsedTime)}</span>
        </div>

        {/* Media Controls */}
        <div className="d-flex gap-2 pe-3">
            <button 
              className={`control-btn ${isCameraOn ? 'active-success' : ''}`}
              onClick={handleCamera}
              title={isCameraOn ? "Stop Camera" : "Start Camera"}
            >
              <i className={`bi bi-camera-video${isCameraOn ? '-fill' : ''}`}></i>
            </button>
            
            <button 
              className={`control-btn ${isShareScreen ? 'active-success' : ''}`}
              onClick={handleShareScreen}
              title={isShareScreen ? "Stop Screen Share" : "Start Screen Share"}
            >
              <i className={`bi bi-display${isShareScreen ? '-fill' : ''}`}></i>
            </button>
        </div>

        {/* Primary Action */}
        <button 
          className={`tracking-btn ${isTracking ? 'active' : ''}`}
          disabled={!isCameraOn && !isShareScreen}
          onClick={handleTracking}
        >
          <div className="d-flex align-items-center gap-2">
              <i className={`bi bi-${isTracking ? 'stop-circle-fill' : 'play-circle-fill'}`}></i>
              <span className="fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                  {isTracking ? "End Tracking" : "Start Analytics"}
              </span>
          </div>
        </button>

        {/* Exit Button */}
        <div className="ps-3 border-start border-secondary border-opacity-25">
            <button 
              className="control-btn exit-btn"
              onClick={handleEndMonitoringSession}
              title="End Monitoring Session"
            >
              <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>

        {/* Tracking Timer */}
        <div className="d-flex flex-column ps-3 border-start border-secondary border-opacity-25" style={{ minWidth: '70px' }}>
            <span style={{ fontSize: '0.55rem', color: '#888', textTransform: 'uppercase', fontWeight: '700' }}>Tracking</span>
            <span className={isTracking ? "text-primary fw-bold" : "text-secondary fw-bold"} style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
              {formatElapsedTime(trackingElapsedTime)}
            </span>
        </div>

        <style>{`
          .control-btn {
              width: 38px;
              height: 38px;
              border-radius: 50%;
              border: none;
              background: rgba(255,255,255,0.05);
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.1rem;
              transition: all 0.2s ease;
          }
          .control-btn:hover {
              background: rgba(255,255,255,0.15);
              transform: translateY(-2px);
          }
          .control-btn.active-success {
              background: #4CAF50;
              box-shadow: 0 0 15px rgba(76, 175, 80, 0.4);
          }
          .exit-btn:hover {
              background: #F44336;
          }
          
          .tracking-btn {
              height: 38px;
              padding: 0 20px;
              border-radius: 19px;
              border: none;
              background: #2196F3;
              color: #fff;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
          }
          .tracking-btn:hover:not(:disabled) {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
          }
          .tracking-btn:disabled {
              background: #333;
              color: #666;
              cursor: not-allowed;
              box-shadow: none;
          }
          .tracking-btn.active {
              background: #F44336;
              box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
          }
          
          @keyframes slideUpDock {
              from { transform: translateY(100px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

export default ControlBar;
