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
      badge: "+ 8.56%",
      badgeUp: true,
      active: false,
    },
    {
      title: "Hoàn thành",
      value: 567,
      icon: <CheckCircle2 className="h-5 w-5" />,
      badge: "+ 9.6%",
      badgeUp: true,
      active: true,
    },
    {
      title: "Doanh thu",
      value: "123,123,123",
      icon: <DollarSign className="h-5 w-5" />,
      badge: "- 9.6%",
      badgeUp: false,
      active: false,
    },
    {
      title: "Đơn hủy",
      value: 125,
      icon: <XCircle className="h-5 w-5" />,
      badge: "+ 12.3%",
      badgeUp: true,
      active: false,
    },
  ];

  const pendingOrders = [
    {
      id: "#4546563",
      time: "26 tháng 3 2020, 12:42 Sáng",
      customer: "Roberto Carlo",
      location: "ĐH FPT HCM",
      menu: "10.000.000 VNĐ",
    },
    {
      id: "#4546563",
      time: "26 tháng 3 2020, 12:42 Sáng",
      customer: "Roberto Carlo",
      location: "ĐH FPT HCM",
      menu: "10.000.000 VNĐ",
    },
    {
      id: "#4546563",
      time: "26 tháng 3 2020, 12:42 Sáng",
      customer: "Roberto Carlo",
      location: "ĐH FPT HCM",
      menu: "10.000.000 VNĐ",
    },
    {
      id: "#4546563",
      time: "26 tháng 3 2020, 12:42 Sáng",
      customer: "Roberto Carlo",
      location: "ĐH FPT HCM",
      menu: "10.000.000 VNĐ",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#fbf7f2] font-main">
      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* RIGHT CONTENT */}
      <div className="flex-1">
        {/* TOP BAR */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-lg font-semibold tracking-wide text-gray-800">
              TỔNG QUAN
            </h2>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 bg-gray-50 border rounded-full px-4 py-2 w-[420px]">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  className="bg-transparent outline-none text-sm w-full"
                  placeholder="Tìm"
                />
              </div>

              {/* Icons */}
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Mail className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute -top-0 -right-0 h-2 w-2 rounded-full bg-red-500" />
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

        {/* PAGE CONTENT */}
        <main className="px-6 py-6">
          {/* Filter Tabs (Hôm nay / Tháng này / Năm nay) */}
          <div className="flex justify-end mb-5">
            <div className="inline-flex bg-white border rounded-lg p-1 gap-1">
              <Tab label="Hôm nay" />
              <Tab label="Tháng này" active />
              <Tab label="Năm nay" />
            </div>
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((s) => (
              <StatCard key={s.title} {...s} />
            ))}
          </div>

          {/* REVENUE CHART */}
          <section className="mt-6 bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Doanh thu</h3>
              <div className="text-sm text-gray-500">
                Tổng{" "}
                <span className="font-semibold text-gray-800">41,512M</span>
              </div>
            </div>

            <div className="mt-4">
              <AreaChartMock />
            </div>
          </section>

          {/* PENDING ORDERS TABLE */}
          <section className="mt-8">
            <h3 className="text-[#E8712E] font-bold mb-4">
              Đơn hàng chờ duyệt
            </h3>

            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white">
                    <tr className="text-left text-gray-500">
                      <th className="px-5 py-4 font-medium">Order ID</th>
                      <th className="px-5 py-4 font-medium">Thời gian</th>
                      <th className="px-5 py-4 font-medium">Khách hàng</th>
                      <th className="px-5 py-4 font-medium">Địa điểm</th>
                      <th className="px-5 py-4 font-medium">Menu</th>
                      <th className="px-5 py-4 font-medium">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map((o, idx) => (
                      <tr
                        key={idx}
                        className="border-t text-gray-700 hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">{o.id}</td>
                        <td className="px-5 py-4">{o.time}</td>
                        <td className="px-5 py-4">{o.customer}</td>
                        <td className="px-5 py-4">{o.location}</td>
                        <td className="px-5 py-4">{o.menu}</td>
                        <td className="px-5 py-4">
                          <button className="px-3 py-1 rounded-md hover:bg-gray-100">
                            ...
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
      className={`px-4 py-2 rounded-md text-sm transition
        ${
          active ? "bg-[#E8712E] text-white" : "text-gray-700 hover:bg-gray-100"
        }`}
      type="button"
    >
      {label}
    </button>
  );
}

function StatCard({ title, value, icon, badge, badgeUp, active }) {
  return (
    <div
      className={`bg-white rounded-xl border p-5 flex items-center justify-between
        ${active ? "ring-2 ring-[#3b82f6]" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center
            ${
              title === "Doanh thu"
                ? "bg-blue-50 text-blue-600"
                : title === "Đơn hủy"
                  ? "bg-red-50 text-red-600"
                  : "bg-emerald-50 text-emerald-600"
            }`}
        >
          {icon}
        </div>

        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
        </div>
      </div>

      <div
        className={`text-xs font-semibold ${
          badgeUp ? "text-emerald-600" : "text-red-500"
        }`}
      >
        {badge}
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
              stroke="#f1f5f9"
              strokeWidth="2"
            />
          ))}

          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <path
            d="M 0 220
               C 120 70, 240 40, 320 90
               C 420 160, 500 220, 560 140
               C 620 60, 690 160, 760 200
               C 830 240, 900 120, 1000 140"
            fill="none"
            stroke="#ef4444"
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

        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-gray-400">
          {[
            "Jan",
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
