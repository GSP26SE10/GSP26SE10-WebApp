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
  X,
} from "lucide-react";
import API_URL from "@/config/api";

export default function OwnerMenu() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [menus, setMenus] = React.useState([]);
  const [dishes, setDishes] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(3);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [openFilter, setOpenFilter] = React.useState(false);
  const [openAddModal, setOpenAddModal] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState("");
  const [modalSuccess, setModalSuccess] = React.useState("");

  const [filters, setFilters] = React.useState({
    status: "all",
    priceMin: "",
    priceMax: "",
  });

  const [menuForm, setMenuForm] = React.useState({
    menuName: "",
    menuCategoryId: "",
    basePrice: "",
    imgUrl: "",
  });

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [menuRes, dishRes] = await Promise.all([
        fetch(`${API_URL}/api/menu?page=${page}&pageSize=${pageSize}`, {
          headers: { accept: "*/*" },
        }),
        fetch(`${API_URL}/api/dish?page=1&pageSize=20`, {
          headers: { accept: "*/*" },
        }),
      ]);

      const menuData = await menuRes.json();
      const dishData = await dishRes.json();

      if (!menuRes.ok) {
        throw new Error(menuData?.message || "Không thể tải danh sách menu");
      }

      if (!dishRes.ok) {
        throw new Error(dishData?.message || "Không thể tải danh sách món");
      }

      setMenus(Array.isArray(menuData?.items) ? menuData.items : []);
      setDishes(Array.isArray(dishData?.items) ? dishData.items : []);
      setTotalPages(Number(menuData?.totalPages || 1));
    } catch (err) {
      setError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredMenus = menus.filter((menu) => {
    const keyword = search.trim().toLowerCase();
    const menuName = String(menu.menuName || "").toLowerCase();
    const categoryName = String(menu.menuCategoryName || "").toLowerCase();
    const partyName = String(menu.partyCategoryName || "").toLowerCase();
    const status = String(menu.status || "").toUpperCase();
    const basePrice = Number(menu.basePrice || 0);

    const matchSearch =
      !keyword ||
      menuName.includes(keyword) ||
      categoryName.includes(keyword) ||
      partyName.includes(keyword);

    const matchStatus =
      filters.status === "all" ||
      status === String(filters.status).toUpperCase();

    const min = filters.priceMin === "" ? null : Number(filters.priceMin);
    const max = filters.priceMax === "" ? null : Number(filters.priceMax);

    const matchMin = min === null || basePrice >= min;
    const matchMax = max === null || basePrice <= max;

    return matchSearch && matchStatus && matchMin && matchMax;
  });

  const previewItems = dishes.slice(0, 5);

  const resetForm = () => {
    setMenuForm({
      menuName: "",
      menuCategoryId: "",
      basePrice: "",
      imgUrl: "",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setModalError("");
    setModalSuccess("");
    setOpenAddModal(true);
  };

  const closeCreateModal = () => {
    setOpenAddModal(false);
    setModalError("");
    setModalSuccess("");
  };

  const handleCreateMenu = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError("");
    setModalSuccess("");

    try {
      const payload = {
        menuName: menuForm.menuName.trim(),
        menuCategoryId: Number(menuForm.menuCategoryId),
        basePrice: Number(menuForm.basePrice),
        imgUrl: menuForm.imgUrl.trim(),
      };

      if (!payload.menuName || !payload.menuCategoryId || !payload.basePrice) {
        throw new Error("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      }

      const res = await fetch(`${API_URL}/api/menu`, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Thêm menu thất bại");
      }

      setModalSuccess("Thêm menu thành công.");
      resetForm();
      await fetchData();

      setTimeout(() => {
        setOpenAddModal(false);
        setModalSuccess("");
      }, 700);
    } catch (err) {
      setModalError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

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
              <span className="text-gray-900">MENU</span>
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
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-9 w-9 rounded-full border border-[#F2B9A5] bg-white text-[#E8712E] flex items-center justify-center hover:bg-[#FFF3EA] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="text-sm font-semibold text-gray-900">
                <span>{String(page).padStart(2, "0")}</span>
                <span className="text-gray-400">
                  /{String(totalPages).padStart(2, "0")}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-9 w-9 rounded-full border border-[#F2B9A5] bg-[#E8712E] text-white flex items-center justify-center hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-end justify-end gap-3">
              {openFilter && (
                <div className="rounded-2xl border border-[#F3D4C2] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:min-h-[76px]">
                    <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Trạng thái
                        </label>
                        <select
                          value={filters.status}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                          className="h-11 w-full rounded-xl border border-gray-200 bg-[#FFFDFC] px-3 text-sm text-gray-700 outline-none transition focus:border-[#E8712E]"
                        >
                          <option value="all">Tất cả</option>
                          <option value="AVAILABLE">AVAILABLE</option>
                          <option value="UNAVAILABLE">UNAVAILABLE</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Giá từ
                        </label>
                        <input
                          type="number"
                          value={filters.priceMin}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              priceMin: e.target.value,
                            }))
                          }
                          placeholder="0"
                          className="h-11 w-full rounded-xl border border-gray-200 bg-[#FFFDFC] px-3 text-sm text-gray-700 outline-none transition focus:border-[#E8712E]"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Giá đến
                        </label>
                        <input
                          type="number"
                          value={filters.priceMax}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              priceMax: e.target.value,
                            }))
                          }
                          placeholder="1000000"
                          className="h-11 w-full rounded-xl border border-gray-200 bg-[#FFFDFC] px-3 text-sm text-gray-700 outline-none transition focus:border-[#E8712E]"
                        />
                      </div>
                    </div>

                    <div className="flex h-11 items-center gap-3 xl:shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setFilters({
                            status: "all",
                            priceMin: "",
                            priceMax: "",
                          })
                        }
                        className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        Đặt lại
                      </button>

                      <button
                        type="button"
                        onClick={() => setOpenFilter(false)}
                        className="h-11 rounded-xl bg-[#E8712E] px-5 text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setOpenFilter((v) => !v)}
                className="h-11 px-4 rounded-lg border border-[#F2B9A5] bg-[#FFFAF0] text-[#E8712E] font-semibold text-sm flex items-center gap-2 hover:bg-[#FFF3EA] transition"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Lọc
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="h-11 px-4 rounded-lg bg-[#E8712E] text-white font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition"
              >
                <Plus className="h-4 w-4" />
                Thêm Menu
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
          ) : error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : filteredMenus.length === 0 ? (
            <div className="text-sm text-gray-500">Không có menu phù hợp.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {filteredMenus.map((menu) => (
                <MenuCard
                  key={menu.menuId}
                  menu={menu}
                  previewItems={previewItems}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {openAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Thêm menu mới</h2>
              <button
                type="button"
                onClick={closeCreateModal}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleCreateMenu} className="p-6 space-y-4">
              <Field
                label="Tên menu"
                value={menuForm.menuName}
                onChange={(v) =>
                  setMenuForm((prev) => ({ ...prev, menuName: v }))
                }
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Menu Category ID"
                  type="number"
                  value={menuForm.menuCategoryId}
                  onChange={(v) =>
                    setMenuForm((prev) => ({
                      ...prev,
                      menuCategoryId: v,
                    }))
                  }
                  required
                />
                <Field
                  label="Giá cơ bản"
                  type="number"
                  value={menuForm.basePrice}
                  onChange={(v) =>
                    setMenuForm((prev) => ({ ...prev, basePrice: v }))
                  }
                  required
                />
              </div>

              <Field
                label="Ảnh menu (URL)"
                value={menuForm.imgUrl}
                onChange={(v) =>
                  setMenuForm((prev) => ({ ...prev, imgUrl: v }))
                }
              />

              {modalError && (
                <div className="text-sm text-red-500">{modalError}</div>
              )}
              {modalSuccess && (
                <div className="text-sm text-green-600">{modalSuccess}</div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="h-10 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-4 rounded-lg bg-[#E8712E] text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
                >
                  {submitting ? "Đang thêm..." : "Lưu menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuCard({ menu, previewItems }) {
  const imgSrc = getMenuImageUrl(menu.imgUrl);

  return (
    <section className="bg-white rounded-xl border border-[#F1F2F6] shadow-[0_6px_18px_rgba(15,23,42,0.08)] overflow-hidden">
      <div className="px-6 pt-6">
        <div className="text-[#E8712E] font-bold">{menu.menuName}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
          <span>Tạo ngày {formatDate(menu.createdAt)}</span>
          {menu.menuCategoryName && (
            <span className="rounded-full bg-[#FFF3EA] px-2 py-1 text-[#E8712E]">
              {menu.menuCategoryName}
            </span>
          )}
          {menu.partyCategoryName && (
            <span className="rounded-full bg-[#F5F5F5] px-2 py-1 text-gray-600">
              {menu.partyCategoryName}
            </span>
          )}
        </div>
      </div>

      <div className="px-6 pt-4">
        <div className="h-44 w-full overflow-hidden rounded-xl bg-white shadow-[0_6px_18px_rgba(0,0,0,0.08)]">
          <img
            src={imgSrc}
            alt={menu.menuName}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="space-y-5">
          {previewItems.map((it) => (
            <div key={it.dishId} className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-full bg-white shadow-[0_10px_20px_rgba(0,0,0,0.18)] overflow-hidden flex-none">
                <img
                  src={getDishImageUrl(it.img)}
                  alt={it.dishName}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">
                  {it.dishName}
                </div>
                <div className="text-xs text-gray-400 whitespace-pre-line leading-relaxed">
                  {it.description || it.note || "Không có mô tả"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-[#F1F2F6] flex items-center justify-between">
        <div className="text-xs text-gray-500">{previewItems.length} món</div>
        <div className="text-sm font-bold text-[#E54B2D]">
          {formatPrice(menu.basePrice)}
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, required = false, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#E8712E]"
      />
    </div>
  );
}

function formatPrice(price) {
  const value = Number(price || 0);
  return `${value.toLocaleString("vi-VN")} VNĐ`;
}

function formatDate(dateString) {
  if (!dateString) return "--/--/----";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "--/--/----";
  return date.toLocaleDateString("vi-VN");
}

function getMenuImageUrl(img) {
  if (!img) {
    return "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=70";
  }

  if (img.startsWith("http://") || img.startsWith("https://")) {
    return img;
  }

  return `${API_URL}${img}`;
}

function getDishImageUrl(img) {
  if (!img) {
    return "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=200&q=60";
  }

  if (img.startsWith("http://") || img.startsWith("https://")) {
    return img;
  }

  return `${API_URL}${img}`;
}
