import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export default function useAutoLogout() {
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

      if (!token || isTokenExpired(token)) {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");

        toast.error("Phiên đăng nhập đã hết hạn");

        navigate("/login");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate]);
}
