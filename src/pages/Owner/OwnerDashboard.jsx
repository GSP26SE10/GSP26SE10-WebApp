import React from "react";
import Sidebar from "@/components/Sidebar";
import {
  Search,
  Mail,
  Bell,
  ChevronDown,
  Package,
  CheckCircle2,
  DollarSign,
  XCircle,
} from "lucide-react";

export default function OwnerDashboard() {
  const stats = [
    {
      title: "Chờ duyệt",
      value: 10,
      icon: <Package className="h-5 w-5" />,
      color: "#19ACA0",
      badge: "+ 8.56%",
      badgeUp: true,
      active: false,
    },
    {
      title: "Hoàn thành",
      value: 567,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "#1F982A",
      badge: "+ 9.6%",
      badgeUp: true,
      active: true,
    },
    {
      title: "Doanh thu",
      value: "123,123,123",
      icon: <DollarSign className="h-5 w-5" />,
      color: "#3B82F6", // nếu bạn có mã chuẩn, gửi mình đổi
      badge: "- 9.6%",
      badgeUp: false,
      active: false,
    },
    {
      title: "Đơn hủy",
      value: 125,
      icon: <XCircle className="h-5 w-5" />,
      color: "#DE4444",
      badge: "+ 12.3%",
      badgeUp: true,
      active: false,
    },
  ];

  const pendingOrders = Array.from({ length: 6 }).map(() => ({
    id: "#4546563",
    time: "26 tháng 3 2020, 12:42 Sáng",
    customer: "Roberto Carlo",
    location: "ĐH FPT HCM",
    menu: "10.000.000 VNĐ",
  }));
  const [sbExpanded, setSbExpanded] = React.useState(false);
  return (
    <div className="min-h-screen bg-[#FFFAF0] font-main">
      <Sidebar onExpandChange={setSbExpanded} />

      <div
        className={`min-h-screen transition-[margin] duration-300 ease-in-out ${
          sbExpanded ? "ml-72" : "ml-20"
        }`}
      >
        {/* TOP BAR */}
        <header className="sticky top-0 z-10 bg-white border-b">
          <div className="h-16 px-7 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-wide text-[#1f2937]">
              TỔNG QUAN
            </h2>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 bg-[#F6F7FB] border border-[#EEF0F6] rounded-full px-4 py-2 w-[360px]">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  className="bg-transparent outline-none text-sm w-full text-gray-700 placeholder:text-gray-400"
                  placeholder="Tìm"
                />
              </div>

              {/* Icons */}
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Mail className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
              </button>

              {/* Avatar */}
              <div className="flex items-center gap-2">
                <img
                  src="https://gocnhobecon.com/wp-content/uploads/2025/08/meme-con-meo-cuoi.webp"
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

        {/* CONTENT */}
        <main className="px-7 py-6">
          {/* Tabs */}
          <div className="flex justify-end mb-6">
            <div className="inline-flex bg-white rounded-lg p-1 gap-1 border border-[#F2B9A5]">
              <Tab label="Hôm nay" />
              <Tab label="Tháng này" active />
              <Tab label="Năm nay" />
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map((s) => (
              <StatCard key={s.title} {...s} />
            ))}
          </div>

          {/* Revenue chart */}
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
                      41,512M
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <AreaChartMock />
            </div>
          </section>

          {/* Pending orders */}
          <section className="mt-8">
            <h3 className="text-[#E8712E] font-bold mb-4">
              Đơn hàng chờ duyệt
            </h3>

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
                    {pendingOrders.map((o, idx) => (
                      <tr
                        key={idx}
                        className="border-b last:border-b-0 border-[#F1F2F6] text-gray-700 hover:bg-[#FBFBFD]"
                      >
                        <td className="px-6 py-5">{o.id}</td>
                        <td className="px-6 py-5">{o.time}</td>
                        <td className="px-6 py-5">{o.customer}</td>
                        <td className="px-6 py-5">{o.location}</td>
                        <td className="px-6 py-5">{o.menu}</td>
                        <td className="px-6 py-5">
                          <button className="px-3 py-1 rounded-md hover:bg-gray-100">
                            •••
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Tab({ label, active }) {
  return (
    <button
      type="button"
      className={`px-4 py-2 rounded-md text-sm transition font-medium
        ${
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
      className={`bg-white rounded-xl border border-[#F1F2F6] px-6 py-5 flex items-center justify-between
        ${active ? "ring-2 ring-[#3b82f6]" : ""}`}
    >
      <div className="flex items-center gap-4">
        {/* icon circle */}
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
          {/* grid */}
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

          {/* line */}
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

          {/* area */}
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

        {/* x labels */}
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

/* helper */
function hexToRgba(hex, alpha = 1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
