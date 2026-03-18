import React from "react";
import Sidebar from "@/components/Sidebar";
import {
  Search,
  Mail,
  Bell,
  ChevronDown,
  SlidersHorizontal,
  Plus,
  X,
  Trash2,
  Pencil,
} from "lucide-react";
import API_URL from "@/config/api";
import Topbar from "@/components/Topbar";

export default function OwnerDish() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("Tất cả");
  const [search, setSearch] = React.useState("");
  const [categories, setCategories] = React.useState([]);
  const [dishes, setDishes] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [openDishModal, setOpenDishModal] = React.useState(false);
  const [openCategoryModal, setOpenCategoryModal] = React.useState(false);
  const [openDetailModal, setOpenDetailModal] = React.useState(false);

  const [selectedDish, setSelectedDish] = React.useState(null);

  const [dishImageFile, setDishImageFile] = React.useState(null);
  const [dishImagePreview, setDishImagePreview] = React.useState("");

  const [dishForm, setDishForm] = React.useState({
    dishName: "",
    price: "",
    note: "",
    description: "",
    status: "AVAILABLE",
    img: "",
    dishCategoryId: "",
  });

  const [categoryForm, setCategoryForm] = React.useState({
    dishCategoryName: "",
    description: "",
  });
  const [openFilter, setOpenFilter] = React.useState(false);
  const [filters, setFilters] = React.useState({
    categoryId: "all",
    status: "all",
    priceMin: "",
    priceMax: "",
  });
  const [submittingDish, setSubmittingDish] = React.useState(false);
  const [submittingCategory, setSubmittingCategory] = React.useState(false);
  const [updatingDish, setUpdatingDish] = React.useState(false);
  const [deletingDish, setDeletingDish] = React.useState(false);
  const [modalError, setModalError] = React.useState("");
  const [modalSuccess, setModalSuccess] = React.useState("");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [categoryRes, dishRes] = await Promise.all([
        fetch(`${API_URL}/api/dish-category`, {
          headers: { accept: "*/*" },
        }),
        fetch(`${API_URL}/api/dish`, {
          headers: { accept: "*/*" },
        }),
      ]);

      const categoryData = await categoryRes.json();
      const dishData = await dishRes.json();

      if (!categoryRes.ok) {
        throw new Error(categoryData?.message || "Không thể tải danh mục món");
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
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    { key: "Tất cả", label: "Tất cả" },
    ...categories.map((c) => ({
      key: c.dishCategoryId,
      label: c.dishCategoryName,
    })),
  ];

  const filtered = dishes.filter((dish) => {
    const keyword = search.trim().toLowerCase();

    const matchSearch =
      !keyword || dish.dishName?.toLowerCase().includes(keyword);

    const matchTab =
      activeTab === "Tất cả" ||
      String(dish.dishCategoryId) === String(activeTab) ||
      dish.dishCategoryName === activeTab;

    const matchCategory =
      filters.categoryId === "all" ||
      String(dish.dishCategoryId) === String(filters.categoryId);

    const matchStatus =
      filters.status === "all" ||
      String(dish.status).toUpperCase() ===
        String(filters.status).toUpperCase();

    const price = Number(dish.price || 0);
    const min = filters.priceMin === "" ? null : Number(filters.priceMin);
    const max = filters.priceMax === "" ? null : Number(filters.priceMax);

    const matchPriceMin = min === null || price >= min;
    const matchPriceMax = max === null || price <= max;

    return (
      matchSearch &&
      matchTab &&
      matchCategory &&
      matchStatus &&
      matchPriceMin &&
      matchPriceMax
    );
  });

  const resetDishForm = () => {
    setDishForm({
      dishName: "",
      price: "",
      note: "",
      description: "",
      status: "AVAILABLE",
      img: "",
      dishCategoryId: "",
    });
    resetDishImage();
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      dishCategoryName: "",
      description: "",
    });
  };

  const openAddDishModal = () => {
    resetDishForm();
    setModalError("");
    setModalSuccess("");
    setOpenDishModal(true);
  };

  const openAddCategoryModal = () => {
    resetCategoryForm();
    setModalError("");
    setModalSuccess("");
    setOpenCategoryModal(true);
  };

  const openDishDetailModal = (dish) => {
    setSelectedDish(dish);
    setDishForm({
      dishName: dish.dishName || "",
      price: String(dish.price ?? ""),
      note: dish.note || "",
      description: dish.description || "",
      status: dish.status || "AVAILABLE",
      img: dish.img || "",
      dishCategoryId: String(dish.dishCategoryId || ""),
    });
    setDishImageFile(null);
    setDishImagePreview(getImageUrl(dish.img));
    setModalError("");
    setModalSuccess("");
    setOpenDetailModal(true);
  };

  const closeAllModals = () => {
    setOpenDishModal(false);
    setOpenCategoryModal(false);
    setOpenDetailModal(false);
    setSelectedDish(null);
    setModalError("");
    setModalSuccess("");
  };

  const handleDishSubmit = async (e) => {
    e.preventDefault();
    setSubmittingDish(true);
    setModalError("");
    setModalSuccess("");

    try {
      const payload = {
        dishName: dishForm.dishName.trim(),
        price: Number(dishForm.price),
        note: dishForm.note.trim(),
        description: dishForm.description.trim(),
        status: dishForm.status.trim(),
        img: dishForm.img?.trim?.() || selectedDish?.img || "",
        dishCategoryId: Number(dishForm.dishCategoryId),
      };

      if (
        !payload.dishName ||
        !payload.price ||
        !payload.status ||
        !payload.dishCategoryId
      ) {
        throw new Error("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      }

      const res = await fetch(`${API_URL}/api/dish`, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Thêm món thất bại");
      }

      setModalSuccess("Thêm món thành công.");
      resetDishForm();
      await fetchData();

      setTimeout(() => {
        setOpenDishModal(false);
        setModalSuccess("");
      }, 700);
    } catch (err) {
      setModalError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmittingDish(false);
    }
  };
  const resetDishImage = () => {
    setDishImageFile(null);
    setDishImagePreview("");
  };

  const handleDishImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDishImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setDishImagePreview(previewUrl);
  };
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setSubmittingCategory(true);
    setModalError("");
    setModalSuccess("");

    try {
      const payload = {
        dishCategoryName: categoryForm.dishCategoryName.trim(),
        description: categoryForm.description.trim(),
      };

      if (!payload.dishCategoryName) {
        throw new Error("Vui lòng nhập tên danh mục.");
      }

      const res = await fetch(`${API_URL}/api/dish-category`, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Thêm danh mục thất bại");
      }

      const categoryRes = await fetch(`${API_URL}/api/dish-category`, {
        headers: { accept: "*/*" },
      });
      const categoryData = await categoryRes.json();

      if (!categoryRes.ok) {
        throw new Error(categoryData?.message || "Không thể tải lại danh mục");
      }

      const newCategories = Array.isArray(categoryData?.items)
        ? categoryData.items
        : [];
      setCategories(newCategories);

      const latest = [...newCategories].sort(
        (a, b) => Number(b.dishCategoryId) - Number(a.dishCategoryId),
      )[0];

      if (latest?.dishCategoryId) {
        setDishForm((prev) => ({
          ...prev,
          dishCategoryId: String(latest.dishCategoryId),
        }));
      }

      setModalSuccess("Thêm danh mục thành công.");
      resetCategoryForm();

      setTimeout(() => {
        setOpenCategoryModal(false);
        setModalSuccess("");
      }, 700);
    } catch (err) {
      setModalError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleUpdateDish = async (e) => {
    e.preventDefault();
    if (!selectedDish?.dishId) return;

    setUpdatingDish(true);
    setModalError("");
    setModalSuccess("");

    try {
      const payload = {
        dishName: dishForm.dishName.trim(),
        price: Number(dishForm.price),
        note: dishForm.note.trim(),
        description: dishForm.description.trim(),
        status: dishForm.status.trim(),
        img: dishForm.img.trim(),
        dishCategoryId: Number(dishForm.dishCategoryId),
      };

      if (
        !payload.dishName ||
        !payload.price ||
        !payload.status ||
        !payload.dishCategoryId
      ) {
        throw new Error("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      }

      const res = await fetch(`${API_URL}/api/dish/${selectedDish.dishId}`, {
        method: "PUT",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Cập nhật món thất bại");
      }

      setModalSuccess("Cập nhật món thành công.");
      await fetchData();

      setTimeout(() => {
        setOpenDetailModal(false);
        setSelectedDish(null);
        setModalSuccess("");
      }, 700);
    } catch (err) {
      setModalError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setUpdatingDish(false);
    }
  };

  const handleDeleteDish = async () => {
    if (!selectedDish?.dishId) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa món "${selectedDish.dishName}" không?`,
    );
    if (!confirmed) return;

    setDeletingDish(true);
    setModalError("");
    setModalSuccess("");

    try {
      const res = await fetch(`${API_URL}/api/dish/${selectedDish.dishId}`, {
        method: "DELETE",
        headers: {
          accept: "*/*",
        },
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data?.message || "Xóa món thất bại");
      }

      await fetchData();
      setOpenDetailModal(false);
      setSelectedDish(null);
    } catch (err) {
      setModalError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setDeletingDish(false);
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
        <Topbar
          breadcrumb={
            <>
              <span className="text-gray-400">QUẢN LÝ</span>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-gray-900">MÓN ĂN</span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm món ăn"
        />

        <main className="px-7 py-6 pb-10">
          <div className="flex items-center justify-end gap-3 mb-6">
            {openFilter && (
              <div className="mb-6 rounded-2xl border border-[#F3D4C2] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Danh mục
                      </label>
                      <select
                        value={filters.categoryId}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            categoryId: e.target.value,
                          }))
                        }
                        className="h-11 w-full rounded-xl border border-gray-200 bg-[#FFFDFC] px-3 text-sm text-gray-700 outline-none transition focus:border-[#E8712E]"
                      >
                        <option value="all">Tất cả</option>
                        {categories.map((c) => (
                          <option
                            key={c.dishCategoryId}
                            value={String(c.dishCategoryId)}
                          >
                            {c.dishCategoryName}
                          </option>
                        ))}
                      </select>
                    </div>

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

                  <div className="flex items-end gap-3 xl:pl-4">
                    <button
                      type="button"
                      onClick={() =>
                        setFilters({
                          categoryId: "all",
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
              className="h-10 px-4 rounded-lg border border-[#F2B9A5] bg-[#FFFAF0] text-[#E8712E] font-semibold text-sm flex items-center gap-2 hover:bg-[#FFF3EA] transition"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Lọc
            </button>

            <button
              type="button"
              onClick={openAddDishModal}
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
                <DishCard
                  key={dish.dishId}
                  dish={dish}
                  onClick={() => openDishDetailModal(dish)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {openDishModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Thêm món mới</h2>
              <button
                type="button"
                onClick={closeAllModals}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleDishSubmit} className="p-6 space-y-4">
              <div className="flex flex-col items-center gap-3 pb-2">
                <div className="h-40 w-40 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                  {dishImagePreview ? (
                    <img
                      src={dishImagePreview}
                      alt="preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-gray-400">Chưa có ảnh</span>
                  )}
                </div>

                <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#F2B9A5] bg-[#FFFAF0] px-4 py-2 text-sm font-semibold text-[#E8712E] hover:bg-[#FFF3EA] transition">
                  Chọn ảnh từ máy
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDishImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Tên món"
                  value={dishForm.dishName}
                  onChange={(v) => setDishForm((p) => ({ ...p, dishName: v }))}
                  required
                />
                <Field
                  label="Giá"
                  type="number"
                  value={dishForm.price}
                  onChange={(v) => setDishForm((p) => ({ ...p, price: v }))}
                  required
                />
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục
                  </label>
                  <select
                    value={dishForm.dishCategoryId}
                    onChange={(e) =>
                      setDishForm((p) => ({
                        ...p,
                        dishCategoryId: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#E8712E]"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((c) => (
                      <option key={c.dishCategoryId} value={c.dishCategoryId}>
                        {c.dishCategoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={openAddCategoryModal}
                  className="h-10 px-4 rounded-lg border border-[#F2B9A5] bg-[#FFFAF0] text-[#E8712E] font-semibold text-sm hover:bg-[#FFF3EA] transition"
                >
                  Thêm danh mục
                </button>
              </div>

              <TextAreaField
                label="Ghi chú"
                value={dishForm.note}
                onChange={(v) => setDishForm((p) => ({ ...p, note: v }))}
              />

              <TextAreaField
                label="Mô tả"
                value={dishForm.description}
                onChange={(v) => setDishForm((p) => ({ ...p, description: v }))}
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
                  onClick={closeAllModals}
                  className="h-10 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingDish}
                  className="h-10 px-4 rounded-lg bg-[#E8712E] text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
                >
                  {submittingDish ? "Đang thêm..." : "Lưu món"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openCategoryModal && (
        <div className="fixed inset-0 z-[110] bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                Thêm danh mục mới
              </h2>
              <button
                type="button"
                onClick={() => {
                  setOpenCategoryModal(false);
                  setModalError("");
                  setModalSuccess("");
                }}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <Field
                label="Tên danh mục"
                value={categoryForm.dishCategoryName}
                onChange={(v) =>
                  setCategoryForm((p) => ({
                    ...p,
                    dishCategoryName: v,
                  }))
                }
                required
              />

              <TextAreaField
                label="Mô tả"
                value={categoryForm.description}
                onChange={(v) =>
                  setCategoryForm((p) => ({ ...p, description: v }))
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
                  onClick={() => {
                    setOpenCategoryModal(false);
                    setModalError("");
                    setModalSuccess("");
                  }}
                  className="h-10 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="h-10 px-4 rounded-lg bg-[#E8712E] text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
                >
                  {submittingCategory ? "Đang thêm..." : "Lưu danh mục"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openDetailModal && selectedDish && (
        <div className="fixed inset-0 z-[120] bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                Chi tiết món ăn
              </h2>
              <button
                type="button"
                onClick={closeAllModals}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleUpdateDish} className="p-6 space-y-4">
              <div className="flex flex-col items-center gap-3 pb-2">
                <div className="h-40 w-40 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                  {dishImagePreview ? (
                    <img
                      src={dishImagePreview}
                      alt="preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-gray-400">Chưa có ảnh</span>
                  )}
                </div>

                <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#F2B9A5] bg-[#FFFAF0] px-4 py-2 text-sm font-semibold text-[#E8712E] hover:bg-[#FFF3EA] transition">
                  Chọn ảnh từ máy
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDishImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Tên món"
                  value={dishForm.dishName}
                  onChange={(v) => setDishForm((p) => ({ ...p, dishName: v }))}
                  required
                />
                <Field
                  label="Giá"
                  type="number"
                  value={dishForm.price}
                  onChange={(v) => setDishForm((p) => ({ ...p, price: v }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục
                </label>
                <select
                  value={dishForm.dishCategoryId}
                  onChange={(e) =>
                    setDishForm((p) => ({
                      ...p,
                      dishCategoryId: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#E8712E]"
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((c) => (
                    <option key={c.dishCategoryId} value={c.dishCategoryId}>
                      {c.dishCategoryName}
                    </option>
                  ))}
                </select>
              </div>

              <TextAreaField
                label="Ghi chú"
                value={dishForm.note}
                onChange={(v) => setDishForm((p) => ({ ...p, note: v }))}
              />

              <TextAreaField
                label="Mô tả"
                value={dishForm.description}
                onChange={(v) => setDishForm((p) => ({ ...p, description: v }))}
              />

              {modalError && (
                <div className="text-sm text-red-500">{modalError}</div>
              )}
              {modalSuccess && (
                <div className="text-sm text-green-600">{modalSuccess}</div>
              )}

              <div className="flex justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDeleteDish}
                  disabled={deletingDish}
                  className="h-10 px-4 rounded-lg bg-red-50 text-red-600 font-semibold flex items-center gap-2 hover:bg-red-100 transition disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingDish ? "Đang xóa..." : "Xóa món"}
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeAllModals}
                    className="h-10 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={updatingDish}
                    className="h-10 px-4 rounded-lg bg-[#E8712E] text-white font-semibold flex items-center gap-2 hover:opacity-90 transition disabled:opacity-60"
                  >
                    <Pencil className="h-4 w-4" />
                    {updatingDish ? "Đang lưu..." : "Cập nhật"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DishCard({ dish, onClick }) {
  const imgSrc = getImageUrl(dish.img);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative text-left bg-white rounded-2xl border border-[#F1F2F6] shadow-[0_10px_22px_rgba(0,0,0,0.12)] overflow-visible min-h-[320px] hover:shadow-[0_14px_30px_rgba(0,0,0,0.16)] transition"
    >
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
        <div className="text-[20px] font-semibold text-gray-900">
          {dish.dishName || "Không có tên"}
        </div>

        <div className="mt-2 text-[20px] font-bold text-[#E54B2D]">
          {formatPrice(dish.price)}
        </div>

        <div className="mt-5 text-[16px] text-[#E54B2D] whitespace-pre-line leading-relaxed min-h-[44px]">
          {dish.note || "Không có ghi chú"}
        </div>

        <div className="mt-6 text-[14px] text-gray-500 whitespace-pre-line leading-relaxed">
          {dish.description || "Không có mô tả"}
        </div>
      </div>
    </button>
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

function TextAreaField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#E8712E] resize-none"
      />
    </div>
  );
}

function formatPrice(price) {
  const value = Number(price || 0);
  return `${value.toLocaleString("vi-VN")} VNĐ`;
}

function getImageUrl(img) {
  if (!img) {
    return "https://lh3.googleusercontent.com/proxy/V7dq9701dopPSChHFrqrgwhxgJomxRTD1G8442hor7bQAs0Nh7ML5OAJ_oLVLyZxnC2sTwR4qi7EooVSppYSQQlob_kCrxBqsWmgKvDOxztyl7gn0B0";
  }

  if (img.startsWith("http://") || img.startsWith("https://")) {
    return img;
  }

  return `${API_URL}${img}`;
}
