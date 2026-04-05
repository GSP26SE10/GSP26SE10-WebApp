import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import API_URL from "@/config/api";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DISH_CATEGORY_ENDPOINT = `${API_URL}/api/dish-category`;

export default function OwnerDishCategory() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [openDeleteModal, setOpenDeleteModal] = React.useState(false);

  const [selectedCategory, setSelectedCategory] = React.useState(null);

  const [submittingCreate, setSubmittingCreate] = React.useState(false);
  const [submittingEdit, setSubmittingEdit] = React.useState(false);
  const [submittingDelete, setSubmittingDelete] = React.useState(false);

  const [createForm, setCreateForm] = React.useState({
    dishCategoryName: "",
    description: "",
  });

  const [editForm, setEditForm] = React.useState({
    dishCategoryName: "",
    description: "",
  });

  const fetchAllCategories = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let page = 1;
      let allItems = [];
      let hasMore = true;

      while (hasMore) {
        const res = await fetch(
          `${DISH_CATEGORY_ENDPOINT}?page=${page}&pageSize=100`,
          {
            headers: { accept: "*/*" },
          },
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.message || "Không thể tải danh mục món");
        }

        const items = Array.isArray(data?.items) ? data.items : [];
        allItems = [...allItems, ...items];

        if (page >= Number(data?.totalPages || 1) || items.length === 0) {
          hasMore = false;
        } else {
          page += 1;
        }
      }

      setCategories(allItems);
    } catch (err) {
      const message = err.message || "Đã có lỗi xảy ra";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);

  const filteredCategories = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return categories;

    return categories.filter((category) => {
      return (
        category.dishCategoryName?.toLowerCase().includes(keyword) ||
        category.description?.toLowerCase().includes(keyword) ||
        String(category.dishCategoryId || "").includes(keyword)
      );
    });
  }, [categories, search]);

  const resetCreateForm = () => {
    setCreateForm({
      dishCategoryName: "",
      description: "",
    });
  };

  const resetEditForm = () => {
    setEditForm({
      dishCategoryName: "",
      description: "",
    });
  };

  const closeCreateModal = () => {
    setOpenCreateModal(false);
    resetCreateForm();
  };

  const closeEditModal = () => {
    setOpenEditModal(false);
    setSelectedCategory(null);
    resetEditForm();
  };

  const closeDeleteModal = () => {
    setOpenDeleteModal(false);
    setSelectedCategory(null);
  };

  const openCreateCategoryModal = () => {
    resetCreateForm();
    setOpenCreateModal(true);
  };

  const openEditCategoryModal = (category) => {
    setSelectedCategory(category);
    setEditForm({
      dishCategoryName: category.dishCategoryName || "",
      description: category.description || "",
    });
    setOpenEditModal(true);
  };

  const openDeleteCategoryModal = (category) => {
    setSelectedCategory(category);
    setOpenDeleteModal(true);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setSubmittingCreate(true);

    try {
      const payload = {
        dishCategoryName: createForm.dishCategoryName.trim(),
        description: createForm.description.trim(),
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
        throw new Error(data?.message || "Thêm danh mục thất bại");
      }

      toast.success("Thêm danh mục thành công");
      closeCreateModal();
      await fetchAllCategories();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();

    if (!selectedCategory?.dishCategoryId) return;
    setSubmittingEdit(true);

    try {
      const payload = {
        dishCategoryName: editForm.dishCategoryName.trim(),
        description: editForm.description.trim(),
      };

      if (!payload.dishCategoryName) {
        throw new Error("Vui lòng nhập tên danh mục.");
      }

      const res = await fetch(
        `${DISH_CATEGORY_ENDPOINT}/${selectedCategory.dishCategoryId}`,
        {
          method: "PUT",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Cập nhật danh mục thất bại");
      }

      toast.success("Cập nhật danh mục thành công");
      closeEditModal();
      await fetchAllCategories();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory?.dishCategoryId) return;
    setSubmittingDelete(true);

    try {
      const res = await fetch(
        `${DISH_CATEGORY_ENDPOINT}/${selectedCategory.dishCategoryId}`,
        {
          method: "DELETE",
          headers: {
            accept: "*/*",
          },
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Xóa danh mục thất bại");
      }

      toast.success("Xóa danh mục thành công");
      closeDeleteModal();
      await fetchAllCategories();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmittingDelete(false);
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
              <span className="text-gray-900">DANH MỤC MÓN ĂN</span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm danh mục"
        />

        <main className="px-7 py-6 pb-10">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-[20px] font-bold text-[#E54B2D]">
              Tất cả danh mục
            </h1>

            <button
              type="button"
              onClick={openCreateCategoryModal}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#E8712E] px-4 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Thêm danh mục
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {filteredCategories.map((category) => (
                <CategoryCard
                  key={category.dishCategoryId}
                  category={category}
                  onEdit={() => openEditCategoryModal(category)}
                  onDelete={() => openDeleteCategoryModal(category)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {openCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                Thêm danh mục mới
              </h2>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 p-6">
              <Field
                label="Tên danh mục"
                value={createForm.dishCategoryName}
                onChange={(v) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    dishCategoryName: v,
                  }))
                }
                required
              />

              <TextAreaField
                label="Mô tả"
                value={createForm.description}
                onChange={(v) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    description: v,
                  }))
                }
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="h-10 rounded-lg border border-gray-300 px-4 text-gray-700 transition hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="h-10 rounded-lg bg-[#E8712E] px-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {submittingCreate ? "Đang thêm..." : "Lưu danh mục"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openEditModal && selectedCategory && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                Cập nhật danh mục
              </h2>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleEditCategory} className="space-y-4 p-6">
              <Field
                label="Tên danh mục"
                value={editForm.dishCategoryName}
                onChange={(v) =>
                  setEditForm((prev) => ({
                    ...prev,
                    dishCategoryName: v,
                  }))
                }
                required
              />

              <TextAreaField
                label="Mô tả"
                value={editForm.description}
                onChange={(v) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: v,
                  }))
                }
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="h-10 rounded-lg border border-gray-300 px-4 text-gray-700 transition hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="h-10 rounded-lg bg-[#E8712E] px-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {submittingEdit ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openDeleteModal && selectedCategory && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                Xác nhận xóa danh mục
              </h2>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-gray-600">
                Bạn có chắc muốn xóa danh mục{" "}
                <span className="font-semibold text-gray-900">
                  "{selectedCategory.dishCategoryName}"
                </span>{" "}
                không?
              </p>
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="h-10 rounded-lg border border-gray-300 px-4 text-gray-700 transition hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteCategory}
                disabled={submittingDelete}
                className="h-10 rounded-lg bg-red-600 px-4 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {submittingDelete ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryCard({ category, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border border-[#F1E3D8] bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[18px] font-bold text-[#2D9C3C]">
          {category.dishCategoryName || "Không có tên"}
        </h3>

        <span className="rounded-full bg-[#FFF3EA] px-2 py-1 text-xs font-semibold text-[#E8712E]">
          #{category.dishCategoryId}
        </span>
      </div>

      <div className="mt-3 min-h-[44px] text-[14px] leading-relaxed text-[#5C5C5C]">
        {category.description || "Không có mô tả"}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-9 items-center gap-2 rounded-lg border border-[#F2B9A5] bg-[#FFFAF0] px-3 text-sm font-semibold text-[#E8712E] transition hover:bg-[#FFF3EA]"
        >
          <Pencil className="h-4 w-4" />
          Sửa
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="flex h-9 items-center gap-2 rounded-lg bg-red-50 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" />
          Xóa
        </button>
      </div>
    </div>
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
