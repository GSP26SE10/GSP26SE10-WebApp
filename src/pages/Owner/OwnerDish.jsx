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
import API_URL from "@/config/api";

export default function OwnerFood() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("Tất cả");
  const [search, setSearch] = React.useState("");
  const [categories, setCategories] = React.useState([]);
  const [dishes, setDishes] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [categoryRes, dishRes] = await Promise.all([
          fetch(`${API_URL}/api/dish-category?page=1&pageSize=10`, {
            headers: { accept: "*/*" },
          }),
          fetch(`${API_URL}/api/dish?page=1&pageSize=100`, {
            headers: { accept: "*/*" },
          }),
        ]);

        const categoryData = await categoryRes.json();
        const dishData = await dishRes.json();

        if (!categoryRes.ok) {
          throw new Error(
            categoryData?.message || "Không thể tải danh mục món",
          );
        }

        if (!dishRes.ok) {
          throw new Error(dishData?.message || "Không thể tải danh sách món");
        }

        setCategories(
          Array.isArray(categoryData?.items) ? categoryData.items : [],
        );
        setDishes(Array.isArray(dishData?.items) ? dishData.items : []);
      } catch (err) {
        setError(err.message || "Đã có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const tabs = [
    { key: "Tất cả", label: "Tất cả" },
    ...categories.map((c) => ({
      key: c.dishCategoryId,
      label: c.dishCategoryName,
    })),
  ];

  const filtered = dishes.filter((dish) => {
    const matchTab =
      activeTab === "Tất cả" ||
      dish.dishCategoryId === activeTab ||
      dish.dishCategoryName === activeTab;

    const keyword = search.trim().toLowerCase();
    const matchSearch =
      !keyword ||
      dish.dishName?.toLowerCase().includes(keyword) ||
      dish.description?.toLowerCase().includes(keyword) ||
      dish.note?.toLowerCase().includes(keyword) ||
      dish.dishCategoryName?.toLowerCase().includes(keyword);

    return matchTab && matchSearch;
  });

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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
            <div className="relative">
              <div className="flex items-center justify-between px-2 text-sm font-semibold text-[#E8712E]">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    className={`relative pb-5 transition ${
                      t.key === activeTab
                        ? "text-[#E8712E]"
                        : "text-[#E8712E]/70"
                    }`}
                  >
                    {t.label}
                    {t.key === activeTab && (
                      <span className="absolute left-0 bottom-[1px] h-[3px] w-12 bg-[#E54B2D]" />
                    )}
                  </button>
                ))}
              </div>
              <div className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#2d2d2d]/70" />
            </div>
          </div>

          {loading ? (
            <div className="mt-16 text-sm text-gray-500">
              Đang tải dữ liệu...
            </div>
          ) : error ? (
            <div className="mt-16 text-sm text-red-500">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="mt-16 text-sm text-gray-500">
              Không có món ăn phù hợp.
            </div>
          ) : (
            <div className="mt-32 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-28">
              {filtered.map((dish) => (
                <DishCard key={dish.dishId} dish={dish} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function DishCard({ dish }) {
  const imgSrc = getImageUrl(dish.img);

  return (
    <div className="relative bg-white rounded-2xl border border-[#F1F2F6] shadow-[0_10px_22px_rgba(0,0,0,0.12)] overflow-visible min-h-[320px]">
      <div className="absolute left-1/2 -top-[64px] -translate-x-1/2">
        <div className="h-[190px] w-[190px] rounded-full shadow-[0_18px_36px_rgba(0,0,0,0.22)] overflow-hidden bg-white">
          <img
            src={imgSrc}
            alt={dish.dishName}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="pt-[138px] pb-8 px-8 text-center">
        <div className="text-[15px] font-semibold text-gray-900">
          {dish.dishName || "Không có tên"}
        </div>

        <div className="mt-2 text-[12px] font-bold text-[#E54B2D]">
          {formatPrice(dish.price)}
        </div>

        <div className="mt-5 text-[11px] text-[#E54B2D] whitespace-pre-line leading-relaxed min-h-[44px]">
          {dish.note || "Không có ghi chú"}
        </div>

        <div className="mt-6 text-[10px] text-gray-500 whitespace-pre-line leading-relaxed">
          {dish.description || "Không có mô tả"}
        </div>
      </div>
    </div>
  );
}

function formatPrice(price) {
  const value = Number(price || 0);
  return `${value.toLocaleString("vi-VN")} VNĐ`;
}

function getImageUrl(img) {
  if (!img) {
    return "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=70";
  }

  if (img.startsWith("http://") || img.startsWith("https://")) {
    return img;
  }

  return `${API_URL}${img}`;
}
