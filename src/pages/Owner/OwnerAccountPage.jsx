import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import API_URL from "@/config/api";
import {
  Pencil,
  Save,
  X,
  UserCircle2,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

const USER_ENDPOINT = `${API_URL}/api/user`;

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getCurrentAuthUser() {
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  if (!token) return null;

  const payload = parseJwt(token);
  if (!payload) return null;

  return {
    userId:
      payload.userId ?? payload.id ?? payload.nameid ?? payload.sub ?? null,
    userName:
      payload.unique_name ??
      payload.userName ??
      payload.username ??
      payload.name ??
      "",
    email: payload.email ?? "",
    role:
      payload.role ??
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
      "",
  };
}

export default function OwnerAccountPage() {
  const [sbExpanded, setSbExpanded] = React.useState(false);

  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [editing, setEditing] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const [form, setForm] = React.useState({
    userName: "",
    fullName: "",
    email: "",
    phone: "",
    address: "",
    avatar: "",
  });

  const fetchAllUsers = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let page = 1;
      let allItems = [];
      let hasMore = true;

      while (hasMore) {
        const res = await fetch(`${USER_ENDPOINT}?page=${page}&pageSize=100`, {
          headers: { accept: "*/*" },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            data?.message || "Không thể tải thông tin người dùng",
          );
        }

        const items = Array.isArray(data?.items) ? data.items : [];
        allItems = [...allItems, ...items];

        if (page >= Number(data?.totalPages || 1) || items.length === 0) {
          hasMore = false;
        } else {
          page += 1;
        }
      }

      const authUser = getCurrentAuthUser();

      let currentUser = null;

      if (authUser?.userId) {
        currentUser = allItems.find(
          (item) => String(item.userId) === String(authUser.userId),
        );
      }

      if (!currentUser && authUser?.email) {
        currentUser = allItems.find(
          (item) =>
            String(item.email || "").toLowerCase() ===
            String(authUser.email).toLowerCase(),
        );
      }

      if (!currentUser && authUser?.userName) {
        currentUser = allItems.find(
          (item) =>
            String(item.userName || "").toLowerCase() ===
            String(authUser.userName).toLowerCase(),
        );
      }

      if (!currentUser) {
        throw new Error("Không tìm thấy thông tin tài khoản đang đăng nhập.");
      }

      setProfile(currentUser);
      setForm({
        userName: currentUser.userName || "",
        fullName: currentUser.fullName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
        avatar: currentUser.avatar || "",
      });
    } catch (err) {
      const message = err.message || "Đã có lỗi xảy ra";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const resetForm = () => {
    if (!profile) return;

    setForm({
      userName: profile.userName || "",
      fullName: profile.fullName || "",
      email: profile.email || "",
      phone: profile.phone || "",
      address: profile.address || "",
      avatar: profile.avatar || "",
    });
  };

  const handleCancelEdit = () => {
    resetForm();
    setEditing(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profile?.userId) return;

    setSubmitting(true);

    try {
      const payload = {
        userName: form.userName.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        avatar: form.avatar.trim(),
        status: profile.status,
        roleName: profile.roleName,
      };

      if (!payload.fullName) {
        throw new Error("Vui lòng nhập họ và tên.");
      }

      if (!payload.email) {
        throw new Error("Vui lòng nhập email.");
      }

      const res = await fetch(`${USER_ENDPOINT}/${profile.userId}`, {
        method: "PUT",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Cập nhật thông tin thất bại");
      }

      toast.success("Cập nhật thông tin thành công");
      setEditing(false);
      await fetchAllUsers();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAF0] font-main">
      <Sidebar onExpandChange={setSbExpanded} />

      <div
        className={`min-h-screen transition-[margin] duration-300 ease-in-out ${
          sbExpanded ? "ml-72" : "ml-20"
        }`}
      >
        <Topbar
          breadcrumb={
            <>
              <span className="text-gray-400">CÀI ĐẶT</span>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900">TÀI KHOẢN</span>
            </>
          }
          userName={profile?.fullName || profile?.userName || "Người dùng"}
          userEmail={profile?.email || ""}
          avatarSrc={profile?.avatar || ""}
        />

        <main className="px-7 py-6 pb-10">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-[20px] font-bold text-[#E54B2D]">
              Thông tin cá nhân
            </h1>

            {!loading && !error && profile && !editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex h-10 items-center gap-2 rounded-lg bg-[#E8712E] px-4 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Pencil className="h-4 w-4" />
                Chỉnh sửa
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
          ) : error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : !profile ? (
            <div className="text-sm text-gray-500">
              Không có thông tin tài khoản.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
              <div className="rounded-2xl border border-[#F1E3D8] bg-white p-6 shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-[#FFF3EA] bg-[#FFF3EA]">
                    {form.avatar ? (
                      <img
                        src={form.avatar}
                        alt={form.fullName || form.userName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserCircle2 className="h-16 w-16 text-[#E8712E]" />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-[20px] font-bold text-gray-900">
                    {profile.fullName || "Chưa có tên"}
                  </div>

                  <div className="mt-1 text-sm text-gray-500">
                    @{profile.userName || "username"}
                  </div>

                  <div className="mt-3 rounded-full bg-[#FFF3EA] px-3 py-1 text-xs font-semibold text-[#E8712E]">
                    {profile.roleName || "USER"}
                  </div>

                  <div className="mt-6 w-full space-y-3 text-left">
                    <InfoLine
                      icon={<Mail className="h-4 w-4" />}
                      text={profile.email || "Chưa có email"}
                    />
                    <InfoLine
                      icon={<Phone className="h-4 w-4" />}
                      text={profile.phone || "Chưa có số điện thoại"}
                    />
                    <InfoLine
                      icon={<MapPin className="h-4 w-4" />}
                      text={profile.address || "Chưa có địa chỉ"}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#F1E3D8] bg-white p-6 shadow-sm">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field
                      label="Tên đăng nhập"
                      value={form.userName}
                      onChange={(v) =>
                        setForm((prev) => ({ ...prev, userName: v }))
                      }
                      disabled={!editing}
                    />
                    <Field
                      label="Họ và tên"
                      value={form.fullName}
                      onChange={(v) =>
                        setForm((prev) => ({ ...prev, fullName: v }))
                      }
                      required
                      disabled={!editing}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(v) =>
                        setForm((prev) => ({ ...prev, email: v }))
                      }
                      required
                      disabled={!editing}
                    />
                    <Field
                      label="Số điện thoại"
                      value={form.phone}
                      onChange={(v) =>
                        setForm((prev) => ({ ...prev, phone: v }))
                      }
                      disabled={!editing}
                    />
                  </div>

                  <Field
                    label="Địa chỉ"
                    value={form.address}
                    onChange={(v) =>
                      setForm((prev) => ({ ...prev, address: v }))
                    }
                    disabled={!editing}
                  />

                  <Field
                    label="Avatar URL"
                    value={form.avatar}
                    onChange={(v) =>
                      setForm((prev) => ({ ...prev, avatar: v }))
                    }
                    disabled={!editing}
                  />
                  {editing && (
                    <div className="flex justify-end gap-3 pt-3">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-4 text-gray-700 transition hover:bg-gray-50"
                      >
                        <X className="h-4 w-4" />
                        Hủy
                      </button>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex h-10 items-center gap-2 rounded-lg bg-[#E8712E] px-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                      >
                        <Save className="h-4 w-4" />
                        {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function InfoLine({ icon, text }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-[#FFF9F4] px-3 py-3 text-sm text-gray-700">
      <div className="mt-0.5 text-[#E8712E]">{icon}</div>
      <div className="break-all">{text}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  disabled = false,
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-3 py-2 outline-none transition ${
          disabled
            ? "border-gray-200 bg-gray-50 text-gray-500"
            : "border-gray-300 bg-white focus:border-[#E8712E]"
        }`}
      />
    </div>
  );
}

function ReadonlyField({ label, value }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600">
        {value || "—"}
      </div>
    </div>
  );
}

function renderStatus(status) {
  if (status === 1 || String(status) === "1") return "Hoạt động";
  if (status === 0 || String(status) === "0") return "Ngưng hoạt động";
  return String(status ?? "—");
}
