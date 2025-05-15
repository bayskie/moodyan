import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthClient } from "@dfinity/auth-client";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      const authClient = await AuthClient.create();
      const isAuth = await authClient.isAuthenticated();
      if (isMounted) setIsAuthenticated(isAuth);
    };
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isAuthenticated === null) return <div>Loading...</div>;

  return isAuthenticated ? children : <Navigate to="/" replace />;
}
