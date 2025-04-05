import { useState, useEffect } from "react";
import axios from "./axiosUtils";
import { toast } from "react-toastify";

const SESSION_TIMEOUT = 180 * 60 * 1000; // 3 hours in milliseconds

const useSession = (navigate) => {
  // Initialize states with session storage data
  const initializeUserData = () => {
    const savedUserData = sessionStorage.getItem("userData");
    const lastActivity = sessionStorage.getItem("lastActivity");

    if (savedUserData && lastActivity) {
      const now = new Date().getTime();
      if (now - parseInt(lastActivity) > SESSION_TIMEOUT) {
        sessionStorage.removeItem("userData");
        sessionStorage.removeItem("lastActivity");
        return null;
      }
    }
    return savedUserData ? JSON.parse(savedUserData) : null;
  };

  const [userData, setUserData] = useState(initializeUserData);
  const [isLoggedIn, setIsLoggedIn] = useState(!!initializeUserData());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hasShownExpirationToast, setHasShownExpirationToast] = useState(false);

  // Session management functions
  const updateLastActivity = () => {
    sessionStorage.setItem("lastActivity", new Date().getTime().toString());
  };

  const clearSession = () => {
    setUserData(null);
    setIsLoggedIn(false);
    sessionStorage.removeItem("userData");
    sessionStorage.removeItem("lastActivity");
  };

  // API interaction functions
  const refetch = async () => {
    try {
      const response = await axios.get("/credential/get_user_session", {
        withCredentials: true,
      });

      if (response.data.logged_in) {
        setUserData(response.data);
        setIsLoggedIn(true);
        sessionStorage.setItem("userData", JSON.stringify(response.data));
        updateLastActivity();
        return true;
      } else {
        clearSession();
        return false;
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        clearSession();
        toast.info("Session expired. Please log in again.");
      }
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post("/credential/login", {
        email,
        password,
      });

      if (response.data.status === "success") {
        setUserData(response.data);
        setIsLoggedIn(true);
        sessionStorage.setItem("userData", JSON.stringify(response.data));
        updateLastActivity();
        navigate(response.data.redirect);
        toast.success(response.data.message);
        return true;
      } else {
        toast.error(response.data.message);
        return false;
      }
    } catch (error) {
      if (error.response) {
        // Handle different response status codes
        if (error.response.status === 401) {
          toast.error(error.response.data.message); // Show the message from the backend
        } else {
          toast.error(
            `Error: ${error.response.data.message || "Something went wrong"}`
          );
        }
      } else if (error.request) {
        toast.error("No response from server. Please check your connection.");
      } else {
        toast.error(`Error during login: ${error.message}`);
      }
      return false;
    }
  };

  const logout = async () => {
    if (isLoggingOut) return false;

    try {
      setIsLoggingOut(true);
      const response = await axios.post("/credential/logout");

      if (response.data.status === "success") {
        clearSession();
        navigate(response.data.redirect);
        toast.success(response.data.message, {
          toastId: "logout-success",
        });
        return true;
      }
      return false;
    } catch (error) {
      toast.error(`Error during logout: ${error.message}`, {
        toastId: "logout-error",
      });
      return false;
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Session activity monitoring
  useEffect(() => {
    const handleActivity = () => {
      if (isLoggedIn) updateLastActivity();
    };

    const activities = ["mousemove", "keydown", "click", "scroll"];
    activities.forEach((activity) => {
      window.addEventListener(activity, handleActivity);
    });

    const checkSession = setInterval(() => {
      const lastActivity = sessionStorage.getItem("lastActivity");
      if (lastActivity && isLoggedIn) {
        const now = new Date().getTime();
        if (
          now - parseInt(lastActivity) > SESSION_TIMEOUT &&
          !hasShownExpirationToast
        ) {
          setHasShownExpirationToast(true);
          toast.info("Session expired. Please login again.", {
            toastId: "session-expired",
          });
          logout();
        }
      }
    }, 1000);

    return () => {
      activities.forEach((activity) => {
        window.removeEventListener(activity, handleActivity);
      });
      clearInterval(checkSession);
    };
  }, [isLoggedIn, hasShownExpirationToast]);

  // Initial session check
  useEffect(() => {
    refetch();
  }, [navigate]);

  return {
    userData,
    isLoggedIn,
    login,
    logout,
    refetch,
    updateLastActivity,
  };
};

export default useSession;
