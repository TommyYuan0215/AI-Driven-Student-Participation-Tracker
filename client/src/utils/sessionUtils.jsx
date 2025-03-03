import { useState, useEffect } from 'react';
import axios from './axios_configure';  // Update this import
import { toast } from 'react-toastify';

const useSession = (navigate) => {
  const [userData, setUserData] = useState(() => {
    // Retrieve user data from sessionStorage if available
    const savedUserData = sessionStorage.getItem('userData');
    return savedUserData ? JSON.parse(savedUserData) : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Check if user is logged in based on sessionStorage
    const savedUserData = sessionStorage.getItem('userData');
    return savedUserData ? true : false;
  });

  useEffect(() => {
    axios.get("/credential/get_user_session", { withCredentials: true })
      .then(response => {
        console.log('Session response:', response.data);  // Add this for debugging
        if (response.data.logged_in) {
          setUserData(response.data);
          setIsLoggedIn(true);
          sessionStorage.setItem('userData', JSON.stringify(response.data));
        } else {
          setIsLoggedIn(false);
          sessionStorage.removeItem('userData');
        }
      })
      .catch(error => {
        console.error('Session error:', error);  // Add this for debugging
        toast.error(`Error fetching session data: ${error.message}`);
        setIsLoggedIn(false);
        sessionStorage.removeItem('userData');
      });
  }, [navigate]);

  const login = (email, password) => {
    axios.post("/credential/login", { email, password })
      .then(response => {
        if (response.data.status === "success") {
          setUserData(response.data);
          setIsLoggedIn(true);
          // Save user data to sessionStorage
          sessionStorage.setItem('userData', JSON.stringify(response.data));
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

  const logout = () => {
    axios.post("/credential/logout")
      .then(response => {
        if (response.data.status === "success") {
          setIsLoggedIn(false);
          setUserData(null);
          // Remove user data from sessionStorage
          sessionStorage.removeItem('userData');
          navigate(response.data.redirect);
          toast.success(response.data.message);
        }
      })
      .catch(error => {
        toast.error(`Error during logout: ${error.message}`);
      });
  };

  return { userData, isLoggedIn, login, logout };
};

export default useSession;