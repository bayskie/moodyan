import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthClient } from "@dfinity/auth-client";

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const authClient = await AuthClient.create();
      const isAuth = await authClient.isAuthenticated();
      setIsAuthenticated(isAuth);
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) return null; // or loading indicator

  return isAuthenticated ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;
