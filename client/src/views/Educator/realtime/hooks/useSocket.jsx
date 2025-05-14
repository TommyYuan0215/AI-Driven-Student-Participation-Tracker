import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const SOCKET_URL = "http://localhost:5000";
const socketOptions = {
  reconnection: true,
  reconnectionAttempts: 15,
  reconnectionDelay: 2500,
  reconnectionDelayMax: 15000,
  timeout: 20000,
  pingTimeout: 30000,
  pingInterval: 15000,
};

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const socketRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    const createSocketConnection = () => {
      if (socketRef.current) {
        socketRef.current.off();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      socketRef.current = io(SOCKET_URL, socketOptions);
      console.log("Attempting to connect to tracking server...");

      socketRef.current.on("connect", () => {
        console.log("Connected to tracking server");
        toast.success("Tracking server connected");
        setIsConnected(true);
        setConnectionAttempts(0);

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        pingIntervalRef.current = setInterval(() => {
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit("ping");
          }
        }, 10000);
      });

      socketRef.current.on("pong", () => {
        console.log("Received pong from server");
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("Connection error:", error);
        toast.error("Failed to connect to tracking server");
        setIsConnected(false);

        setConnectionAttempts((prev) => {
          const newAttempts = prev + 1;
          if (newAttempts >= maxReconnectAttempts) {
            toast.error(
              `Failed to connect after ${maxReconnectAttempts} attempts. Please check server status.`
            );
          }
          return newAttempts;
        });
      });

      socketRef.current.on("disconnect", (reason) => {
        console.warn("Disconnected from tracking server:", reason);
        toast.warn("Disconnected from tracking server");
        setIsConnected(false);

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        if (
          reason !== "io client disconnect" &&
          connectionAttempts < maxReconnectAttempts
        ) {
          toast.info("Attempting to reconnect...");
          reconnectTimeoutRef.current = setTimeout(() => {
            if (socketRef.current) {
              socketRef.current.connect();
            }
          }, 2000);
        }
      });

      socketRef.current.on("error", (error) => {
        console.error("Socket error:", error);
        toast.error("Socket error occurred");
      });
    };

    createSocketConnection();

    return () => {
      if (socketRef.current) {
        socketRef.current.off();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    socketRef,
    isConnected,
    connectionAttempts,
    setConnectionAttempts,
  };
}
