import { useRef, useState } from "react";
import { toast } from "react-toastify";

export function useMediaStream() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isShareScreen, setIsShareScreen] = useState(false);
  const mediaStreamRef = useRef(null);
  const cameraRef = useRef(null);
  const screenRef = useRef(null);

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (cameraRef.current) cameraRef.current.srcObject = null;
    if (screenRef.current) screenRef.current.srcObject = null;
  };

  const stopScreenShare = () => {
    stopMediaStream();
    setIsShareScreen(false);
    toast.info("Screen sharing stopped");
  };

  const handleCamera = async () => {
    try {
      if (isCameraOn) {
        stopMediaStream();
        setIsCameraOn(false);
        toast.info("Camera turned off");
      } else {
        if (isShareScreen) stopScreenShare();

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        mediaStreamRef.current = stream;

        if (cameraRef.current) {
          cameraRef.current.srcObject = stream;
          await cameraRef.current
            .play()
            .catch((err) => console.error("Play error:", err));
        }

        setIsCameraOn(true);
        toast.success("Camera turned on");
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera");
    }
  };

  const handleShareScreen = async () => {
    try {
      if (!isShareScreen) {
        if (isCameraOn) stopMediaStream();

        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        mediaStreamRef.current = stream;

        if (screenRef.current) {
          screenRef.current.srcObject = stream;
          await screenRef.current
            .play()
            .catch((err) => console.error("Play error:", err));
        }

        stream.getVideoTracks()[0].onended = () => stopScreenShare();
        setIsShareScreen(true);
        toast.success("Screen sharing started");
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error("Error sharing screen:", error);
      toast.error("Failed to start screen sharing");
    }
  };

  return {
    isCameraOn,
    isShareScreen,
    cameraRef,
    screenRef,
    mediaStreamRef,
    handleCamera,
    handleShareScreen,
    stopMediaStream,
    stopScreenShare,
  };
}
