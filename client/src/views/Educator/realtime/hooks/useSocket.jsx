import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const SOCKET_URL = "http://localhost:5000";

// Enhanced socket configuration for stability
const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionAttempts: 10, // Increased attempts
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000, // Exponential backoff cap
  timeout: 15000, // Increased timeout
  pingTimeout: 60000, // Longer ping timeout
  pingInterval: 25000, // More frequent pings
  transports: ['websocket', 'polling'], // Fallback to polling
  forceNew: false, // Reuse existing connection if possible
  autoConnect: true,
  upgrade: true,
  rememberUpgrade: true,
  rejectUnauthorized: false,
  path: '/socket.io/',
  query: {
    clientId: Date.now().toString(),
    version: '1.0'
  }
};

// Enhanced constants
const MAX_RECONNECT_ATTEMPTS = 10;
const RAPID_DISCONNECT_THRESHOLD = 3;
const RAPID_DISCONNECT_WINDOW = 5000;
const HEARTBEAT_INTERVAL = 20000;
const CONNECTION_TIMEOUT = 90000; // 90 seconds
const STABILITY_TIMEOUT = 5000; // 5 seconds for stability
const OPERATION_TIMEOUT = 10000; // 10 seconds for operations
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

export const useSocket = () => {
  // Enhanced state management
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isStable, setIsStable] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [connectionQuality, setConnectionQuality] = useState('unknown'); // poor, fair, good, excellent

  // Enhanced refs
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const lastDisconnectTimeRef = useRef(Date.now());
  const rapidDisconnectsRef = useRef(0);
  const lastPingTimeRef = useRef(Date.now());
  const pendingOperationsRef = useRef(new Map()); // Use Map for better tracking
  const stableTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const healthCheckIntervalRef = useRef(null);
  const isInitializedRef = useRef(false);
  const operationTimeoutsRef = useRef(new Map());
  const connectionStartTimeRef = useRef(null);
  const lastSuccessfulOperationRef = useRef(Date.now());

  // Enhanced toast management with debouncing
  const lastToastRef = useRef({});
  const showToast = useCallback((message, type = 'error') => {
    const toastKey = `${type}-${message}`;
    const now = Date.now();
    
    // Debounce similar toasts (prevent spam)
    if (lastToastRef.current[toastKey] && 
        now - lastToastRef.current[toastKey] < 3000) {
      return;
    }
    
    lastToastRef.current[toastKey] = now;
    
    const toastId = `socket-${type}-${Date.now()}`;
    if (!toast.isActive(toastId)) {
      toast[type](message, {
        toastId,
        autoClose: type === 'error' ? 5000 : 3000,
        position: "top-center"
      });
    }
  }, []);

  // Connection quality assessment
  const assessConnectionQuality = useCallback(() => {
    const now = Date.now();
    const pingLatency = now - lastPingTimeRef.current;
    
    if (pingLatency < 1000) {
      setConnectionQuality('excellent');
    } else if (pingLatency < 3000) {
      setConnectionQuality('good');
    } else if (pingLatency < 5000) {
      setConnectionQuality('fair');
    } else {
      setConnectionQuality('poor');
    }
  }, []);

  // Enhanced connection handler
  const handleConnect = useCallback(() => {
    console.log("Connected to tracking server");
    connectionStartTimeRef.current = Date.now();
    
    showToast("Tracking server connected", "success");
    setIsConnected(true);
    setIsReconnecting(false);
    setConnectionAttempts(0);
    setLastError(null);
    lastPingTimeRef.current = Date.now();
    rapidDisconnectsRef.current = 0;
    lastSuccessfulOperationRef.current = Date.now();

    // Enhanced stability timer
    if (stableTimeoutRef.current) {
      clearTimeout(stableTimeoutRef.current);
    }
    stableTimeoutRef.current = setTimeout(() => {
      setIsStable(true);
      console.log("Connection marked as stable");
    }, STABILITY_TIMEOUT);

    // Process pending operations with timeout handling
    if (pendingOperationsRef.current.size > 0) {
      console.log(`Processing ${pendingOperationsRef.current.size} pending operations`);
      
      pendingOperationsRef.current.forEach((operation, operationId) => {
        try {
          operation.execute();
          pendingOperationsRef.current.delete(operationId);
          
          // Clear operation timeout
          if (operationTimeoutsRef.current.has(operationId)) {
            clearTimeout(operationTimeoutsRef.current.get(operationId));
            operationTimeoutsRef.current.delete(operationId);
          }
        } catch (error) {
          console.error("Failed to execute pending operation:", error);
          pendingOperationsRef.current.delete(operationId);
        }
      });
    }

    assessConnectionQuality();
  }, [showToast, assessConnectionQuality]);

  // Enhanced disconnect handler
  const handleDisconnect = useCallback((reason) => {
    console.warn("Disconnected from tracking server:", reason);
    setIsConnected(false);
    setIsStable(false);
    setLastError(reason);
    
    if (stableTimeoutRef.current) {
      clearTimeout(stableTimeoutRef.current);
    }

    const now = Date.now();
    const timeSinceLastDisconnect = now - lastDisconnectTimeRef.current;
    const connectionDuration = connectionStartTimeRef.current ? 
      now - connectionStartTimeRef.current : 0;
    
    lastDisconnectTimeRef.current = now;

    // Enhanced rapid disconnection detection
    if (timeSinceLastDisconnect < RAPID_DISCONNECT_WINDOW || connectionDuration < 1000) {
      rapidDisconnectsRef.current++;
      console.warn(`Rapid disconnect #${rapidDisconnectsRef.current} detected`);
      
      if (rapidDisconnectsRef.current >= RAPID_DISCONNECT_THRESHOLD) {
        console.warn("Multiple rapid disconnections detected - implementing backoff");
        showToast("Connection unstable. Implementing smart reconnection...", "warning");
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        // Exponential backoff for rapid disconnects
        const backoffDelay = Math.min(5000 * Math.pow(2, rapidDisconnectsRef.current - 3), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          rapidDisconnectsRef.current = Math.max(0, rapidDisconnectsRef.current - 1);
          if (socketRef.current && connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
            console.log("Reconnecting after backoff period");
            socketRef.current.connect();
          }
        }, backoffDelay);
        return;
      }
    } else {
      rapidDisconnectsRef.current = Math.max(0, rapidDisconnectsRef.current - 1);
    }

    // Enhanced reconnection logic
    if (reason !== "io client disconnect") {
      if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
        showToast("Connection lost. Reconnecting...", "warning");
        setIsReconnecting(true);
        
        // Progressive delay based on attempts
        const delay = Math.min(1000 * Math.pow(1.5, connectionAttempts), 10000);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (socketRef.current) {
            console.log(`Reconnection attempt ${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}`);
            socketRef.current.connect();
          }
        }, delay);
      } else {
        showToast("Connection failed. Please check your network and refresh.", "error");
        setIsReconnecting(false);
      }
    }
  }, [connectionAttempts, showToast]);

  // Enhanced error handlers
  const handleError = useCallback((error) => {
    console.error("Socket error:", error);
    setLastError(error.message || error);
    
    if (error.message?.includes("xhr poll error")) {
      showToast("Network connection error detected");
    } else if (error.message?.includes("timeout")) {
      showToast("Connection timeout - check your network");
    } else {
      showToast("Connection error occurred");
    }
  }, [showToast]);

  const handleConnectError = useCallback((error) => {
    console.error("Connection error:", error);
    setIsConnected(false);
    setIsReconnecting(true);
    setLastError(error.message || error);

    setConnectionAttempts((prev) => {
      const newAttempts = prev + 1;
      if (newAttempts >= MAX_RECONNECT_ATTEMPTS) {
        showToast(`Connection failed after ${MAX_RECONNECT_ATTEMPTS} attempts. Please refresh.`, "error");
        setIsReconnecting(false);
      } else {
        showToast(`Connection attempt ${newAttempts}/${MAX_RECONNECT_ATTEMPTS} failed. Retrying...`);
      }
      return newAttempts;
    });
  }, [showToast]);

  // Enhanced health check
  const performHealthCheck = useCallback(() => {
    if (!socketRef.current?.connected) return;

    const now = Date.now();
    const timeSinceLastPing = now - lastPingTimeRef.current;
    const timeSinceLastOperation = now - lastSuccessfulOperationRef.current;

    // Check if connection is stale
    if (timeSinceLastPing > CONNECTION_TIMEOUT) {
      console.warn("Connection appears stale - forcing reconnection");
      socketRef.current.disconnect();
      socketRef.current.connect();
      return;
    }

    // Assess connection quality
    assessConnectionQuality();

    // Send ping to check responsiveness
    try {
      socketRef.current.emit('ping', { timestamp: now });
    } catch (error) {
      console.error("Failed to send ping:", error);
    }
  }, [assessConnectionQuality]);

  // Enhanced socket initialization
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const initializeSocket = () => {
      // Clean up existing socket
      if (socketRef.current) {
        socketRef.current.off();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      try {
        socketRef.current = io(SOCKET_URL, SOCKET_CONFIG);
        console.log("Initializing socket connection...");

        // Enhanced event listeners
        socketRef.current.on("connect", handleConnect);
        socketRef.current.on("disconnect", handleDisconnect);
        socketRef.current.on("error", handleError);
        socketRef.current.on("connect_error", handleConnectError);
        
        socketRef.current.on("pong", (data) => {
          console.log("Received pong from server:", data);
          lastPingTimeRef.current = Date.now();
          lastSuccessfulOperationRef.current = Date.now();
          assessConnectionQuality();
        });

        // Handle server-side reconnection
        socketRef.current.on("reconnect", () => {
          console.log("Server initiated reconnection");
          lastPingTimeRef.current = Date.now();
        });

        // Start health check interval
        healthCheckIntervalRef.current = setInterval(performHealthCheck, HEALTH_CHECK_INTERVAL);

      } catch (error) {
        console.error("Failed to initialize socket:", error);
        showToast("Failed to initialize connection", "error");
      }
    };

    initializeSocket();

    // Enhanced cleanup
    return () => {
      isInitializedRef.current = false;
      
      // Clear all intervals and timeouts
      [heartbeatIntervalRef, healthCheckIntervalRef, stableTimeoutRef, reconnectTimeoutRef]
        .forEach(ref => {
          if (ref.current) {
            clearInterval(ref.current);
            clearTimeout(ref.current);
            ref.current = null;
          }
        });

      // Clear operation timeouts
      operationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      operationTimeoutsRef.current.clear();

      // Clean up socket
      if (socketRef.current) {
        socketRef.current.off();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // Clear pending operations
      pendingOperationsRef.current.clear();
    };
  }, [handleConnect, handleDisconnect, handleError, handleConnectError, performHealthCheck, showToast]);

  // Enhanced connection management
  const ensureConnection = useCallback(async (operation, operationId = null) => {
    if (!socketRef.current?.connected || !isStable) {
      const id = operationId || `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`Queueing operation ${id} - connection not ready`);
      
      pendingOperationsRef.current.set(id, {
        execute: operation,
        timestamp: Date.now()
      });

      // Set timeout for operation
      const timeout = setTimeout(() => {
        if (pendingOperationsRef.current.has(id)) {
          console.warn(`Operation ${id} timed out`);
          pendingOperationsRef.current.delete(id);
          operationTimeoutsRef.current.delete(id);
        }
      }, OPERATION_TIMEOUT);

      operationTimeoutsRef.current.set(id, timeout);
      return false;
    }

    lastSuccessfulOperationRef.current = Date.now();
    return true;
  }, [isStable]);

  // Enhanced manual reconnection
  const reconnect = useCallback(() => {
    console.log("Manual reconnection requested");
    setConnectionAttempts(0);
    rapidDisconnectsRef.current = 0;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.connect();
        }
      }, 500);
    }
  }, []);

  // Enhanced manual disconnection
  const disconnect = useCallback(() => {
    console.log("Manual disconnection requested");
    setIsStable(false);
    setConnectionAttempts(MAX_RECONNECT_ATTEMPTS); // Prevent auto-reconnection
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  // Operation retry helper
  const retryOperation = useCallback((operation, maxRetries = 3, delay = 1000) => {
    let attempts = 0;
    
    const executeWithRetry = async () => {
      try {
        if (await ensureConnection(operation)) {
          return await operation();
        } else {
          throw new Error("Connection not available");
        }
      } catch (error) {
        attempts++;
        if (attempts < maxRetries) {
          console.log(`Operation failed, retrying (${attempts}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, delay * attempts));
          return executeWithRetry();
        } else {
          throw error;
        }
      }
    };

    return executeWithRetry();
  }, [ensureConnection]);

  return {
    // Core functionality
    socketRef,
    isConnected,
    isReconnecting,
    isStable,
    connectionAttempts,
    setConnectionAttempts,
    ensureConnection,
    reconnect,
    disconnect,
    
    // Enhanced features
    lastError,
    connectionQuality,
    retryOperation,
    
    // Status helpers
    isHealthy: isConnected && isStable && connectionQuality !== 'poor',
    pendingOperationsCount: pendingOperationsRef.current?.size || 0
  };
};