import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ChatPanel from "@/components/ChatPanel";
import API_URL from "@/config/api";
import { toast } from "sonner";
import {
  ClipboardList,
  Filter,
  MapPin,
  Check,
  Ban,
  ChefHat,
  Wallet,
  Users,
  Clock3,
  MessageCircle,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";

const ORDER_STATUS_MAP = {
  1: { label: "Chờ duyệt", className: "bg-[#FEF3C7] text-[#B45309]" },
  2: { label: "Đã duyệt", className: "bg-[#DCFCE7] text-[#15803D]" },
  3: { label: "Từ chối", className: "bg-[#F3F4F6] text-[#6B7280]" },
  4: { label: "Đang chuẩn bị", className: "bg-[#DBEAFE] text-[#1D4ED8]" },
  5: { label: "Đang thực hiện", className: "bg-[#E0E7FF] text-[#4338CA]" },
  6: { label: "Thanh toán", className: "bg-[#EDE9FE] text-[#6D28D9]" },
  7: { label: "Hoàn thành", className: "bg-[#D1FAE5] text-[#047857]" },
  8: { label: "Đã hủy", className: "bg-[#FEE2E2] text-[#B91C1C]" },
};

const ORDER_DETAIL_STATUS_MAP = {
  1: { label: "Chờ duyệt", className: "bg-[#FEF3C7] text-[#B45309]" },
  2: { label: "Đã duyệt", className: "bg-[#DCFCE7] text-[#15803D]" },
  3: { label: "Từ chối", className: "bg-[#F3F4F6] text-[#6B7280]" },
  4: { label: "Đang chuẩn bị", className: "bg-[#DBEAFE] text-[#1D4ED8]" },
  5: { label: "Đang thực hiện", className: "bg-[#E0E7FF] text-[#4338CA]" },
  6: { label: "Hoàn thành", className: "bg-[#D1FAE5] text-[#047857]" },
  7: { label: "Đã hủy", className: "bg-[#FEE2E2] text-[#B91C1C]" },
};

export default function OwnerPendingOrder() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [openChat, setOpenChat] = React.useState(false);
  const [orders, setOrders] = React.useState([]);
  const [activeConversation, setActiveConversation] = React.useState(null);
  const [chatMessages, setChatMessages] = React.useState([]);
  const [chatLoading, setChatLoading] = React.useState(false);
  const [chatError, setChatError] = React.useState("");
  const [sendingMessage, setSendingMessage] = React.useState(false);
  const [chatInput, setChatInput] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [selectedOrderId, setSelectedOrderId] = React.useState(null);
  const [selectedOrderDetailId, setSelectedOrderDetailId] =
    React.useState(null);
  const [search, setSearch] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState("");
  const [rejectReason, setRejectReason] = React.useState("");
  const [openRejectModal, setOpenRejectModal] = React.useState(false);

  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  const ownerId = React.useMemo(() => {
    const userRaw =
      localStorage.getItem("userId") || sessionStorage.getItem("userId");

    if (!userRaw) return null;

    try {
      const user = JSON.parse(userRaw);
      return user?.userId || user?.ownerId || user?.id || null;
    } catch {
      return null;
    }
  }, []);

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/order?page=1&pageSize=100`, {
        headers: {
          accept: "*/*",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải danh sách đơn hàng");
      }

      const items = Array.isArray(data?.items) ? data.items : [];
      const pendingOnly = items.filter((item) => Number(item.status) === 1);

      setOrders(pendingOnly);

      if (pendingOnly.length > 0) {
        setSelectedOrderId((prev) => {
          const exists = pendingOnly.some((item) => item.orderId === prev);
          return exists ? prev : pendingOnly[0].orderId;
        });
      } else {
        setSelectedOrderId(null);
        setSelectedOrderDetailId(null);
      }
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return orders;

    return orders.filter((order) => {
      const details = Array.isArray(order.orderDetails)
        ? order.orderDetails
        : [];

      const matchOrder =
        String(order.orderId).includes(keyword) ||
        String(order.customerName || "")
          .toLowerCase()
          .includes(keyword);

      const matchDetail = details.some((detail) => {
        return (
          String(detail?.address || "")
            .toLowerCase()
            .includes(keyword) ||
          String(detail?.menuName || "")
            .toLowerCase()
            .includes(keyword) ||
          String(detail?.partyCategoryName || "")
            .toLowerCase()
            .includes(keyword)
        );
      });

      return matchOrder || matchDetail;
    });
  }, [orders, search]);

  const selectedOrder =
    filteredOrders.find((order) => order.orderId === selectedOrderId) ||
    filteredOrders[0] ||
    null;

  React.useEffect(() => {
    const firstDetail = selectedOrder?.orderDetails?.[0] || null;

    setSelectedOrderDetailId((prev) => {
      const exists = selectedOrder?.orderDetails?.some(
        (detail) => detail.orderDetailId === prev,
      );
      return exists ? prev : (firstDetail?.orderDetailId ?? null);
    });
  }, [selectedOrder]);

  const selectedDetail =
    selectedOrder?.orderDetails?.find(
      (detail) => detail.orderDetailId === selectedOrderDetailId,
    ) ||
    selectedOrder?.orderDetails?.[0] ||
    null;

  const handleApproveOrder = async () => {
    if (!selectedOrder) return;

    setActionLoading("approve");
    setMessage("");
    setError("");

    try {
      const res = await fetch(
        `${API_URL}/api/order/${selectedOrder.orderId}/owner/review`,
        {
          method: "PUT",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: 2 }),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Duyệt đơn thất bại");
      }

      toast.success("Duyệt đơn thành công.");
      setSelectedOrderId(null);
      await fetchOrders();
    } catch (err) {
      toast.error(err.message || "Duyệt đơn thất bại");
    } finally {
      setActionLoading("");
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder) return;

    if (!rejectReason.trim()) {
      toast.warning("Vui lòng nhập lý do từ chối");
      return;
    }

    setActionLoading("reject");
    setMessage("");
    setError("");

    try {
      const res = await fetch(
        `${API_URL}/api/order/${selectedOrder.orderId}/owner/review`,
        {
          method: "PUT",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            status: 3,
            noteOrder: rejectReason,
          }),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Từ chối đơn thất bại");
      }

      toast.success("Từ chối đơn thành công.");
      setRejectReason("");
      setOpenRejectModal(false);
      setSelectedOrderId(null);
      await fetchOrders();
    } catch (err) {
      toast.error(err.message || "Từ chối đơn thất bại");
    } finally {
      setActionLoading("");
    }
  };

  const openCustomerChat = async (order) => {
    if (!order?.customerId) {
      setChatError("Không tìm thấy khách hàng.");
      setOpenChat(true);
      return;
    }

    if (!ownerId) {
      setChatError("Không tìm thấy ownerId hiện tại.");
      setOpenChat(true);
      return;
    }

    setChatLoading(true);
    setChatError("");
    setChatInput("");

    try {
      let conversation = null;

      const conversationRes = await fetch(`${API_URL}/api/conversation`, {
        headers: {
          accept: "*/*",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const conversationData = await conversationRes.json().catch(() => ({}));

      if (!conversationRes.ok) {
        throw new Error(
          conversationData?.message ||
            "Không thể tải danh sách cuộc trò chuyện",
        );
      }

      const conversations = Array.isArray(conversationData?.items)
        ? conversationData.items
        : [];

      conversation =
        conversations.find(
          (item) =>
            Number(item.customerId) === Number(order.customerId) &&
            Number(item.ownerId) === Number(ownerId),
        ) || null;

      if (!conversation) {
        const createRes = await fetch(`${API_URL}/api/conversation`, {
          method: "POST",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            customerId: Number(order.customerId),
            ownerId: Number(ownerId),
          }),
        });

        const createData = await createRes.json().catch(() => ({}));

        if (!createRes.ok) {
          throw new Error(
            createData?.message || "Không thể tạo cuộc trò chuyện",
          );
        }

        if (Array.isArray(createData?.items) && createData.items.length > 0) {
          conversation = createData.items[0];
        } else {
          conversation = createData?.data ||
            createData || {
              conversationId: createData?.conversationId,
              customerId: order.customerId,
              ownerId,
            };
        }
      }

      if (!conversation?.conversationId) {
        throw new Error("Không tìm thấy conversationId.");
      }

      const messageRes = await fetch(`${API_URL}/api/message`, {
        headers: {
          accept: "*/*",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const messageData = await messageRes.json().catch(() => ({}));

      if (!messageRes.ok) {
        throw new Error(messageData?.message || "Không thể tải tin nhắn");
      }

      const allMessages = Array.isArray(messageData?.items)
        ? messageData.items
        : [];

      const messages = allMessages
        .filter(
          (item) =>
            Number(item.conversationId) === Number(conversation.conversationId),
        )
        .sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));

      setActiveConversation(conversation);
      setChatMessages(messages);
      setOpenChat(true);
    } catch (err) {
      setChatError(err.message || "Không thể mở đoạn chat");
      setOpenChat(true);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const content = chatInput.trim();

    if (!content || !activeConversation?.conversationId || !ownerId) return;

    setSendingMessage(true);
    setChatError("");

    try {
      const res = await fetch(`${API_URL}/api/message`, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          conversationId: Number(activeConversation.conversationId),
          senderId: Number(ownerId),
          content,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Không thể gửi tin nhắn");
      }

      const newMessage = data?.data ||
        data || {
          messageId: Date.now(),
          conversationId: activeConversation.conversationId,
          senderId: ownerId,
          content,
          senderName: activeConversation.ownerName || "Bạn",
          sentAt: new Date().toISOString(),
        };

      setChatMessages((prev) => [...prev, newMessage]);
      setChatInput("");
    } catch (err) {
      setChatError(err.message || "Không thể gửi tin nhắn");
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F2EA] font-main">
      <Sidebar onExpandChange={setSbExpanded} />

      <div
        className={`min-h-screen transition-[margin] duration-300 ease-in-out ${
          sbExpanded ? "ml-72" : "ml-20"
        }`}
      >
        <Topbar
          breadcrumb={
            <>
              <span className="text-gray-400">QUẢN LÝ</span>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-[#2F3A67] font-bold">
                ĐƠN HÀNG CHỜ DUYỆT
              </span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm đơn hàng"
          onMailClick={() =>
            selectedOrder ? openCustomerChat(selectedOrder) : setOpenChat(true)
          }
        />

        <main className="px-7 py-6">
          <div className="rounded-[28px] border border-[#ECE7DF] bg-white px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm text-[#8DA1C1]">Hàng đợi phê duyệt</div>
                <div className="mt-1 text-3xl font-bold text-[#2F3A67]">
                  {orders.length} đơn chờ duyệt
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start xl:h-[calc(100vh-210px)]">
            <section className="min-h-0 xl:h-full flex flex-col">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[24px] font-bold text-[#2F3A67]">
                    Đơn đang chờ duyệt
                  </h2>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#D6DFEF] bg-white px-4 py-2 text-sm font-medium text-[#8DA1C1] hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4" />
                  Lọc
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar space-y-3 pr-1">
                {loading ? (
                  <div className="rounded-2xl bg-white p-5 text-sm text-gray-500">
                    Đang tải đơn hàng...
                  </div>
                ) : error ? (
                  <div className="rounded-2xl bg-white p-5 text-sm text-red-500">
                    {error}
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="rounded-2xl bg-white p-5 text-sm text-gray-500">
                    Không có đơn hàng chờ duyệt.
                  </div>
                ) : (
                  filteredOrders.map((order) => {
                    const detail = order.orderDetails?.[0];
                    const active = selectedOrder?.orderId === order.orderId;
                    const firstImage = getFirstImage(
                      detail?.menuSnapshot?.imgUrl,
                    );

                    return (
                      <button
                        key={order.orderId}
                        type="button"
                        onClick={() => setSelectedOrderId(order.orderId)}
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                          active
                            ? "border-[#2F3A67] bg-[#F8FAFC] shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                            : "border-[#ECEFF5] bg-white hover:border-[#D9E4F5]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-14 w-14 overflow-hidden rounded-2xl bg-[#F6F7FB] shrink-0 ring-1 ring-[#EEF2F7]">
                            {firstImage ? (
                              <img
                                src={firstImage}
                                alt={detail?.menuName || "menu"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                                Không ảnh
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-bold text-[#2F3A67]">
                                #{String(order.orderId).padStart(3, "0")}
                              </div>
                              <StatusBadge type="order" status={order.status} />
                            </div>

                            <div className="mt-1 text-base font-semibold text-[#2B2B2B] truncate">
                              {order.customerName || "--"}
                            </div>

                            <div className="mt-1 text-sm text-[#8DA1C1] truncate">
                              {detail?.menuName || "--"} •{" "}
                              {order.orderDetails?.length || 0} tiệc
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-3">
                              <div className="min-w-0 text-xs text-[#6B7280] truncate">
                                {detail?.address || "--"}
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCustomerChat(order);
                                }}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-[#6B8FFB] hover:bg-[#dfeaff]"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section className="min-h-0 xl:h-full overflow-y-auto hide-scrollbar pr-1">
              {!selectedOrder || !selectedDetail ? (
                <div className="rounded-2xl bg-white p-6 text-sm text-gray-500">
                  Chọn một đơn hàng để xem chi tiết.
                </div>
              ) : (
                <OrderDetailPanel
                  order={selectedOrder}
                  detail={selectedDetail}
                  actionLoading={actionLoading}
                  message={message}
                  error={error}
                  onApprove={handleApproveOrder}
                  onReject={handleRejectOrder}
                  openRejectModal={openRejectModal}
                  setOpenRejectModal={setOpenRejectModal}
                  rejectReason={rejectReason}
                  setRejectReason={setRejectReason}
                  setSelectedOrderDetailId={setSelectedOrderDetailId}
                  onOpenChat={openCustomerChat}
                />
              )}
            </section>
          </div>
        </main>
      </div>

      <ChatPanel
        open={openChat}
        onClose={() => setOpenChat(false)}
        conversation={activeConversation}
        messages={chatMessages}
        loading={chatLoading}
        error={chatError}
        input={chatInput}
        setInput={setChatInput}
        onSend={handleSendMessage}
        sending={sendingMessage}
        currentUserId={ownerId}
      />
    </div>
  );
}

function OrderDetailPanel({
  order,
  detail,
  actionLoading,
  message,
  error,
  onApprove,
  onReject,
  openRejectModal,
  setOpenRejectModal,
  rejectReason,
  setRejectReason,
  setSelectedOrderDetailId,
  onOpenChat,
}) {
  const orderDetails = Array.isArray(order?.orderDetails)
    ? order.orderDetails
    : [];
  const hasMultipleDetails = orderDetails.length > 1;

  const menuSnapshot = detail?.menuSnapshot;
  const serviceSnapshot = detail?.serviceSnapshot;
  const firstImage = getFirstImage(menuSnapshot?.imgUrl);
  const mapSrc = getGoogleMapEmbedUrl(detail?.address);
  const detailStatus = Number(detail?.status ?? 1);
  const statusSteps = buildOrderDetailStatusSteps(detailStatus);
  const menuDishes = Array.isArray(menuSnapshot?.dishes)
    ? menuSnapshot.dishes
    : [];
  const menuBasePrice = Number(menuSnapshot?.basePrice || 0);
  const serviceTotal = Array.isArray(serviceSnapshot?.services)
    ? serviceSnapshot.services.reduce(
        (sum, s) => sum + Number(s.basePrice || 0) * Number(s.quantity || 1),
        0,
      )
    : 0;
  const extraCost = Number(detail?.extraChargeCost || 0);
  const [openMenu, setOpenMenu] = React.useState(false);

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-[#ECE7DF] bg-white p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mt-2 text-[34px] leading-tight font-bold text-[#2B2B2B]">
              {order.customerName || "--"}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#8DA1C1]">
              <span>#{String(order.orderId).padStart(3, "0")}</span>
              <span>•</span>
              <span>
                {formatDateTime(detail?.startTime || order.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <StatusBadge type="order" status={order.status} />

            <button
              type="button"
              onClick={() => onOpenChat(order)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#DCE6F7] px-4 py-2 text-sm text-[#6B8FFB] hover:bg-[#F8FBFF]"
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[#FDE7C7] bg-[#FFF9F2] px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFEAD5] text-[#E8712E]">
              <AlertTriangle className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#B08968]">
                Lưu ý khi duyệt đơn
              </div>

              <div className="mt-1 text-sm leading-6 text-[#5B4636] whitespace-pre-wrap break-words">
                Kiểm tra thời gian tổ chức, địa chỉ, số lượng khách, menu và số
                tiền cọc trước khi xác nhận.
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasMultipleDetails ? (
        <div className="rounded-[24px] border border-[#ECEFF5] bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-[#8DA1C1]">
                Party items
              </div>
              <div className="mt-1 text-lg font-semibold text-[#2F3A67]">
                Danh sách tiệc
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {orderDetails.map((item, index) => {
              const active = item.orderDetailId === detail?.orderDetailId;

              return (
                <button
                  key={item.orderDetailId}
                  type="button"
                  onClick={() => setSelectedOrderDetailId(item.orderDetailId)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-[#2F3A67] bg-[#F8FAFC]"
                      : "border-[#E5E7EB] bg-white hover:bg-[#FAFAFA]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-[#2F3A67]">
                        Tiệc {index + 1}
                      </div>
                      <div className="mt-1 text-sm text-[#8DA1C1]">
                        {item.menuName || "--"} •{" "}
                        {item.partyCategoryName || "--"}
                      </div>
                      <div className="mt-1 text-sm text-[#2B2B2B]">
                        {formatDateTime(item.startTime)}
                      </div>
                    </div>

                    <StatusBadge type="orderDetail" status={item.status} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="sticky top-4 z-10 rounded-2xl border border-[#E5E7EB] bg-white/95 backdrop-blur px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[#2F3A67]">
              Quyết định đơn hàng
            </div>
            <div className="text-xs text-[#8DA1C1]">
              Xác nhận thông tin trước khi duyệt hoặc từ chối
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onApprove}
              disabled={actionLoading === "approve"}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2F855A] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              {actionLoading === "approve" ? "Đang duyệt..." : "Duyệt đơn"}
            </button>

            <button
              type="button"
              onClick={() => setOpenRejectModal(true)}
              disabled={actionLoading === "reject"}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D64545] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              <Ban className="h-4 w-4" />
              {actionLoading === "reject" ? "Đang từ chối..." : "Từ chối"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-5">
        <div className="space-y-5">
          <div className="rounded-[24px] border border-[#ECEFF5] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="mt-1 text-lg font-semibold text-[#2F3A67]">
                  Menu
                </div>
              </div>

              <div className="text-xs font-medium text-[#8DA1C1]">
                {menuDishes.length} món
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-5 items-start">
              <div className="h-[180px] overflow-hidden rounded-2xl bg-[#F5F5F5] border border-[#F1F2F6]">
                {firstImage ? (
                  <img
                    src={firstImage}
                    alt={detail?.menuName || "menu"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">
                    Không có ảnh
                  </div>
                )}
              </div>

              <div>
                <div className="text-[24px] font-bold text-[#2F3A67]">
                  {detail?.menuName || menuSnapshot?.menuName || "--"}
                </div>

                <div className="mt-2 text-sm text-[#8DA1C1]">
                  {detail?.partyCategoryName || "--"}
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoBox
                    icon={<Users className="h-4 w-4" />}
                    label="Số khách"
                    value={`${detail?.numberOfGuests || 0} khách`}
                  />
                  <InfoBox
                    icon={<Wallet className="h-4 w-4" />}
                    label="Giá menu"
                    value={formatPrice(menuBasePrice)}
                  />
                  <InfoBox
                    icon={<Clock3 className="h-4 w-4" />}
                    label="Bắt đầu"
                    value={formatDateTime(detail?.startTime)}
                  />
                  <InfoBox
                    icon={<Clock3 className="h-4 w-4" />}
                    label="Kết thúc"
                    value={formatDateTime(detail?.endTime)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 w-full rounded-2xl border border-[#FDE7C7] bg-[#FFF9F2] px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFEAD5] text-[#E8712E]">
                  <ClipboardList className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#B08968]">
                    Ghi chú tiệc
                  </div>

                  <div className="mt-1 text-sm leading-6 text-[#5B4636] whitespace-pre-wrap break-words">
                    {detail?.noteOrderDetail ||
                      "Không có ghi chú riêng cho tiệc này."}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpenMenu((prev) => !prev)}
              className="mt-5 w-full rounded-2xl border border-[#EEF2F7] bg-[#FAFBFD] px-4 py-4 text-left transition hover:border-[#D9E4F5] hover:bg-[#F7F9FC]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-medium uppercase tracking-wide text-[#8DA1C1]">
                    Tên menu
                  </div>
                  <div className="mt-1 text-base font-semibold text-[#2B2B2B] break-words">
                    {detail?.menuName || menuSnapshot?.menuName || "--"}
                  </div>
                </div>

                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#8DA1C1] ring-1 ring-[#EEF2F7] transition-transform duration-200 ${
                    openMenu ? "rotate-180" : ""
                  }`}
                >
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </button>

            {openMenu ? (
              <div className="mt-4 space-y-3">
                {menuDishes.length > 0 ? (
                  menuDishes.map((dish, index) => (
                    <div
                      key={dish.dishId || index}
                      className="flex items-center gap-3 rounded-2xl border border-[#F1F2F6] bg-[#FFFDFC] px-4 py-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF1E8] text-[#E8712E]">
                        <ChefHat className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[#2B2B2B] break-words">
                          {dish.dishName}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl bg-[#FAFBFD] px-4 py-3 text-sm text-gray-500">
                    Không có món trong menu.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-[#ECEFF5] bg-white p-5">
            <div className="mt-1 text-lg font-semibold text-[#2F3A67] mb-4">
              Dịch vụ đi kèm
            </div>

            {Array.isArray(serviceSnapshot?.services) &&
            serviceSnapshot.services.length > 0 ? (
              <div className="space-y-3">
                {serviceSnapshot.services.map((service) => (
                  <div
                    key={service.serviceId}
                    className="flex items-center justify-between rounded-xl bg-[#F8F5F1] px-4 py-3"
                  >
                    <div>
                      <div className="font-medium text-[#2B2B2B]">
                        {service.serviceName}
                      </div>
                      <div className="text-sm text-[#8DA1C1]">
                        Số lượng: {service.quantity || 1}
                      </div>
                    </div>
                    <div className="font-semibold text-[#2F3A67]">
                      {formatPrice(service.basePrice)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Không có dịch vụ đi kèm.
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-[#ECEFF5] bg-white p-5">
            <div className="mt-1 text-lg font-semibold text-[#2F3A67] mb-4">
              Thông tin thanh toán
            </div>

            <div className="space-y-2">
              <PaymentRow
                label="Menu"
                value={menuBasePrice * Number(detail?.numberOfGuests || 0)}
              />
              <PaymentRow label="Dịch vụ đi kèm" value={serviceTotal} />
              {extraCost > 0 && (
                <PaymentRow label="Chi phí phát sinh" value={extraCost} />
              )}

              <div className="pt-2 mt-2 border-t border-[#F1F2F6]">
                <PaymentRow
                  label="Tổng tiền tiệc"
                  value={detail?.totalPrice}
                  highlight
                />
              </div>

              <div className="pt-2 mt-2 border-t border-[#F1F2F6]">
                <PaymentRow label="Tổng đơn" value={order?.totalPrice} />
                <PaymentRow label="Đã đặt cọc" value={order?.depositAmount} />
                <PaymentRow
                  label="Còn lại"
                  value={order?.remainingAmount}
                  highlight
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[24px] border border-[#ECEFF5] bg-white p-5">
            <div className="mt-1 text-lg font-semibold text-[#2F3A67] mb-4">
              Địa điểm tổ chức
            </div>

            <div className="h-[280px] overflow-hidden rounded-2xl bg-[#F5F5F5]">
              {mapSrc ? (
                <iframe
                  title="Google Map"
                  src={mapSrc}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">
                  Không có bản đồ
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2 text-[#6B8FFB]">
                <MapPin className="h-4 w-4" />
                <span className="font-medium text-[#2F3A67]">
                  {detail?.address || "--"}
                </span>
              </div>
              <div className="mt-1 text-xs text-[#B4BED1]">
                {formatDateTime(detail?.startTime)}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#ECEFF5] bg-white p-5">
            <div className="mt-1 text-lg font-semibold text-[#2F3A67] mb-4">
              Trạng thái tiệc
            </div>

            <div className="mb-4">
              <StatusBadge type="orderDetail" status={detailStatus} />
            </div>

            <div className="space-y-4">
              {statusSteps.map((step, index) => (
                <OrderStatusStep
                  key={step.key}
                  title={step.title}
                  active={step.active}
                  last={index === statusSteps.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {openRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="text-lg font-semibold text-[#2F3A67] mb-2">
              Lý do từ chối
            </div>
            <div className="text-sm text-[#8DA1C1] mb-4">
              Lý do sẽ được lưu vào ghi chú đơn hàng và gửi cho khách hàng.
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              className="w-full rounded-2xl border border-[#E5E7EB] p-4 text-sm outline-none focus:border-red-400"
              rows={5}
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setOpenRejectModal(false)}
                className="px-4 py-2 text-sm rounded-xl border border-[#D6DFEF]"
              >
                Hủy
              </button>

              <button
                onClick={onReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm rounded-xl bg-[#D64545] text-white disabled:opacity-50"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <div className="rounded-xl bg-[#F8F5F1] px-4 py-3">
      <div className="flex items-center gap-2 text-[#8DA1C1] text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 font-medium text-[#2B2B2B]">{value}</div>
    </div>
  );
}

function PaymentRow({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="text-sm text-[#6B7280]">{label}</div>
      <div
        className={`text-sm font-semibold ${
          highlight ? "text-[#E54B2D]" : "text-[#2B2B2B]"
        }`}
      >
        {formatPrice(value)}
      </div>
    </div>
  );
}

function OrderStatusStep({ title, active, last }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold ${
            active
              ? "bg-[#E9F1FF] text-[#3B82F6]"
              : "bg-[#F3F4F6] text-[#9CA3AF]"
          }`}
        >
          {active ? "✓" : "•"}
        </div>

        {!last ? (
          <div
            className={`mt-2 h-10 w-[2px] ${
              active ? "bg-[#BFDBFE]" : "bg-[#E5E7EB]"
            }`}
          />
        ) : null}
      </div>

      <div className={`pt-1 ${active ? "text-[#2F3A67]" : "text-[#9CA3AF]"}`}>
        {title}
      </div>
    </div>
  );
}

function StatusBadge({ status, type = "order" }) {
  const map =
    type === "orderDetail" ? ORDER_DETAIL_STATUS_MAP : ORDER_STATUS_MAP;

  const item = map[Number(status)] || {
    label: `Trạng thái ${status}`,
    className: "bg-[#F3F4F6] text-[#374151]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
}

function buildOrderDetailStatusSteps(status) {
  const value = Number(status);

  if (value === 3) {
    return [
      { key: "pending", title: "Chờ duyệt", active: true },
      { key: "rejected", title: "Từ chối", active: true },
    ];
  }

  if (value === 7) {
    return [
      { key: "pending", title: "Chờ duyệt", active: true },
      { key: "approved", title: "Đã duyệt", active: true },
      { key: "cancelled", title: "Đã hủy", active: true },
    ];
  }

  return [
    { key: "pending", title: "Chờ duyệt", active: value >= 1 },
    { key: "approved", title: "Đã duyệt", active: value >= 2 },
    { key: "preparing", title: "Đang chuẩn bị", active: value >= 4 },
    { key: "inProgress", title: "Đang thực hiện", active: value >= 5 },
    { key: "completed", title: "Hoàn thành", active: value >= 6 },
  ];
}

function getFirstImage(imgUrl) {
  if (Array.isArray(imgUrl) && imgUrl.length > 0) return imgUrl[0];
  if (typeof imgUrl === "string" && imgUrl.trim()) return imgUrl;
  return "";
}

function getGoogleMapEmbedUrl(address) {
  if (!address) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`;
}

function formatPrice(value) {
  const number = Number(value || 0);
  return `${number.toLocaleString("vi-VN")} VNĐ`;
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("vi-VN");
}

function formatTime(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
