import React from "react";
import { Search, Mail, Bell, ChevronDown } from "lucide-react";
import API_URL from "@/config/api";
import ChatPanel from "@/components/ChatPanel";

export default function Topbar({
  title,
  breadcrumb,
  showSearch = true,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Tìm",
  actions,
  avatarSrc = "https://gocnhobecon.com/wp-content/uploads/2025/08/meme-con-meo-cuoi.webp",
  onMailClick,
  unreadCount = 0,
}) {
  const [openChat, setOpenChat] = React.useState(false);
  const [notificationOpen, setNotificationOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const [loadingNotifications, setLoadingNotifications] = React.useState(true);
  const [notificationError, setNotificationError] = React.useState("");
  const notificationRef = React.useRef(null);

  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  const authHeaders = React.useMemo(
    () => ({
      accept: "*/*",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const unreadNotificationCount = notifications.filter(
    (item) => !item.isRead,
  ).length;

  const fetchNotifications = React.useCallback(async () => {
    setLoadingNotifications(true);
    setNotificationError("");

    try {
      const res = await fetch(
        `${API_URL}/api/notification/my-notifications?page=1&pageSize=10`,
        {
          headers: authHeaders,
        },
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải thông báo");
      }

      const items = Array.isArray(data?.items) ? data.items : [];
      setNotifications(items);
    } catch (err) {
      setNotificationError(err.message || "Đã có lỗi khi tải thông báo");
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMailClick = () => {
    if (onMailClick) {
      onMailClick();
      return;
    }
    setOpenChat(true);
  };

  const toggleNotificationPanel = () => {
    setNotificationOpen((prev) => !prev);
    if (!notificationOpen) {
      fetchNotifications();
    }
  };

  const markNotificationRead = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/notification/${id}/read`, {
        method: "PATCH",
        headers: authHeaders,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Không thể cập nhật thông báo");
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.notificationId === id ? { ...item, isRead: true } : item,
        ),
      );
    } catch (err) {
      setNotificationError(err.message || "Không thể cập nhật thông báo");
    }
  };

  const markAllNotificationsRead = async () => {
    const unread = notifications.filter((item) => !item.isRead);
    await Promise.all(
      unread.map((item) =>
        fetch(`${API_URL}/api/notification/${item.notificationId}/read`, {
          method: "PATCH",
          headers: authHeaders,
        }),
      ),
    );
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationOpen &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationOpen]);

  return (
    <>
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="min-h-16 px-7 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {breadcrumb ? (
              <div className="text-sm font-semibold tracking-wide truncate">
                {breadcrumb}
              </div>
            ) : (
              <h2 className="text-lg font-semibold tracking-wide text-[#1f2937]">
                {title}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-3">
            {actions ? (
              <div className="flex items-center gap-3">{actions}</div>
            ) : null}

            {showSearch && (
              <div className="hidden md:flex items-center gap-2 bg-[#F6F7FB] border border-[#EEF0F6] rounded-full px-4 py-2 w-[360px]">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="bg-transparent outline-none text-sm w-full text-gray-700 placeholder:text-gray-400"
                  placeholder={searchPlaceholder}
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleMailClick}
              className="p-2 rounded-full hover:bg-gray-100 relative"
            >
              <Mail className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#E8712E] text-white text-[10px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={toggleNotificationPanel}
                className="p-2 rounded-full hover:bg-gray-100 relative"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#E8712E] text-white text-[10px] flex items-center justify-center px-1">
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-hidden overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        Thông báo
                      </div>
                      <div className="text-xs text-gray-500">
                        {loadingNotifications
                          ? "Đang tải..."
                          : `${notifications.length} thông báo`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-xs font-semibold text-[#E8712E] hover:text-[#c55f2c]"
                    >
                      Đánh dấu tất cả đã đọc
                    </button>
                  </div>
                  <div className="space-y-1 p-2">
                    {notificationError && (
                      <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                        {notificationError}
                      </div>
                    )}

                    {loadingNotifications ? (
                      <div className="p-3 text-sm text-gray-500">
                        Đang tải thông báo...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">
                        Không có thông báo
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <button
                          key={item.notificationId}
                          type="button"
                          onClick={() =>
                            markNotificationRead(item.notificationId)
                          }
                          className={`w-full text-left rounded-2xl px-4 py-3 transition ${
                            item.isRead ? "bg-white" : "bg-[#FFF4E6]"
                          } hover:bg-[#F7F3EE]`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm font-semibold text-gray-900">
                              {item.title || "Thông báo mới"}
                            </div>
                            {!item.isRead && (
                              <span className="h-2.5 w-2.5 rounded-full bg-[#E8712E] mt-1" />
                            )}
                          </div>
                          <div className="mt-1 text-xs leading-snug text-gray-600">
                            {item.body || "---"}
                          </div>
                          <div className="mt-2 text-[11px] text-gray-400">
                            {new Date(item.createdAt).toLocaleString("vi-VN")}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <img
                src={avatarSrc}
                alt="avatar"
                className="h-9 w-9 rounded-full object-cover"
              />
              <button className="hidden md:inline-flex items-center gap-1 text-sm text-gray-700">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>
      {!onMailClick && (
        <ChatPanel open={openChat} onClose={() => setOpenChat(false)} />
      )}
    </>
  );
}
