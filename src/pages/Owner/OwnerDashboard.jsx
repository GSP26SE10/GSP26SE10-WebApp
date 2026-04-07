import React from "react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  Package,
  CheckCircle2,
  XCircle,
  UtensilsCrossed,
  Banknote,
} from "lucide-react";
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

  const [menus, setMenus] = React.useState([]);
  const [loadingMenus, setLoadingMenus] = React.useState(true);
  const [menuError, setMenuError] = React.useState("");

  const [viewMode, setViewMode] = React.useState("week"); // week | month | year
  const [selectedDate] = React.useState(new Date());

  const [revenueData, setRevenueData] = React.useState([]);
  const [loadingRevenue, setLoadingRevenue] = React.useState(true);
  const [revenueError, setRevenueError] = React.useState("");

  const navigate = useNavigate();

  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  const apiGroupBy = viewMode === "year" ? "month" : "day";

  const buildAuthHeaders = React.useCallback(() => {
    return {
      accept: "*/*",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [token]);

  const parseJsonSafe = async (res) => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  const handleUnauthorized = React.useCallback((res) => {
    if (res.status === 401) {
      const message = "Phiên đăng nhập đã hết hạn.";
      setOrderError(message);
      setRevenueError(message);
      setMenuError(message);
      toast.error(message);
    }
  }, []);

  const fetchOrders = React.useCallback(async () => {
    setLoadingOrders(true);
    setOrderError("");

    try {
      const res = await fetch(`${API_URL}/api/order?page=1&pageSize=50`, {
        headers: buildAuthHeaders(),
      });

      handleUnauthorized(res);
      const data = await parseJsonSafe(res);

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải danh sách đơn hàng");
      }

      setOrders(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      const message = err.message || "Đã có lỗi xảy ra";
      setOrderError(message);
      toast.error(message);
    } finally {
      setLoadingOrders(false);
    }
  }, [buildAuthHeaders, handleUnauthorized]);

  const fetchRevenueChart = React.useCallback(async () => {
    setLoadingRevenue(true);
    setRevenueError("");

    try {
      const res = await fetch(
        `${API_URL}/api/owner/revenue-chart?groupBy=${apiGroupBy}`,
        {
          headers: buildAuthHeaders(),
        },
      );

      handleUnauthorized(res);
      const data = await parseJsonSafe(res);

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải biểu đồ doanh thu");
      }

      setRevenueData(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      const message = err.message || "Không thể tải biểu đồ doanh thu";
      setRevenueError(message);
      toast.error(message);
    } finally {
      setLoadingRevenue(false);
    }
  }, [apiGroupBy, buildAuthHeaders, handleUnauthorized]);

  const fetchMenus = React.useCallback(async () => {
    setLoadingMenus(true);
    setMenuError("");

    try {
      const res = await fetch(`${API_URL}/api/menu?page=1&pageSize=6`, {
        headers: buildAuthHeaders(),
      });

      handleUnauthorized(res);
      const data = await parseJsonSafe(res);

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải danh sách menu");
      }

      setMenus(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      const message = err.message || "Không thể tải danh sách menu";
      setMenuError(message);
      toast.error(message);
    } finally {
      setLoadingMenus(false);
    }
  }, [buildAuthHeaders, handleUnauthorized]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  React.useEffect(() => {
    fetchRevenueChart();
  }, [fetchRevenueChart]);

  React.useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const pendingOrders = React.useMemo(() => {
    return orders
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
  }, [orders]);

  const pendingCount = orders.filter((x) => Number(x.status) === 1).length;
  const completedCount = orders.filter((x) => Number(x.status) === 7).length;
  const cancelledCount = orders.filter((x) =>
    [3, 8].includes(Number(x.status)),
  ).length;

  const displayRevenueData = React.useMemo(() => {
    if (!Array.isArray(revenueData)) return [];

    if (viewMode === "week") {
      const sourceMap = new Map(
        revenueData.map((item) => [item.label, Number(item.revenue || 0)]),
      );

      return getLast7Days(selectedDate).map((date) => {
        const key = formatDateKey(date);
        return {
          label: key,
          revenue: sourceMap.get(key) || 0,
        };
      });
    }

    if (viewMode === "month") {
      const sourceMap = new Map(
        revenueData.map((item) => [item.label, Number(item.revenue || 0)]),
      );

      return getAllDaysInMonth(selectedDate).map((date) => {
        const key = formatDateKey(date);
        return {
          label: key,
          revenue: sourceMap.get(key) || 0,
        };
      });
    }

    const sourceMap = new Map(
      revenueData.map((item) => [item.label, Number(item.revenue || 0)]),
    );

    return getAllMonthsInYear(selectedDate).map((item) => ({
      label: item.label,
      revenue: sourceMap.get(item.label) || 0,
    }));
  }, [revenueData, viewMode, selectedDate]);

  const totalRevenueFromChart = displayRevenueData.reduce(
    (sum, item) => sum + Number(item?.revenue || 0),
    0,
  );

  const stats = [
    {
      title: "Chờ duyệt",
      value: pendingCount,
      icon: <Package className="h-5 w-5" />,
      color: "#19ACA0",
      active: false,
      onClick: () => navigate("/owner/orders/pending"),
    },
    {
      title: "Hoàn thành",
      value: completedCount,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "#1F982A",
      active: false,
      onClick: () => navigate("/owner/orders/tracking"),
    },
    {
      title: "Doanh thu",
      value: formatCompactPrice(totalRevenueFromChart),
      icon: <Banknote className="h-5 w-5" />,
      color: "#3B82F6",
      active: true,
    },
    {
      title: "Đơn hủy",
      value: cancelledCount,
      icon: <XCircle className="h-5 w-5" />,
      color: "#DE4444",
      active: false,
      onClick: () => navigate("/owner/orders/tracking"),
    },
  ];

  const topMenus = React.useMemo(() => {
    return menus.slice(0, 4).map((menu, index) => ({
      id: menu.menuId || index,
      name: menu.menuName || menu.name || `Menu ${index + 1}`,
      price: Number(menu.basePrice || menu.price || 0),
      image: getFirstImage(menu.imgUrl || menu.image || menu.thumbnail),
      code: menu.menuCode || menu.code || `MN-${menu.menuId || index + 1}`,
    }));
  }, [menus]);

  const handleOpenPendingOrder = (orderId) => {
    navigate(`/owner/orders/pending?orderId=${orderId}`);
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
          title="TỔNG QUAN"
          showSearch={false}
          onMailClick={() => setOpenChat(true)}
        />

        <main className="px-7 py-6">
          <div className="flex justify-end mb-6">
            <div className="inline-flex bg-white rounded-lg p-1 gap-1 border border-[#F2B9A5]">
              <Tab
                label="Theo tuần"
                active={viewMode === "week"}
                onClick={() => setViewMode("week")}
              />
              <Tab
                label="Theo tháng"
                active={viewMode === "month"}
                onClick={() => setViewMode("month")}
              />
              <Tab
                label="Theo năm"
                active={viewMode === "year"}
                onClick={() => setViewMode("year")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map((s) => (
              <StatCard key={s.title} {...s} />
            ))}
          </div>

          <section className="mt-6 bg-white rounded-xl border border-[#F1F2F6] p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Doanh thu
                </h3>

                <div className="mt-3 flex items-start gap-2 text-sm">
                  <span className="mt-1 inline-block h-4 w-[3px] rounded bg-[#E8712E]" />
                  <div className="text-gray-500 leading-tight">
                    <div className="text-xs">
                      Tổng{" "}
                      {viewMode === "week"
                        ? "7 ngày gần nhất"
                        : viewMode === "month"
                          ? "trong tháng"
                          : "trong năm"}
                    </div>
                    <div className="text-gray-900 font-semibold text-xs">
                      {formatPrice(totalRevenueFromChart)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-[#94A3B8]">
                {viewMode === "week"
                  ? "Dữ liệu 7 ngày gần nhất"
                  : viewMode === "month"
                    ? "Dữ liệu từng ngày trong tháng"
                    : "Dữ liệu từng tháng trong năm"}
              </div>
            </div>

            <div className="mt-4">
              {loadingRevenue ? (
                <div className="h-[260px] flex items-center justify-center text-sm text-gray-500">
                  Đang tải biểu đồ doanh thu...
                </div>
              ) : revenueError ? (
                <div className="h-[260px] flex items-center justify-center text-sm text-red-500">
                  {revenueError}
                </div>
              ) : displayRevenueData.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-sm text-gray-500">
                  Không có dữ liệu doanh thu.
                </div>
              ) : (
                <RevenueAreaChart
                  data={displayRevenueData}
                  viewMode={viewMode}
                />
              )}
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
            <div className="bg-white rounded-xl border border-[#F1F2F6] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[#E8712E] font-bold">Đơn hàng chờ duyệt</h3>

                <button
                  type="button"
                  onClick={() => navigate("/owner/orders/pending")}
                  className="rounded-lg border border-[#F2B9A5] px-4 py-2 text-sm font-semibold text-[#E8712E] hover:bg-[#FFF3EA]"
                >
                  Xem tất cả
                </button>
              </div>

              <div className="bg-white rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-[#F1F2F6]">
                        <th className="px-4 py-4 font-medium">Order ID</th>
                        <th className="px-4 py-4 font-medium">Thời gian</th>
                        <th className="px-4 py-4 font-medium">Khách hàng</th>
                        <th className="px-4 py-4 font-medium">Địa điểm</th>
                        <th className="px-4 py-4 font-medium">Menu</th>
                        <th className="px-4 py-4 font-medium">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingOrders ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-6 text-sm text-gray-500"
                          >
                            Đang tải đơn hàng...
                          </td>
                        </tr>
                      ) : orderError ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-6 text-sm text-red-500"
                          >
                            {orderError}
                          </td>
                        </tr>
                      ) : pendingOrders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-6 text-sm text-gray-500"
                          >
                            Không có đơn hàng chờ duyệt.
                          </td>
                        </tr>
                      ) : (
                        pendingOrders.slice(0, 6).map((o) => (
                          <tr
                            key={o.orderId}
                            className="border-b last:border-b-0 border-[#F1F2F6] text-gray-700 hover:bg-[#FBFBFD] cursor-pointer"
                            onClick={() => handleOpenPendingOrder(o.orderId)}
                          >
                            <td className="px-4 py-5">{o.id}</td>
                            <td className="px-4 py-5">{o.time}</td>
                            <td className="px-4 py-5">{o.customer}</td>
                            <td className="px-4 py-5">{o.location}</td>
                            <td className="px-4 py-5">{o.menu}</td>
                            <td className="px-4 py-5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPendingOrder(o.orderId);
                                }}
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
            </div>

            <div className="bg-white rounded-xl border border-[#F1F2F6] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-[#2F3A67]">Menu nổi bật</h3>
                <UtensilsCrossed className="h-5 w-5 text-[#E8712E]" />
              </div>

              {loadingMenus ? (
                <div className="text-sm text-gray-500">Đang tải menu...</div>
              ) : menuError ? (
                <div className="text-sm text-red-500">{menuError}</div>
              ) : topMenus.length === 0 ? (
                <div className="text-sm text-gray-500">
                  Không có dữ liệu menu.
                </div>
              ) : (
                <div className="space-y-4">
                  {topMenus.map((menu) => (
                    <div
                      key={menu.id}
                      className="flex items-center gap-3 rounded-xl border border-[#F1F2F6] p-3 hover:bg-[#FFF9F3]"
                    >
                      <div className="h-14 w-14 rounded-xl overflow-hidden bg-[#F6F7FB] shrink-0">
                        {menu.image ? (
                          <img
                            src={menu.image}
                            alt={menu.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                            Không ảnh
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[#2F3A67] truncate">
                          {menu.name}
                        </div>
                        <div className="text-xs text-[#94A3B8] mt-1">
                          {menu.code}
                        </div>
                      </div>

                      <div className="text-sm font-bold text-[#E8712E] whitespace-nowrap">
                        {formatPrice(menu.price)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      <ChatPanel open={openChat} onClose={() => setOpenChat(false)} />
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm transition font-medium ${
        active ? "bg-[#E8712E] text-white" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({ title, value, icon, color, active, onClick }) {
  const clickable = typeof onClick === "function";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`bg-white rounded-xl border border-[#F1F2F6] px-6 py-5 flex items-center justify-between text-left ${
        active ? "ring-2 ring-[#3b82f6]" : ""
      } ${
        clickable
          ? "hover:shadow-md hover:-translate-y-[1px] transition"
          : "cursor-default"
      } w-full`}
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
    </button>
  );
}

function RevenueAreaChart({ data, viewMode }) {
  const width = 1000;
  const height = 260;
  const paddingX = 40;
  const paddingTop = 20;
  const paddingBottom = 40;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxRevenue = Math.max(...data.map((d) => Number(d.revenue || 0)), 1);

  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? width / 2
        : paddingX + (index * (width - paddingX * 2)) / (data.length - 1);

    const y =
      paddingTop +
      (1 - Number(item.revenue || 0) / maxRevenue) *
        Math.max(chartHeight - 10, 1);

    return {
      x,
      y,
      label: item.label,
      revenue: Number(item.revenue || 0),
    };
  });

  const linePath = points
    .map((p, index) => `${index === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${
    points[points.length - 1]?.x ?? width - paddingX
  } ${height - paddingBottom} L ${points[0]?.x ?? paddingX} ${
    height - paddingBottom
  } Z`;

  return (
    <div className="w-full">
      <div className="relative w-full h-[260px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + chartHeight * ratio;
            return (
              <line
                key={i}
                x1="0"
                y1={y}
                x2={width}
                y2={y}
                stroke="#F1F2F6"
                strokeWidth="2"
              />
            );
          })}

          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E54B2D" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#E54B2D" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill="url(#areaGrad)" />
          <path
            d={linePath}
            fill="none"
            stroke="#E54B2D"
            strokeWidth="5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((p) => (
            <circle
              key={`${p.label}-${p.x}`}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#E54B2D"
            />
          ))}
        </svg>

        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-[#94A3B8] gap-2 overflow-hidden">
          {data.map((item) => (
            <span key={item.label} className="truncate">
              {formatRevenueLabel(item.label, viewMode)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function normalizeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getLast7Days(referenceDate) {
  const end = normalizeDate(referenceDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(end);
    d.setDate(end.getDate() - (6 - i));
    return d;
  });
}

function getAllDaysInMonth(referenceDate) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: lastDay }, (_, i) => {
    const d = new Date(year, month, i + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

function getAllMonthsInYear(referenceDate) {
  const year = referenceDate.getFullYear();

  return Array.from({ length: 12 }, (_, i) => ({
    label: `${year}-${String(i + 1).padStart(2, "0")}`,
    revenue: 0,
  }));
}

function formatRevenueLabel(label, viewMode) {
  if (!label) return "--";

  if (viewMode === "week" || viewMode === "month") {
    const date = new Date(label);
    if (Number.isNaN(date.getTime())) return label;
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  if (viewMode === "year") {
    const [, month] = String(label).split("-");
    if (!month) return label;
    return `T${month}`;
  }

  return label;
}

function getFirstImage(imgUrl) {
  if (Array.isArray(imgUrl) && imgUrl.length > 0) return imgUrl[0];
  if (typeof imgUrl === "string" && imgUrl.trim()) return imgUrl;
  return "";
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
