import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, User } from "lucide-react";
import API_URL from "@/config/api";
import { useNavigate } from "react-router-dom";
import { hubConnection } from "@/signalr/connection";

export default function LoginPage() {
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [remember, setRemember] = React.useState(true);

  const navigate = useNavigate();

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

      // if (hubConnection.state === "Disconnected") {
      //   await hubConnection.start();
      //   console.log("chatHub connected:", hubConnection.connectionId);
      // }

      navigate("/owner/dashboard");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-sm rounded-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Đăng nhập</CardTitle>
            <CardDescription>
              Nhập <span className="font-medium">email hoặc username</span> và
              mật khẩu để tiếp tục.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email hoặc Username</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <User className="h-4 w-4" />
                  </span>
                  <Input
                    id="identifier"
                    name="identifier"
                    autoComplete="username"
                    placeholder="admin hoặc example@domain.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </span>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-24"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-9 px-3"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "Ẩn" : "Hiện"}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-foreground"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Ghi nhớ đăng nhập
                </label>

                <a
                  href="/forgot-password"
                  className="text-sm font-medium underline-offset-4 hover:underline"
                >
                  Quên mật khẩu?
                </a>
              </div>

              <Button type="submit" className="w-full" disabled={!canSubmit}>
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
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <div className="text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <a
                href="/register"
                className="font-medium underline-offset-4 hover:underline"
              >
                Đăng ký
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
