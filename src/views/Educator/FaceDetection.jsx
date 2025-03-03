import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const FaceDetection = () => {
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState(null);
  const videoElement = React.useRef(null); // Ref to hold video element

  useEffect(() => {
    const socket = io.connect("http://localhost:5000");

    // Start video stream from webcam
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoElement.current.srcObject = stream;
        sendVideoFrames(socket);
      })
      .catch(err => {
        console.error("Error accessing webcam:", err);
      });

    // Listen for face prediction from server
    socket.on("face_prediction", (data) => {
      setPrediction(data.label);
      setConfidence(data.confidence);
    });

    // Cleanup socket connection when the component unmounts
    return () => {
      socket.disconnect();
    };
  }, []);

  // Function to send video frames to the server
  const sendVideoFrames = (socket) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    setInterval(() => {
      context.drawImage(videoElement.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        const reader = new FileReader();
        reader.onloadend = function () {
          const base64data = reader.result.split(",")[1]; // Get base64 string without prefix
          socket.emit("video_frame", { frame: base64data }); // Send frame as 'frame' field in the data
        };
        reader.readAsDataURL(blob);
      }, "image/jpeg");
    }, 100); // Send frames every 100ms
  };

  return (
    <div>
      <video ref={videoElement} autoPlay width="1280" height="720"></video>
    </div>
  );
};

export default FaceDetection;
