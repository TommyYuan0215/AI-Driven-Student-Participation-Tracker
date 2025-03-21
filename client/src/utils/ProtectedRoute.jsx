import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useSession } from "./sessionUtils";
import LoadingSpinner from "../components/LoadingSpinner";

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const navigate = useNavigate();
  const { isLoggedIn, userData, checkAuth } = useSession(navigate);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        setLoading(true);
        const isAuthenticated = await checkAuth();

        if (!isAuthenticated) {
          navigate("/");
          return;
        }

        // Check if user has required role
        if (
          requiredRoles.length > 0 &&
          !requiredRoles.includes(userData?.role)
        ) {
          navigate("/");
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    verifyAccess();
  }, [checkAuth, navigate, requiredRoles, userData?.role]);

  if (loading) {
    return <LoadingSpinner text="Verifying access..." />;
  }

  return isLoggedIn ? (
    <>
      {children}
      <Outlet />
    </>
  ) : null;
};

export default ProtectedRoute;
