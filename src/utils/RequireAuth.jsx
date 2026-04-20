import { Navigate, Outlet } from "react-router-dom";

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export default function RequireAuth({ children }) {
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");

    return <Navigate to="/login" replace />;
  }

  return children || <Outlet />;
}
