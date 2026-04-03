import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import API_URL from "@/config/api";
import { toast } from "sonner";
import {
  Filter,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Users,
  Image as ImageIcon,
  ClipboardList,
} from "lucide-react";

const EMPTY_FORM = {
  partyCategoryName: "",
  description: "",
  status: "1",
  numberOfGuests: "",
  imageUrl: "",
  imageFile: null,
};

export default function OwnerPartyCategory() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
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

  const fetchCategories = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/party-category`, {
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải danh sách loại tiệc");
      }

      const items = Array.isArray(data?.items) ? data.items : [];
      setCategories(items);
    } catch (err) {
      const errorMessage = err.message || "Đã có lỗi xảy ra";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return categories;

    return categories.filter((item) => {
      return (
        String(item.partyCategoryId).includes(keyword) ||
        String(item.partyCategoryName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.description || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.numberOfGuests || "").includes(keyword)
      );
    });
  }, [categories, search]);

  const stats = React.useMemo(
    () => [
      {
        title: "Tổng loại tiệc",
        value: categories.length,
        icon: <ClipboardList className="h-5 w-5" />,
        bg: "bg-blue-100",
        text: "text-blue-600",
      },
      {
        title: "Đang hoạt động",
        value: categories.filter((item) => Number(item.status) === 1).length,
        icon: <Users className="h-5 w-5" />,
        bg: "bg-green-100",
        text: "text-green-600",
      },
    ],
    [categories],
  );

  const resetForm = React.useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    resetForm();
    setOpenModal(true);
    setError("");
    setMessage("");
  };

  const openEditModal = (item) => {
    setModalMode("edit");
    setEditingId(item.partyCategoryId);
    setForm({
      partyCategoryName: item.partyCategoryName || "",
      description: item.description || "",
      status: String(item.status ?? 1),
      numberOfGuests: String(item.numberOfGuests ?? ""),
      imageUrl: item.imageUrl || "",
      imageFile: null,
    });
    setOpenModal(true);
    setError("");
    setMessage("");
  };

  const closeModal = () => {
    setOpenModal(false);
    resetForm();
  };

  const handleChangeForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageFileChange = (file) => {
    if (!file) {
      setForm((prev) => ({ ...prev, imageFile: null }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({
      ...prev,
      imageFile: file,
      imageUrl: previewUrl,
    }));
  };

  const validateForm = () => {
    if (!form.partyCategoryName.trim()) {
      return "Vui lòng nhập tên loại tiệc.";
    }
    if (!form.description.trim()) {
      return "Vui lòng nhập mô tả loại tiệc.";
    }
    if (form.numberOfGuests === "" || Number(form.numberOfGuests) <= 0) {
      return "Vui lòng nhập số lượng khách hợp lệ.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    const payload = {
      partyCategoryName: form.partyCategoryName.trim(),
      description: form.description.trim(),
      status: Number(form.status),
      numberOfGuests: Number(form.numberOfGuests),
      imageUrl: form.imageFile ? "" : form.imageUrl.trim() || null,
    };

    try {
      const url =
        modalMode === "create"
          ? `${API_URL}/api/party-category`
          : `${API_URL}/api/party-category/${editingId}`;

      const method = modalMode === "create" ? "POST" : "PUT";

      const requestBody = new FormData();
      requestBody.append("partyCategoryName", payload.partyCategoryName);
      requestBody.append("description", payload.description);
      requestBody.append("status", String(payload.status));
      requestBody.append("numberOfGuests", String(payload.numberOfGuests));

      if (form.imageFile) {
        requestBody.append("imageFile", form.imageFile);
      } else if (payload.imageUrl) {
        requestBody.append("imageUrl", payload.imageUrl);
      }

      const res = await fetch(url, {
        method,
        headers: {
          ...authHeaders,
        },
        body: requestBody,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.message ||
            (modalMode === "create"
              ? "Tạo loại tiệc thất bại"
              : "Cập nhật loại tiệc thất bại"),
        );
      }

      const successMessage =
        modalMode === "create"
          ? "Tạo loại tiệc thành công."
          : "Cập nhật loại tiệc thành công.";
      setMessage(successMessage);
      toast.success(successMessage);
      closeModal();
      await fetchCategories();
    } catch (err) {
      const errorMessage = err.message || "Thao tác thất bại";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa loại tiệc \"${item.partyCategoryName}\" không?`,
    );
    if (!confirmed) return;

    setDeletingId(item.partyCategoryId);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `${API_URL}/api/party-category/${item.partyCategoryId}`,
        {
          method: "DELETE",
          headers: authHeaders,
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Xóa loại tiệc thất bại");
      }

      const successMessage = "Xóa loại tiệc thành công.";
      setMessage(successMessage);
      toast.success(successMessage);
      await fetchCategories();
    } catch (err) {
      const errorMessage = err.message || "Xóa loại tiệc thất bại";
      setError(errorMessage);
      toast.error(errorMessage);
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
              <span className="text-[#2F3A67] font-bold">LOẠI TIỆC</span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm loại tiệc"
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
              Quản lý loại tiệc
            </h1>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2F3A67] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Thêm loại tiệc
            </button>
          </div>

          {(message || error) && (
            <div className="mt-4 rounded-2xl bg-white p-4">
              {message ? (
                <div className="text-sm text-green-600">{message}</div>
              ) : null}
              {error ? (
                <div className="text-sm text-red-500">{error}</div>
              ) : null}
            </div>
          )}

          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[24px] font-bold text-[#2F3A67]">
                Danh sách loại tiệc
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
                Đang tải loại tiệc...
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFBFD] p-6 text-sm text-gray-500">
                Không tìm thấy loại tiệc nào.
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
                        Tên loại tiệc
                      </th>
                      <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                        Mô tả
                      </th>
                      <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                        Số khách
                      </th>
                      <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                        Trạng thái
                      </th>
                      <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                        Thao tác
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCategories.map((item) => (
                      <tr
                        key={item.partyCategoryId}
                        className="overflow-hidden rounded-2xl bg-[#FAFBFD]"
                      >
                        <td className="px-4 py-4 align-middle">
                          <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white ring-1 ring-[#EEF2F7]">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.partyCategoryName}
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
                            {item.partyCategoryName}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="max-w-[320px] text-sm leading-6 text-[#42526B] line-clamp-2">
                            {item.description || "--"}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle text-sm font-medium text-[#2B2B2B]">
                          {item.numberOfGuests || 0} khách
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <StatusPill status={item.status} />
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
                              disabled={deletingId === item.partyCategoryId}
                              className="inline-flex items-center gap-2 rounded-xl border border-[#F6D7D7] bg-white px-3 py-2 text-sm font-medium text-[#C24141] hover:bg-[#FFF5F5] disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              {deletingId === item.partyCategoryId
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
                    ? "Thêm loại tiệc"
                    : "Cập nhật loại tiệc"}
                </h3>
                <p className="mt-1 text-sm text-[#8DA1C1]">
                  Điền đầy đủ thông tin để{" "}
                  {modalMode === "create" ? "tạo mới" : "cập nhật"} loại tiệc.
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Tên loại tiệc" required>
                  <input
                    type="text"
                    value={form.partyCategoryName}
                    onChange={(e) =>
                      handleChangeForm("partyCategoryName", e.target.value)
                    }
                    className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
                    placeholder="Ví dụ: Wedding Party"
                  />
                </FormField>

                <FormField label="Số lượng khách" required>
                  <input
                    type="number"
                    min="1"
                    value={form.numberOfGuests}
                    onChange={(e) =>
                      handleChangeForm("numberOfGuests", e.target.value)
                    }
                    className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
                    placeholder="Ví dụ: 200"
                  />
                </FormField>
              </div>

              <FormField label="Mô tả" required>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    handleChangeForm("description", e.target.value)
                  }
                  className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
                  placeholder="Nhập mô tả loại tiệc"
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

                <FormField label="Trạng thái" required>
                  <select
                    value={form.status}
                    onChange={(e) => handleChangeForm("status", e.target.value)}
                    className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
                  >
                    <option value="1">Đang hoạt động</option>
                    <option value="0">Ngừng hoạt động</option>
                  </select>
                </FormField>
              </div>

              {form.imageUrl ? (
                <div className="rounded-2xl border border-[#EEF2F7] bg-[#FAFBFD] p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                    Xem trước ảnh
                  </div>
                  <div className="h-44 overflow-hidden rounded-2xl bg-white ring-1 ring-[#EEF2F7]">
                    <img
                      src={form.imageUrl}
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
                      ? "Tạo loại tiệc"
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

function StatusPill({ status }) {
  const active = Number(status) === 1;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#F3F4F6] text-[#6B7280]"
      }`}
    >
      {active ? "Đang hoạt động" : "Ngừng hoạt động"}
    </span>
  );
}
