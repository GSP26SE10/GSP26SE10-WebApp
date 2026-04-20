import React from "react";
import {
  Search,
  Mail,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  UserCircle2,
} from "lucide-react";
import API_URL from "@/config/api";
import ChatPanel from "@/components/ChatPanel";

const USER_ENDPOINT = `${API_URL}/api/user`;
const CHAT_READ_STORAGE_KEY = "owner_chat_last_read_map";

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
      payload.userId ??
      payload.id ??
      payload.nameid ??
      payload.sub ??
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ] ??
      null,
    userName:
      payload.unique_name ??
      payload.userName ??
      payload.username ??
      payload.name ??
      "",
    email: payload.email ?? "",
  };
}

function readLastReadMap() {
  try {
    const raw = localStorage.getItem(CHAT_READ_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLastReadMap(map) {
  localStorage.setItem(CHAT_READ_STORAGE_KEY, JSON.stringify(map));
}

function formatIsoDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export default function Topbar({
  title,
  breadcrumb,
  showSearch = true,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Tìm",
  actions,
  avatarSrc = "",
  onMailClick,
  userName = "Người dùng",
  userEmail = "",
}) {
  const [openChat, setOpenChat] = React.useState(false);
  const [notificationOpen, setNotificationOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const [loadingNotifications, setLoadingNotifications] = React.useState(true);
  const [notificationError, setNotificationError] = React.useState("");

  const [profile, setProfile] = React.useState(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);

  const [conversations, setConversations] = React.useState([]);
  const [mailUnreadCount, setMailUnreadCount] = React.useState(0);
  const [lastReadMap, setLastReadMap] = React.useState(() => readLastReadMap());

  const notificationRef = React.useRef(null);
  const userRef = React.useRef(null);

  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  const authUser = React.useMemo(() => getCurrentAuthUser(), [token]);

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
    if (!token) {
      setNotifications([]);
      setLoadingNotifications(false);
      return;
    }

    setLoadingNotifications(true);
    setNotificationError("");

    try {
      const res = await fetch(
        `${API_URL}/api/notification/my-notifications?page=1&pageSize=10`,
        { headers: authHeaders },
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
  }, [authHeaders, token]);

  const fetchProfile = React.useCallback(async () => {
    setLoadingProfile(true);

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

      setProfile(currentUser || null);
    } catch (err) {
      console.error("Fetch profile error:", err);
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [authUser]);

  const fetchConversations = React.useCallback(async () => {
    if (!token) {
      setConversations([]);
      return [];
    }

    try {
      const res = await fetch(`${API_URL}/api/conversation`, {
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải cuộc trò chuyện");
      }

      const items = Array.isArray(data?.items) ? data.items : [];
      setConversations(items);
      return items;
    } catch (err) {
      console.error("Fetch conversations error:", err);
      setConversations([]);
      return [];
    }
  }, [authHeaders, token]);

  const fetchUnreadCount = React.useCallback(async () => {
    if (!token) {
      setMailUnreadCount(0);
      return;
    }

    const convs = await fetchConversations();
    if (!convs.length) {
      setMailUnreadCount(0);
      return;
    }

    try {
      const results = await Promise.all(
        convs.map(async (conv) => {
          const conversationId = Number(conv.conversationId);
          if (!conversationId) return 0;

          const res = await fetch(
            `${API_URL}/api/message?conversationId=${conversationId}&page=1&pageSize=100`,
            { headers: authHeaders },
          );

          const data = await res.json().catch(() => ({}));
          if (!res.ok) return 0;

          const items = Array.isArray(data?.items) ? data.items : [];
          const lastReadAt = lastReadMap[String(conversationId)] || null;

          const unreadItems = items.filter((msg) => {
            const senderId = Number(msg.senderId || 0);
            const sentAt = formatIsoDate(msg.sentAt);
            if (!sentAt) return false;

            // Không tính tin nhắn do chính owner gửi
            if (
              authUser?.userId &&
              String(senderId) === String(authUser.userId)
            ) {
              return false;
            }

            // Nếu chưa từng đọc conversation này, tất cả tin từ khách đều là unread
            if (!lastReadAt) return true;

            return new Date(sentAt).getTime() > new Date(lastReadAt).getTime();
          });

          return unreadItems.length;
        }),
      );

      const total = results.reduce((sum, count) => sum + count, 0);
      setMailUnreadCount(total);
    } catch (err) {
      console.error("Fetch unread count error:", err);
    }
  }, [authHeaders, authUser, fetchConversations, lastReadMap, token]);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  React.useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  React.useEffect(() => {
    if (openChat) return;

    const intervalId = window.setInterval(() => {
      fetchUnreadCount();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [openChat, fetchUnreadCount]);

  const markAllConversationsAsRead = React.useCallback(async () => {
    const nowIso = new Date().toISOString();
    const nextMap = { ...lastReadMap };

    for (const conv of conversations) {
      const id = Number(conv.conversationId);
      if (!id) continue;
      nextMap[String(id)] = nowIso;
    }

    setLastReadMap(nextMap);
    writeLastReadMap(nextMap);
    setMailUnreadCount(0);
  }, [conversations, lastReadMap]);

  const handleMailClick = async () => {
    await markAllConversationsAsRead();

    if (onMailClick) {
      onMailClick();
      return;
    }

    setOpenChat(true);
  };

  const handleChatClose = async () => {
    setOpenChat(false);
    await fetchUnreadCount();
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

    try {
      await Promise.all(
        unread.map((item) =>
          fetch(`${API_URL}/api/notification/${item.notificationId}/read`, {
            method: "PATCH",
            headers: authHeaders,
          }),
        ),
      );

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true })),
      );
    } catch (err) {
      setNotificationError(err.message || "Không thể cập nhật thông báo");
    }
  };

  const handleGoAccount = () => {
    window.location.href = "/owner/account";
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("auth");
    localStorage.removeItem("userProfile");
    localStorage.removeItem(CHAT_READ_STORAGE_KEY);
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("auth");
    sessionStorage.removeItem("userProfile");
    window.location.href = "/login";
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

      if (
        userDropdownOpen &&
        userRef.current &&
        !userRef.current.contains(event.target)
      ) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationOpen, userDropdownOpen]);

  const displayName =
    profile?.fullName || profile?.userName || userName || "Người dùng";

  const displayEmail = profile?.email || userEmail || "";

  const displayAvatar = profile?.avatar || avatarSrc || "";

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
              {mailUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#E8712E] text-white text-[10px] flex items-center justify-center px-1">
                  {mailUnreadCount > 99 ? "99+" : mailUnreadCount}
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

            <div className="relative" ref={userRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full hover:bg-gray-50 pl-1 pr-2 py-1 transition"
              >
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt="avatar"
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-[#FFF3EA] flex items-center justify-center">
                    <UserCircle2 className="h-6 w-6 text-[#E8712E]" />
                  </div>
                )}

                <div className="hidden md:block text-left">
                  <div className="max-w-[180px] truncate text-sm font-medium text-gray-800">
                    {loadingProfile ? "Đang tải..." : displayName}
                  </div>
                  <div className="max-w-[180px] truncate text-xs text-gray-400">
                    {displayEmail || "Chưa có email"}
                  </div>
                </div>

                <ChevronDown
                  className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${
                    userDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`absolute right-0 top-14 w-56 origin-top-right rounded-2xl border border-gray-200 bg-white shadow-xl transition-all duration-200 ${
                  userDropdownOpen
                    ? "pointer-events-auto translate-y-0 opacity-100 scale-100"
                    : "pointer-events-none -translate-y-1 opacity-0 scale-95"
                }`}
              >
                <div className="border-b border-gray-100 px-4 py-3">
                  <div className="truncate text-sm font-semibold text-gray-900">
                    {loadingProfile ? "Đang tải..." : displayName}
                  </div>
                  <div className="truncate text-xs text-gray-500">
                    {displayEmail || "Chưa có email"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoAccount}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <Settings className="h-4 w-4" />
                  Cài đặt tài khoản
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {!onMailClick && <ChatPanel open={openChat} onClose={handleChatClose} />}
    </>
  );
}
