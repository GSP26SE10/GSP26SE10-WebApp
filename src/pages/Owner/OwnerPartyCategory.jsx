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
  Users,
  Image as ImageIcon,
  ClipboardList,
} from "lucide-react";

const PAGE_SIZE = 8;

const EMPTY_FORM = {
  partyCategoryName: "",
  description: "",
  numberOfGuests: "",
  status: "1",
};

export default function OwnerPartyCategory() {
  const [sbExpanded, setSbExpanded] = React.useState(false);

  const [allCategories, setAllCategories] = React.useState([]);
  const [categories, setCategories] = React.useState([]);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [openDetailModal, setOpenDetailModal] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState(null);

  const [form, setForm] = React.useState(EMPTY_FORM);
  const [imageFile, setImageFile] = React.useState(null);
  const [imagePreview, setImagePreview] = React.useState("");
  const [existingImage, setExistingImage] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const cleanupPreview = React.useCallback((url) => {
    if (typeof url === "string" && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }, []);

  React.useEffect(() => {
    return () => {
      cleanupPreview(imagePreview);
    };
  }, [imagePreview, cleanupPreview]);

  const resetImageState = React.useCallback(() => {
    cleanupPreview(imagePreview);
    setImageFile(null);
    setImagePreview("");
    setExistingImage("");
  }, [cleanupPreview, imagePreview]);

  const resetForm = React.useCallback(() => {
    setForm(EMPTY_FORM);
    resetImageState();
  }, [resetImageState]);

  const fetchAllPages = React.useCallback(async (basePath, pageSize = 50) => {
    let currentPage = 1;
    let total = 1;
    const merged = [];

    do {
      const res = await fetch(
        `${API_URL}${basePath}?page=${currentPage}&pageSize=${pageSize}`,
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
  }, []);

  const fetchCategories = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const items = await fetchAllPages("/api/party-category", 50);
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

    return allCategories.filter((item) => {
      const matchSearch =
        !keyword ||
        String(item.partyCategoryId || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.partyCategoryName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.description || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.numberOfGuests || "")
          .toLowerCase()
          .includes(keyword);

      const matchStatus =
        statusFilter === "all" ||
        String(normalizeStatusValue(item.status)) === String(statusFilter);

      return matchSearch && matchStatus;
    });
  }, [allCategories, search, statusFilter]);

  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

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

  const stats = React.useMemo(
    () => [
      {
        title: "Tổng loại tiệc",
        value: allCategories.length,
        icon: <ClipboardList className="h-5 w-5" />,
        bg: "bg-blue-100",
        text: "text-blue-600",
      },
      {
        title: "Đang hoạt động",
        value: allCategories.filter((item) => Number(item.status) === 1).length,
        icon: <Users className="h-5 w-5" />,
        bg: "bg-green-100",
        text: "text-green-600",
      },
    ],
    [allCategories],
  );

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    cleanupPreview(imagePreview);
    const nextPreview = URL.createObjectURL(file);

    setImageFile(file);
    setImagePreview(nextPreview);
    e.target.value = "";
  };

  const openCreate = () => {
    setSelectedCategory(null);
    resetForm();
    setOpenCreateModal(true);
  };

  const openDetail = (item) => {
    setSelectedCategory(item);
    setForm({
      partyCategoryName: item.partyCategoryName || "",
      description: item.description || "",
      numberOfGuests: String(item.numberOfGuests || ""),
      status: String(normalizeStatusValue(item.status)),
    });
    cleanupPreview(imagePreview);
    setImageFile(null);
    setImagePreview("");
    setExistingImage(normalizePartyImage(item.imageUrl));
    setOpenDetailModal(true);
  };

  const closeModals = () => {
    setOpenCreateModal(false);
    setOpenDetailModal(false);
    setSelectedCategory(null);
    resetForm();
  };

  const validateForm = () => {
    if (!form.partyCategoryName.trim()) {
      return "Vui lòng nhập tên loại tiệc.";
    }
    if (!form.numberOfGuests || Number(form.numberOfGuests) <= 0) {
      return "Vui lòng nhập số lượng khách hợp lệ.";
    }
    return "";
  };

  const buildFormData = ({ includeStatus = false } = {}) => {
    const validationError = validateForm();
    if (validationError) {
      throw new Error(validationError);
    }

    const formData = new FormData();
    formData.append("PartyCategoryName", form.partyCategoryName.trim());
    formData.append("NumberOfGuests", String(Number(form.numberOfGuests)));

    if (form.description.trim()) {
      formData.append("Description", form.description.trim());
    }

    if (includeStatus) {
      formData.append("Status", String(normalizeStatusValue(form.status)));
    }

    if (imageFile) {
      formData.append("ImageUrl", imageFile);
    }

    return formData;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const body = buildFormData({ includeStatus: false });

      const res = await fetch(`${API_URL}/api/party-category`, {
        method: "POST",
        headers: { accept: "*/*" },
        body,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Tạo loại tiệc thất bại");
      }

      toast.success("Tạo loại tiệc thành công.");
      await fetchCategories();
      closeModals();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedCategory?.partyCategoryId) return;

    setUpdating(true);

    try {
      const body = buildFormData({ includeStatus: true });

      const res = await fetch(
        `${API_URL}/api/party-category/${selectedCategory.partyCategoryId}`,
        {
          method: "PUT",
          headers: { accept: "*/*" },
          body,
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Cập nhật loại tiệc thất bại");
      }

      toast.success("Cập nhật loại tiệc thành công.");
      await fetchCategories();
      closeModals();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory?.partyCategoryId) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa loại tiệc "${selectedCategory.partyCategoryName}" không?`,
    );
    if (!confirmed) return;

    setDeleting(true);

    try {
      const res = await fetch(
        `${API_URL}/api/party-category/${selectedCategory.partyCategoryId}`,
        {
          method: "DELETE",
          headers: { accept: "*/*" },
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Xóa loại tiệc thất bại");
      }

      toast.success("Xóa loại tiệc thành công.");
      await fetchCategories();
      closeModals();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setDeleting(false);
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

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-[20px] font-bold text-[#E54B2D]">
              Quản lý loại tiệc
            </h1>

            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-[#D6DFEF] bg-white px-4 py-2 text-sm font-medium text-[#2F3A67] outline-none"
              >
                <option value="all">Tất cả</option>
                <option value="1">Đang hoạt động</option>
                <option value="0">Ngừng hoạt động</option>
              </select>

              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2F3A67] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Thêm loại tiệc
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-[24px] font-bold text-[#2F3A67]">
                Danh sách loại tiệc
              </h2>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-10 w-10 rounded-full border border-[#D6DFEF] bg-white text-[#2F3A67] flex items-center justify-center disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="text-sm font-semibold text-[#2F3A67]">
                  {String(page).padStart(2, "0")}/
                  {String(totalPages).padStart(2, "0")}
                </div>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-10 w-10 rounded-full border border-[#D6DFEF] bg-white text-[#2F3A67] flex items-center justify-center disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-[#FAFBFD] p-6 text-sm text-gray-500">
                Đang tải loại tiệc...
              </div>
            ) : error ? (
              <div className="rounded-2xl bg-[#FAFBFD] p-6 text-sm text-red-500">
                {error}
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
                    {categories.map((item) => (
                      <tr
                        key={item.partyCategoryId}
                        className="overflow-hidden rounded-2xl bg-[#FAFBFD]"
                      >
                        <td className="px-4 py-4 align-middle">
                          <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white ring-1 ring-[#EEF2F7]">
                            <img
                              src={
                                normalizePartyImage(item.imageUrl) ||
                                "/logo.png"
                              }
                              alt={item.partyCategoryName}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = generateTextLogo(
                                  item.partyCategoryName,
                                );
                              }}
                            />
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
                              onClick={() => openDetail(item)}
                              className="inline-flex items-center gap-2 rounded-xl border border-[#D6DFEF] bg-white px-3 py-2 text-sm font-medium text-[#2F3A67] hover:bg-[#F7F9FC]"
                            >
                              <Pencil className="h-4 w-4" />
                              Sửa
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

      {openCreateModal && (
        <PartyCategoryModal
          title="Thêm loại tiệc"
          form={form}
          setForm={setForm}
          imagePreview={imagePreview}
          existingImage={existingImage}
          onImageChange={handleImageChange}
          onRemoveImage={resetImageState}
          onClose={closeModals}
          onSubmit={handleCreate}
          submitting={submitting}
          submitLabel={submitting ? "Đang tạo..." : "Tạo loại tiệc"}
          deleteButton={null}
        />
      )}

      {openDetailModal && selectedCategory && (
        <PartyCategoryModal
          title="Cập nhật loại tiệc"
          form={form}
          setForm={setForm}
          imagePreview={imagePreview}
          existingImage={existingImage}
          onImageChange={handleImageChange}
          onRemoveImage={resetImageState}
          onClose={closeModals}
          onSubmit={handleUpdate}
          submitting={updating}
          submitLabel={updating ? "Đang cập nhật..." : "Lưu thay đổi"}
          deleteButton={
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl border border-[#F6D7D7] bg-white px-4 py-2 text-sm font-medium text-[#C24141] hover:bg-[#FFF5F5] disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Đang xóa..." : "Xóa"}
            </button>
          }
        />
      )}
    </div>
  );
}

function PartyCategoryModal({
  title,
  form,
  setForm,
  imagePreview,
  existingImage,
  onImageChange,
  onRemoveImage,
  onClose,
  onSubmit,
  submitting,
  submitLabel,
  deleteButton,
}) {
  const displayImage = imagePreview || existingImage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-[#2F3A67]">{title}</h3>
            <p className="mt-1 text-sm text-[#8DA1C1]">
              Điền đầy đủ thông tin để lưu loại tiệc.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F7FB] text-[#6B7280] hover:bg-[#EEF2F7]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Tên loại tiệc" required>
              <input
                type="text"
                value={form.partyCategoryName}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    partyCategoryName: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
                placeholder="Ví dụ: Tiệc cưới"
              />
            </FormField>

            <FormField label="Số lượng khách" required>
              <input
                type="number"
                min="1"
                value={form.numberOfGuests}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    numberOfGuests: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
                placeholder="Ví dụ: 200"
              />
            </FormField>
          </div>

          <FormField label="Mô tả">
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
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
                  onChange={onImageChange}
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
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
              >
                <option value="1">Đang hoạt động</option>
                <option value="0">Ngừng hoạt động</option>
              </select>
            </FormField>
          </div>

          {displayImage ? (
            <div className="rounded-2xl border border-[#EEF2F7] bg-[#FAFBFD] p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                  Xem trước ảnh
                </div>
                <button
                  type="button"
                  onClick={onRemoveImage}
                  className="text-xs font-medium text-[#C24141]"
                >
                  Xóa ảnh
                </button>
              </div>
              <div className="h-44 overflow-hidden rounded-2xl bg-white ring-1 ring-[#EEF2F7]">
                <img
                  src={displayImage || "/logo.png"}
                  alt="preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = generateTextLogo(
                      form.partyCategoryName || "Logo",
                    );
                  }}
                />
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 pt-2">
            <div>{deleteButton}</div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
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
                {submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
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

function normalizeStatusValue(status) {
  if (status === 0 || status === "0") return 0;
  return 1;
}

function normalizePartyImage(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return "";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
    return imageUrl;
  return `${API_URL}${imageUrl}`;
}

function generateTextLogo(name) {
  const canvas = document.createElement("canvas");
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext("2d");

  // Background color
  ctx.fillStyle = "#E8712E";
  ctx.fillRect(0, 0, 100, 100);

  // Text
  ctx.fillStyle = "white";
  ctx.font = "bold 50px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const initial = (name || "").charAt(0).toUpperCase() || "?";
  ctx.fillText(initial, 50, 50);

  return canvas.toDataURL();
}
