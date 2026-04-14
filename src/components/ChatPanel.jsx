import React from "react";
import { X, Send, MessageCircle, UtensilsCrossed } from "lucide-react";
import API_URL from "@/config/api";
import {
  startSignalRConnection,
  joinConversation,
  onReceiveMessage,
  offReceiveMessage,
} from "@/signalr/connection";

export default function ChatPanel({ open, onClose }) {
  const [loadingConversations, setLoadingConversations] = React.useState(false);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [conversations, setConversations] = React.useState([]);
  const [messages, setMessages] = React.useState([]);
  const [selectedConversation, setSelectedConversation] = React.useState(null);
  const [messageText, setMessageText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState("");

  const [menuSuggestions, setMenuSuggestions] = React.useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [menuKeyword, setMenuKeyword] = React.useState("");

  const messagesEndRef = React.useRef(null);

  const authToken =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  const authHeaders = React.useMemo(
    () => ({
      accept: "*/*",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    }),
    [authToken],
  );

  const scrollToBottom = React.useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  const safeJson = async (res) => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  const normalizeMenu = React.useCallback((menu) => {
    if (!menu) return null;

    const rawImages =
      menu.menuImage ||
      menu.menuImages ||
      menu.imgUrl ||
      menu.images ||
      menu.thumbnail ||
      menu.photoUrl ||
      menu.menuSnapshot?.imgUrl;

    const menuImages = rawImages
      ? Array.isArray(rawImages)
        ? rawImages.filter(Boolean)
        : [rawImages].filter(Boolean)
      : [];

    return {
      id: menu.menuId || menu.id,
      menuId: menu.menuId || menu.id,
      menuName: menu.menuName || menu.name || "Menu chưa đặt tên",
      description:
        menu.menuDescription || menu.description || menu.shortDescription || "",
      price: menu.menuPrice || menu.basePrice || menu.price || 0,
      menuImages,
      dishes: Array.isArray(menu.dishes)
        ? menu.dishes
        : Array.isArray(menu.menuSnapshot?.dishes)
          ? menu.menuSnapshot.dishes
          : [],
      raw: menu,
    };
  }, []);

  const fetchConversations = React.useCallback(async () => {
    setLoadingConversations(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/conversation`, {
        headers: authHeaders,
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải cuộc trò chuyện");
      }

      const items = Array.isArray(data?.items) ? data.items : [];
      setConversations(items);

      if (!selectedConversation && items.length > 0) {
        setSelectedConversation(items[0]);
      }
    } catch (err) {
      setError(err.message || "Không thể tải cuộc trò chuyện");
    } finally {
      setLoadingConversations(false);
    }
  }, [authHeaders, selectedConversation]);

  const fetchMessages = React.useCallback(
    async (conversationId) => {
      if (!conversationId) return;

      setLoadingMessages(true);

      try {
        const res = await fetch(
          `${API_URL}/api/message?conversationId=${conversationId}&page=1&pageSize=100`,
          {
            headers: authHeaders,
          },
        );

        const data = await safeJson(res);

        if (!res.ok) {
          throw new Error(data?.message || "Không thể tải tin nhắn");
        }

        const items = Array.isArray(data?.items) ? data.items : [];
        setMessages(
          items.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt)),
        );
      } catch (err) {
        setError(err.message || "Không thể tải tin nhắn");
      } finally {
        setLoadingMessages(false);
      }
    },
    [authHeaders],
  );

  const fetchMenuSuggestions = React.useCallback(async () => {
    setLoadingSuggestions(true);

    try {
      const query = new URLSearchParams({
        page: "1",
        pageSize: "20",
        ...(menuKeyword.trim() ? { keyword: menuKeyword.trim() } : {}),
      });

      const res = await fetch(`${API_URL}/api/menu?${query.toString()}`, {
        headers: authHeaders,
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải menu gợi ý");
      }

      const rawItems = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data?.items)
          ? data.data.items
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];

      setMenuSuggestions(rawItems.map(normalizeMenu).filter(Boolean));
    } catch (err) {
      setError(err.message || "Không thể tải menu gợi ý");
    } finally {
      setLoadingSuggestions(false);
    }
  }, [authHeaders, menuKeyword, normalizeMenu]);

  React.useEffect(() => {
    if (!open) return;
    fetchConversations();
  }, [open, fetchConversations]);

  React.useEffect(() => {
    if (!open) return;
    fetchMenuSuggestions();
  }, [open, fetchMenuSuggestions]);

  React.useEffect(() => {
    if (!open || !selectedConversation?.conversationId) return;

    const handleReceiveMessage = (message) => {
      if (
        Number(message?.conversationId) !==
        Number(selectedConversation.conversationId)
      ) {
        return;
      }

      setMessages((prev) => {
        const exists = prev.some(
          (m) =>
            Number(m.messageId) === Number(message.messageId) &&
            Number(m.conversationId) === Number(message.conversationId),
        );
        if (exists) return prev;
        return [...prev, message].sort(
          (a, b) => new Date(a.sentAt) - new Date(b.sentAt),
        );
      });
    };

    const init = async () => {
      setError("");

      try {
        await startSignalRConnection();
        await fetchMessages(selectedConversation.conversationId);

        onReceiveMessage(handleReceiveMessage);

        try {
          await joinConversation(Number(selectedConversation.conversationId));
        } catch (err) {
          console.error("JoinConversation error:", err);
          setError("Không thể tham gia phòng chat realtime.");
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Không thể tải dữ liệu chat");
      }
    };

    init();

    return () => {
      offReceiveMessage(handleReceiveMessage);
    };
  }, [open, selectedConversation, fetchMessages]);

  React.useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open, scrollToBottom]);

  const handleSendMessage = async () => {
    const content = messageText.trim();
    if (!content || !selectedConversation?.conversationId) return;

    setSending(true);
    setError("");

    try {
      const payload = {
        conversationId: Number(selectedConversation.conversationId),
        content,
        senderId: Number(selectedConversation.ownerId),
      };

      const res = await fetch(`${API_URL}/api/message`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.message || "Gửi tin nhắn thất bại");
      }

      const newMessage = data?.data || data;

      if (newMessage?.conversationId) {
        setMessages((prev) => {
          const exists = prev.some(
            (m) => Number(m.messageId) === Number(newMessage.messageId),
          );
          if (exists) return prev;
          return [...prev, newMessage].sort(
            (a, b) => new Date(a.sentAt) - new Date(b.sentAt),
          );
        });
      } else {
        await fetchMessages(selectedConversation.conversationId);
      }

      setMessageText("");
    } catch (err) {
      setError(err.message || "Không thể gửi tin nhắn");
    } finally {
      setSending(false);
    }
  };

  const handleSendMenuSuggestion = async (menu) => {
    if (!selectedConversation?.conversationId || !menu) return;

    setSending(true);
    setError("");

    try {
      const payload = {
        conversationId: Number(selectedConversation.conversationId),
        senderId: Number(selectedConversation.ownerId),
        messageType: "MENU",
        content: `Gợi ý cho bạn menu: ${menu.menuName}`,
        menuId: Number(menu.menuId),
        menuName: menu.menuName,
        menuDescription: menu.description || "",
        menuPrice: Number(menu.price || 0),
        menuImages: menu.menuImages || [],
        menuSnapshot: {
          menuName: menu.menuName,
          description: menu.description || "",
          basePrice: Number(menu.price || 0),
          imgUrl: menu.menuImages || [],
          dishes: Array.isArray(menu.dishes) ? menu.dishes : [],
        },
      };

      const res = await fetch(`${API_URL}/api/message`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.message || "Gửi menu thất bại");
      }

      const newMessage = data?.data || data;

      if (newMessage?.conversationId) {
        setMessages((prev) => {
          const exists = prev.some(
            (m) => Number(m.messageId) === Number(newMessage.messageId),
          );
          if (exists) return prev;
          return [...prev, newMessage].sort(
            (a, b) => new Date(a.sentAt) - new Date(b.sentAt),
          );
        });
      } else {
        await fetchMessages(selectedConversation.conversationId);
      }

      setShowSuggestions(false);
    } catch (err) {
      setError(err.message || "Không thể gửi menu");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatPrice = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const number = Number(value);
    if (Number.isNaN(number)) return String(value);
    return number.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });
  };

  const renderMenuPreview = (msg) => {
    const menuName =
      msg.menuName || msg.menuSnapshot?.menuName || "Menu đính kèm";
    const menuPrice =
      msg.menuPrice || msg.menuSnapshot?.basePrice || msg.menuSnapshot?.price;
    const menuDescription =
      msg.menuDescription || msg.menuSnapshot?.description;
    const rawImages =
      msg.menuImage ||
      msg.menuImages ||
      msg.menuSnapshot?.imgUrl ||
      msg.menuSnapshot?.menuImages;

    const menuImages = rawImages
      ? Array.isArray(rawImages)
        ? rawImages.filter(Boolean)
        : [rawImages].filter(Boolean)
      : [];

    const menuDishes = Array.isArray(msg.menuSnapshot?.dishes)
      ? msg.menuSnapshot.dishes
      : [];

    if (
      !msg.menuId &&
      !msg.menuName &&
      menuImages.length === 0 &&
      !menuDishes.length
    ) {
      return null;
    }

    return (
      <div className="mt-3 rounded-2xl border border-[#F3D4BF] bg-[#FFF7F2] p-3 text-sm text-gray-900">
        <div className="font-semibold text-gray-900">{menuName}</div>

        {menuImages.length > 0 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {menuImages.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={`${menuName}-${index}`}
                className={`rounded-2xl object-cover flex-shrink-0 ${
                  index === 0
                    ? "h-36 w-64 min-w-[16rem]"
                    : "h-36 w-44 min-w-[11rem]"
                }`}
              />
            ))}
          </div>
        ) : null}

        {/* <div className="mt-3 space-y-2">
          {menuPrice ? (
            <div className="text-sm text-gray-700">
              Giá: {formatPrice(menuPrice)}
            </div>
          ) : null}

          {menuDescription ? (
            <div className="text-sm text-gray-600">{menuDescription}</div>
          ) : null}

          {msg.menuId ? (
            <div className="text-xs text-gray-500">Menu ID: {msg.menuId}</div>
          ) : null}

          {menuDishes.length > 0 ? (
            <div className="mt-2 rounded-2xl bg-white p-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Danh sách món
              </div>
              <ul className="mt-2 space-y-1 text-gray-700">
                {menuDishes.slice(0, 5).map((dish, index) => (
                  <li key={index} className="text-sm">
                    • {dish?.dishName || dish?.name || dish}
                  </li>
                ))}
                {menuDishes.length > 5 ? (
                  <li className="text-sm text-gray-500">
                    ...và {menuDishes.length - 5} món khác
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div> */}
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end bg-black/25">
      <div className="flex h-full w-full max-w-6xl bg-white shadow-2xl">
        <div className="flex w-[320px] flex-col border-r border-gray-200">
          <div className="flex h-16 items-center justify-between border-b px-5">
            <div className="font-semibold text-gray-900">Tin nhắn</div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="p-4 text-sm text-gray-500">Đang tải...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                Chưa có cuộc trò chuyện nào.
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive =
                  Number(conv.conversationId) ===
                  Number(selectedConversation?.conversationId);

                return (
                  <button
                    key={conv.conversationId}
                    type="button"
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full border-b px-4 py-4 text-left transition ${
                      isActive ? "bg-[#FFF3EA]" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">
                      {conv.customerName || "Khách hàng"}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Owner: {conv.ownerName || "--"}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      #{conv.conversationId}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex h-16 items-center justify-between border-b px-6">
            <div>
              <div className="font-semibold text-gray-900">
                {selectedConversation?.customerName || "Chọn cuộc trò chuyện"}
              </div>
              <div className="text-sm text-gray-500">
                {selectedConversation
                  ? `Conversation #${selectedConversation.conversationId}`
                  : "Chưa chọn cuộc trò chuyện"}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#FFFAF0] px-6 py-5">
            {loadingMessages ? (
              <div className="text-sm text-gray-500">Đang tải tin nhắn...</div>
            ) : !selectedConversation ? (
              <div className="flex h-full items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageCircle className="mx-auto mb-2 h-10 w-10" />
                  Chọn một cuộc trò chuyện để bắt đầu
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-400">
                Chưa có tin nhắn nào
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isOwner =
                    Number(msg.senderId) ===
                    Number(selectedConversation?.ownerId);

                  const hasMenuPreview =
                    msg.messageType === "MENU" ||
                    msg.menuId ||
                    msg.menuName ||
                    msg.menuImage ||
                    msg.menuImages ||
                    msg.menuSnapshot;

                  return (
                    <div
                      key={`${msg.messageId}-${msg.sentAt}`}
                      className={`flex ${isOwner ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                          isOwner
                            ? "bg-[#E8712E] text-white"
                            : "bg-white text-gray-900"
                        }`}
                      >
                        {msg.content ? (
                          <div className="whitespace-pre-wrap text-sm">
                            {msg.content}
                          </div>
                        ) : null}

                        {hasMenuPreview ? renderMenuPreview(msg) : null}

                        <div
                          className={`mt-1 text-[11px] ${
                            isOwner ? "text-white/80" : "text-gray-400"
                          }`}
                        >
                          {msg.senderName || "Unknown"} •{" "}
                          {formatTime(msg.sentAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t bg-white p-4">
            {error ? (
              <div className="mb-2 text-sm text-red-500">{error}</div>
            ) : null}

            {showSuggestions ? (
              <div className="mb-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="font-semibold text-gray-900">
                    Chọn menu để gửi cho khách
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Đóng
                  </button>
                </div>

                <div className="mb-3 flex gap-2">
                  <input
                    value={menuKeyword}
                    onChange={(e) => setMenuKeyword(e.target.value)}
                    placeholder="Tìm menu..."
                    className="h-11 flex-1 rounded-xl border border-gray-300 px-4 outline-none focus:border-[#E8712E]"
                  />
                  <button
                    type="button"
                    onClick={fetchMenuSuggestions}
                    className="rounded-xl bg-[#E8712E] px-4 font-medium text-white hover:opacity-90"
                  >
                    Tìm
                  </button>
                </div>

                {loadingSuggestions ? (
                  <div className="text-sm text-gray-500">Đang tải menu...</div>
                ) : menuSuggestions.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    Không có menu gợi ý.
                  </div>
                ) : (
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {menuSuggestions.map((menu) => {
                      const image = menu.menuImages?.[0];

                      return (
                        <button
                          key={menu.menuId}
                          type="button"
                          onClick={() => handleSendMenuSuggestion(menu)}
                          disabled={sending}
                          className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 p-3 text-left hover:bg-gray-50 disabled:opacity-60"
                        >
                          {image ? (
                            <img
                              src={image}
                              alt={menu.menuName}
                              className="h-16 w-24 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                              <UtensilsCrossed className="h-5 w-5" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium text-gray-900">
                              {menu.menuName}
                            </div>
                            <div className="mt-1 line-clamp-2 text-sm text-gray-500">
                              {menu.description || "Không có mô tả"}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-[#E8712E]">
                              {formatPrice(menu.price)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            <div className="relative flex items-end gap-3">
              <button
                type="button"
                onClick={() => setShowSuggestions((prev) => !prev)}
                disabled={!selectedConversation || sending}
                className="flex h-12 items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                <UtensilsCrossed className="h-4 w-4" />
                Đề xuất menu
              </button>

              <textarea
                rows={2}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#E8712E]"
                disabled={!selectedConversation || sending}
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={
                  !selectedConversation || !messageText.trim() || sending
                }
                className="flex h-12 items-center gap-2 rounded-xl bg-[#E8712E] px-4 font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {sending ? "Đang gửi..." : "Gửi"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(dateString) {
  if (!dateString) return "--:--";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}
