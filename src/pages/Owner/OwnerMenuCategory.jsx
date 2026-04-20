import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import API_URL from "@/config/api";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM = {
  menuCategoryName: "",
  description: "",
  status: 1,
};

export default function OwnerMenuCategory() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");

  const [openModal, setOpenModal] = React.useState(false);
  const [modalMode, setModalMode] = React.useState("create");
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [form, setForm] = React.useState(EMPTY_FORM);

  const [submitting, setSubmitting] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState(null);

  const fetchAllPages = async () => {
    let currentPage = 1;
    let total = 1;
    const merged = [];

    do {
      const res = await fetch(
        `${API_URL}/api/menu-category?page=${currentPage}&pageSize=100`,
        {
          headers: { accept: "*/*" },
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải danh mục menu");
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
      const items = await fetchAllPages();
      setCategories(items);
    } catch (err) {
      setError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return categories;

    return categories.filter((item) => {
      return (
        String(item.menuCategoryName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.description || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [categories, search]);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedItem(null);
    setForm(EMPTY_FORM);
    setOpenModal(true);
  };

  const openEditModal = (item) => {
    setModalMode("edit");
    setSelectedItem(item);
    setForm({
      menuCategoryName: item.menuCategoryName || "",
      description: item.description || "",
      status: Number(item.status ?? 1),
    });
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setSelectedItem(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.menuCategoryName.trim()) {
      toast.error("Vui lòng nhập tên danh mục menu.");
      return;
    }

    setSubmitting(true);

    try {
      const isCreate = modalMode === "create";
      const url = isCreate
        ? `${API_URL}/api/menu-category`
        : `${API_URL}/api/menu-category/${selectedItem.menuCategoryId}`;

      const method = isCreate ? "POST" : "PUT";

      const payload = {
        menuCategoryName: form.menuCategoryName.trim(),
        description: form.description.trim(),
        status: Number(form.status),
      };

      const res = await fetch(url, {
        method,
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.message ||
            (isCreate
              ? "Thêm danh mục menu thất bại"
              : "Cập nhật danh mục menu thất bại"),
        );
      }

      toast.success(
        isCreate
          ? "Thêm danh mục menu thành công"
          : "Cập nhật danh mục menu thành công",
      );

      await fetchData();
      closeModal();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa danh mục "${item.menuCategoryName}" không?`,
    );
    if (!confirmed) return;

    setDeletingId(item.menuCategoryId);

    try {
      const res = await fetch(
        `${API_URL}/api/menu-category/${item.menuCategoryId}`,
        {
          method: "DELETE",
          headers: { accept: "*/*" },
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Xóa danh mục menu thất bại");
      }

      toast.success("Xóa danh mục menu thành công");
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setDeletingId(null);
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
              <span className="text-gray-900">DANH MỤC MENU</span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm danh mục menu"
        />

        <main className="px-7 py-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="text-[20px] font-bold text-[#E54B2D]">
              Quản lý danh mục menu
            </h1>

            <button
              type="button"
              onClick={openCreateModal}
              className="h-11 px-4 rounded-lg bg-[#E8712E] text-white font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition"
            >
              <Plus className="h-4 w-4" />
              Thêm danh mục
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
          ) : error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-sm text-gray-500">
              Không có danh mục menu phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#F1F2F6] bg-white">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-[#FFF3EA]">
                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#2F3A67]">
                      ID
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#2F3A67]">
                      Tên danh mục
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#2F3A67]">
                      Mô tả
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#2F3A67]">
                      Trạng thái
                    </th>
                    <th className="px-4 py-4 text-right text-sm font-semibold text-[#2F3A67]">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.menuCategoryId}
                      className="border-t border-[#F1F2F6]"
                    >
                      <td className="px-4 py-4 text-sm text-gray-700">
                        #{item.menuCategoryId}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-[#2F3A67]">
                        {item.menuCategoryName}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {item.description || "--"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            Number(item.status) === 1
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {Number(item.status) === 1
                            ? "Hoạt động"
                            : "Ngưng hoạt động"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="h-9 px-3 rounded-lg border border-gray-200 text-sm font-medium text-[#2F3A67] hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Sửa
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item.menuCategoryId}
                            className="h-9 px-3 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingId === item.menuCategoryId
                              ? "Đang xóa..."
                              : "Xóa"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {modalMode === "create"
                  ? "Thêm danh mục menu"
                  : "Cập nhật danh mục menu"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên danh mục
                </label>
                <input
                  type="text"
                  value={form.menuCategoryName}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      menuCategoryName: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#E8712E]"
                  placeholder="Ví dụ: Buffet bò"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#E8712E]"
                  placeholder="Nhập mô tả danh mục menu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={String(form.status)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#E8712E]"
                >
                  <option value="1">Hoạt động</option>
                  <option value="0">Ngưng hoạt động</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-10 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-4 rounded-lg bg-[#E8712E] text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
                >
                  {submitting
                    ? "Đang lưu..."
                    : modalMode === "create"
                      ? "Thêm danh mục"
                      : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
