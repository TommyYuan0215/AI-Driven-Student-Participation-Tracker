import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';

function EducatorDashboard() {
  const [isTracking, setIsTracking] = useState(false);
  const [isShareScreen, setIsShareScreen] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const cameraRef = useRef();
  const screenRef = useRef();

  const mediaStreamRef = useRef(null);

  const handleCamera = async () => {
    try {
      if (isCameraOn) {
        // If camera is on, turn it off
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
          
          if (cameraRef.current) {
            cameraRef.current.srcObject = null;
          }
        }
        setIsCameraOn(false);
        toast.info('Camera turned off');
      } else {
        // If screen sharing is on, turn it off first
        if (isShareScreen) {
          stopScreenShare();
        }
        
        // Turn on camera
        const constraints = {
          video: true,
          audio: false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        mediaStreamRef.current = stream;
        
        if (cameraRef.current) {
          cameraRef.current.srcObject = stream;
          cameraRef.current.onloadedmetadata = async () => {
            try {
              await cameraRef.current.play();
            } catch (err) {
              console.error('Error playing video:', err);
            }
          };
        }
        
        setIsCameraOn(true);
        toast.success('Camera turned on');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Failed to access camera');
    }
  };
  
  const handleShareScreen = async () => {
    try {
      if (!isShareScreen) {
        // If camera is on, turn it off first
        if (isCameraOn) {
          // Stop camera and clear state
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            if (cameraRef.current) {
              cameraRef.current.srcObject = null;
            }
          }
          setIsCameraOn(false);
        }
        
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
            displaySurface: "monitor",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });
  
        mediaStreamRef.current = stream;
        
        if (screenRef.current) {
          screenRef.current.srcObject = stream;
          screenRef.current.onloadedmetadata = async () => {
            try {
              await screenRef.current.play();
            } catch (err) {
              console.error('Error playing video:', err);
              throw new Error('Failed to play video stream');
            }
          };
        }
  
        // Handle stream stop event
        stream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
  
        setIsShareScreen(true);
        toast.success('Screen sharing started');
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
      toast.error('Failed to start screen sharing');
      setIsShareScreen(false);
    }
  };
  
  const stopScreenShare = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      
      if (screenRef.current) {
        screenRef.current.srcObject = null;
      }
    }
    setIsShareScreen(false);
    toast.info('Screen sharing stopped');
  };

  const handleTracking = () => {
    setIsTracking(!isTracking);
    // Add your tracking logic here
  };

  return (
    <Container fluid className="d-flex flex-column p-0 h-100">
      {/* Main Content Area */}
      <Row className="g-0" style={{ height: '92%' }}>
        <Col xs={10} className="h-100 border-0 rounded-0">
          {/* Video Feed Layout */}
          <div className="camera-container h-100 d-flex align-items-center justify-content-center border rounded bg-light">
            {isShareScreen ? (
              <video 
              ref={screenRef}
              className="w-100 h-100"
              autoPlay
              playsInline
              muted
              style={{ 
                objectFit: 'cover',
                backgroundColor: '#000'
              }}
            />
            ) : isCameraOn ? (
              <video 
                ref={cameraRef}
                className="w-100 h-100"
                autoPlay
                playsInline
                muted
                style={{ 
                  objectFit: 'cover',
                  backgroundColor: '#000'
                }}
              />
            ) : (
              <div className="text-center text-muted">
                <span><i className="bi bi-cast fs-1"></i> &nbsp; <i className='bi bi-camera fs-1'></i></span>
                <p className="mt-2">Click 'Start Share Screen' or 'Start Camera' to begin</p>
              </div>
            )}
          </div>
        </Col>
        
        {/* Statistical List */}
        <Col xs={2} style={{ backgroundColor: '#2A2A2A' }}>
          <Card className="h-100 border-0" style={{ backgroundColor: '#2A2A2A' }}>
            <Card.Body className="p-3 text-white">
              <Card.Title className='text-center'>Statistical List</Card.Title>
              <div className="student-list h-100">
                <Card.Text>
                  Detected students and their participation metrics will appear here.
                </Card.Text>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Bottom Control Bar */}
      <Row className="g-0 border-top" style={{ height: '8%', backgroundColor: '#2A2A2A' }}>
        <Col xs={12} className="d-flex align-items-center justify-content-center gap-3">
        <Button
            variant={isCameraOn ? "danger" : "primary"}
            className="px-3"
            onClick={handleCamera}
          >
            <i className={`bi bi-${isCameraOn ? 'stop-btn' : 'camera'}`}></i> &nbsp; {isCameraOn ? 'Stop Camera' : 'Start Camera'}
          </Button>

          <Button
            variant={isShareScreen ? "danger" : "primary"}
            className="px-3"
            onClick={handleShareScreen}
          >
            <i className={`bi bi-${isShareScreen ? 'stop-btn' : 'cast'}`}></i> &nbsp; {isShareScreen ? 'Stop Share Screen' : 'Start Share Screen'}
          </Button>

          <Button 
            variant={isTracking ? "danger" : "success"}
            className="px-3"
            onClick={handleTracking}
          >
            <i className={`bi bi-${isTracking ? 'stop-fill' : 'play-fill'}`}></i>
            &nbsp;{isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default EducatorDashboard;