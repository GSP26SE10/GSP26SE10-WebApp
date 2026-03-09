import React from "react";
import Sidebar from "@/components/Sidebar";
import { Search, Mail, Bell, ChevronDown, Plus } from "lucide-react";

import API_URL from "@/config/api";

export default function OwnerDishCategory() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `${API_URL}/api/dish-category?page=1&pageSize=10`,
          {
            headers: { accept: "*/*" },
          },
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Không thể tải danh mục món");
        }

        setCategories(Array.isArray(data?.items) ? data.items : []);
      } catch (err) {
        setError(err.message || "Đã có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((category) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;

    return (
      category.dishCategoryName?.toLowerCase().includes(keyword) ||
      category.description?.toLowerCase().includes(keyword)
    );
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
              <span className="text-gray-900">DANH MỤC</span>
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

        <main className="px-7 py-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-[20px] font-bold text-[#E54B2D]">
              Tất cả Danh mục
            </h1>

            <button
              type="button"
              className="h-10 px-4 rounded-lg bg-[#E8712E] text-white font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition"
            >
              <Plus className="h-4 w-4" />
              Thêm Danh mục
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
          ) : error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-sm text-gray-500">
              Không có danh mục phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-8">
              {filteredCategories.map((category, index) => (
                <CategoryCard
                  key={category.dishCategoryId}
                  category={category}
                  image={getCategoryImage(index)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CategoryCard({ category, image }) {
  return (
    <div>
      <div className="h-[152px] w-full rounded-md overflow-hidden bg-white">
        <img
          src={image}
          alt={category.dishCategoryName}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="mt-3">
        <div className="text-[18px] font-bold text-[#2D9C3C]">
          {category.dishCategoryName}
        </div>
        <div className="mt-1 text-[14px] text-[#5C5C5C] leading-relaxed">
          {category.description}
        </div>
      </div>
    </div>
  );
}

function getCategoryImage(index) {
  const images = [
    "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=70",
    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=70",
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=70",
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=70",
  ];

  return images[index % images.length];
}
