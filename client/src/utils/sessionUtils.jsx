import { useState, useEffect } from 'react';
import axios from './axios_configure';  // Update this import
import { toast } from 'react-toastify';

const SESSION_TIMEOUT = 180 * 60 * 1000; // 3 hours in milliseconds

const useSession = (navigate) => {
  const [userData, setUserData] = useState(() => {
    const savedUserData = sessionStorage.getItem('userData');
    const lastActivity = sessionStorage.getItem('lastActivity');
    
    // Check if session has expired
    if (savedUserData && lastActivity) {
      const now = new Date().getTime();
      if (now - parseInt(lastActivity) > SESSION_TIMEOUT) {
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('lastActivity');
        return null;
      }
    }
    return savedUserData ? JSON.parse(savedUserData) : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const savedUserData = sessionStorage.getItem('userData');
    const lastActivity = sessionStorage.getItem('lastActivity');
    
    if (savedUserData && lastActivity) {
      const now = new Date().getTime();
      if (now - parseInt(lastActivity) > SESSION_TIMEOUT) {
        return false;
      }
      return true;
    }
    return false;
  });

  // Flag to prevent multiple expiration toasts
  const [hasShownExpirationToast, setHasShownExpirationToast] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Update last activity timestamp
  const updateLastActivity = () => {
    sessionStorage.setItem('lastActivity', new Date().getTime().toString());
  };

  // Add activity listener
  useEffect(() => {
    const handleActivity = () => {
      if (isLoggedIn) {
        updateLastActivity();
      }
    };

    // Add event listeners for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Check session expiration periodically
    const checkSession = setInterval(() => {
      const lastActivity = sessionStorage.getItem('lastActivity');
      if (lastActivity && isLoggedIn) {
        const now = new Date().getTime();
        if (now - parseInt(lastActivity) > SESSION_TIMEOUT && !hasShownExpirationToast) {
          setHasShownExpirationToast(true); // Set flag before showing toast
          toast.info("Session expired. Please login again.", {
            toastId: 'session-expired', // Add unique ID to prevent duplicates
          });
          logout();
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(checkSession);
    };
  }, [isLoggedIn, hasShownExpirationToast]);

  // Modify existing useEffect to update last activity on successful session check
  useEffect(() => {
    axios.get("/credential/get_user_session", { withCredentials: true })
      .then(response => {
        if (response.data.logged_in) {
          setUserData(response.data);
          setIsLoggedIn(true);
          sessionStorage.setItem('userData', JSON.stringify(response.data));
          updateLastActivity(); // Update timestamp on successful session check
        } else {
          setIsLoggedIn(false);
          sessionStorage.removeItem('userData');
          sessionStorage.removeItem('lastActivity');
        }
      })
      .catch(error => {
        console.error('Session error:', error);
        setIsLoggedIn(false);
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('lastActivity');
      });
  }, [navigate]);

  // Modify login to include last activity timestamp
  const login = (email, password) => {
    axios.post("/credential/login", { email, password })
      .then(response => {
        if (response.data.status === "success") {
          setUserData(response.data);
          setIsLoggedIn(true);
          sessionStorage.setItem('userData', JSON.stringify(response.data));
          updateLastActivity(); // Set initial timestamp
          navigate(response.data.redirect);
          toast.success(response.data.message);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch(error => {
        toast.error(`Error during login: ${error.message}`);
      });
  };

  // Modify logout to clear last activity
  const logout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts
    
    try {
      setIsLoggingOut(true);
      const response = await axios.post("/credential/logout");
      
      if (response.data.status === "success") {
        setIsLoggedIn(false);
        setUserData(null);
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('lastActivity');
        navigate(response.data.redirect);
        toast.success(response.data.message, {
          toastId: 'logout-success' // Prevent duplicate toasts
        });
      }
    } catch (error) {
      toast.error(`Error during logout: ${error.message}`, {
        toastId: 'logout-error'
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return { userData, isLoggedIn, login, logout };
};

export default useSession;