import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ChatPanel from "@/components/ChatPanel";
import API_URL from "@/config/api";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Filter,
  MapPin,
  Phone,
  CalendarDays,
  Save,
  ChefHat,
  UtensilsCrossed,
  MessageCircle,
  Send,
  X,
  ChevronDown,
  Users,
  Wallet,
  Clock3,
} from "lucide-react";

export default function OwnerTrackingOrder() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [openChat, setOpenChat] = React.useState(false);

  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [selectedOrderId, setSelectedOrderId] = React.useState(null);
  const [selectedOrderDetailId, setSelectedOrderDetailId] =
    React.useState(null);
  const [search, setSearch] = React.useState("");

  const [staffGroups, setStaffGroups] = React.useState([]);
  const [loadingStaffGroups, setLoadingStaffGroups] = React.useState(false);
  const [selectedStaffGroupId, setSelectedStaffGroupId] = React.useState("");
  const [assigning, setAssigning] = React.useState(false);
  const [activeConversation, setActiveConversation] = React.useState(null);
  const [chatMessages, setChatMessages] = React.useState([]);
  const [chatLoading, setChatLoading] = React.useState(false);
  const [chatError, setChatError] = React.useState("");
  const [sendingMessage, setSendingMessage] = React.useState(false);
  const [chatInput, setChatInput] = React.useState("");
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/order`, {
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
      const trackingOrders = items.filter((item) => Number(item.status) !== 1);

      setOrders(trackingOrders);

      if (trackingOrders.length > 0) {
        setSelectedOrderId((prev) => {
          const exists = trackingOrders.some((item) => item.orderId === prev);
          return exists ? prev : trackingOrders[0].orderId;
        });
      } else {
        setSelectedOrderId(null);
        setSelectedOrderDetailId(null);
      }
    } catch (err) {
      setError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [token]);
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
  const fetchStaffGroups = React.useCallback(async () => {
    setLoadingStaffGroups(true);

    try {
      const res = await fetch(`${API_URL}/api/staff-group`, {
        headers: {
          accept: "*/*",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải danh sách nhóm");
      }

      const items = Array.isArray(data?.items) ? data.items : [];
      setStaffGroups(items.filter((x) => Number(x.status) === 1));
    } catch (err) {
      setError(err.message || "Không thể tải danh sách nhóm");
    } finally {
      setLoadingStaffGroups(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  React.useEffect(() => {
    fetchStaffGroups();
  }, [fetchStaffGroups]);
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

  React.useEffect(() => {
    setSelectedStaffGroupId(
      selectedDetail?.staffGroupId ? String(selectedDetail.staffGroupId) : "",
    );
  }, [selectedDetail]);

  const stats = React.useMemo(
    () => [
      {
        title: "Chờ phân công",
        value: orders.filter((o) => Number(o.status) === 2).length,
        icon: <CheckCircle2 className="h-5 w-5" />,
        bg: "bg-green-100",
        text: "text-green-600",
      },
      {
        title: "Đang xử lý",
        value: orders.filter((o) => [4, 5, 6].includes(Number(o.status)))
          .length,
        icon: <ClipboardList className="h-5 w-5" />,
        bg: "bg-blue-100",
        text: "text-blue-600",
      },
      {
        title: "Hoàn thành",
        value: orders.filter((o) => Number(o.status) === 7).length,
        icon: <CheckCircle2 className="h-5 w-5" />,
        bg: "bg-emerald-100",
        text: "text-emerald-600",
      },
      {
        title: "Từ chối / Hủy",
        value: orders.filter((o) => [3, 8].includes(Number(o.status))).length,
        icon: <XCircle className="h-5 w-5" />,
        bg: "bg-rose-100",
        text: "text-rose-600",
      },
    ],
    [orders],
  );

  const handleAssignStaffGroup = async () => {
    if (!selectedOrder || !selectedDetail) return;

    if (Number(selectedOrder.status) !== 2) {
      setError("Chỉ gán nhóm cho đơn đã được duyệt.");
      return;
    }

    if (!selectedStaffGroupId) {
      setError("Vui lòng chọn nhóm phụ trách.");
      return;
    }

    setAssigning(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(
        `${API_URL}/api/order/${selectedOrder.orderId}/assign-staff-group`,
        {
          method: "PUT",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            orderDetailId: selectedDetail.orderDetailId,
            staffGroupId: Number(selectedStaffGroupId),
          }),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Gán nhóm phụ trách thất bại");
      }

      setMessage("Gán nhóm phụ trách thành công.");
      await fetchOrders();
    } catch (err) {
      setError(err.message || "Gán nhóm phụ trách thất bại");
    } finally {
      setAssigning(false);
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
                THEO DÕI ĐƠN HÀNG
              </span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm đơn hàng"
          onMailClick={() => setOpenChat(true)}
        />

        <main className="px-7 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {stats.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-white px-6 py-5 flex items-center gap-4"
              >
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center ${item.bg} ${item.text}`}
                >
                  {item.icon}
                </div>

                <div>
                  <div className="text-sm text-[#8DA1C1]">{item.title}</div>
                  <div className="text-3xl font-bold text-[#1F2937]">
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h1 className="text-[20px] font-bold text-[#E54B2D]">
              Tất cả Đơn hàng theo dõi
            </h1>
          </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start xl:h-[calc(100vh-220px)]">
            <section className="min-h-0 xl:h-full flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[28px] font-bold text-[#2F3A67]">Tất cả</h2>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#D6DFEF] bg-white px-4 py-2 text-sm font-medium text-[#8DA1C1] hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4" />
                  Lọc
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar space-y-4 pr-1">
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
                    Không có đơn hàng theo dõi.
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
                        className={`w-full rounded-3xl border bg-white p-5 text-left transition-all duration-200 ${
                          active
                            ? "border-[#7CA3FF] shadow-[0_8px_30px_rgba(96,133,255,0.16)]"
                            : "border-[#EEF2F7] hover:border-[#D9E4F5] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8DA1C1]">
                              Đơn hàng
                            </div>
                            <div className="mt-1 text-base font-bold text-[#2F3A67]">
                              #{String(order.orderId).padStart(3, "0")}
                            </div>
                          </div>

                          <OrderBadge status={order.status} />
                        </div>

                        <div className="mt-4 grid grid-cols-[88px_minmax(0,1fr)] gap-4 items-start">
                          <div className="h-[88px] w-[88px] overflow-hidden rounded-2xl bg-[#F6F7FB] ring-1 ring-[#EEF2F7]">
                            {firstImage ? (
                              <img
                                src={firstImage}
                                alt={detail?.menuName || "menu"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[11px] text-gray-400">
                                Không ảnh
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="text-[28px] leading-tight font-bold text-[#2B2B2B] break-words">
                              {order.customerName || "--"}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <div className="inline-flex items-center rounded-xl bg-[#F5F7FB] px-3 py-2 text-sm font-medium text-[#42526B]">
                                {order.orderDetails?.length || 0} tiệc
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-[#FAFBFD] px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-[#6B8FFB]">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span className="text-xs font-medium text-[#9AA9C2]">
                                  Địa chỉ
                                </span>
                              </div>

                              <div className="mt-1 line-clamp-2 text-sm leading-6 text-[#2F3A67]">
                                {detail?.address || "--"}
                              </div>
                            </div>

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-[#6B8FFB]">
                              <MessageCircle className="h-4 w-4" />
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
                  assigning={assigning}
                  message={message}
                  error={error}
                  staffGroups={staffGroups}
                  loadingStaffGroups={loadingStaffGroups}
                  selectedStaffGroupId={selectedStaffGroupId}
                  setSelectedStaffGroupId={setSelectedStaffGroupId}
                  setSelectedOrderDetailId={setSelectedOrderDetailId}
                  onAssign={handleAssignStaffGroup}
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
  assigning,
  message,
  error,
  staffGroups,
  loadingStaffGroups,
  selectedStaffGroupId,
  setSelectedStaffGroupId,
  setSelectedOrderDetailId,
  onAssign,
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
  const canAssignStaffGroup = Number(order.status) === 2;

  const detailStatus = Number(detail?.status ?? 1);
  const statusSteps = buildOrderDetailStatusSteps(detailStatus);

  const menuDishes = Array.isArray(menuSnapshot?.dishes)
    ? menuSnapshot.dishes
    : [];

  const extraDishes = Array.isArray(detail?.customDishSnapshot?.customDishes)
    ? detail.customDishSnapshot.customDishes
    : Array.isArray(detail?.extraDishes)
      ? detail.extraDishes
      : Array.isArray(detail?.customDishes)
        ? detail.customDishes
        : Array.isArray(detail?.additionalDishes)
          ? detail.additionalDishes
          : [];
  const menuBasePrice = Number(menuSnapshot?.basePrice || 0);

  const [openMenu, setOpenMenu] = React.useState(false);
  const serviceTotal = Array.isArray(serviceSnapshot?.services)
    ? serviceSnapshot.services.reduce(
        (sum, s) => sum + Number(s.basePrice || 0) * Number(s.quantity || 1),
        0,
      )
    : 0;

  const customDishTotal = Array.isArray(
    detail?.customDishSnapshot?.customDishes,
  )
    ? detail.customDishSnapshot.customDishes.reduce(
        (sum, d) => sum + Number(d.totalAmount || 0),
        0,
      )
    : 0;
  const extraCost = Number(detail?.extraChargeCost || 0);
  const assignedStaffGroup =
    staffGroups.find(
      (group) => Number(group.staffGroupId) === Number(detail?.staffGroupId),
    ) ||
    staffGroups.find(
      (group) => Number(group.staffGroupId) === Number(selectedStaffGroupId),
    ) ||
    null;
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#2F3A67]">
              Đơn hàng #{String(order.orderId).padStart(3, "0")}
            </div>

            <div className="mt-2 text-[38px] leading-none font-bold text-[#2B2B2B]">
              {order.customerName || "--"}
            </div>

            <div className="mt-2 text-xs text-[#8DA1C1]">
              {formatTime(detail?.startTime || order.createdAt)} &nbsp; | &nbsp;
              {formatDate(detail?.startTime || order.createdAt)}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <OrderBadge status={order.status} />

            <button
              type="button"
              onClick={() => onOpenChat(order)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#DCE6F7] px-4 py-2 text-sm text-[#6B8FFB] hover:bg-[#F8FBFF]"
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-[#DCE6F7] px-4 py-2 text-sm text-[#6B8FFB] hover:bg-[#F8FBFF]"
            >
              <CalendarDays className="h-4 w-4" />
              Lịch trình
            </button>
          </div>
        </div>

        <div className="mt-4 w-full rounded-2xl border border-[#F1E7D8] bg-[#FFF9F2] px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFEAD5] text-[#E8712E]">
              <ClipboardList className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#B08968]">
                Ghi chú đơn hàng
              </div>

              <div className="mt-1 text-sm leading-6 text-[#5B4636] whitespace-pre-wrap break-words">
                {order.noteOrder || "Không có ghi chú chung cho đơn hàng."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasMultipleDetails ? (
        <div className="rounded-2xl bg-white p-5">
          <div className="text-lg font-semibold text-[#2F3A67] mb-4">
            Danh sách tiệc
          </div>

          <div className="space-y-3">
            {orderDetails.map((item, index) => {
              const active = item.orderDetailId === detail?.orderDetailId;

              return (
                <button
                  key={item.orderDetailId}
                  type="button"
                  onClick={() => setSelectedOrderDetailId(item.orderDetailId)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-[#7CA3FF] bg-[#F8FBFF]"
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

                    <OrderDetailBadge status={item.status} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[30px] font-bold text-[#2F3A67]">Chi tiết</h3>

          {canAssignStaffGroup ? (
            <button
              type="button"
              onClick={onAssign}
              disabled={assigning}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2F3A67] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {assigning ? "Đang gán..." : "Gán nhóm phụ trách"}
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-5">
          <div className="space-y-5">
            <div className="rounded-2xl bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold text-[#2F3A67]">Menu</div>
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
              <div className="mt-5 rounded-2xl border border-[#FDE7C7] bg-[#FFF9F2] px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFEAD5] text-[#E8712E]">
                    <ClipboardList className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#B08968]">
                        Ghi chú tiệc
                      </span>
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

            {Number(detail?.type) === 2 ? (
              <div className="rounded-2xl bg-white p-5">
                <div className="text-lg font-semibold text-[#2F3A67] mb-4">
                  Món lẻ khách gọi thêm
                </div>

                {extraDishes.length > 0 ? (
                  <div className="space-y-3">
                    {extraDishes.map((dish, index) => (
                      <div
                        key={dish.dishId || dish.id || index}
                        className="flex items-center gap-3 rounded-xl bg-[#F8F5F1] px-4 py-3"
                      >
                        <div className="h-10 w-10 rounded-full bg-[#FFF1E8] flex items-center justify-center text-[#E8712E] overflow-hidden">
                          {dish.img ? (
                            <img
                              src={dish.img}
                              alt={dish.dishName || "dish"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UtensilsCrossed className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-[#2B2B2B]">
                            {dish.dishName || dish.name || "Món lẻ"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Chưa có món lẻ gọi thêm.
                  </div>
                )}
              </div>
            ) : null}

            <div className="rounded-2xl bg-white p-5">
              <div className="text-lg font-semibold text-[#2F3A67] mb-4">
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Không có dịch vụ đi kèm.
                </div>
              )}
            </div>
            <div className="rounded-2xl bg-white p-5">
              <div className="text-lg font-semibold text-[#2F3A67] mb-4">
                Thông tin thanh toán
              </div>

              <div className="space-y-2">
                <div className="py-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-[#6B7280]">Menu</div>
                    <div className="text-sm font-semibold text-[#2B2B2B]">
                      {formatPrice(
                        menuBasePrice * (detail?.numberOfGuests || 0),
                      )}
                    </div>
                  </div>

                  <div className="mt-2 pl-3 border-l border-[#E5E7EB]">
                    <div className="flex items-center justify-between text-xs text-[#6B7280]">
                      <span className="truncate">
                        {menuSnapshot?.menuName || detail?.menuName || "Menu"}
                      </span>
                      <span className="text-right whitespace-nowrap">
                        {formatPrice(menuBasePrice)} x{" "}
                        {detail?.numberOfGuests || 0} khách ={" "}
                        {formatPrice(
                          menuBasePrice * (detail?.numberOfGuests || 0),
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <PaymentGroup
                  label="Món lẻ"
                  total={customDishTotal}
                  items={detail?.customDishSnapshot?.customDishes || []}
                  type="dish"
                  guestCount={detail?.numberOfGuests || 0}
                />
                <PaymentGroup
                  label="Dịch vụ"
                  total={serviceTotal}
                  items={serviceSnapshot?.services || []}
                  type="service"
                />

                {extraCost > 0 && (
                  <PaymentRow label="Phát sinh" value={extraCost} />
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
            {(message || error) && (
              <div className="rounded-2xl bg-white p-5">
                {message ? (
                  <div className="text-sm text-green-600">{message}</div>
                ) : null}
                {error ? (
                  <div className="text-sm text-red-500">{error}</div>
                ) : null}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl bg-white p-5">
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
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5">
              <div className="text-lg font-semibold text-[#2F3A67] mb-4">
                Trạng thái tiệc
              </div>

              <div className="mb-4">
                <OrderDetailBadge status={detailStatus} />
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

            <div className="rounded-2xl bg-white p-5">
              <div className="text-lg font-semibold text-[#2F3A67] mb-3">
                Nhóm phụ trách
              </div>

              {canAssignStaffGroup ? (
                <>
                  <select
                    value={selectedStaffGroupId}
                    onChange={(e) => setSelectedStaffGroupId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-[#F8F5F1] px-4 py-3 text-sm outline-none"
                  >
                    <option value="">
                      {loadingStaffGroups
                        ? "Đang tải nhóm..."
                        : "Chưa phân công"}
                    </option>
                    {staffGroups.map((group) => (
                      <option
                        key={group.staffGroupId}
                        value={group.staffGroupId}
                      >
                        {group.staffGroupName}
                        {group.leaderName ? ` - ${group.leaderName}` : ""}
                      </option>
                    ))}
                  </select>

                  {assignedStaffGroup ? (
                    <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#FAFBFD] px-4 py-3">
                      <div className="text-xs text-[#8DA1C1]">
                        Đang phụ trách
                      </div>
                      <div className="mt-1 font-semibold text-[#2F3A67]">
                        {assignedStaffGroup.staffGroupName}
                      </div>
                      <div className="mt-1 text-sm text-[#6B7280]">
                        {assignedStaffGroup.leaderName
                          ? `Trưởng nhóm: ${assignedStaffGroup.leaderName}`
                          : "Chưa có thông tin trưởng nhóm"}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : assignedStaffGroup ? (
                <div className="rounded-xl border border-[#DCE6F7] bg-[#F8FBFF] px-4 py-4">
                  <div className="text-xs font-medium text-[#8DA1C1]">
                    Đang phụ trách
                  </div>
                  <div className="mt-1 text-base font-semibold text-[#2F3A67]">
                    {assignedStaffGroup.staffGroupName}
                  </div>
                  <div className="mt-1 text-sm text-[#6B7280]">
                    {assignedStaffGroup.leaderName
                      ? `Trưởng nhóm: ${assignedStaffGroup.leaderName}`
                      : "Chưa có thông tin trưởng nhóm"}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-4 py-4 text-sm text-[#8DA1C1]">
                  Chưa có nhóm phụ trách.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-xl bg-[#F8F5F1] px-4 py-3">
      <div className="text-xs text-[#8DA1C1]">{label}</div>
      <div className="mt-1 font-medium text-[#2B2B2B]">{value}</div>
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
function PaymentRow({ label, value, rightText, highlight = false }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="text-sm text-[#6B7280]">{label}</div>

      <div className="text-right whitespace-nowrap">
        {rightText ? (
          <span className="text-sm font-medium text-[#2B2B2B]">
            {rightText}
          </span>
        ) : (
          <span
            className={`text-sm font-semibold ${
              highlight ? "text-[#E54B2D]" : "text-[#2B2B2B]"
            }`}
          >
            {formatPrice(value)}
          </span>
        )}
      </div>
    </div>
  );
}
function PaymentGroup({ label, total, items, type, guestCount = 0 }) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-[#6B7280]">{label}</div>
        <div className="text-sm font-semibold text-[#2B2B2B]">
          {formatPrice(total)}
        </div>
      </div>

      {items.length > 0 && (
        <div className="mt-2 space-y-1 pl-3 border-l border-[#E5E7EB]">
          {items.map((item, index) => {
            if (type === "service") {
              const price = Number(item.basePrice || 0);
              const qty = Number(item.quantity || 1);
              const total = price * qty;

              return (
                <div
                  key={item.serviceId || index}
                  className="flex items-center justify-between text-xs text-[#6B7280]"
                >
                  <span className="truncate">{item.serviceName}</span>
                  <span>
                    {formatPrice(price)} x {qty} = {formatPrice(total)}
                  </span>
                </div>
              );
            }

            if (type === "dish") {
              const price = Number(item.unitPrice || 0);
              const total = Number(item.totalAmount || 0);

              return (
                <div
                  key={item.dishId || index}
                  className="flex items-center justify-between text-xs text-[#6B7280]"
                >
                  <span className="truncate">{item.dishName}</span>
                  <span>
                    {formatPrice(price)} x {guestCount} khách ={" "}
                    {formatPrice(total)}
                  </span>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
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

function OrderBadge({ status }) {
  const value = Number(status);

  const config = {
    1: {
      label: "Chờ duyệt",
      className: "bg-[#FEF3C7] text-[#B45309]",
    },
    2: {
      label: "Đã duyệt",
      className: "bg-[#DCFCE7] text-[#15803D]",
    },
    3: {
      label: "Đã từ chối",
      className: "bg-[#F3F4F6] text-[#6B7280]",
    },
    4: {
      label: "Đang xử lý",
      className: "bg-[#DBEAFE] text-[#1D4ED8]",
    },
    5: {
      label: "Hoàn thành",
      className: "bg-[#D1FAE5] text-[#047857]",
    },
    6: {
      label: "Đang chờ thanh toán",
      className: "bg-[#FEF3C7] text-[#B45309]",
    },
    7: {
      label: "Đã thanh toán",
      className: "bg-[#EDE9FE] text-[#6D28D9]",
    },
    8: {
      label: "Đã hủy",
      className: "bg-[#FEE2E2] text-[#B91C1C]",
    },
  };

  const item = config[value] || {
    label: `Trạng thái ${value}`,
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

function OrderDetailBadge({ status }) {
  const value = Number(status);

  const config = {
    1: {
      label: "Chờ duyệt",
      className: "bg-[#FEF3C7] text-[#B45309]",
    },
    2: {
      label: "Đã duyệt",
      className: "bg-[#DCFCE7] text-[#15803D]",
    },
    3: {
      label: "Từ chối",
      className: "bg-[#F3F4F6] text-[#6B7280]",
    },
    4: {
      label: "Chuẩn bị",
      className: "bg-[#DBEAFE] text-[#1D4ED8]",
    },
    5: {
      label: "Đang thực hiện",
      className: "bg-[#E0E7FF] text-[#4338CA]",
    },
    6: {
      label: "Hoàn thành",
      className: "bg-[#D1FAE5] text-[#047857]",
    },
    7: {
      label: "Đã hủy",
      className: "bg-[#FEE2E2] text-[#B91C1C]",
    },
  };

  const item = config[value] || {
    label: `Trạng thái ${value}`,
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
    { key: "preparing", title: "Chuẩn bị", active: value >= 4 },
    { key: "inProgress", title: "Đang thực hiện", active: value >= 5 },
    { key: "completed", title: "Hoàn thành", active: value >= 6 },
  ];
}

function getTypeLabel(type) {
  const value = Number(type);

  if (value === 1) return "Đặt theo menu";
  if (value === 2) return "Tùy chỉnh";
  return "--";
}

function getFirstImage(imgUrl) {
  if (Array.isArray(imgUrl) && imgUrl.length > 0) return imgUrl[0];
  if (typeof imgUrl === "string" && imgUrl.trim()) return imgUrl;
  return "";
}

function getGoogleMapEmbedUrl(address) {
  if (!address) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
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
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
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
