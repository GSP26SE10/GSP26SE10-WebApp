import React from "react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import API_URL from "@/config/api";
import {
  ClipboardList,
  Filter,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Image as ImageIcon,
} from "lucide-react";

const EMPTY_FORM = {
  ingredientName: "",
  description: "",
  img: "",
  imageFile: null,
};

export default function OwnerIngredient() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [ingredients, setIngredients] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const [openModal, setOpenModal] = React.useState(false);
  const [modalMode, setModalMode] = React.useState("create");
  const [submitting, setSubmitting] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState(null);
  const [editingId, setEditingId] = React.useState(null);
  const [form, setForm] = React.useState(EMPTY_FORM);

  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  const authHeaders = React.useMemo(
    () => ({
      accept: "*/*",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const fetchIngredients = React.useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/ingredient`, {
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải danh sách nguyên liệu");
      }

      const items = Array.isArray(data?.items) ? data.items : [];
      setIngredients(items);
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  React.useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const filteredIngredients = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return ingredients;

    return ingredients.filter((item) => {
      return (
        String(item.ingredientId).includes(keyword) ||
        String(item.ingredientName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.description || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [ingredients, search]);

  const stats = React.useMemo(
    () => [
      {
        title: "Tổng nguyên liệu",
        value: ingredients.length,
        icon: <ClipboardList className="h-5 w-5" />,
        bg: "bg-blue-100",
        text: "text-blue-600",
      },
    ],
    [ingredients],
  );

  const resetForm = React.useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    resetForm();
    setOpenModal(true);
  };

  const openEditModal = async (item) => {
    setModalMode("edit");
    setEditingId(item.ingredientId);
    setForm({
      ingredientName: item.ingredientName || "",
      description: item.description || "",
      img: item.img || "",
      imageFile: null,
    });
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    resetForm();
  };

  const handleChangeForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageFileChange = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setForm((prev) => ({
          ...prev,
          img: e.target.result,
          imageFile: file,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("ingredientName", form.ingredientName);
      formData.append("description", form.description);
      if (form.imageFile) {
        formData.append("image", form.imageFile);
      } else if (form.img) {
        formData.append("img", form.img);
      }

      const method = modalMode === "create" ? "POST" : "PUT";
      const url =
        modalMode === "create"
          ? `${API_URL}/api/ingredient`
          : `${API_URL}/api/ingredient/${editingId}`;

      const res = await fetch(url, {
        method,
        headers:
          modalMode === "create"
            ? { Authorization: `Bearer ${token}` }
            : {
                Authorization: `Bearer ${token}`,
              },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Thao tác thất bại");
      }

      toast.success(
        modalMode === "create"
          ? "Tạo nguyên liệu thành công"
          : "Cập nhật nguyên liệu thành công",
      );
      closeModal();
      await fetchIngredients();
    } catch (err) {
      toast.error(err.message || "Thao tác thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa nguyên liệu \"${item.ingredientName}\" không?`,
    );
    if (!confirmed) return;
    setDeletingId(item.ingredientId);

    try {
      const res = await fetch(
        `${API_URL}/api/ingredient/${item.ingredientId}`,
        {
          method: "DELETE",
          headers: authHeaders,
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Xóa nguyên liệu thất bại");
      }
      toast.success("Xóa nguyên liệu thành công");
      await fetchIngredients();
    } catch (err) {
      toast.error(err.message || "Xóa nguyên liệu thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F2EA] font-main">
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
              <span className="text-[#2F3A67] font-bold">NGUYÊN LIỆU</span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm nguyên liệu"
        />

        <main className="px-7 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {stats.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-white px-6 py-5 flex items-center gap-4"
              >
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center ${item.bg} ${item.text}`}
                >
                  {item.icon}
                </div>

                <div>
                  <div className="text-sm text-[#8DA1C1]">{item.title}</div>
                  <div className="text-3xl font-bold text-[#1F2937]">
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <h1 className="text-[20px] font-bold text-[#E54B2D]">
              Quản lý nguyên liệu
            </h1>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2F3A67] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Thêm nguyên liệu
            </button>
          </div>

          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[24px] font-bold text-[#2F3A67]">
                Danh sách nguyên liệu
              </h2>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-[#D6DFEF] bg-white px-4 py-2 text-sm font-medium text-[#8DA1C1] hover:bg-gray-50"
              >
                <Filter className="h-4 w-4" />
                Lọc
              </button>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-[#FAFBFD] p-6 text-sm text-gray-500">
                Đang tải nguyên liệu...
              </div>
            ) : filteredIngredients.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFBFD] p-6 text-sm text-gray-500">
                Không tìm thấy nguyên liệu nào.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr>
                      <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                        Ảnh
                      </th>
                      <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                        Tên nguyên liệu
                      </th>
                      <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                        Mô tả
                      </th>
                      <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                        Thao tác
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredIngredients.map((item) => (
                      <tr
                        key={item.ingredientId}
                        className="overflow-hidden rounded-2xl bg-[#FAFBFD]"
                      >
                        <td className="px-4 py-4 align-middle">
                          <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white ring-1 ring-[#EEF2F7]">
                            {item.img ? (
                              <img
                                src={item.img}
                                alt={item.ingredientName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[#B6C2D5]">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="font-semibold text-[#2F3A67]">
                            {item.ingredientName}
                          </div>
                          <div className="mt-1 text-xs text-[#8DA1C1]">
                            ID: #{item.ingredientId}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="max-w-[360px] text-sm leading-6 text-[#42526B] line-clamp-2">
                            {item.description || "--"}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="inline-flex items-center gap-2 rounded-xl border border-[#D6DFEF] bg-white px-3 py-2 text-sm font-medium text-[#2F3A67] hover:bg-[#F7F9FC]"
                            >
                              <Pencil className="h-4 w-4" />
                              Sửa
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.ingredientId}
                              className="inline-flex items-center gap-2 rounded-xl border border-[#F6D7D7] bg-white px-3 py-2 text-sm font-medium text-[#C24141] hover:bg-[#FFF5F5] disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              {deletingId === item.ingredientId
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
          </div>
        </main>
      </div>

      {openModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-[#2F3A67]">
                  {modalMode === "create"
                    ? "Thêm nguyên liệu"
                    : "Cập nhật nguyên liệu"}
                </h3>
                <p className="mt-1 text-sm text-[#8DA1C1]">
                  Điền đầy đủ thông tin để{" "}
                  {modalMode === "create" ? "tạo mới" : "cập nhật"} nguyên liệu.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F7FB] text-[#6B7280] hover:bg-[#EEF2F7]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <FormField label="Tên nguyên liệu" required>
                <input
                  type="text"
                  value={form.ingredientName}
                  onChange={(e) =>
                    handleChangeForm("ingredientName", e.target.value)
                  }
                  className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
                  placeholder="Ví dụ: Beef"
                />
              </FormField>

              <FormField label="Mô tả" required>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    handleChangeForm("description", e.target.value)
                  }
                  className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
                  placeholder="Nhập mô tả nguyên liệu"
                />
              </FormField>

              <FormField label="Ảnh">
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageFileChange(e.target.files?.[0] || null)
                    }
                    className="block w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-[#EEF2FF] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#2F3A67]"
                  />

                  <div className="text-xs text-[#8DA1C1]">
                    Có thể để trống nếu chưa muốn thêm ảnh.
                  </div>
                </div>
              </FormField>

              {form.img ? (
                <div className="rounded-2xl border border-[#EEF2F7] bg-[#FAFBFD] p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                    Xem trước ảnh
                  </div>
                  <div className="h-44 overflow-hidden rounded-2xl bg-white ring-1 ring-[#EEF2F7]">
                    <img
                      src={form.img}
                      alt="preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-[#D6DFEF] bg-white px-4 py-2 text-sm font-medium text-[#6B7280] hover:bg-[#F7F9FC]"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2F3A67] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {submitting
                    ? modalMode === "create"
                      ? "Đang tạo..."
                      : "Đang cập nhật..."
                    : modalMode === "create"
                      ? "Tạo nguyên liệu"
                      : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FormField({ label, required = false, children }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-[#2F3A67]">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </div>
      {children}
    </label>
  );
}
