import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const SOCKET_URL = "/";

// SOCKET_CONFIG matches server-side ping_timeout/ping_interval
const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionAttempts: 50,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  timeout: 20000,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  autoConnect: true,
};

const STABILITY_TIMEOUT = 5000;
const HEALTH_CHECK_INTERVAL = 30000;
const OPERATION_TIMEOUT = 10000;

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
  const lastPongTimeRef = useRef(Date.now()); // Changed from lastPingTimeRef
  const pendingOperationsRef = useRef(new Map()); // Use Map for better tracking
  const stableTimeoutRef = useRef(null);
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
    const pongLatency = now - lastPongTimeRef.current; // Based on when the last pong was received

    if (pongLatency < 1000) {
      setConnectionQuality('excellent');
    } else if (pongLatency < 3000) {
      setConnectionQuality('good');
    } else if (pongLatency < 5000) {
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
    lastPongTimeRef.current = Date.now(); // Reset last pong time on connect
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

  // Enhanced disconnect handler with improved reconnection logic
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

        // Exponential backoff with jitter for rapid disconnects
        const baseDelay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, rapidDisconnectsRef.current - 1), MAX_RECONNECT_DELAY);
        const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
        const backoffDelay = baseDelay + jitter;

        reconnectTimeoutRef.current = setTimeout(() => {
          rapidDisconnectsRef.current = Math.max(0, rapidDisconnectsRef.current - 1); // Decay rapid disconnect count
          if (socketRef.current && connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
            console.log("Reconnecting after backoff period");
            socketRef.current.connect();
          }
        }, backoffDelay);
        return;
      }
    } else {
      rapidDisconnectsRef.current = Math.max(0, rapidDisconnectsRef.current - 1); // Decay rapid disconnect count if stable for a while
    }

    // Normal reconnection logic (if not explicitly disconnected by client)
    if (reason !== "io client disconnect" && connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(1.5, connectionAttempts), MAX_RECONNECT_DELAY);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.connect();
        }
      }, delay);
    }
  }, [showToast, connectionAttempts]);

  // Enhanced error handlers
  const handleError = useCallback((error) => {
    console.error("Socket error:", error);
    setLastError(error.message || error);

    if (error.message?.includes("xhr poll error") || error.message?.includes("websocket error")) {
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

  // Custom pong handler for assessing connection quality (server-side ping response)
  const handlePong = useCallback((data) => {
    console.log("Received pong from server:", data);
    lastPongTimeRef.current = Date.now();
    lastSuccessfulOperationRef.current = Date.now();
    assessConnectionQuality();
  }, [assessConnectionQuality]);

  // Enhanced health check (using custom interval, not relying on client library's ping/pong)
  const performHealthCheck = useCallback(() => {
    if (!socketRef.current?.connected) return;

    const now = Date.now();
    // Check if the connection has been silent (no pongs from server) for too long
    // Use SOCKET_CONFIG.pingTimeout as a reference, plus a buffer
    if (now - lastPongTimeRef.current > (SOCKET_CONFIG.pingTimeout || 20000) * 1.5) {
      console.warn("Connection appears stale (no pong for extended period) - forcing reconnection");
      socketRef.current.disconnect();
      socketRef.current.connect();
      return;
    }

    // Assess connection quality based on recent pong
    assessConnectionQuality();

    // Optionally send a custom ping to the server if you want specific server response
    // The client library handles its own pings. This is for an *additional* check.
    try {
      socketRef.current.emit('ping', { clientTimestamp: now });
    } catch (error) {
      console.error("Failed to send custom ping:", error);
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

        // Listen for the 'pong' event from the server (for our custom health check)
        socketRef.current.on("pong", handlePong);

        // Start health check interval
        // This interval will periodically run performHealthCheck
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
      [healthCheckIntervalRef, stableTimeoutRef, reconnectTimeoutRef]
        .forEach(ref => {
          if (ref.current) {
            clearInterval(ref.current); // Use clearInterval for setInterval refs
            clearTimeout(ref.current);  // Use clearTimeout for setTimeout refs
            ref.current = null;
          }
        });

      // Clear operation timeouts
      operationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      operationTimeoutsRef.current.clear();

      // Clean up socket
      if (socketRef.current) {
        socketRef.current.off(); // Remove all listeners
        socketRef.current.disconnect(); // Disconnect from the server
        socketRef.current = null;
      }

      // Clear pending operations
      pendingOperationsRef.current.clear();
    };
  }, [handleConnect, handleDisconnect, handleError, handleConnectError, handlePong, performHealthCheck, showToast]);

  // Enhanced connection management
  const ensureConnection = useCallback(async (operation, operationId = null) => {
    if (!socketRef.current?.connected || !isStable) {
      const id = operationId || `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(`Queueing operation ${id} - connection not ready`);

      // Store the operation for later execution
      pendingOperationsRef.current.set(id, {
        execute: operation,
        timestamp: Date.now()
      });

      // Set timeout for operation to prevent indefinite waiting
      const timeout = setTimeout(() => {
        if (pendingOperationsRef.current.has(id)) {
          console.warn(`Operation ${id} timed out`);
          pendingOperationsRef.current.delete(id);
          operationTimeoutsRef.current.delete(id);
          // You might want to resolve or reject a promise here if `operation` was async
        }
      }, OPERATION_TIMEOUT);

      operationTimeoutsRef.current.set(id, timeout);
      return false; // Indicate that operation was queued
    }

    lastSuccessfulOperationRef.current = Date.now();
    return true; // Indicate that connection is ready
  }, [isStable]);

  // Enhanced manual reconnection
  const reconnect = useCallback(() => {
    console.log("Manual reconnection requested");
    setConnectionAttempts(0); // Reset attempts to allow full retries
    rapidDisconnectsRef.current = 0; // Reset rapid disconnect count

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socketRef.current) {
      socketRef.current.disconnect(); // Force disconnect
      setTimeout(() => { // Give a moment before reconnecting
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
    setConnectionAttempts(MAX_RECONNECT_ATTEMPTS); // Prevent auto-reconnection after manual disconnect

    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  // Operation retry helper (useful for `ensureConnection` where operation is passed)
  const retryOperation = useCallback(async (operation, maxRetries = 3, delay = 1000) => {
    let attempts = 0;

    const executeWithRetry = async () => {
      try {
        // First, check if connection is ready and queue if not
        const isReady = await ensureConnection(operation); // ensureConnection might queue
        if (isReady) {
          // If connection was ready, execute the operation directly
          return await operation();
        } else {
          // If operation was queued, we can't await its result directly here
          // The pendingOperationsRef will handle its execution upon connect
          console.log("Operation was queued, awaiting connection.");
          // You might need a more sophisticated mechanism here if the operation needs to return a value immediately
          // For now, it just means it will run later.
          return new Promise((resolve, reject) => {
            // This is a simplified approach, a real-world scenario might need a unique ID for the queued operation
            // and a way for the operation itself to resolve/reject this promise.
            // For now, we assume if it's queued, it eventually succeeds.
            const checkInterval = setInterval(() => {
              if (!pendingOperationsRef.current.has(operation.id)) { // Assuming operation has a unique ID
                clearInterval(checkInterval);
                resolve(); // Operation executed (or timed out)
              }
            }, 100);
            // Consider adding a timeout for this promise as well.
          });
        }
      } catch (error) {
        attempts++;
        if (attempts < maxRetries) {
          console.log(`Operation failed, retrying (${attempts}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, delay * attempts));
          return executeWithRetry();
        } else {
          showToast(`Operation failed after ${maxRetries} attempts: ${error.message}`, "error");
          throw error;
        }
      }
    };

    return executeWithRetry();
  }, [ensureConnection, showToast]);

  return {
    // Core functionality
    socketRef,
    isConnected,
    isReconnecting,
    isStable,
    connectionAttempts,
    setConnectionAttempts, // You might not need to expose this setter
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