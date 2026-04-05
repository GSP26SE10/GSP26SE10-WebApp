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
} from "lucide-react";

const PAGE_SIZE = 9;

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "1", label: "Đang mở" },
  { value: "0", label: "Ngừng cung cấp" },
];

const EMPTY_FORM = {
  serviceName: "",
  description: "",
  basePrice: "",
  status: "1",
};

export default function OwnerService() {
  const [sbExpanded, setSbExpanded] = React.useState(false);

  const [allServices, setAllServices] = React.useState([]);
  const [services, setServices] = React.useState([]);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [openDetailModal, setOpenDetailModal] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState(null);

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

  const fetchServices = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const items = await fetchAllPages("/api/service", 50);
      setAllServices(items);
    } catch (err) {
      const message = err.message || "Đã có lỗi xảy ra";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [fetchAllPages]);

  React.useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const filteredServices = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return allServices.filter((service) => {
      const name = String(service.serviceName || "").toLowerCase();
      const description = String(service.description || "").toLowerCase();
      const status = String(normalizeStatusValue(service.status));

      const matchSearch =
        !keyword || name.includes(keyword) || description.includes(keyword);
      const matchStatus =
        statusFilter === "all" || status === String(statusFilter);

      return matchSearch && matchStatus;
    });
  }, [allServices, search, statusFilter]);

  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  React.useEffect(() => {
    const nextTotalPages = Math.max(
      1,
      Math.ceil(filteredServices.length / PAGE_SIZE),
    );
    setTotalPages(nextTotalPages);

    const safePage = Math.min(page, nextTotalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    if (safePage !== page) {
      setPage(safePage);
      return;
    }

    setServices(filteredServices.slice(start, end));
  }, [filteredServices, page]);

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
    setSelectedService(null);
    resetForm();
    setOpenCreateModal(true);
  };

  const openDetail = (service) => {
    setSelectedService(service);
    setForm({
      serviceName: service.serviceName || "",
      description: service.description || "",
      basePrice: String(service.basePrice || ""),
      status: String(normalizeStatusValue(service.status)),
    });

    cleanupPreview(imagePreview);
    setImageFile(null);
    setImagePreview("");
    setExistingImage(normalizeServiceImage(service.img));
    setOpenDetailModal(true);
  };

  const closeModals = () => {
    setOpenCreateModal(false);
    setOpenDetailModal(false);
    setSelectedService(null);
    resetForm();
  };

  const buildFormData = ({ includeStatus = true } = {}) => {
    const serviceName = form.serviceName.trim();
    const description = form.description.trim();
    const basePrice = Number(form.basePrice);

    if (!serviceName || !description || Number.isNaN(basePrice)) {
      throw new Error("Vui lòng nhập đầy đủ thông tin bắt buộc.");
    }

    const formData = new FormData();
    formData.append("ServiceName", serviceName);
    formData.append("Description", description);
    formData.append("BasePrice", String(basePrice));

    if (includeStatus) {
      formData.append("Status", String(normalizeStatusValue(form.status)));
    }

    if (imageFile) {
      formData.append("ImgFile", imageFile);
    }

    return formData;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const body = buildFormData({ includeStatus: true });

      const res = await fetch(`${API_URL}/api/service`, {
        method: "POST",
        headers: { accept: "*/*" },
        body,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Thêm dịch vụ thất bại");
      }

      toast.success("Thêm dịch vụ thành công.");
      await fetchServices();
      closeModals();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedService?.serviceId) return;

    setUpdating(true);

    try {
      const body = buildFormData({ includeStatus: true });

      const res = await fetch(
        `${API_URL}/api/service/${selectedService.serviceId}`,
        {
          method: "PUT",
          headers: { accept: "*/*" },
          body,
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Cập nhật dịch vụ thất bại");
      }

      toast.success("Cập nhật dịch vụ thành công.");
      await fetchServices();
      closeModals();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedService?.serviceId) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa dịch vụ "${selectedService.serviceName}" không?`,
    );
    if (!confirmed) return;

    setDeleting(true);

    try {
      const res = await fetch(
        `${API_URL}/api/service/${selectedService.serviceId}`,
        {
          method: "DELETE",
          headers: { accept: "*/*" },
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Xóa dịch vụ thất bại");
      }

      toast.success("Xóa dịch vụ thành công.");
      await fetchServices();
      closeModals();
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
              <span className="text-gray-900">DỊCH VỤ</span>
            </>
          }
          showSearch={false}
        />

        <main className="px-7 py-6">
          <div className="mb-6 rounded-3xl border border-[#F2E2D7] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <h1 className="text-[22px] font-bold text-[#E54B2D]">
                  Quản lý dịch vụ
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Tìm kiếm trên toàn bộ dữ liệu và quản lý dịch vụ theo API hiện
                  tại.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreate}
                className="h-11 rounded-xl bg-[#E8712E] px-4 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
              >
                <Plus className="h-4 w-4" />
                Thêm Dịch vụ
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_200px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên dịch vụ hoặc mô tả"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#FFFDFC] pl-11 pr-4 text-sm text-gray-700 outline-none transition focus:border-[#E8712E]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-xl border border-gray-200 bg-[#FFFDFC] px-3 text-sm text-gray-700 outline-none transition focus:border-[#E8712E]"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

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
          ) : filteredServices.length === 0 ? (
            <div className="text-sm text-gray-500">
              Không có dịch vụ phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => (
                <ServiceCard
                  key={service.serviceId}
                  service={service}
                  onClick={() => openDetail(service)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {openCreateModal && (
        <ServiceModal
          title="Thêm dịch vụ mới"
          form={form}
          setForm={setForm}
          imagePreview={imagePreview}
          existingImage={existingImage}
          onImageChange={handleImageChange}
          onRemoveImage={resetImageState}
          onClose={closeModals}
          onSubmit={handleCreate}
          submitting={submitting}
          submitLabel={submitting ? "Đang thêm..." : "Lưu dịch vụ"}
          showDelete={false}
        />
      )}

      {openDetailModal && selectedService && (
        <ServiceModal
          title="Chi tiết dịch vụ"
          form={form}
          setForm={setForm}
          imagePreview={imagePreview}
          existingImage={existingImage}
          onImageChange={handleImageChange}
          onRemoveImage={resetImageState}
          onClose={closeModals}
          onSubmit={handleUpdate}
          submitting={updating}
          submitLabel={updating ? "Đang lưu..." : "Cập nhật"}
          showDelete
          deleteButton={
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="h-10 px-4 rounded-lg bg-red-50 text-red-600 font-semibold flex items-center gap-2 hover:bg-red-100 transition disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Đang xóa..." : "Xóa dịch vụ"}
            </button>
          }
        />
      )}
    </div>
  );
}

function ServiceModal({
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
  showDelete,
  deleteButton = null,
}) {
  const displayImage = imagePreview || existingImage;

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
          <div className="space-y-3">
            <div className="relative h-52 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center">
              {displayImage ? (
                <>
                  <img
                    src={displayImage}
                    alt="service-preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={onRemoveImage}
                    className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-gray-600 shadow-sm hover:bg-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <span className="text-sm text-gray-400">
                  Chưa có ảnh dịch vụ
                </span>
              )}
            </div>

            <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#F2B9A5] bg-[#FFFAF0] px-4 py-2 text-sm font-semibold text-[#E8712E] hover:bg-[#FFF3EA] transition">
              Chọn ảnh từ máy
              <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="hidden"
              />
            </label>
          </div>

          <Field
            label="Tên dịch vụ"
            value={form.serviceName}
            onChange={(v) => setForm((prev) => ({ ...prev, serviceName: v }))}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={form.description}
              required
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#E8712E] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Giá cơ bản"
              type="number"
              value={form.basePrice}
              onChange={(v) => setForm((prev) => ({ ...prev, basePrice: v }))}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#E8712E]"
              >
                <option value="1">Đang mở</option>
                <option value="0">Ngừng cung cấp</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-2">
            <div>{showDelete ? deleteButton : null}</div>

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

function ServiceCard({ service, onClick }) {
  const isActive = Number(service.status) === 1;
  const imageUrl = normalizeServiceImage(service.img);

  return (
    <button
      type="button"
      onClick={onClick}
      className="overflow-hidden rounded-2xl bg-white shadow-sm border border-[#E9E2D8] text-left transition hover:shadow-md"
    >
      <div className="h-[200px] w-full overflow-hidden bg-[#F5F5F5]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={service.serviceName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">
            Không có ảnh
          </div>
        )}
      </div>

      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="text-[18px] font-bold text-[#E54B2D] leading-snug line-clamp-2">
            {service.serviceName}
          </div>
          <div
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isActive
                ? "bg-[#DCEFD9] text-[#2D9C3C]"
                : "bg-[#F6DAD4] text-[#D9534F]"
            }`}
          >
            {isActive ? "Đang mở" : "Ngừng"}
          </div>
        </div>

        <div className="mt-3 text-[14px] font-bold text-[#2F3A67]">
          {formatPrice(service.basePrice)}
        </div>

        <div className="mt-3 text-[14px] text-[#8A8A8A] leading-relaxed min-h-[66px] line-clamp-3">
          {service.description || "Chưa có mô tả"}
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

function normalizeStatusValue(status) {
  if (status === 0 || status === "0") return 0;
  return 1;
}

function normalizeServiceImage(img) {
  if (!img || typeof img !== "string") return "";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  return `${API_URL}${img}`;
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} VNĐ`;
}
