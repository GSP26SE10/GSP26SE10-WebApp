import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import API_URL from "@/config/api";
import {
  SlidersHorizontal,
  Plus,
  X,
  Trash2,
  Pencil,
  ChefHat,
  Package2,
} from "lucide-react";
import { toast } from "sonner";

const DISH_ENDPOINT = `${API_URL}/api/dish`;
const DISH_CATEGORY_ENDPOINT = `${API_URL}/api/dish-category`;
const DISH_DETAIL_ENDPOINT = `${API_URL}/api/dish-detail`;
const INGREDIENT_ENDPOINT = `${API_URL}/api/ingredient`;

const DEFAULT_PAGE_SIZE = 200;

export default function OwnerDish() {
  const [sbExpanded, setSbExpanded] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState("Tất cả");
  const [search, setSearch] = React.useState("");

  const [categories, setCategories] = React.useState([]);
  const [dishes, setDishes] = React.useState([]);
  const [dishDetails, setDishDetails] = React.useState([]);
  const [ingredients, setIngredients] = React.useState([]);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [openFilter, setOpenFilter] = React.useState(false);
  const [filters, setFilters] = React.useState({
    categoryId: "all",
    status: "all",
    priceMin: "",
    priceMax: "",
  });

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
    dishCategoryId: "",
  });

  const [categoryForm, setCategoryForm] = React.useState({
    dishCategoryName: "",
    description: "",
  });

  const [detailForm, setDetailForm] = React.useState({
    ingredientId: "",
    quantity: "",
    unit: "",
  });

  const [editingDetailId, setEditingDetailId] = React.useState(null);

  const [submittingDish, setSubmittingDish] = React.useState(false);
  const [submittingCategory, setSubmittingCategory] = React.useState(false);
  const [updatingDish, setUpdatingDish] = React.useState(false);
  const [deletingDish, setDeletingDish] = React.useState(false);
  const [submittingDetail, setSubmittingDetail] = React.useState(false);
  const [updatingDetail, setUpdatingDetail] = React.useState(false);
  const [deletingDetailId, setDeletingDetailId] = React.useState(null);

  const [confirmDeleteDetail, setConfirmDeleteDetail] = React.useState({
    open: false,
    detail: null,
  });

  const fetchAllPages = React.useCallback(async (baseUrl) => {
    let page = 1;
    let allItems = [];
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(
        `${baseUrl}?page=${page}&pageSize=${DEFAULT_PAGE_SIZE}`,
        {
          headers: { accept: "*/*" },
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || `Không thể tải dữ liệu từ ${baseUrl}`);
      }

      const items = Array.isArray(data?.items) ? data.items : [];
      allItems = [...allItems, ...items];

      if (items.length < DEFAULT_PAGE_SIZE) {
        hasMore = false;
      } else {
        page += 1;
      }
    }

    return allItems;
  }, []);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [categoryItems, dishItems, detailItems, ingredientItems] =
        await Promise.all([
          fetchAllPages(DISH_CATEGORY_ENDPOINT),
          fetchAllPages(DISH_ENDPOINT),
          fetchAllPages(DISH_DETAIL_ENDPOINT),
          fetchAllPages(INGREDIENT_ENDPOINT).catch(() => []),
        ]);

      setCategories(categoryItems);
      setDishes(dishItems);
      setDishDetails(detailItems);
      setIngredients(Array.isArray(ingredientItems) ? ingredientItems : []);
    } catch (err) {
      setError(err.message || "Đã có lỗi xảy ra khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [fetchAllPages]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    return () => {
      if (dishImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(dishImagePreview);
      }
    };
  }, [dishImagePreview]);

  const tabs = [
    { key: "Tất cả", label: "Tất cả" },
    ...categories.map((c) => ({
      key: String(c.dishCategoryId),
      label: c.dishCategoryName,
    })),
  ];

  const detailsByDishId = React.useMemo(() => {
    const map = {};
    for (const item of dishDetails) {
      const key = String(item.dishId);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  }, [dishDetails]);

  const selectedDishDetails = React.useMemo(() => {
    if (!selectedDish?.dishId) return [];
    return detailsByDishId[String(selectedDish.dishId)] || [];
  }, [detailsByDishId, selectedDish]);

  const filtered = React.useMemo(() => {
    return dishes.filter((dish) => {
      const keyword = search.trim().toLowerCase();

      const matchSearch =
        !keyword ||
        dish.dishName?.toLowerCase().includes(keyword) ||
        dish.note?.toLowerCase().includes(keyword) ||
        dish.description?.toLowerCase().includes(keyword);

      const matchTab =
        activeTab === "Tất cả" ||
        String(dish.dishCategoryId) === String(activeTab);

      const matchCategory =
        filters.categoryId === "all" ||
        String(dish.dishCategoryId) === String(filters.categoryId);

      const price = Number(dish.price || 0);
      const min = filters.priceMin === "" ? null : Number(filters.priceMin);
      const max = filters.priceMax === "" ? null : Number(filters.priceMax);

      const matchPriceMin = min === null || price >= min;
      const matchPriceMax = max === null || price <= max;

      const matchStatus =
        filters.status === "all" ||
        normalizeDishStatus(dish.status) === filters.status;

      return (
        matchSearch &&
        matchTab &&
        matchCategory &&
        matchPriceMin &&
        matchPriceMax &&
        matchStatus
      );
    });
  }, [dishes, search, activeTab, filters]);

  const resetDishImage = () => {
    if (dishImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(dishImagePreview);
    }
    setDishImageFile(null);
    setDishImagePreview("");
  };

  const resetDishForm = () => {
    setDishForm({
      dishName: "",
      price: "",
      note: "",
      description: "",
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

  const resetDetailForm = () => {
    setDetailForm({
      ingredientId: "",
      quantity: "",
      unit: "",
    });
    setEditingDetailId(null);
  };

  const closeAllModals = () => {
    setOpenDishModal(false);
    setOpenCategoryModal(false);
    setOpenDetailModal(false);
    setSelectedDish(null);
    resetDishForm();
    resetDetailForm();
    setConfirmDeleteDetail({ open: false, detail: null });
  };

  const openAddDishModal = () => {
    setSelectedDish(null);
    resetDishForm();
    resetDetailForm();
    setOpenDishModal(true);
  };

  const openAddCategoryModal = () => {
    resetCategoryForm();
    setOpenCategoryModal(true);
  };

  const openDishDetailModal = (dish) => {
    setSelectedDish(dish);
    setDishForm({
      dishName: dish.dishName || "",
      price: String(dish.price ?? ""),
      note: dish.note || "",
      description: dish.description || "",
      dishCategoryId: String(dish.dishCategoryId || ""),
    });
    setDishImageFile(null);
    setDishImagePreview(getImageUrl(dish.img));
    resetDetailForm();
    setOpenDetailModal(true);
  };

  const handleDishImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (dishImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(dishImagePreview);
    }

    setDishImageFile(file);
    setDishImagePreview(URL.createObjectURL(file));
  };

  const buildDishFormData = () => {
    const formData = new FormData();

    formData.append("DishName", dishForm.dishName.trim());
    formData.append("Price", String(Number(dishForm.price || 0)));
    formData.append("Note", dishForm.note.trim());
    formData.append("Description", dishForm.description.trim());
    formData.append("DishCategoryId", String(Number(dishForm.dishCategoryId)));

    if (dishImageFile) {
      formData.append("ImgFile", dishImageFile);
    }

    return formData;
  };

  const handleDishSubmit = async (e) => {
    e.preventDefault();
    setSubmittingDish(true);

    try {
      if (!dishForm.dishName.trim()) {
        throw new Error("Vui lòng nhập tên món.");
      }

      if (!dishForm.price || Number(dishForm.price) <= 0) {
        throw new Error("Vui lòng nhập giá hợp lệ.");
      }

      if (!dishForm.dishCategoryId) {
        throw new Error("Vui lòng chọn danh mục.");
      }

      const res = await fetch(DISH_ENDPOINT, {
        method: "POST",
        headers: { accept: "*/*" },
        body: buildDishFormData(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Thêm món thất bại.");
      }

      toast.success("Thêm món thành công.");
      setOpenDishModal(false);
      resetDishForm();
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra.");
    } finally {
      setSubmittingDish(false);
    }
  };

  const handleUpdateDish = async (e) => {
    e.preventDefault();

    if (!selectedDish?.dishId) return;
    setUpdatingDish(true);

    try {
      if (!dishForm.dishName.trim()) {
        throw new Error("Vui lòng nhập tên món.");
      }

      if (!dishForm.price || Number(dishForm.price) <= 0) {
        throw new Error("Vui lòng nhập giá hợp lệ.");
      }

      if (!dishForm.dishCategoryId) {
        throw new Error("Vui lòng chọn danh mục.");
      }

      const res = await fetch(`${DISH_ENDPOINT}/${selectedDish.dishId}`, {
        method: "PUT",
        headers: { accept: "*/*" },
        body: buildDishFormData(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Cập nhật món thất bại.");
      }

      toast.success("Cập nhật món thành công.");
      await fetchData();
      setOpenDetailModal(false);
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra.");
    } finally {
      setUpdatingDish(false);
    }
  };

  const handleDeleteDish = async () => {
    if (!selectedDish?.dishId) return;

    setDeletingDish(true);

    try {
      const res = await fetch(`${DISH_ENDPOINT}/${selectedDish.dishId}`, {
        method: "DELETE",
        headers: { accept: "*/*" },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Xóa món thất bại.");
      }

      toast.success("Xóa món thành công.");
      setOpenDetailModal(false);
      setSelectedDish(null);
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra.");
    } finally {
      setDeletingDish(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setSubmittingCategory(true);

    try {
      const payload = {
        dishCategoryName: categoryForm.dishCategoryName.trim(),
        description: categoryForm.description.trim(),
      };

      if (!payload.dishCategoryName) {
        throw new Error("Vui lòng nhập tên danh mục.");
      }

      const res = await fetch(DISH_CATEGORY_ENDPOINT, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Thêm danh mục thất bại.");
      }

      toast.success("Thêm danh mục thành công.");
      setOpenCategoryModal(false);
      resetCategoryForm();
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra.");
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleCreateDetail = async (e) => {
    e.preventDefault();

    if (!selectedDish?.dishId) {
      toast.error("Chưa chọn món ăn.");
      return;
    }

    setSubmittingDetail(true);

    try {
      if (!detailForm.ingredientId) {
        throw new Error("Vui lòng chọn nguyên liệu.");
      }

      if (!detailForm.quantity || Number(detailForm.quantity) <= 0) {
        throw new Error("Vui lòng nhập số lượng hợp lệ.");
      }

      if (!detailForm.unit.trim()) {
        throw new Error("Vui lòng nhập đơn vị.");
      }

      const payload = {
        dishId: Number(selectedDish.dishId),
        ingredientId: Number(detailForm.ingredientId),
        quantity: Number(detailForm.quantity),
        unit: detailForm.unit.trim(),
      };

      const res = await fetch(DISH_DETAIL_ENDPOINT, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Thêm nguyên liệu thất bại.");
      }

      toast.success("Thêm nguyên liệu thành công.");
      resetDetailForm();
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra.");
    } finally {
      setSubmittingDetail(false);
    }
  };

  const handleStartEditDetail = (detail) => {
    setEditingDetailId(detail.dishDetailId);
    setDetailForm({
      ingredientId: String(detail.ingredientId || ""),
      quantity: String(detail.quantity || ""),
      unit: detail.unit || "",
    });
  };

  const handleCancelEditDetail = () => {
    resetDetailForm();
  };

  const handleUpdateDetail = async (e) => {
    e.preventDefault();

    if (!editingDetailId || !selectedDish?.dishId) return;
    setUpdatingDetail(true);

    try {
      if (!detailForm.ingredientId) {
        throw new Error("Vui lòng chọn nguyên liệu.");
      }

      if (!detailForm.quantity || Number(detailForm.quantity) <= 0) {
        throw new Error("Vui lòng nhập số lượng hợp lệ.");
      }

      if (!detailForm.unit.trim()) {
        throw new Error("Vui lòng nhập đơn vị.");
      }

      const payload = {
        dishId: Number(selectedDish.dishId),
        ingredientId: Number(detailForm.ingredientId),
        quantity: Number(detailForm.quantity),
        unit: detailForm.unit.trim(),
      };

      const res = await fetch(`${DISH_DETAIL_ENDPOINT}/${editingDetailId}`, {
        method: "PUT",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Cập nhật nguyên liệu thất bại.");
      }

      toast.success("Cập nhật nguyên liệu thành công.");
      resetDetailForm();
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra.");
    } finally {
      setUpdatingDetail(false);
    }
  };

  const openDeleteDetailConfirm = (detail) => {
    setConfirmDeleteDetail({
      open: true,
      detail,
    });
  };

  const closeDeleteDetailConfirm = () => {
    setConfirmDeleteDetail({
      open: false,
      detail: null,
    });
  };

  const handleDeleteDetail = async () => {
    const detail = confirmDeleteDetail.detail;
    if (!detail?.dishDetailId) return;

    setDeletingDetailId(detail.dishDetailId);

    try {
      const res = await fetch(
        `${DISH_DETAIL_ENDPOINT}/${detail.dishDetailId}`,
        {
          method: "DELETE",
          headers: {
            accept: "*/*",
          },
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Xóa nguyên liệu thất bại.");
      }

      toast.success("Xóa nguyên liệu thành công.");

      if (editingDetailId === detail.dishDetailId) {
        resetDetailForm();
      }

      closeDeleteDetailConfirm();
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra.");
    } finally {
      setDeletingDetailId(null);
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
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900">MÓN ĂN</span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm món ăn"
        />

        <main className="px-7 py-6 pb-10">
          <div className="mb-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpenFilter((v) => !v)}
              className="flex h-10 items-center gap-2 rounded-lg border border-[#F2B9A5] bg-[#FFFAF0] px-4 text-sm font-semibold text-[#E8712E] transition hover:bg-[#FFF3EA]"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Lọc
            </button>

            <button
              type="button"
              onClick={openAddDishModal}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#E8712E] px-4 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Thêm món
            </button>
          </div>

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
                      <option value="available">Đang bán</option>
                      <option value="unavailable">Ngừng bán</option>
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

          <div className="w-full">
            <div className="relative">
              <div className="flex items-center justify-between px-2 text-sm font-semibold text-[#E8712E]">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    className={`relative pb-5 transition ${
                      String(t.key) === String(activeTab)
                        ? "text-[#E8712E]"
                        : "text-[#E8712E]/70"
                    }`}
                  >
                    {t.label}
                    {String(t.key) === String(activeTab) && (
                      <span className="absolute bottom-[1px] left-0 h-[3px] w-12 bg-[#E54B2D]" />
                    )}
                  </button>
                ))}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2d2d2d]/70" />
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
            <div className="mt-32 grid grid-cols-1 gap-x-12 gap-y-28 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((dish) => (
                <DishCard
                  key={dish.dishId}
                  dish={dish}
                  details={detailsByDishId[String(dish.dishId)] || []}
                  onClick={() => openDishDetailModal(dish)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {openDishModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Thêm món mới</h2>
              <button
                type="button"
                onClick={closeAllModals}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleDishSubmit} className="space-y-4 p-6">
              <div className="flex flex-col items-center gap-3 pb-2">
                <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
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

                <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#F2B9A5] bg-[#FFFAF0] px-4 py-2 text-sm font-semibold text-[#E8712E] transition hover:bg-[#FFF3EA]">
                  Chọn ảnh từ máy
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDishImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">
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
                  className="h-10 rounded-lg border border-[#F2B9A5] bg-[#FFFAF0] px-4 text-sm font-semibold text-[#E8712E] transition hover:bg-[#FFF3EA]"
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

              <div className="rounded-2xl border border-dashed border-[#F2B9A5] bg-[#FFF9F4] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#E8712E]">
                  <Package2 className="h-4 w-4" />
                  Nguyên liệu đi kèm
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Sau khi tạo món xong, vào chi tiết món để thêm nguyên liệu.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="h-10 rounded-lg border border-gray-300 px-4 text-gray-700 transition hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingDish}
                  className="h-10 rounded-lg bg-[#E8712E] px-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {submittingDish ? "Đang thêm..." : "Lưu món"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openCategoryModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                Thêm danh mục mới
              </h2>
              <button
                type="button"
                onClick={() => setOpenCategoryModal(false)}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4 p-6">
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

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenCategoryModal(false)}
                  className="h-10 rounded-lg border border-gray-300 px-4 text-gray-700 transition hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="h-10 rounded-lg bg-[#E8712E] px-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {submittingCategory ? "Đang thêm..." : "Lưu danh mục"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openDetailModal && selectedDish && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                Chi tiết món ăn
              </h2>
              <button
                type="button"
                onClick={closeAllModals}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="hide-scrollbar max-h-[calc(92vh-72px)] overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-[#F4E2D8] bg-[#FFFDFC] p-5">
                  <form onSubmit={handleUpdateDish} className="space-y-4">
                    <div className="flex flex-col items-center gap-3 pb-2">
                      <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                        {dishImagePreview ? (
                          <img
                            src={dishImagePreview}
                            alt="preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm text-gray-400">
                            Chưa có ảnh
                          </span>
                        )}
                      </div>

                      <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#F2B9A5] bg-[#FFFAF0] px-4 py-2 text-sm font-semibold text-[#E8712E] transition hover:bg-[#FFF3EA]">
                        Chọn ảnh từ máy
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDishImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field
                        label="Tên món"
                        value={dishForm.dishName}
                        onChange={(v) =>
                          setDishForm((p) => ({ ...p, dishName: v }))
                        }
                        required
                      />
                      <Field
                        label="Giá"
                        type="number"
                        value={dishForm.price}
                        onChange={(v) =>
                          setDishForm((p) => ({ ...p, price: v }))
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
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
                            <option
                              key={c.dishCategoryId}
                              value={c.dishCategoryId}
                            >
                              {c.dishCategoryName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Trạng thái hiện tại
                        </label>
                        <div className="flex h-[42px] items-center rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-700">
                          {renderDishStatusLabel(selectedDish.status)}
                        </div>
                      </div>
                    </div>

                    <TextAreaField
                      label="Ghi chú"
                      value={dishForm.note}
                      onChange={(v) => setDishForm((p) => ({ ...p, note: v }))}
                    />

                    <TextAreaField
                      label="Mô tả"
                      value={dishForm.description}
                      onChange={(v) =>
                        setDishForm((p) => ({ ...p, description: v }))
                      }
                    />

                    <div className="flex justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleDeleteDish}
                        disabled={deletingDish}
                        className="flex h-10 items-center gap-2 rounded-lg bg-red-50 px-4 font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingDish ? "Đang xóa..." : "Xóa món"}
                      </button>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={closeAllModals}
                          className="h-10 rounded-lg border border-gray-300 px-4 text-gray-700 transition hover:bg-gray-50"
                        >
                          Đóng
                        </button>
                        <button
                          type="submit"
                          disabled={updatingDish}
                          className="flex h-10 items-center gap-2 rounded-lg bg-[#E8712E] px-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                          <Pencil className="h-4 w-4" />
                          {updatingDish ? "Đang lưu..." : "Cập nhật"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="rounded-2xl border border-[#F4E2D8] bg-white p-5">
                  <div className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
                    <ChefHat className="h-5 w-5 text-[#E8712E]" />
                    Nguyên liệu của món
                  </div>

                  <form
                    onSubmit={
                      editingDetailId ? handleUpdateDetail : handleCreateDetail
                    }
                    className="space-y-3 rounded-2xl border border-dashed border-[#F2B9A5] bg-[#FFF9F4] p-4"
                  >
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Nguyên liệu
                      </label>
                      <select
                        value={detailForm.ingredientId}
                        onChange={(e) =>
                          setDetailForm((p) => ({
                            ...p,
                            ingredientId: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#E8712E]"
                      >
                        <option value="">Chọn nguyên liệu</option>
                        {ingredients.map((item) => (
                          <option
                            key={item.ingredientId}
                            value={item.ingredientId}
                          >
                            {item.ingredientName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="Số lượng"
                        type="number"
                        value={detailForm.quantity}
                        onChange={(v) =>
                          setDetailForm((p) => ({ ...p, quantity: v }))
                        }
                        required
                      />
                      <Field
                        label="Đơn vị"
                        value={detailForm.unit}
                        onChange={(v) =>
                          setDetailForm((p) => ({ ...p, unit: v }))
                        }
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-1">
                      {editingDetailId && (
                        <button
                          type="button"
                          onClick={handleCancelEditDetail}
                          className="h-10 rounded-lg border border-gray-300 px-4 text-gray-700 transition hover:bg-gray-50"
                        >
                          Hủy sửa
                        </button>
                      )}

                      <button
                        type="submit"
                        disabled={submittingDetail || updatingDetail}
                        className="h-10 rounded-lg bg-[#E8712E] px-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                      >
                        {editingDetailId
                          ? updatingDetail
                            ? "Đang cập nhật..."
                            : "Cập nhật nguyên liệu"
                          : submittingDetail
                            ? "Đang thêm..."
                            : "Thêm nguyên liệu"}
                      </button>
                    </div>
                  </form>

                  <div className="mt-5">
                    {selectedDishDetails.length === 0 ? (
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                        Món này chưa có nguyên liệu nào.
                      </div>
                    ) : (
                      <div className="hide-scrollbar max-h-[420px] space-y-3 overflow-y-auto pr-1">
                        {selectedDishDetails.map((detail) => (
                          <div
                            key={detail.dishDetailId}
                            className="rounded-2xl border border-[#EEE] bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {detail.ingredientName ||
                                    `#${detail.ingredientId}`}
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                  {Number(detail.quantity).toLocaleString(
                                    "vi-VN",
                                  )}{" "}
                                  {detail.unit}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditDetail(detail)}
                                  className="rounded-lg bg-[#FFF3EA] p-2 text-[#E8712E] transition hover:bg-[#FFE6D5]"
                                  title="Sửa nguyên liệu"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openDeleteDetailConfirm(detail)
                                  }
                                  disabled={
                                    deletingDetailId === detail.dishDetailId
                                  }
                                  className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                                  title="Xóa nguyên liệu"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <div className="mt-2 text-xs text-gray-400">
                              DishDetailId: {detail.dishDetailId}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {ingredients.length === 0 && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      Chưa tải được danh sách nguyên liệu. Kiểm tra lại endpoint{" "}
                      <span className="font-semibold">/api/ingredient</span>.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteDetail.open && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">
                Xác nhận xóa nguyên liệu
              </h3>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-gray-600">
                Bạn có chắc muốn xóa nguyên liệu{" "}
                <span className="font-semibold text-gray-900">
                  "{confirmDeleteDetail.detail?.ingredientName}"
                </span>{" "}
                khỏi món này không?
              </p>
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={closeDeleteDetailConfirm}
                className="h-10 rounded-lg border border-gray-300 px-4 text-gray-700 transition hover:bg-gray-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleDeleteDetail}
                disabled={
                  deletingDetailId === confirmDeleteDetail.detail?.dishDetailId
                }
                className="h-10 rounded-lg bg-red-600 px-4 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deletingDetailId === confirmDeleteDetail.detail?.dishDetailId
                  ? "Đang xóa..."
                  : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DishCard({ dish, details, onClick }) {
  const imgSrc = getImageUrl(dish.img);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative min-h-[360px] overflow-visible rounded-2xl border border-[#F1F2F6] bg-white text-left shadow-[0_10px_22px_rgba(0,0,0,0.12)] transition hover:shadow-[0_14px_30px_rgba(0,0,0,0.16)]"
    >
      <div className="absolute left-1/2 top-[-64px] -translate-x-1/2">
        <div className="h-[190px] w-[190px] overflow-hidden rounded-full bg-white shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
          <img
            src={imgSrc}
            alt={dish.dishName}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="px-8 pb-8 pt-[138px] text-center">
        <div className="text-[20px] font-semibold text-gray-900">
          {dish.dishName || "Không có tên"}
        </div>

        <div className="mt-2 text-[20px] font-bold text-[#E54B2D]">
          {formatPrice(dish.price)}
        </div>

        <div className="mt-3 inline-flex rounded-full bg-[#FFF3EA] px-3 py-1 text-xs font-semibold text-[#E8712E]">
          {dish.dishCategoryName || "Chưa có danh mục"}
        </div>

        <div className="mt-3">
          <StatusBadge status={dish.status} />
        </div>

        <div className="mt-5 min-h-[44px] whitespace-pre-line text-[16px] leading-relaxed text-[#E54B2D]">
          {dish.note || "Không có ghi chú"}
        </div>

        <div className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-gray-500">
          {dish.description || "Không có mô tả"}
        </div>

        <div className="mt-5 rounded-xl bg-[#FFF9F4] px-4 py-3 text-left">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#E8712E]">
            Nguyên liệu đi kèm
          </div>
          {details.length === 0 ? (
            <div className="text-sm text-gray-400">Chưa có nguyên liệu</div>
          ) : (
            <div className="space-y-1">
              {details.slice(0, 3).map((item) => (
                <div key={item.dishDetailId} className="text-sm text-gray-700">
                  • {item.ingredientName} - {item.quantity} {item.unit}
                </div>
              ))}
              {details.length > 3 && (
                <div className="pt-1 text-xs font-medium text-[#E8712E]">
                  + {details.length - 3} nguyên liệu khác
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function Field({ label, value, onChange, required = false, type = "text" }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
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
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#E8712E]"
      />
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = normalizeDishStatus(status);

  const cls =
    normalized === "available"
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-red-200 bg-red-50 text-red-700";

  const text = normalized === "available" ? "Đang bán" : "Ngừng bán";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}
    >
      {text}
    </span>
  );
}

function normalizeDishStatus(status) {
  if (status === 1 || String(status) === "1") return "available";
  if (status === 0 || String(status) === "0") return "unavailable";

  const raw = String(status || "")
    .trim()
    .toUpperCase();

  if (["AVAILABLE", "ACTIVE", "ENABLE"].includes(raw)) return "available";
  return "unavailable";
}

function renderDishStatusLabel(status) {
  return normalizeDishStatus(status) === "available" ? "Đang bán" : "Ngừng bán";
}

function formatPrice(price) {
  const value = Number(price || 0);
  return `${value.toLocaleString("vi-VN")} VNĐ`;
}

function getImageUrl(img) {
  if (!img) {
    return "https://placehold.co/400x400?text=No+Image";
  }

  if (img.startsWith("http://") || img.startsWith("https://")) {
    return img;
  }

  return `${API_URL}${img}`;
}
