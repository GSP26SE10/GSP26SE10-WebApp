import React from "react";
import Sidebar from "@/components/Sidebar";
import {
  Search,
  Mail,
  Bell,
  ChevronDown,
  SlidersHorizontal,
  Plus,
} from "lucide-react";

export default function OwnerFood() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("Tất cả");

  const tabs = ["Tất cả", "Bò", "Hải sản", "Gà", "Món chay"];

  const dishes = [
    {
      id: 1,
      name: "Súp hải sản",
      price: "100.000 VNĐ",
      note: "Hấp dẫn với vị ngọt thanh và mang lại\nnhiều lợi ích cho sức khỏe",
      ingredients:
        "Thành phần: Tôm, Mực, Hành lá, Bột\nnăng, Cá, Thịt Heo, Gà, Bò, Nấm, Cà rốt",
      category: "Hải sản",
      img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=70",
    },
    {
      id: 2,
      name: "Chả giò hải sản",
      price: "100.000 VNĐ",
      note: "Món này rất ngon\nMón này rất ngon",
      ingredients:
        "Thành phần: Tôm, Mực, Hành lá, Bột\nnăng, Cá, Thịt Heo, Gà, Bò, Nấm, Cà rốt",
      category: "Hải sản",
      img: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=70",
    },
    {
      id: 3,
      name: "Cá chiên giòn",
      price: "100.000 VNĐ",
      note: "Món này rất ngon\nMón này rất ngon",
      ingredients:
        "Thành phần: Tôm, Mực, Hành lá, Bột\nnăng, Cá, Thịt Heo, Gà, Bò, Nấm, Cà rốt",
      category: "Hải sản",
      img: "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=800&q=70",
    },
    {
      id: 4,
      name: "Súp hải sản",
      price: "100.000 VNĐ",
      note: "Hấp dẫn với vị ngọt thanh và mang lại\nnhiều lợi ích cho sức khỏe",
      ingredients:
        "Thành phần: Tôm, Mực, Hành lá, Bột\nnăng, Cá, Thịt Heo, Gà, Bò, Nấm, Cà rốt",
      category: "Hải sản",
      img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=70",
    },
    {
      id: 5,
      name: "Chả giò hải sản",
      price: "100.000 VNĐ",
      note: "Món này rất ngon\nMón này rất ngon",
      ingredients:
        "Thành phần: Tôm, Mực, Hành lá, Bột\nnăng, Cá, Thịt Heo, Gà, Bò, Nấm, Cà rốt",
      category: "Hải sản",
      img: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=70",
    },
    {
      id: 6,
      name: "Cá chiên giòn",
      price: "100.000 VNĐ",
      note: "Món này rất ngon\nMón này rất ngon",
      ingredients:
        "Thành phần: Tôm, Mực, Hành lá, Bột\nnăng, Cá, Thịt Heo, Gà, Bò, Nấm, Cà rốt",
      category: "Hải sản",
      img: "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=800&q=70",
    },
  ];

  const filtered =
    activeTab === "Tất cả"
      ? dishes
      : dishes.filter((d) => d.category === activeTab);

  return (
    <div className="min-h-screen bg-[#FFFAF0] font-main">
      <Sidebar onExpandChange={setSbExpanded} />

      <div
        className={`min-h-screen transition-[margin] duration-300 ease-in-out ${
          sbExpanded ? "ml-72" : "ml-20"
        }`}
      >
        <header className="sticky top-0 z-10 bg-white border-b">
          <div className="h-16 px-7 flex items-center justify-between">
            <div className="text-sm font-semibold tracking-wide">
              <span className="text-gray-400">QUẢN LÝ</span>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-gray-900">MÓN ĂN</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-[#F6F7FB] border border-[#EEF0F6] rounded-full px-4 py-2 w-[360px]">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  className="bg-transparent outline-none text-sm w-full text-gray-700 placeholder:text-gray-400"
                  placeholder="Tìm"
                />
              </div>

              <button className="p-2 rounded-full hover:bg-gray-100">
                <Mail className="h-5 w-5 text-gray-600" />
              </button>

              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
              </button>

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

        <main className="px-7 py-6 pb-10">
          <div className="flex items-center justify-end gap-3 mb-6">
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
              Thêm Món
            </button>
          </div>

          <div className="w-full">
            <div className="flex items-center justify-between text-sm font-semibold text-[#E8712E] px-2">
              {tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(t)}
                  className={`relative pb-4 transition ${
                    t === activeTab ? "text-[#E8712E]" : "text-[#E8712E]/70"
                  }`}
                >
                  {t}
                  {t === activeTab && (
                    <span className="absolute left-0 -bottom-[1px] h-[3px] w-full bg-[#E54B2D] rounded-full" />
                  )}
                </button>
              ))}
            </div>
            <div className="h-[2px] w-full bg-[#2d2d2d]/70" />
          </div>

          <div className="mt-32 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-28">
            {filtered.map((d) => (
              <DishCard key={d.id} dish={d} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function DishCard({ dish }) {
  return (
    <div className="relative bg-white rounded-2xl border border-[#F1F2F6] shadow-[0_10px_22px_rgba(0,0,0,0.12)] overflow-visible">
      <div className="absolute left-1/2 -top-[64px] -translate-x-1/2">
        <div className="h-[190px] w-[190px] rounded-full shadow-[0_18px_36px_rgba(0,0,0,0.22)] overflow-hidden bg-white">
          <img
            src={dish.img}
            alt={dish.name}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="pt-[138px] pb-8 px-8 text-center">
        <div className="text-[15px] font-semibold text-gray-900">
          {dish.name}
        </div>

        <div className="mt-2 text-[12px] font-bold text-[#E54B2D]">
          {dish.price}
        </div>

        <div className="mt-5 text-[11px] text-[#E54B2D] whitespace-pre-line leading-relaxed">
          {dish.note}
        </div>

        <div className="mt-6 text-[10px] text-gray-500 whitespace-pre-line leading-relaxed">
          {dish.ingredients}
        </div>
      </div>
    </div>
  );
}
