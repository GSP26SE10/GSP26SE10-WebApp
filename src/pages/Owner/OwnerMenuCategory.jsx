import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import API_URL from "@/config/api";
import { Navigate, useNavigate } from "react-router-dom";
import { hubConnection } from "@/signalr/connection";
import { toast } from "sonner";

export default function LoginPage() {
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
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

    if (!identifier.trim() || !password) {
      toast.error("Vui lòng nhập email/username và mật khẩu.");
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

      localStorage.removeItem("accessToken");
      localStorage.removeItem("auth");
      localStorage.removeItem("userProfile");
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("auth");
      sessionStorage.removeItem("userProfile");

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
      }

      toast.success("Đăng nhập thành công.");
      navigate("/owner/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFAF0] font-main">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFF3EA] via-[#FFFAF0] to-[#FFE4D1]" />
          <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-[#F2B9A5]/40 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-[#FFD7BF]/50 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F2B9A5] bg-white/80 px-4 py-2 text-sm font-semibold text-[#E8712E] shadow-sm">
                <ShieldCheck className="h-4 w-4" />
                Bookfet Management
              </div>

              <h1 className="mt-8 max-w-xl text-5xl font-bold leading-tight text-[#2F3A67]">
                Chào mừng bạn quay trở lại
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-gray-600">
                Đăng nhập để quản lý menu, danh mục, dữ liệu vận hành và tiếp
                tục công việc với giao diện đồng bộ cùng hệ thống quản trị.
              </p>
            </div>

            <div className="grid max-w-xl gap-4">
              <FeatureCard
                title="Giao diện đồng bộ"
                description="Thiết kế cùng tone quản trị với màu cam chủ đạo, card trắng và trải nghiệm gọn gàng."
              />
              <FeatureCard
                title="Đăng nhập nhanh chóng"
                description="Hỗ trợ email hoặc username, lưu phiên đăng nhập và chuyển thẳng đến dashboard."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="rounded-[28px] border border-[#F1E3D8] bg-white p-8 shadow-[0_18px_45px_rgba(229,113,46,0.10)]">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF3EA] text-[#E8712E]">
                  <LogIn className="h-7 w-7" />
                </div>

                <h2 className="text-[28px] font-bold text-[#2F3A67]">
                  Đăng nhập
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Nhập email hoặc username và mật khẩu để tiếp tục.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label
                    htmlFor="identifier"
                    className="mb-2 block text-sm font-semibold text-[#2F3A67]"
                  >
                    Email hoặc Username
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <User className="h-5 w-5" />
                    </span>
                    <Input
                      id="identifier"
                      name="identifier"
                      autoComplete="username"
                      placeholder="admin hoặc example@domain.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="h-12 rounded-xl border-gray-200 bg-[#FFFCF9] pl-12 text-sm outline-none focus-visible:ring-0 focus-visible:border-[#E8712E]"
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-[#2F3A67]"
                  >
                    Mật khẩu
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
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
                      className="h-12 rounded-xl border-gray-200 bg-[#FFFCF9] pl-12 pr-12 text-sm outline-none focus-visible:ring-0 focus-visible:border-[#E8712E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#E8712E]"
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
                      className="h-4 w-4 accent-[#E8712E]"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Ghi nhớ đăng nhập
                  </label>

                  <a
                    href="/forgot-password"
                    className="text-sm font-semibold text-[#E8712E] hover:underline"
                  >
                    Quên mật khẩu?
                  </a>
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="h-12 w-full rounded-xl bg-[#E8712E] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(232,113,46,0.25)] transition hover:opacity-90 disabled:opacity-60"
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

              <div className="mt-6 text-center text-sm text-gray-500">
                Chưa có tài khoản?{" "}
                <a
                  href="/register"
                  className="font-semibold text-[#E8712E] hover:underline"
                >
                  Đăng ký
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
      <div className="text-base font-bold text-[#2F3A67]">{title}</div>
      <div className="mt-1 text-sm leading-6 text-gray-600">{description}</div>
    </div>
  );
}
