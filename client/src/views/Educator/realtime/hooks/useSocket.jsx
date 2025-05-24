import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const SOCKET_URL = "http://localhost:5000";

// Socket configuration
const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 15000,
  timeout: 60000,
  pingTimeout: 120000,
  pingInterval: 25000,
  transports: ['websocket'],
  forceNew: true,
  autoConnect: true,
  upgrade: true,
  rememberUpgrade: true,
  rejectUnauthorized: false
};

// Constants for connection management
const MAX_RECONNECT_ATTEMPTS = 15;
const RAPID_DISCONNECT_THRESHOLD = 3;
const RAPID_DISCONNECT_WINDOW = 5000; // 5 seconds
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 60000; // 60 seconds

export const useSocket = () => {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isStable, setIsStable] = useState(false);

  // Refs
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const lastDisconnectTimeRef = useRef(Date.now());
  const rapidDisconnectsRef = useRef(0);
  const lastPingTimeRef = useRef(Date.now());
  const pendingOperationsRef = useRef(new Set());
  const stableTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);

  // Toast management
  const showToast = useCallback((message, type = 'error') => {
    const toastId = `socket-${type}-${message}`;
    if (!toast.isActive(toastId)) {
      toast[type](message, {
        toastId,
        autoClose: 5000,
        position: "top-center"
      });
    }
  }, []);

  // Connection management
  const handleConnect = useCallback(() => {
    console.log("Connected to tracking server");
    showToast("Tracking server connected", "success");
    setIsConnected(true);
    setIsReconnecting(false);
    setConnectionAttempts(0);
    lastPingTimeRef.current = Date.now();
    rapidDisconnectsRef.current = 0;

    // Start stability timer
    if (stableTimeoutRef.current) {
      clearTimeout(stableTimeoutRef.current);
    }
    stableTimeoutRef.current = setTimeout(() => {
      setIsStable(true);
    }, 5000); // Consider connection stable after 5 seconds

    // Process pending operations
    if (pendingOperationsRef.current.size > 0) {
      console.log(`Processing ${pendingOperationsRef.current.size} pending operations`);
      pendingOperationsRef.current.clear();
    }
  }, [showToast]);

  const handleDisconnect = useCallback((reason) => {
    console.warn("Disconnected from tracking server:", reason);
    setIsConnected(false);
    setIsStable(false);
    
    if (stableTimeoutRef.current) {
      clearTimeout(stableTimeoutRef.current);
    }

    const now = Date.now();
    const timeSinceLastDisconnect = now - lastDisconnectTimeRef.current;
    lastDisconnectTimeRef.current = now;

    // Handle rapid disconnections
    if (timeSinceLastDisconnect < RAPID_DISCONNECT_WINDOW) {
      rapidDisconnectsRef.current++;
      if (rapidDisconnectsRef.current >= RAPID_DISCONNECT_THRESHOLD) {
        console.warn("Multiple rapid disconnections detected");
        showToast("Connection unstable. Waiting before reconnecting...");
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          rapidDisconnectsRef.current = 0;
          if (socketRef.current) {
            socketRef.current.connect();
          }
        }, 10000);
        return;
      }
    } else {
      rapidDisconnectsRef.current = 0;
    }

    if (reason !== "io client disconnect") {
      showToast("Disconnected from tracking server. Attempting to reconnect...", "warning");
      
      if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (socketRef.current) {
            console.log("Attempting to reconnect...");
            socketRef.current.connect();
          }
        }, 2000);
      }
    }
  }, [connectionAttempts, showToast]);

  const handleError = useCallback((error) => {
    console.error("Socket error:", error);
    if (error.message.includes("xhr poll error")) {
      showToast("Connection error. Please check your network.");
    }
  }, [showToast]);

  const handleConnectError = useCallback((error) => {
    console.error("Connection error:", error);
    setIsConnected(false);
    setIsReconnecting(true);

    setConnectionAttempts((prev) => {
      const newAttempts = prev + 1;
      if (newAttempts >= MAX_RECONNECT_ATTEMPTS) {
        showToast(`Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts. Please check server status.`);
      } else {
        showToast("Failed to connect to tracking server. Retrying...");
      }
      return newAttempts;
    });
  }, [showToast]);

  // Socket initialization
  useEffect(() => {
    const initializeSocket = () => {
      if (socketRef.current) {
        socketRef.current.off();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      socketRef.current = io(SOCKET_URL, SOCKET_CONFIG);
      console.log("Attempting to connect to tracking server...");

      // Event listeners
      socketRef.current.on("connect", handleConnect);
      socketRef.current.on("disconnect", handleDisconnect);
      socketRef.current.on("error", handleError);
      socketRef.current.on("connect_error", handleConnectError);
      socketRef.current.on("pong", () => {
        console.log("Received pong from server");
        lastPingTimeRef.current = Date.now();
      });

      // Heartbeat check
      heartbeatIntervalRef.current = setInterval(() => {
        if (socketRef.current?.connected) {
          const now = Date.now();
          if (now - lastPingTimeRef.current > CONNECTION_TIMEOUT) {
            console.warn("No ping received for 60 seconds, reconnecting...");
            socketRef.current.disconnect();
            socketRef.current.connect();
          }
        }
      }, HEARTBEAT_INTERVAL);
    };

    initializeSocket();

    // Cleanup
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (stableTimeoutRef.current) {
        clearTimeout(stableTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.off();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [handleConnect, handleDisconnect, handleError, handleConnectError]);

  // Connection status check
  const ensureConnection = useCallback(async (operation) => {
    if (!socketRef.current?.connected) {
      console.log("Socket not connected, queuing operation");
      pendingOperationsRef.current.add(operation);
      return false;
    }
    return true;
  }, []);

  // Manual reconnection
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  }, []);

  // Manual disconnection
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  return {
    socketRef,
    isConnected,
    isReconnecting,
    isStable,
    connectionAttempts,
    setConnectionAttempts,
    ensureConnection,
    reconnect,
    disconnect
  };
};
