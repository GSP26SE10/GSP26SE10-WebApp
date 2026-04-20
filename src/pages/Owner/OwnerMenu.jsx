import React from "react";
import Sidebar from "@/components/Sidebar";
import {
  SlidersHorizontal,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import API_URL from "@/config/api";
import Topbar from "@/components/Topbar";
import { toast } from "sonner";
import ChatPanel from "@/components/ChatPanel";

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "1", label: "Hoạt động" },
  { value: "0", label: "Ngưng hoạt động" },
];

const EMPTY_MENU_FORM = {
  menuName: "",
  menuCategoryId: "",
  partyCategoryIds: [],
  basePrice: "",
  status: "1",
  selectedDishIds: [],
};

export default function OwnerMenu() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [openChat, setOpenChat] = React.useState(false);

  const [menus, setMenus] = React.useState([]);
  const [allMenus, setAllMenus] = React.useState([]);
  const [dishes, setDishes] = React.useState([]);
  const [menuDishLinks, setMenuDishLinks] = React.useState([]);

  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 3;
  const [totalPages, setTotalPages] = React.useState(1);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [filters, setFilters] = React.useState({
    categoryId: "all",
    status: "all",
    priceMin: "",
    priceMax: "",
  });

  const [openAddModal, setOpenAddModal] = React.useState(false);
  const [openDetailModal, setOpenDetailModal] = React.useState(false);

  const [selectedMenu, setSelectedMenu] = React.useState(null);
  const [menuForm, setMenuForm] = React.useState(EMPTY_MENU_FORM);

  const [submitting, setSubmitting] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [dishSearch, setDishSearch] = React.useState("");

  const [menuImageFiles, setMenuImageFiles] = React.useState([]);
  const [newMenuImagePreviews, setNewMenuImagePreviews] = React.useState([]);
  const [existingMenuImages, setExistingMenuImages] = React.useState([]);

  const [menuCategories, setMenuCategories] = React.useState([]);
  const [partyCategories, setPartyCategories] = React.useState([]);
  const [loadingCategories, setLoadingCategories] = React.useState(true);
  const [categoryError, setCategoryError] = React.useState("");

  const EMPTY_MENU_CATEGORY_FORM = {
    menuCategoryName: "",
    description: "",
  };

  const [openMenuCategoryModal, setOpenMenuCategoryModal] =
    React.useState(false);
  const [menuCategoryForm, setMenuCategoryForm] = React.useState(
    EMPTY_MENU_CATEGORY_FORM,
  );
  const [creatingMenuCategory, setCreatingMenuCategory] = React.useState(false);
  const revokePreviewUrls = React.useCallback((urls) => {
    urls.forEach((url) => {
      if (typeof url === "string" && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
  }, []);

  React.useEffect(() => {
    return () => {
      revokePreviewUrls(newMenuImagePreviews);
    };
  }, [newMenuImagePreviews, revokePreviewUrls]);

  const resetMenuImages = React.useCallback(() => {
    revokePreviewUrls(newMenuImagePreviews);
    setMenuImageFiles([]);
    setNewMenuImagePreviews([]);
    setExistingMenuImages([]);
  }, [newMenuImagePreviews, revokePreviewUrls]);

  const fetchCategories = React.useCallback(async () => {
    setLoadingCategories(true);
    setCategoryError("");

    try {
      const [menuCategoryRes, partyCategoryRes] = await Promise.all([
        fetch(`${API_URL}/api/menu-category`, {
          headers: { accept: "*/*" },
        }),
        fetch(`${API_URL}/api/party-category`, {
          headers: { accept: "*/*" },
        }),
      ]);

      const [menuCategoryData, partyCategoryData] = await Promise.all([
        menuCategoryRes.json().catch(() => ({})),
        partyCategoryRes.json().catch(() => ({})),
      ]);

      if (!menuCategoryRes.ok) {
        throw new Error(
          menuCategoryData?.message || "Không thể tải danh sách loại menu",
        );
      }
      if (!partyCategoryRes.ok) {
        throw new Error(
          partyCategoryData?.message || "Không thể tải danh sách loại tiệc",
        );
      }

      setMenuCategories(extractItems(menuCategoryData));
      setPartyCategories(extractItems(partyCategoryData));
    } catch (err) {
      const message = err.message || "Đã có lỗi khi tải danh sách danh mục";
      setCategoryError(message);
      setMenuCategories([]);
      setPartyCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const handleMenuImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const nextFiles = files.filter(
      (file) =>
        !menuImageFiles.some(
          (existing) =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified,
        ),
    );

    if (nextFiles.length === 0) {
      e.target.value = "";
      return;
    }

    const nextPreviews = nextFiles.map((file) => URL.createObjectURL(file));

    setMenuImageFiles((prev) => [...prev, ...nextFiles]);
    setNewMenuImagePreviews((prev) => [...prev, ...nextPreviews]);
    e.target.value = "";
  };

  const removeNewMenuImage = (index) => {
    setMenuImageFiles((prev) => prev.filter((_, idx) => idx !== index));
    setNewMenuImagePreviews((prev) => {
      const removed = prev[index];
      revokePreviewUrls([removed]);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const removeExistingMenuImage = (index) => {
    setExistingMenuImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const fetchAllPages = async (basePath, pageSizeValue = 100) => {
    let currentPage = 1;
    let total = 1;
    const merged = [];

    do {
      const res = await fetch(
        `${API_URL}${basePath}?page=${currentPage}&pageSize=${pageSizeValue}`,
        { headers: { accept: "*/*" } },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.message || `Không thể tải dữ liệu từ ${basePath}`,
        );
      }

      const items = Array.isArray(data?.items) ? data.items : [];
      merged.push(...items);

      total = Number(data?.totalPages || 1);
      currentPage += 1;
    } while (currentPage <= total);

    return merged;
  };

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [menuItems, dishItems, menuDishItems] = await Promise.all([
        fetchAllPages("/api/menu", 50),
        fetchAllPages("/api/dish", 200),
        fetchAllPages("/api/menu-dish", 1000),
      ]);

      setAllMenus(menuItems);
      setDishes(dishItems);
      setMenuDishLinks(menuDishItems);
    } catch (err) {
      setError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
    fetchCategories();
  }, [fetchData, fetchCategories]);

  const getMenuDishIds = React.useCallback(
    (menuId) => {
      return menuDishLinks
        .filter((x) => Number(x.menuId) === Number(menuId))
        .map((x) => Number(x.dishId));
    },
    [menuDishLinks],
  );

  const getMenuPreviewDishes = React.useCallback(
    (menuId) => {
      const ids = getMenuDishIds(menuId);
      return dishes.filter((d) => ids.includes(Number(d.dishId)));
    },
    [dishes, getMenuDishIds],
  );

  const getMenuDishRelations = React.useCallback(
    (menuId) => {
      return menuDishLinks.filter((x) => Number(x.menuId) === Number(menuId));
    },
    [menuDishLinks],
  );

  const filteredMenus = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return allMenus.filter((menu) => {
      const menuName = String(menu.menuName || "").toLowerCase();
      const categoryName = String(menu.menuCategoryName || "").toLowerCase();
      const partyNames = getPartyCategoryLabel(menu).toLowerCase();
      const status = String(normalizeStatusValue(menu.status));
      const basePrice = Number(menu.basePrice || 0);
      const dishNames = getMenuPreviewDishes(menu.menuId)
        .map((dish) => String(dish.dishName || "").toLowerCase())
        .join(" ");

      const resolvedMenuCategoryId = resolveMenuCategoryIdFromMenu(
        menu,
        menuCategories,
      );

      const matchSearch =
        !keyword ||
        menuName.includes(keyword) ||
        categoryName.includes(keyword) ||
        partyNames.includes(keyword) ||
        dishNames.includes(keyword);

      const matchStatus =
        filters.status === "all" || status === String(filters.status);

      const matchCategory =
        filters.categoryId === "all" ||
        String(resolvedMenuCategoryId) === String(filters.categoryId);

      const min = filters.priceMin === "" ? null : Number(filters.priceMin);
      const max = filters.priceMax === "" ? null : Number(filters.priceMax);

      const matchMin = min === null || basePrice >= min;
      const matchMax = max === null || basePrice <= max;

      return (
        matchSearch && matchStatus && matchCategory && matchMin && matchMax
      );
    });
  }, [allMenus, search, filters, getMenuPreviewDishes, menuCategories]);

  React.useEffect(() => {
    setPage(1);
  }, [
    search,
    filters.categoryId,
    filters.status,
    filters.priceMin,
    filters.priceMax,
  ]);

  React.useEffect(() => {
    const nextTotalPages = Math.max(
      1,
      Math.ceil(filteredMenus.length / pageSize),
    );
    setTotalPages(nextTotalPages);

    const safePage = Math.min(page, nextTotalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;

    if (safePage !== page) {
      setPage(safePage);
      return;
    }

    setMenus(filteredMenus.slice(start, end));
  }, [filteredMenus, page]);

  const resetForm = React.useCallback(() => {
    setMenuForm(EMPTY_MENU_FORM);
    resetMenuImages();
  }, [resetMenuImages]);

  const openCreateModal = () => {
    resetForm();
    setDishSearch("");
    setOpenAddModal(true);
  };

  const openMenuDetail = (menu) => {
    setSelectedMenu(menu);

    setMenuForm({
      menuName: menu.menuName || "",
      menuCategoryId: resolveMenuCategoryIdFromMenu(menu, menuCategories),
      partyCategoryIds: normalizeIdArray(menu.partyCategoryIds),
      basePrice: String(menu.basePrice || ""),
      status: String(normalizeStatusValue(menu.status)),
      selectedDishIds: getMenuDishIds(menu.menuId),
    });

    setDishSearch("");
    revokePreviewUrls(newMenuImagePreviews);
    setMenuImageFiles([]);
    setNewMenuImagePreviews([]);
    setExistingMenuImages(normalizeImageUrls(menu.imgUrl));
    setOpenDetailModal(true);
  };

  const closeAllModals = () => {
    setOpenAddModal(false);
    setOpenDetailModal(false);
    setSelectedMenu(null);
    resetForm();
  };

  const syncMenuDishes = async (menuId, selectedDishIds) => {
    const currentRelations = getMenuDishRelations(menuId);
    const currentDishIds = currentRelations.map((x) => Number(x.dishId));

    const toAdd = selectedDishIds.filter(
      (id) => !currentDishIds.includes(Number(id)),
    );
    const toDelete = currentRelations.filter(
      (rel) => !selectedDishIds.includes(Number(rel.dishId)),
    );

    for (const dishId of toAdd) {
      await fetch(`${API_URL}/api/menu-dish`, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuId: Number(menuId),
          dishId: Number(dishId),
        }),
      });
    }

    for (const rel of toDelete) {
      await fetch(`${API_URL}/api/menu-dish/${rel.menuDishId}`, {
        method: "DELETE",
        headers: { accept: "*/*" },
      });
    }
  };

  const buildMenuFormData = ({ includeStatus = false } = {}) => {
    const formData = new FormData();
    const menuName = menuForm.menuName.trim();
    const menuCategoryId = Number(menuForm.menuCategoryId);
    const basePrice = Number(menuForm.basePrice);

    if (!menuName || !menuCategoryId || Number.isNaN(basePrice)) {
      throw new Error("Vui lòng nhập đầy đủ thông tin bắt buộc.");
    }

    formData.append("MenuName", menuName);
    formData.append("MenuCategoryId", String(menuCategoryId));
    formData.append("BasePrice", String(basePrice));

    normalizeIdArray(menuForm.partyCategoryIds).forEach((id) => {
      formData.append("PartyCategoryIds", String(id));
    });

    if (includeStatus) {
      formData.append("Status", String(normalizeStatusValue(menuForm.status)));
    }

    menuImageFiles.forEach((file) => {
      formData.append("ImgFiles", file);
    });

    return formData;
  };
  const handleCreateMenuCategory = async (e) => {
    e.preventDefault();

    if (!menuCategoryForm.menuCategoryName.trim()) {
      toast.error("Vui lòng nhập tên danh mục menu.");
      return;
    }

    setCreatingMenuCategory(true);

    try {
      const res = await fetch(`${API_URL}/api/menu-category`, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuCategoryName: menuCategoryForm.menuCategoryName.trim(),
          description: menuCategoryForm.description.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Thêm danh mục menu thất bại");
      }

      toast.success("Thêm danh mục menu thành công.");
      await fetchCategories();

      const createdId =
        data?.menuCategoryId ||
        data?.data?.menuCategoryId ||
        data?.id ||
        data?.data?.id;

      if (createdId) {
        setMenuForm((prev) => ({
          ...prev,
          menuCategoryId: String(createdId),
        }));
      }

      setMenuCategoryForm(EMPTY_MENU_CATEGORY_FORM);
      setOpenMenuCategoryModal(false);
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setCreatingMenuCategory(false);
    }
  };
  const handleCreateMenu = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const body = buildMenuFormData({ includeStatus: true });

      const res = await fetch(`${API_URL}/api/menu`, {
        method: "POST",
        headers: { accept: "*/*" },
        body,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Thêm menu thất bại");
      }

      const createdMenuId =
        data?.menuId || data?.data?.menuId || data?.id || data?.data?.id;

      if (createdMenuId && menuForm.selectedDishIds.length > 0) {
        await syncMenuDishes(createdMenuId, menuForm.selectedDishIds);
      }

      toast.success("Thêm menu thành công.");
      await fetchData();
      closeAllModals();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMenu = async (e) => {
    e.preventDefault();
    if (!selectedMenu?.menuId) return;

    setUpdating(true);

    try {
      const body = buildMenuFormData({ includeStatus: true });

      const res = await fetch(`${API_URL}/api/menu/${selectedMenu.menuId}`, {
        method: "PUT",
        headers: { accept: "*/*" },
        body,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Cập nhật menu thất bại");
      }

      await syncMenuDishes(selectedMenu.menuId, menuForm.selectedDishIds);
      await fetchData();

      toast.success("Cập nhật menu thành công.");
      closeAllModals();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteMenu = async () => {
    if (!selectedMenu?.menuId) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa menu "${selectedMenu.menuName}" không?`,
    );
    if (!confirmed) return;

    setDeleting(true);

    try {
      const relations = getMenuDishRelations(selectedMenu.menuId);

      for (const rel of relations) {
        await fetch(`${API_URL}/api/menu-dish/${rel.menuDishId}`, {
          method: "DELETE",
          headers: { accept: "*/*" },
        });
      }

      const res = await fetch(`${API_URL}/api/menu/${selectedMenu.menuId}`, {
        method: "DELETE",
        headers: { accept: "*/*" },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Xóa menu thất bại");
      }

      await fetchData();
      toast.success("Xóa menu thành công.");
      closeAllModals();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setDeleting(false);
    }
  };

  const toggleDishSelection = (dishId) => {
    setMenuForm((prev) => {
      const exists = prev.selectedDishIds.includes(Number(dishId));
      return {
        ...prev,
        selectedDishIds: exists
          ? prev.selectedDishIds.filter((id) => Number(id) !== Number(dishId))
          : [...prev.selectedDishIds, Number(dishId)],
      };
    });
  };

  const togglePartyCategoryId = (value) => {
    const numericValue = Number(value);
    if (!numericValue) return;

    setMenuForm((prev) => {
      const exists = prev.partyCategoryIds.includes(numericValue);
      return {
        ...prev,
        partyCategoryIds: exists
          ? prev.partyCategoryIds.filter((id) => Number(id) !== numericValue)
          : [...prev.partyCategoryIds, numericValue],
      };
    });
  };

  const filteredDishes = React.useMemo(() => {
    const keyword = dishSearch.trim().toLowerCase();
    if (!keyword) return dishes;

    return dishes.filter((dish) =>
      String(dish.dishName || "")
        .toLowerCase()
        .includes(keyword),
    );
  }, [dishes, dishSearch]);

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
              <span className="text-gray-900">MENU</span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm menu"
          onMailClick={() => setOpenChat(true)}
        />

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
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-gray-700">Lọc:</div>
                <select
                  value={filters.categoryId}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      categoryId: e.target.value,
                    }))
                  }
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#E8712E]"
                >
                  <option value="all">Tất cả loại</option>
                  {menuCategories.map((category) => {
                    const id = getMenuCategoryId(category);
                    const label = getMenuCategoryLabel(category);
                    return (
                      <option key={id} value={String(id)}>
                        {label}
                      </option>
                    );
                  })}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#E8712E]"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  value={filters.priceMin}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      priceMin: e.target.value,
                    }))
                  }
                  placeholder="Giá từ"
                  className="h-10 w-32 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#E8712E]"
                />

                <input
                  type="number"
                  value={filters.priceMax}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      priceMax: e.target.value,
                    }))
                  }
                  placeholder="Giá đến"
                  className="h-10 w-32 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#E8712E]"
                />

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
                  className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Đặt lại
                </button>
              </div>

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {menus.map((menu) => (
                <MenuCard
                  key={menu.menuId}
                  menu={menu}
                  previewItems={getMenuPreviewDishes(menu.menuId)}
                  onClick={() => openMenuDetail(menu)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {openAddModal && (
        <MenuModal
          title="Thêm menu mới"
          menuForm={menuForm}
          setMenuForm={setMenuForm}
          existingMenuImages={existingMenuImages}
          newMenuImagePreviews={newMenuImagePreviews}
          onImageChange={handleMenuImageChange}
          dishes={dishes}
          menuCategories={menuCategories}
          partyCategories={partyCategories}
          loadingCategories={loadingCategories}
          categoryError={categoryError}
          removeNewMenuImage={removeNewMenuImage}
          removeExistingMenuImage={removeExistingMenuImage}
          toggleDishSelection={toggleDishSelection}
          togglePartyCategoryId={togglePartyCategoryId}
          onClose={closeAllModals}
          onSubmit={handleCreateMenu}
          submitting={submitting}
          submitLabel={submitting ? "Đang thêm..." : "Lưu menu"}
          showStatus
          dishSearch={dishSearch}
          setDishSearch={setDishSearch}
          filteredDishes={filteredDishes}
          onOpenCreateCategory={() => setOpenMenuCategoryModal(true)}
        />
      )}

      {openDetailModal && selectedMenu && (
        <MenuModal
          title="Chi tiết menu"
          menuForm={menuForm}
          setMenuForm={setMenuForm}
          existingMenuImages={existingMenuImages}
          newMenuImagePreviews={newMenuImagePreviews}
          onImageChange={handleMenuImageChange}
          dishes={dishes}
          menuCategories={menuCategories}
          partyCategories={partyCategories}
          loadingCategories={loadingCategories}
          categoryError={categoryError}
          removeNewMenuImage={removeNewMenuImage}
          removeExistingMenuImage={removeExistingMenuImage}
          toggleDishSelection={toggleDishSelection}
          togglePartyCategoryId={togglePartyCategoryId}
          onClose={closeAllModals}
          onSubmit={handleUpdateMenu}
          submitting={updating}
          submitLabel={updating ? "Đang lưu..." : "Cập nhật"}
          showStatus
          dishSearch={dishSearch}
          setDishSearch={setDishSearch}
          filteredDishes={filteredDishes}
          footerLeft={
            <button
              type="button"
              onClick={handleDeleteMenu}
              disabled={deleting}
              className="h-10 px-4 rounded-lg bg-red-50 text-red-600 font-semibold flex items-center gap-2 hover:bg-red-100 transition disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Đang xóa..." : "Xóa menu"}
            </button>
          }
          onOpenCreateCategory={() => setOpenMenuCategoryModal(true)}
        />
      )}
      {openMenuCategoryModal && (
        <div className="fixed inset-0 z-[110] bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                Thêm danh mục menu
              </h2>
              <button
                type="button"
                onClick={() => {
                  setOpenMenuCategoryModal(false);
                  setMenuCategoryForm(EMPTY_MENU_CATEGORY_FORM);
                }}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleCreateMenuCategory} className="p-6 space-y-4">
              <Field
                label="Tên danh mục"
                value={menuCategoryForm.menuCategoryName}
                onChange={(v) =>
                  setMenuCategoryForm((prev) => ({
                    ...prev,
                    menuCategoryName: v,
                  }))
                }
                required
              />

              <textarea
                value={menuCategoryForm.description}
                onChange={(e) =>
                  setMenuCategoryForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={4}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Mô tả"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpenMenuCategoryModal(false)}
                  className="border px-4 py-2 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-[#E8712E] text-white px-4 py-2 rounded-lg"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ChatPanel open={openChat} onClose={() => setOpenChat(false)} />
    </div>
  );
}

function MenuModal({
  title,
  menuForm,
  setMenuForm,
  existingMenuImages,
  newMenuImagePreviews,
  onImageChange,
  dishes,
  menuCategories,
  partyCategories,
  loadingCategories,
  categoryError,
  removeNewMenuImage,
  removeExistingMenuImage,
  toggleDishSelection,
  togglePartyCategoryId,
  onClose,
  onSubmit,
  submitting,
  submitLabel,
  showStatus,
  dishSearch,
  setDishSearch,
  filteredDishes,
  footerLeft = null,
  onOpenCreateCategory,
}) {
  const allPreviewImages = [
    ...existingMenuImages.map((src) => ({ src, type: "existing" })),
    ...newMenuImagePreviews.map((src) => ({ src, type: "new" })),
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="hide-scrollbar max-h-[calc(90vh-80px)] overflow-y-auto p-6 space-y-5"
        >
          <div className="space-y-3 pb-1">
            {allPreviewImages.length > 0 ? (
              <div className="overflow-x-auto pb-2">
                <div
                  className={`flex gap-3 ${allPreviewImages.length <= 2 ? "sm:grid sm:grid-cols-2" : ""}`}
                >
                  {allPreviewImages.map((image, index) => (
                    <div
                      key={`${image.type}-${image.src}-${index}`}
                      className="relative h-44 min-w-[260px] sm:min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          image.type === "existing"
                            ? removeExistingMenuImage(index)
                            : removeNewMenuImage(
                                index - existingMenuImages.length,
                              )
                        }
                        className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1 text-gray-600 shadow-sm hover:bg-white"
                      >
                        ✕
                      </button>
                      <img
                        src={image.src}
                        alt={`menu-preview-${index}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-44 w-full overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-sm text-gray-400">
                Chưa có ảnh menu
              </div>
            )}

            <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#F2B9A5] bg-[#FFFAF0] px-4 py-2 text-sm font-semibold text-[#E8712E] hover:bg-[#FFF3EA] transition">
              Chọn ảnh từ máy
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onImageChange}
                className="hidden"
              />
            </label>
          </div>

          <Field
            label="Tên menu"
            value={menuForm.menuName}
            onChange={(v) => setMenuForm((prev) => ({ ...prev, menuName: v }))}
            required
          />

          <div className="flex flex-col">
            <div className="mb-1 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-gray-700">
                Loại menu
              </label>

              <button
                type="button"
                onClick={onOpenCreateCategory}
                className="inline-flex items-center gap-1 rounded-lg border border-[#F2B9A5] bg-[#FFF3EA] px-3 py-1 text-xs font-semibold text-[#E8712E] hover:bg-[#FFE7D9]"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm danh mục
              </button>
            </div>

            <select
              value={menuForm.menuCategoryId}
              onChange={(e) =>
                setMenuForm((prev) => ({
                  ...prev,
                  menuCategoryId: e.target.value,
                }))
              }
              className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-[#E8712E]"
              required
            >
              <option value="">Chọn loại menu</option>
              {menuCategories.map((category) => {
                const id = getMenuCategoryId(category);
                const label = getMenuCategoryLabel(category);
                return (
                  <option key={id} value={String(id)}>
                    {label}
                  </option>
                );
              })}
            </select>

            <div className="mt-1 min-h-[20px]">
              {loadingCategories && (
                <p className="text-xs text-gray-500">
                  Đang tải danh mục menu...
                </p>
              )}
              {!loadingCategories && categoryError && (
                <p className="text-xs text-red-500">{categoryError}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá cơ bản
            </label>

            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={formatVndInput(menuForm.basePrice)}
                onChange={(e) =>
                  setMenuForm((prev) => ({
                    ...prev,
                    basePrice: sanitizeMoneyInput(e.target.value),
                  }))
                }
                placeholder="Nhập giá cơ bản"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-14 outline-none focus:border-[#E8712E]"
                required
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                VNĐ
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại tiệc
            </label>
            <div className="rounded-xl border border-gray-200 p-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                {menuForm.partyCategoryIds.length > 0 ? (
                  menuForm.partyCategoryIds.map((id) => {
                    const category = partyCategories.find(
                      (item) => Number(getPartyCategoryId(item)) === Number(id),
                    );
                    const label = category
                      ? getPartyCategoryLabelOption(category)
                      : `ID: ${id}`;
                    return (
                      <span
                        key={id}
                        className="rounded-full bg-[#FFF3EA] px-3 py-1 text-sm text-[#E8712E]"
                      >
                        {label}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-sm text-gray-400">
                    Chưa chọn loại tiệc
                  </span>
                )}
              </div>

              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {partyCategories.length > 0 ? (
                  partyCategories.map((category) => {
                    const id = getPartyCategoryId(category);
                    const label = getPartyCategoryLabelOption(category);
                    const checked = menuForm.partyCategoryIds.includes(
                      Number(id),
                    );
                    return (
                      <label
                        key={id}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePartyCategoryId(id)}
                        />
                        <span className="text-sm text-gray-800">{label}</span>
                      </label>
                    );
                  })
                ) : (
                  <div className="text-sm text-gray-500">
                    {loadingCategories
                      ? "Đang tải loại tiệc..."
                      : "Không có loại tiệc khả dụng."}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn món cho menu
            </label>
            <div className="mb-3">
              <input
                type="text"
                value={dishSearch}
                onChange={(e) => setDishSearch(e.target.value)}
                placeholder="Tìm theo tên món"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#E8712E] focus:ring-2 focus:ring-[#FFE7D9]"
              />
            </div>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 p-3 space-y-2">
              {filteredDishes.length === 0 ? (
                <div className="text-sm text-gray-500">
                  Không tìm thấy món ăn nào.
                </div>
              ) : (
                filteredDishes.map((dish) => {
                  const checked = menuForm.selectedDishIds.includes(
                    Number(dish.dishId),
                  );

                  return (
                    <label
                      key={dish.dishId}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDishSelection(dish.dishId)}
                      />
                      <span className="text-sm text-gray-800">
                        {dish.dishName}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-2">
            <div>{footerLeft}</div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-10 px-4 rounded-lg bg-[#E8712E] text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
              >
                {submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function MenuCard({ menu, previewItems, onClick }) {
  const imgUrls = normalizeImageUrls(menu.imgUrl);
  const firstImage = imgUrls[0] || "";
  const partyLabel = getPartyCategoryLabel(menu);

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white rounded-xl border border-[#F1F2F6] shadow-[0_6px_18px_rgba(15,23,42,0.08)] overflow-hidden transition hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)] h-fit"
    >
      <div className="px-6 pt-6">
        <div className="text-[#E8712E] font-bold">{menu.menuName}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
          <span>Tạo ngày {formatDate(menu.createdAt)}</span>
          {menu.menuCategoryName && (
            <span className="rounded-full bg-[#FFF3EA] px-2 py-1 text-[#E8712E]">
              {menu.menuCategoryName}
            </span>
          )}
          {partyLabel && (
            <span className="rounded-full bg-[#F5F5F5] px-2 py-1 text-gray-600">
              {partyLabel}
            </span>
          )}
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(
              menu.status,
            )}`}
          >
            {getStatusLabel(menu.status)}
          </span>
        </div>
      </div>

      <div className="px-6 pt-4">
        <div className="h-44 w-full overflow-hidden rounded-xl bg-white shadow-[0_6px_18px_rgba(0,0,0,0.08)] flex items-center justify-center">
          {firstImage ? (
            <img
              src={firstImage}
              alt={menu.menuName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm text-gray-400">Không có ảnh</span>
          )}
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">
            Danh sách món
          </div>
          <div className="text-xs text-gray-500">{previewItems.length} món</div>
        </div>

        <div className="hide-scrollbar max-h-80 overflow-y-auto pr-1 space-y-5">
          {previewItems.length > 0 ? (
            previewItems.map((it) => (
              <div key={it.dishId} className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-full bg-white shadow-[0_10px_20px_rgba(0,0,0,0.18)] overflow-hidden flex-none flex items-center justify-center">
                  {getDishImageUrl(it.img) ? (
                    <img
                      src={getDishImageUrl(it.img)}
                      alt={it.dishName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-400">No image</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900">
                    {it.dishName}
                  </div>
                  <div className="text-xs text-gray-400 whitespace-pre-line leading-relaxed">
                    {it.description || it.note || "Không có mô tả"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-400">
              Chưa có món nào trong menu
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-[#F1F2F6] flex items-center justify-between">
        <div className="text-xs text-gray-500">Menu #{menu.menuId}</div>
        <div className="text-sm font-bold text-[#E54B2D]">
          {formatPrice(menu.basePrice)}
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

function extractItems(data) {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

function getMenuCategoryId(category) {
  return category.menuCategoryId ?? category.id ?? category.categoryId ?? "";
}

function getMenuCategoryLabel(category) {
  return (
    category.menuCategoryName ||
    category.categoryName ||
    category.name ||
    String(getMenuCategoryId(category))
  );
}

function getPartyCategoryId(category) {
  return category.partyCategoryId ?? category.id ?? category.categoryId ?? "";
}

function getPartyCategoryLabelOption(category) {
  return (
    category.partyCategoryName ||
    category.categoryName ||
    category.name ||
    String(getPartyCategoryId(category))
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

function normalizeStatusValue(status) {
  if (status === 0 || status === "0") return 0;
  return 1;
}

function getStatusLabel(status) {
  return normalizeStatusValue(status) === 1 ? "Hoạt động" : "Ngưng hoạt động";
}

function getStatusBadgeClass(status) {
  return normalizeStatusValue(status) === 1
    ? "bg-emerald-100 text-emerald-700"
    : "bg-slate-100 text-slate-500";
}

function normalizeIdArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function normalizeImageUrls(img) {
  if (Array.isArray(img)) {
    return img.filter(Boolean);
  }

  if (typeof img === "string" && img.trim()) {
    if (img.startsWith("[")) {
      try {
        const parsed = JSON.parse(img);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch {
        return [img];
      }
    }
    return [img];
  }

  return [];
}

function getPartyCategoryLabel(menu) {
  if (
    Array.isArray(menu.partyCategoryNames) &&
    menu.partyCategoryNames.length > 0
  ) {
    return menu.partyCategoryNames.join(", ");
  }

  if (
    typeof menu.partyCategoryName === "string" &&
    menu.partyCategoryName.trim()
  ) {
    return menu.partyCategoryName;
  }

  return "";
}

function getDishImageUrl(img) {
  if (!img) return "";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  return `${API_URL}${img}`;
}
function resolveMenuCategoryIdFromMenu(menu, menuCategories) {
  const directId =
    menu?.menuCategoryId ??
    menu?.categoryId ??
    menu?.id ??
    menu?.menuCategory?.menuCategoryId ??
    menu?.menuCategory?.id;

  if (directId !== undefined && directId !== null && String(directId) !== "") {
    return String(directId);
  }

  const menuCategoryName = String(
    menu?.menuCategoryName ||
      menu?.categoryName ||
      menu?.menuCategory?.menuCategoryName ||
      menu?.menuCategory?.name ||
      "",
  )
    .trim()
    .toLowerCase();

  if (!menuCategoryName) return "";

  const matched = menuCategories.find((category) => {
    const label = String(getMenuCategoryLabel(category)).trim().toLowerCase();
    return label === menuCategoryName;
  });

  return matched ? String(getMenuCategoryId(matched)) : "";
}

function sanitizeMoneyInput(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatVndInput(value) {
  const numeric = String(value || "").replace(/\D/g, "");
  if (!numeric) return "";
  return Number(numeric).toLocaleString("vi-VN");
}
