import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ChatPanel from "@/components/ChatPanel";
import API_URL from "@/config/api";
import {
  BookOpen,
  Filter,
  MapPin,
  Phone,
  FileDown,
  Wallet,
  Users,
  Check,
  Ban,
  Clock3,
} from "lucide-react";

export default function OwnerPendingOrder() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [openChat, setOpenChat] = React.useState(false);

  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selectedOrderId, setSelectedOrderId] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState("");
  const [message, setMessage] = React.useState("");

  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

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

      if (pendingOnly.length > 0 && !selectedOrderId) {
        setSelectedOrderId(pendingOnly[0].orderId);
      }
    } catch (err) {
      setError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [token, selectedOrderId]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter((order) => {
    const detail = order.orderDetails?.[0];
    const keyword = search.trim().toLowerCase();

    if (!keyword) return true;

    return (
      String(order.orderId).includes(keyword) ||
      String(order.customerName || "")
        .toLowerCase()
        .includes(keyword) ||
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

  const selectedOrder =
    filteredOrders.find((order) => order.orderId === selectedOrderId) ||
    filteredOrders[0] ||
    null;

  const stats = [
    {
      title: "Chờ duyệt",
      value: orders.length,
      icon: <BookOpen className="h-5 w-5" />,
      bg: "bg-cyan-100",
      text: "text-cyan-600",
    },
  ];

  const handleApproveOrder = async () => {
    if (!selectedOrder) return;

    setActionLoading("approve");
    setMessage("");
    setError("");

    try {
      const reviewRes = await fetch(
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

      const reviewData = await reviewRes.json().catch(() => ({}));

      if (!reviewRes.ok) {
        throw new Error(reviewData?.message || "Duyệt đơn thất bại");
      }

      setMessage("Duyệt đơn thành công.");
      setSelectedOrderId(null);
      await fetchOrders();
    } catch (err) {
      setError(err.message || "Duyệt đơn thất bại");
    } finally {
      setActionLoading("");
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder) return;

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
          body: JSON.stringify({ status: 3 }),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Từ chối đơn thất bại");
      }

      setMessage("Từ chối đơn thành công.");
      setSelectedOrderId(null);
      await fetchOrders();
    } catch (err) {
      setError(err.message || "Từ chối đơn thất bại");
    } finally {
      setActionLoading("");
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
              <span className="text-gray-400">ĐƠN HÀNG</span>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-[#2F3A67] font-bold">
                ĐƠN HÀNG CHỜ DUYỆT
              </span>
            </>
          }
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm"
          onMailClick={() => setOpenChat(true)}
          avatarSrc="https://gocnhobecon.com/wp-content/uploads/2025/08/meme-con-meo-cuoi.webp"
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
                        className={`w-full rounded-2xl border bg-white p-5 text-left transition ${
                          active
                            ? "border-[#7CA3FF] shadow-[0_0_0_2px_rgba(96,133,255,0.18)]"
                            : "border-transparent hover:border-[#E5E7EB]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm font-semibold text-[#2F3A67]">
                            Đơn hàng #{String(order.orderId).padStart(3, "0")}
                          </div>

                          <StatusBadge status={order.status} />
                        </div>

                        <div className="mt-4 grid grid-cols-[90px_1fr] gap-4 items-start">
                          <div className="h-[90px] w-[90px] overflow-hidden rounded-xl bg-[#F5F5F5]">
                            {firstImage ? (
                              <img
                                src={firstImage}
                                alt={detail?.menuName || "menu"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[11px] text-gray-400">
                                Không ảnh
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="text-[30px] leading-none font-bold text-[#2B2B2B]">
                              {order.customerName || "--"}
                            </div>

                            <div className="mt-2 text-xs text-[#8DA1C1] flex items-center gap-2">
                              <span>
                                {formatTime(
                                  detail?.startTime || order.createdAt,
                                )}
                              </span>
                              <span>|</span>
                              <span>
                                {formatDate(
                                  detail?.startTime || order.createdAt,
                                )}
                              </span>
                            </div>

                            <div className="mt-3 rounded-xl bg-[#F5F5F5] px-4 py-3 text-sm text-[#2B2B2B] flex items-center justify-between">
                              <span>
                                1 x {detail?.menuName || "Menu chưa xác định"}
                              </span>
                              <span>⌄</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-[#6B8FFB]">
                              <MapPin className="h-4 w-4" />
                              <span className="text-xs text-[#B4BED1]">
                                Địa chỉ
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-[#2F3A67] line-clamp-2">
                              {detail?.address || "--"}
                            </div>
                          </div>

                          <div className="h-9 w-9 shrink-0 rounded-full bg-[#E9F1FF] flex items-center justify-center text-[#6B8FFB]">
                            <Phone className="h-4 w-4" />
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section className="min-h-0 xl:h-full overflow-y-auto hide-scrollbar pr-1">
              {!selectedOrder ? (
                <div className="rounded-2xl bg-white p-6 text-sm text-gray-500">
                  Chọn một đơn hàng để xem chi tiết.
                </div>
              ) : (
                <OrderDetailPanel
                  order={selectedOrder}
                  actionLoading={actionLoading}
                  message={message}
                  error={error}
                  onApprove={handleApproveOrder}
                  onReject={handleRejectOrder}
                />
              )}
            </section>
          </div>
        </main>
      </div>

      <ChatPanel open={openChat} onClose={() => setOpenChat(false)} />
    </div>
  );
}

function OrderDetailPanel({
  order,
  actionLoading,
  message,
  error,
  onApprove,
  onReject,
}) {
  const detail = order.orderDetails?.[0];
  const menuSnapshot = detail?.menuSnapshot;
  const serviceSnapshot = detail?.serviceSnapshot;
  const firstImage = getFirstImage(menuSnapshot?.imgUrl);
  const mapSrc = getGoogleMapEmbedUrl(detail?.address);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
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

          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-[#DCE6F7] px-4 py-2 text-sm text-[#6B8FFB] hover:bg-[#F8FBFF]"
            >
              <FileDown className="h-4 w-4" />
              Xuất file
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[30px] font-bold text-[#2F3A67]">Chi Tiết</h3>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onApprove}
              disabled={actionLoading === "approve"}
              className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              {actionLoading === "approve" ? "Đang duyệt..." : "Duyệt đơn"}
            </button>

            <button
              type="button"
              onClick={onReject}
              disabled={actionLoading === "reject"}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              <Ban className="h-4 w-4" />
              {actionLoading === "reject" ? "Đang từ chối..." : "Từ chối"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-5">
          <div className="space-y-5">
            <div className="rounded-2xl bg-white p-5">
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

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <MiniInfo
                      label="Số khách"
                      value={`${detail?.numberOfGuests || 0} khách`}
                    />
                    <MiniInfo
                      label="Giá menu"
                      value={formatPrice(
                        menuSnapshot?.basePrice || order.totalPrice,
                      )}
                    />
                    <MiniInfo
                      label="Bắt đầu"
                      value={formatDateTime(detail?.startTime)}
                    />
                    <MiniInfo
                      label="Kết thúc"
                      value={formatDateTime(detail?.endTime)}
                    />
                  </div>

                  {Array.isArray(menuSnapshot?.dishes) &&
                  menuSnapshot.dishes.length > 0 ? (
                    <div className="mt-5">
                      <div className="text-sm font-semibold text-[#2F3A67] mb-2">
                        Món trong menu
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {menuSnapshot.dishes.map((dish) => (
                          <span
                            key={dish.dishId}
                            className="rounded-full bg-[#F8F5F1] px-3 py-2 text-sm text-[#2B2B2B]"
                          >
                            {dish.dishName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5">
              <div className="text-lg font-semibold text-[#2F3A67]">
                Chi tiết đơn hàng
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <PriceRow label="Tổng cộng" value={order.totalPrice} />
                <PriceRow label="Đặt cọc" value={order.depositAmount} />
                <PriceRow label="Còn lại" value={order.remainingAmount} />
                <PriceRow
                  label="Phụ phí"
                  value={detail?.extraChargeCost || 0}
                />
              </div>

              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="text-lg font-semibold text-[#2F3A67]">
                  Thanh toán
                </div>
                <div className="text-2xl font-bold text-[#2B2B2B]">
                  {formatPrice(order.remainingAmount)}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5">
              <div className="text-lg font-semibold text-[#2F3A67]">
                Thông tin tiệc
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#2F3A67]">
                <InfoBox
                  icon={<Users className="h-4 w-4" />}
                  label="Số khách"
                  value={`${detail?.numberOfGuests || 0} khách`}
                />
                <InfoBox
                  icon={<BookOpen className="h-4 w-4" />}
                  label="Loại tiệc"
                  value={detail?.partyCategoryName || "--"}
                />
                <InfoBox
                  icon={<Wallet className="h-4 w-4" />}
                  label="Menu"
                  value={detail?.menuName || "--"}
                />
                <InfoBox
                  icon={<Clock3Icon />}
                  label="Thời gian"
                  value={`${formatDateTime(detail?.startTime)} - ${formatTime(
                    detail?.endTime,
                  )}`}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5">
              <div className="text-lg font-semibold text-[#2F3A67]">
                Dịch vụ đi kèm
              </div>

              <div className="mt-4 space-y-3">
                {Array.isArray(serviceSnapshot?.services) &&
                serviceSnapshot.services.length > 0 ? (
                  serviceSnapshot.services.map((service) => (
                    <div
                      key={service.serviceId}
                      className="flex items-center justify-between rounded-xl bg-[#F8F5F1] px-4 py-3"
                    >
                      <div>
                        <div className="font-medium text-[#2B2B2B]">
                          {service.serviceName}
                        </div>
                        <div className="text-sm text-[#8DA1C1]">
                          SL: {service.quantity || 1}
                        </div>
                      </div>
                      <div className="font-semibold text-[#2F3A67]">
                        {formatPrice(service.basePrice)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">
                    Không có dịch vụ đi kèm.
                  </div>
                )}
              </div>
            </div>
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
                <div className="mt-1 text-xs text-[#B4BED1]">
                  {formatDateTime(detail?.startTime)}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5">
              <div className="text-lg font-semibold text-[#2F3A67] mb-4">
                Trạng thái đơn hàng
              </div>

              <div className="space-y-4">
                {buildOrderStatusSteps(order.status).map((step, index) => (
                  <OrderStatusStep
                    key={step.key}
                    title={step.title}
                    active={step.active}
                    last={
                      index === buildOrderStatusSteps(order.status).length - 1
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
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

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-xl bg-[#F8F5F1] px-4 py-3">
      <div className="text-xs text-[#8DA1C1]">{label}</div>
      <div className="mt-1 font-medium text-[#2B2B2B]">{value}</div>
    </div>
  );
}

function PriceRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#8DA1C1]">{label}</span>
      <span className="font-medium text-[#2B2B2B]">{formatPrice(value)}</span>
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
        {!last && (
          <div
            className={`mt-1 w-[2px] h-8 ${
              active ? "bg-[#BFDBFE]" : "bg-[#E5E7EB]"
            }`}
          />
        )}
      </div>

      <div className="pt-1">
        <div
          className={`font-medium ${
            active ? "text-[#2B2B2B]" : "text-[#9CA3AF]"
          }`}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const configMap = {
    1: {
      label: "Chờ duyệt",
      className: "bg-[#FFF2D9] text-[#D4A038]",
    },
    2: {
      label: "Đã duyệt",
      className: "bg-[#E8F7E8] text-[#5FB85F]",
    },
    3: {
      label: "Từ chối",
      className: "bg-[#FDE8E8] text-[#D9534F]",
    },
    4: {
      label: "Đang chuẩn bị",
      className: "bg-[#E8F1FF] text-[#4C7DDB]",
    },
    5: {
      label: "Đang thực hiện",
      className: "bg-[#EAF4FF] text-[#3B82F6]",
    },
    6: {
      label: "Thanh toán",
      className: "bg-[#F3E8FF] text-[#8B5CF6]",
    },
    7: {
      label: "Hoàn thành",
      className: "bg-[#DCFCE7] text-[#16A34A]",
    },
    8: {
      label: "Đã hủy",
      className: "bg-[#FEE2E2] text-[#DC2626]",
    },
  };

  const config = configMap[Number(status)] || {
    label: "Không xác định",
    className: "bg-gray-100 text-gray-500",
  };

  return (
    <span
      className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function Clock3Icon() {
  return <Clock3 className="h-4 w-4" />;
}

function buildOrderStatusSteps(currentStatus) {
  const status = Number(currentStatus);

  const steps = [
    { key: 1, title: "Chờ duyệt" },
    { key: 2, title: "Đã duyệt" },
    { key: 4, title: "Đang chuẩn bị" },
    { key: 5, title: "Đang thực hiện" },
    { key: 6, title: "Thanh toán" },
    { key: 7, title: "Hoàn thành" },
  ];

  if (status === 3) {
    return [
      { key: 1, title: "Chờ duyệt", active: true },
      { key: 3, title: "Từ chối", active: true },
    ];
  }

  if (status === 8) {
    return [
      { key: 1, title: "Chờ duyệt", active: true },
      { key: 2, title: "Đã duyệt", active: true },
      { key: 8, title: "Đã hủy", active: true },
    ];
  }

  return steps.map((step) => ({
    ...step,
    active: status >= step.key,
  }));
}

function formatPrice(price) {
  return `${Number(price || 0).toLocaleString("vi-VN")} VNĐ`;
}

function formatTime(dateString) {
  if (!dateString) return "--:--";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateString) {
  if (!dateString) return "--";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("vi-VN");
}

function formatDateTime(dateString) {
  if (!dateString) return "--";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getFirstImage(img) {
  if (Array.isArray(img) && img.length > 0) {
    return img[0];
  }

  if (typeof img === "string" && img.trim()) {
    return img;
  }

  return "";
}

function getGoogleMapEmbedUrl(address) {
  if (!address) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`;
}
