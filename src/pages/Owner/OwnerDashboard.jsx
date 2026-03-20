import React from "react";
import Sidebar from "@/components/Sidebar";
import { Package, CheckCircle2, DollarSign, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_URL from "@/config/api";
import Topbar from "@/components/Topbar";
import ChatPanel from "@/components/ChatPanel";

export default function OwnerDashboard() {
  const [openChat, setOpenChat] = React.useState(false);
  const [sbExpanded, setSbExpanded] = React.useState(false);

  const [orders, setOrders] = React.useState([]);
  const [loadingOrders, setLoadingOrders] = React.useState(true);
  const [orderError, setOrderError] = React.useState("");

  const navigate = useNavigate();

  const fetchOrders = React.useCallback(async () => {
    setLoadingOrders(true);
    setOrderError("");

    try {
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

      const res = await fetch(`${API_URL}/api/order?page=1&pageSize=20`, {
        headers: {
          accept: "*/*",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải danh sách đơn hàng");
      }

      setOrders(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setOrderError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const pendingOrders = orders
    .filter((order) => Number(order.status) === 1)
    .map((order) => {
      const detail = order.orderDetails?.[0];

      return {
        orderId: order.orderId,
        id: `#${order.orderId}`,
        time: formatDateTime(detail?.startTime || order.createdAt),
        customer: order.customerName || "--",
        location: detail?.address || "--",
        menu: detail?.menuName || "--",
        totalPrice: order.totalPrice || 0,
      };
    });

  const pendingCount = orders.filter((x) => Number(x.status) === 1).length;
  const completedCount = orders.filter((x) => Number(x.status) === 2).length;
  const cancelledCount = orders.filter((x) => Number(x.status) === 0).length;
  const totalRevenue = orders.reduce(
    (sum, x) => sum + Number(x.totalPrice || 0),
    0,
  );

  const stats = [
    {
      title: "Chờ duyệt",
      value: pendingCount,
      icon: <Package className="h-5 w-5" />,
      color: "#19ACA0",
      badge: "+ 8.56%",
      badgeUp: true,
      active: false,
    },
    {
      title: "Hoàn thành",
      value: completedCount,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "#1F982A",
      badge: "+ 9.6%",
      badgeUp: true,
      active: true,
    },
    {
      title: "Doanh thu",
      value: formatCompactPrice(totalRevenue),
      icon: <DollarSign className="h-5 w-5" />,
      color: "#3B82F6",
      badge: "- 9.6%",
      badgeUp: false,
      active: false,
    },
    {
      title: "Đơn hủy",
      value: cancelledCount,
      icon: <XCircle className="h-5 w-5" />,
      color: "#DE4444",
      badge: "+ 12.3%",
      badgeUp: true,
      active: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFAF0] font-main">
      <Sidebar onExpandChange={setSbExpanded} />

      <div
        className={`min-h-screen transition-[margin] duration-300 ease-in-out ${
          sbExpanded ? "ml-72" : "ml-20"
        }`}
      >
        <Topbar
          title="TỔNG QUAN"
          showSearch={false}
          avatarSrc="https://gocnhobecon.com/wp-content/uploads/2025/08/meme-con-meo-cuoi.webp"
          onMailClick={() => setOpenChat(true)}
        />

        <main className="px-7 py-6">
          <div className="flex justify-end mb-6">
            <div className="inline-flex bg-white rounded-lg p-1 gap-1 border border-[#F2B9A5]">
              <Tab label="Hôm nay" />
              <Tab label="Tháng này" active />
              <Tab label="Năm nay" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map((s) => (
              <StatCard key={s.title} {...s} />
            ))}
          </div>

          <section className="mt-6 bg-white rounded-xl border border-[#F1F2F6] p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Doanh thu
                </h3>

                <div className="mt-3 flex items-start gap-2 text-sm">
                  <span className="mt-1 inline-block h-4 w-[3px] rounded bg-[#E8712E]" />
                  <div className="text-gray-500 leading-tight">
                    <div className="text-xs">Tổng</div>
                    <div className="text-gray-900 font-semibold text-xs">
                      {formatPrice(totalRevenue)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <AreaChartMock />
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[#E8712E] font-bold">Đơn hàng chờ duyệt</h3>

              <button
                type="button"
                onClick={() => navigate("/owner/orders")}
                className="rounded-lg border border-[#F2B9A5] px-4 py-2 text-sm font-semibold text-[#E8712E] hover:bg-[#FFF3EA]"
              >
                Xem tất cả
              </button>
            </div>

            <div className="bg-white rounded-xl border border-[#F1F2F6] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-[#F1F2F6]">
                      <th className="px-6 py-4 font-medium">Order ID</th>
                      <th className="px-6 py-4 font-medium">Thời gian</th>
                      <th className="px-6 py-4 font-medium">Khách hàng</th>
                      <th className="px-6 py-4 font-medium">Địa điểm</th>
                      <th className="px-6 py-4 font-medium">Menu</th>
                      <th className="px-6 py-4 font-medium">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingOrders ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-6 text-sm text-gray-500"
                        >
                          Đang tải đơn hàng...
                        </td>
                      </tr>
                    ) : orderError ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-6 text-sm text-red-500"
                        >
                          {orderError}
                        </td>
                      </tr>
                    ) : pendingOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-6 text-sm text-gray-500"
                        >
                          Không có đơn hàng chờ duyệt.
                        </td>
                      </tr>
                    ) : (
                      pendingOrders.slice(0, 6).map((o) => (
                        <tr
                          key={o.orderId}
                          className="border-b last:border-b-0 border-[#F1F2F6] text-gray-700 hover:bg-[#FBFBFD]"
                        >
                          <td className="px-6 py-5">{o.id}</td>
                          <td className="px-6 py-5">{o.time}</td>
                          <td className="px-6 py-5">{o.customer}</td>
                          <td className="px-6 py-5">{o.location}</td>
                          <td className="px-6 py-5">{o.menu}</td>
                          <td className="px-6 py-5">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/owner/orders/${o.orderId}`)
                              }
                              className="rounded-md px-3 py-1 hover:bg-gray-100"
                            >
                              •••
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>

      <ChatPanel open={openChat} onClose={() => setOpenChat(false)} />
    </div>
  );
}

function Tab({ label, active }) {
  return (
    <button
      type="button"
      className={`px-4 py-2 rounded-md text-sm transition font-medium ${
        active ? "bg-[#E8712E] text-white" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({ title, value, icon, color, badge, badgeUp, active }) {
  return (
    <div
      className={`bg-white rounded-xl border border-[#F1F2F6] px-6 py-5 flex items-center justify-between ${
        active ? "ring-2 ring-[#3b82f6]" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className="h-11 w-11 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: hexToRgba(color, 0.12),
            color,
          }}
        >
          {icon}
        </div>

        <div className="leading-tight">
          <div className="text-sm text-[#94A3B8]">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
        </div>
      </div>

      <div
        className={`text-xs font-semibold self-end ${
          badgeUp ? "text-emerald-600" : "text-red-500"
        }`}
      >
        {badgeUp ? "↑ " : "↓ "}
        {badge.replace("+ ", "").replace("- ", "")}
      </div>
    </div>
  );
}

function AreaChartMock() {
  return (
    <div className="w-full">
      <div className="relative w-full h-[260px]">
        <svg
          viewBox="0 0 1000 260"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {[40, 90, 140, 190, 240].map((y, i) => (
            <line
              key={i}
              x1="0"
              y1={y}
              x2="1000"
              y2={y}
              stroke="#F1F2F6"
              strokeWidth="2"
            />
          ))}

          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E54B2D" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#E54B2D" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          <path
            d="M 0 220
               C 120 70, 240 40, 320 90
               C 420 160, 500 220, 560 140
               C 620 60, 690 160, 760 200
               C 830 240, 900 120, 1000 140"
            fill="none"
            stroke="#E54B2D"
            strokeWidth="5"
          />

          <path
            d="M 0 260
               L 0 220
               C 120 70, 240 40, 320 90
               C 420 160, 500 220, 560 140
               C 620 60, 690 160, 760 200
               C 830 240, 900 120, 1000 140
               L 1000 260
               Z"
            fill="url(#areaGrad)"
          />
        </svg>

        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-[#94A3B8]">
          {[
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "July",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ].map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function hexToRgba(hex, alpha = 1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatPrice(price) {
  return `${Number(price || 0).toLocaleString("vi-VN")} VNĐ`;
}

function formatCompactPrice(price) {
  return Number(price || 0).toLocaleString("vi-VN");
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
