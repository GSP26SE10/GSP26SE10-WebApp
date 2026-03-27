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
  FileDown,
  Check,
  Ban,
  ChefHat,
  UtensilsCrossed,
  Wallet,
  Users,
  Clock3,
} from "lucide-react";

const ORDER_STATUS_MAP = {
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
    label: "Đang chuẩn bị",
    className: "bg-[#DBEAFE] text-[#1D4ED8]",
  },
  5: {
    label: "Đang thực hiện",
    className: "bg-[#E0E7FF] text-[#4338CA]",
  },
  6: {
    label: "Thanh toán",
    className: "bg-[#EDE9FE] text-[#6D28D9]",
  },
  7: {
    label: "Hoàn thành",
    className: "bg-[#D1FAE5] text-[#047857]",
  },
  8: {
    label: "Đã hủy",
    className: "bg-[#FEE2E2] text-[#B91C1C]",
  },
};

const ORDER_DETAIL_STATUS_MAP = {
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
    label: "Đang chuẩn bị",
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

export default function OwnerPendingOrder() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [openChat, setOpenChat] = React.useState(false);

  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [selectedOrderId, setSelectedOrderId] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState("");

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

      if (pendingOnly.length > 0) {
        setSelectedOrderId((prev) => {
          const exists = pendingOnly.some((item) => item.orderId === prev);
          return exists ? prev : pendingOnly[0].orderId;
        });
      } else {
        setSelectedOrderId(null);
      }
    } catch (err) {
      setError(err.message || "Đã có lỗi xảy ra");
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
      const detail = order.orderDetails?.[0];

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
  }, [orders, search]);

  const selectedOrder =
    filteredOrders.find((order) => order.orderId === selectedOrderId) ||
    filteredOrders[0] ||
    null;

  const stats = React.useMemo(
    () => [
      {
        title: "Chờ duyệt",
        value: orders.length,
        icon: <ClipboardList className="h-5 w-5" />,
        bg: "bg-amber-100",
        text: "text-amber-600",
      },
    ],
    [orders],
  );

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

          <div className="mt-8">
            <h1 className="text-[20px] font-bold text-[#E54B2D]">
              Tất cả đơn hàng chờ duyệt
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

                          <StatusBadge type="order" status={order.status} />
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
            <StatusBadge type="order" status={order.status} />

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

      <div className="rounded-2xl bg-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <MiniInfo
            label="Status Order"
            value={<StatusBadge type="order" status={order.status} />}
          />
          <MiniInfo
            label="Status OrderDetail"
            value={<StatusBadge type="orderDetail" status={detail?.status} />}
          />
        </div>

        {(message || error) && (
          <div className="mt-4 rounded-2xl bg-white">
            {message ? (
              <div className="text-sm text-green-600">{message}</div>
            ) : null}
            {error ? <div className="text-sm text-red-500">{error}</div> : null}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[30px] font-bold text-[#2F3A67]">Chi tiết</h3>

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

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
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
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5">
              <div className="text-lg font-semibold text-[#2F3A67] mb-4">
                Menu và món trong menu
              </div>

              <div className="rounded-xl bg-[#F8F5F1] px-4 py-3 mb-4">
                <div className="text-sm text-[#8DA1C1]">Tên menu</div>
                <div className="mt-1 font-semibold text-[#2B2B2B]">
                  {detail?.menuName || menuSnapshot?.menuName || "--"}
                </div>
              </div>

              {Array.isArray(menuSnapshot?.dishes) &&
              menuSnapshot.dishes.length > 0 ? (
                <div className="space-y-3">
                  {menuSnapshot.dishes.map((dish) => (
                    <div
                      key={dish.dishId}
                      className="flex items-center gap-3 rounded-xl bg-[#F8F5F1] px-4 py-3"
                    >
                      <div className="h-10 w-10 rounded-full bg-[#FFF1E8] flex items-center justify-center text-[#E8712E]">
                        <ChefHat className="h-4 w-4" />
                      </div>

                      <div>
                        <div className="font-medium text-[#2B2B2B]">
                          {dish.dishName}
                        </div>
                        <div className="text-sm text-[#8DA1C1]">
                          Mã món: {dish.dishId}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Không có món trong menu.
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-5">
              <div className="text-lg font-semibold text-[#2F3A67] mb-4">
                Thông tin thanh toán
              </div>

              <div className="space-y-3">
                <PaymentRow label="Tổng đơn hàng" value={order.totalPrice} />
                <PaymentRow label="Đã đặt cọc" value={order.depositAmount} />
                <PaymentRow label="Còn lại" value={order.remainingAmount} />
                <PaymentRow
                  label="Chi phí phát sinh"
                  value={detail?.extraChargeCost || 0}
                />
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[#EEF2F7] pt-4">
                <div className="text-lg font-semibold text-[#2F3A67]">
                  Thanh toán
                </div>
                <div className="text-2xl font-bold text-[#2B2B2B]">
                  {formatPrice(order.remainingAmount)}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5">
              <div className="text-lg font-semibold text-[#2F3A67] mb-4">
                Thông tin tiệc
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#2F3A67]">
                <InfoBox
                  icon={<Users className="h-4 w-4" />}
                  label="Số khách"
                  value={`${detail?.numberOfGuests || 0} khách`}
                />
                <InfoBox
                  icon={<UtensilsCrossed className="h-4 w-4" />}
                  label="Loại tiệc"
                  value={detail?.partyCategoryName || "--"}
                />
                <InfoBox
                  icon={<Wallet className="h-4 w-4" />}
                  label="Menu"
                  value={detail?.menuName || "--"}
                />
                <InfoBox
                  icon={<Clock3 className="h-4 w-4" />}
                  label="Thời gian"
                  value={`${formatDateTime(detail?.startTime)} - ${formatTime(
                    detail?.endTime,
                  )}`}
                />
              </div>
            </div>

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
                Trạng thái OrderDetail
              </div>

              <div className="mb-4">
                <StatusBadge type="orderDetail" status={detail?.status} />
              </div>

              <div className="space-y-4">
                {buildOrderDetailStatusSteps(detail?.status).map(
                  (step, index) => (
                    <OrderStatusStep
                      key={step.key}
                      title={step.title}
                      active={step.active}
                      last={
                        index ===
                        buildOrderDetailStatusSteps(detail?.status).length - 1
                      }
                    />
                  ),
                )}
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

function PaymentRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#F8F5F1] px-4 py-3">
      <span className="text-sm text-[#8DA1C1]">{label}</span>
      <span className="font-semibold text-[#2B2B2B]">{formatPrice(value)}</span>
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
