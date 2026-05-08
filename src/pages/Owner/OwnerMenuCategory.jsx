import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import API_URL from "@/config/api";
import { toast } from "sonner";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";

const PAGE_SIZE = 9;

const EMPTY_FORM = {
  menuCategoryName: "",
  description: "",
};

export default function OwnerMenuCategory() {
  const [sbExpanded, setSbExpanded] = React.useState(false);

  const [allCategories, setAllCategories] = React.useState([]);
  const [categories, setCategories] = React.useState([]);

  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [openModal, setOpenModal] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [form, setForm] = React.useState(EMPTY_FORM);

  const [submitting, setSubmitting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const getAuthHeaders = React.useCallback((json = false) => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken");

    return {
      accept: "*/*",
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const fetchAllPages = React.useCallback(
    async (basePath, pageSize = 50) => {
      let currentPage = 1;
      let total = 1;
      const merged = [];

      do {
        const res = await fetch(
          `${API_URL}${basePath}?page=${currentPage}&pageSize=${pageSize}`,
          { headers: getAuthHeaders(false) },
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            data?.message || `Không thể tải dữ liệu từ ${basePath}`,
          );
        }

        merged.push(...(Array.isArray(data?.items) ? data.items : []));
        total = Number(data?.totalPages || 1);
        currentPage += 1;
      } while (currentPage <= total);

      return merged;
    },
    [getAuthHeaders],
  );

  const fetchCategories = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const items = await fetchAllPages("/api/menu-category", 50);
      setAllCategories(items);
    } catch (err) {
      const message = err.message || "Đã có lỗi xảy ra";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [fetchAllPages]);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return allCategories.filter((category) => {
      const name = String(category.menuCategoryName || "").toLowerCase();
      const description = String(category.description || "").toLowerCase();

      return (
        !keyword || name.includes(keyword) || description.includes(keyword)
      );
    });
  }, [allCategories, search]);

  React.useEffect(() => {
    setPage(1);
  }, [search]);

  React.useEffect(() => {
    const nextTotalPages = Math.max(
      1,
      Math.ceil(filteredCategories.length / PAGE_SIZE),
    );
    setTotalPages(nextTotalPages);

    const safePage = Math.min(page, nextTotalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    if (safePage !== page) {
      setPage(safePage);
      return;
    }

    setCategories(filteredCategories.slice(start, end));
  }, [filteredCategories, page]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setSelectedCategory(null);
  };

  const openCreate = () => {
    resetForm();
    setOpenModal(true);
  };

  const openDetail = (category) => {
    setSelectedCategory(category);
    setForm({
      menuCategoryName: category.menuCategoryName || "",
      description: category.description || "",
    });
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    resetForm();
  };

  const buildPayload = () => {
    const menuCategoryName = form.menuCategoryName.trim();
    const description = form.description.trim();

    if (!menuCategoryName || !description) {
      throw new Error("Vui lòng nhập đầy đủ tên danh mục và mô tả.");
    }

    return {
      menuCategoryName,
      description,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const isEdit = Boolean(selectedCategory?.menuCategoryId);

    try {
      const payload = buildPayload();

      const res = await fetch(
        isEdit
          ? `${API_URL}/api/menu-category/${selectedCategory.menuCategoryId}`
          : `${API_URL}/api/menu-category`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.message ||
            (isEdit ? "Cập nhật danh mục thất bại" : "Thêm danh mục thất bại"),
        );
      }

      toast.success(
        isEdit ? "Cập nhật danh mục thành công." : "Thêm danh mục thành công.",
      );
      await fetchCategories();
      closeModal();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory?.menuCategoryId) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa danh mục "${selectedCategory.menuCategoryName}" không?`,
    );
    if (!confirmed) return;

    setDeleting(true);

    try {
      const res = await fetch(
        `${API_URL}/api/menu-category/${selectedCategory.menuCategoryId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(false),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Xóa danh mục thất bại");
      }

      toast.success("Xóa danh mục thành công.");
      await fetchCategories();
      closeModal();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F2] font-main">
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
              <span className="text-gray-900">DANH MỤC MENU</span>
            </>
          }
          showSearch={false}
        />

        <main className="px-7 py-6">
          <div className="mb-6 rounded-3xl border border-[#F2E2D7] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <h1 className="text-[22px] font-bold text-[#E54B2D]">
                  Quản lý danh mục menu
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Thêm, sửa, xóa và tìm kiếm danh mục menu.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreate}
                className="h-11 rounded-xl bg-[#E8712E] px-4 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
              >
                <Plus className="h-4 w-4" />
                Thêm danh mục
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên danh mục hoặc mô tả"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#FFFDFC] pl-11 pr-4 text-sm text-gray-700 outline-none transition focus:border-[#E8712E]"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-10 w-10 rounded-full border border-[#F2B9A5] bg-white text-[#E8712E] flex items-center justify-center hover:bg-[#FFF3EA] transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="h-10 w-10 rounded-full border border-[#F2B9A5] bg-[#E8712E] text-white flex items-center justify-center hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <MenuCategoryCard
                  key={category.menuCategoryId}
                  category={category}
                  onClick={() => openDetail(category)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {openModal && (
        <MenuCategoryModal
          form={form}
          setForm={setForm}
          selectedCategory={selectedCategory}
          submitting={submitting}
          deleting={deleting}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function MenuCategoryCard({ category, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-[#E9E2D8] bg-white p-5 text-left shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[18px] font-bold leading-snug text-[#2D9C3C] line-clamp-2">
            {category.menuCategoryName || "Chưa có tên"}
          </div>
        </div>

        <div className="shrink-0 rounded-full bg-[#FFF3EA] p-2 text-[#E8712E]">
          <Pencil className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 min-h-[72px] text-sm leading-relaxed text-[#8A8A8A] line-clamp-4">
        {category.description || "Chưa có mô tả"}
      </div>

      {category.createdAt && (
        <div className="mt-4 border-t border-[#F2E2D7] pt-3 text-xs text-gray-400">
          Ngày tạo: {formatDate(category.createdAt)}
        </div>
      )}
    </button>
  );
}

function MenuCategoryModal({
  form,
  setForm,
  selectedCategory,
  submitting,
  deleting,
  onClose,
  onSubmit,
  onDelete,
}) {
  const isEdit = Boolean(selectedCategory?.menuCategoryId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? "Chi tiết danh mục menu" : "Thêm danh mục menu"}
            </h2>
            {isEdit && (
              <p className="mt-1 text-xs text-gray-400">
                ID: #{selectedCategory.menuCategoryId}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          <Field
            label="Tên danh mục"
            value={form.menuCategoryName}
            onChange={(v) =>
              setForm((prev) => ({ ...prev, menuCategoryName: v }))
            }
            required
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mô tả
            </label>
            <textarea
              value={form.description}
              required
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={5}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#E8712E]"
              placeholder="Nhập mô tả danh mục"
            />
          </div>

          <div className="flex justify-between gap-3 pt-2">
            <div>
              {isEdit && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={deleting}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-50 px-4 font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Đang xóa..." : "Xóa"}
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-lg border border-gray-300 px-4 text-gray-700 transition hover:bg-gray-50"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#E8712E] px-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {submitting
                  ? "Đang lưu..."
                  : isEdit
                    ? "Cập nhật"
                    : "Thêm danh mục"}
              </button>
            </div>
          </div>
        </form>
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

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN");
}
