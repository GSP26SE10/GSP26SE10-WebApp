import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import API_URL from "@/config/api";
import { Navigate, useNavigate } from "react-router-dom";
import { hubConnection } from "@/signalr/connection";

export default function LoginPage() {
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [remember, setRemember] = React.useState(true);

  const navigate = useNavigate();
  const authToken =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  if (authToken) {
    return <Navigate to="/owner/dashboard" replace />;
  }

  const canSubmit =
    identifier.trim().length > 0 && password.length > 0 && !isLoading;

  async function safeParse(res) {
    const text = await res.text().catch(() => "");
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }

  function extractToken(data) {
    const root = data?.data && typeof data.data === "object" ? data.data : data;
    return (
      root?.accessToken ??
      root?.token ??
      root?.jwt ??
      data?.accessToken ??
      data?.token ??
      null
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Vui lòng nhập email/username và mật khẩu.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/authentication/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        mode: "cors",
        body: JSON.stringify({
          userNameOrEmail: identifier.trim(),
          password,
        }),
      });

      const data = await safeParse(res);

      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            data?.title ||
            data?.raw ||
            `HTTP ${res.status}`,
        );
      }

      const token = extractToken(data);
      if (!token) {
        throw new Error("Không lấy được access token.");
      }

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("accessToken", token);
      storage.setItem(
        "auth",
        JSON.stringify({ token, savedAt: new Date().toISOString() }),
      );

      if (data?.data?.user || data?.user) {
        storage.setItem(
          "userProfile",
          JSON.stringify(data?.data?.user ?? data?.user),
        );
      }

      if (hubConnection.state === "Disconnected") {
        await hubConnection.start();
        console.log("chatHub connected:", hubConnection.connectionId);
      }

      navigate("/owner/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setError(err?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-100">
      <div className="absolute inset-0">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-rose-100/50 blur-3xl" />
      </div>

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:flex items-center justify-center p-10">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/70 px-4 py-2 text-sm font-medium text-orange-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Hệ thống quản lý Bookfet
            </div>

            <h1 className="text-5xl font-bold leading-tight text-gray-900">
              Chào mừng bạn quay lại
            </h1>

            <p className="mt-5 text-lg leading-8 text-gray-600">
              Đăng nhập để quản lý tài khoản, theo dõi dữ liệu và tiếp tục công
              việc một cách nhanh chóng, an toàn và thuận tiện hơn.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="rounded-3xl border border-white/60 bg-white/85 p-8 shadow-2xl backdrop-blur-xl">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg">
                  <Lock className="h-7 w-7" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Đăng nhập</h2>
              </div>

              {error ? (
                <Alert className="mb-5 border-red-200 bg-red-50 text-red-700">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="identifier"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Email hoặc Username
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <User className="h-5 w-5" />
                    </span>
                    <Input
                      id="identifier"
                      name="identifier"
                      autoComplete="username"
                      placeholder="admin hoặc example@domain.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="h-12 rounded-xl border-gray-200 bg-white pl-12 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-orange-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Mật khẩu
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock className="h-5 w-5" />
                    </span>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl border-gray-200 bg-white pl-12 pr-12 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-orange-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-orange-500"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600 select-none">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded accent-orange-500"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Ghi nhớ đăng nhập
                  </label>

                  <a
                    href="/forgot-password"
                    className="text-sm font-medium text-orange-600 transition hover:text-orange-700 hover:underline"
                  >
                    Quên mật khẩu?
                  </a>
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang đăng nhập...
                    </span>
                  ) : (
                    "Đăng nhập"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
