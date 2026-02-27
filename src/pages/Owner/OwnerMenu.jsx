import React from "react";
import Sidebar from "@/components/Sidebar";
import {
  Search,
  Mail,
  Bell,
  ChevronDown,
  SlidersHorizontal,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function OwnerMenu() {
  const [sbExpanded, setSbExpanded] = React.useState(false);

  const menus = [
    {
      id: 1,
      name: "Buffet Bò",
      createdAt: "Tạo ngày 01/01/2026",
      items: Array.from({ length: 5 }).map((_, i) => ({
        id: i + 1,
        name: "Súp hải sản",
        desc: "Hấp dẫn với vị ngọt thanh và mang\nlại nhiều lợi ích cho sức khỏe",
        img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=200&q=60",
      })),
      countText: "5 món",
      price: "500.000 VND",
    },
    {
      id: 2,
      name: "Buffet Hải sản",
      createdAt: "Tạo ngày 01/01/2026",
      items: Array.from({ length: 5 }).map((_, i) => ({
        id: i + 1,
        name: "Súp hải sản",
        desc: "Hấp dẫn với vị ngọt thanh và mang\nlại nhiều lợi ích cho sức khỏe",
        img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=200&q=60",
      })),
      countText: "5 món",
      price: "500.000 VND",
    },
    {
      id: 3,
      name: "Buffet Chay",
      createdAt: "Tạo ngày 01/01/2026",
      items: Array.from({ length: 5 }).map((_, i) => ({
        id: i + 1,
        name: "Súp hải sản",
        desc: "Hấp dẫn với vị ngọt thanh và mang\nlại nhiều lợi ích cho sức khỏe",
        img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=200&q=60",
      })),
      countText: "5 món",
      price: "500.000 VND",
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
        {/* TOP BAR */}
        <header className="sticky top-0 z-10 bg-white border-b">
          <div className="h-16 px-7 flex items-center justify-between">
            <div className="text-sm font-semibold tracking-wide">
              <span className="text-gray-400">QUẢN LÝ</span>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-gray-900">MENU</span>
            </div>

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

        {/* PAGE */}
        <main className="px-7 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="h-9 w-9 rounded-full border border-[#F2B9A5] bg-white text-[#E8712E] flex items-center justify-center hover:bg-[#FFF3EA] transition"
                aria-label="prev"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="text-sm font-semibold text-gray-900">
                <span>01</span>
                <span className="text-gray-400">/08</span>
              </div>

              <button
                type="button"
                className="h-9 w-9 rounded-full border border-[#F2B9A5] bg-[#E8712E] text-white flex items-center justify-center hover:opacity-90 transition"
                aria-label="next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="h-10 px-4 rounded-lg border border-[#F2B9A5] bg-[#FFFAF0] text-[#E8712E] font-semibold text-sm flex items-center gap-2 hover:bg-[#FFF3EA] transition"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Lọc
              </button>

              <button
                type="button"
                className="h-10 px-4 rounded-lg bg-[#E8712E] text-white font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition"
              >
                <Plus className="h-4 w-4" />
                Thêm Menu
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {menus.map((m) => (
              <MenuCard key={m.id} menu={m} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function MenuCard({ menu }) {
  return (
    <section className="bg-white rounded-xl border border-[#F1F2F6] shadow-[0_6px_18px_rgba(15,23,42,0.08)] overflow-hidden">
      {/* header */}
      <div className="px-6 pt-6">
        <div className="text-[#E8712E] font-bold">{menu.name}</div>
        <div className="text-xs text-gray-400 mt-1">{menu.createdAt}</div>
      </div>

      {/* list */}
      <div className="px-6 py-4">
        <div className="space-y-5">
          {menu.items.map((it) => (
            <div key={it.id} className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-full bg-white shadow-[0_10px_20px_rgba(0,0,0,0.18)] overflow-hidden flex-none">
                <img
                  src={it.img}
                  alt={it.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">
                  {it.name}
                </div>
                <div className="text-xs text-gray-400 whitespace-pre-line leading-relaxed">
                  {it.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* footer */}
      <div className="px-6 py-4 border-t border-[#F1F2F6] flex items-center justify-between">
        <div className="text-xs text-gray-500">{menu.countText}</div>
        <div className="text-sm font-bold text-[#E54B2D]">{menu.price}</div>
      </div>
    </section>
  );
}
