import React from "react";
import { X, Send, MessageCircle } from "lucide-react";
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

  React.useEffect(() => {
    if (!open) return;
    fetchConversations();
  }, [open, fetchConversations]);

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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/25 flex justify-end">
      <div className="w-full max-w-5xl h-full bg-white shadow-2xl flex">
        <div className="w-[320px] border-r border-gray-200 flex flex-col">
          <div className="h-16 px-5 border-b flex items-center justify-between">
            <div className="font-semibold text-gray-900">Tin nhắn</div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
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
                    className={`w-full text-left px-4 py-4 border-b transition ${
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

        <div className="flex-1 flex flex-col">
          <div className="h-16 px-6 border-b flex items-center justify-between">
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
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageCircle className="h-10 w-10 mx-auto mb-2" />
                  Chọn một cuộc trò chuyện để bắt đầu
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                Chưa có tin nhắn nào
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isOwner =
                    Number(msg.senderId) ===
                    Number(selectedConversation?.ownerId);

                  return (
                    <div
                      key={`${msg.messageId}-${msg.sentAt}`}
                      className={`flex ${isOwner ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                          isOwner
                            ? "bg-[#E8712E] text-white"
                            : "bg-white text-gray-900"
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </div>
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

            <div className="flex items-end gap-3">
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
                className="h-12 px-4 rounded-xl bg-[#E8712E] text-white font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-60"
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
