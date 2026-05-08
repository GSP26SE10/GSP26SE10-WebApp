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
  Trash2,
  Tags,
  Save,
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
  const [serviceExtraCharges, setServiceExtraCharges] = React.useState([]);
  const [extraChargeCatalogs, setExtraChargeCatalogs] = React.useState([]);

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

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken");

    do {
      const res = await fetch(
        `${API_URL}${basePath}?page=${currentPage}&pageSize=${pageSize}`,
        {
          headers: {
            accept: "*/*",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
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
  }, []);

  const fetchServices = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [serviceItems, serviceExtraChargeItems, extraChargeCatalogItems] =
        await Promise.all([
          fetchAllPages("/api/service", 50),
          fetchAllPages("/api/service-extra-charge-catalog", 50),
          fetchAllPages("/api/extra-charge-catalog", 50),
        ]);

      setAllServices(serviceItems);
      setServiceExtraCharges(serviceExtraChargeItems);
      setExtraChargeCatalogs(extraChargeCatalogItems);
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

  const extraChargesByServiceId = React.useMemo(() => {
    return serviceExtraCharges.reduce((map, item) => {
      const serviceId = Number(item.serviceId);
      if (!map[serviceId]) map[serviceId] = [];
      map[serviceId].push(item);
      return map;
    }, {});
  }, [serviceExtraCharges]);

  const filteredServices = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return allServices.filter((service) => {
      const serviceId = Number(service.serviceId);
      const extraCharges = extraChargesByServiceId[serviceId] || [];

      const name = String(service.serviceName || "").toLowerCase();
      const description = String(service.description || "").toLowerCase();
      const status = String(normalizeStatusValue(service.status));

      const extraChargeText = extraCharges
        .map((item) =>
          [
            item.extraChargeCatalogTitle,
            item.extraChargeType,
            item.extraChargeCatalogId,
          ]
            .filter(Boolean)
            .join(" "),
        )
        .join(" ")
        .toLowerCase();

      const matchSearch =
        !keyword ||
        name.includes(keyword) ||
        description.includes(keyword) ||
        extraChargeText.includes(keyword);

      const matchStatus =
        statusFilter === "all" || status === String(statusFilter);

      return matchSearch && matchStatus;
    });
  }, [allServices, extraChargesByServiceId, search, statusFilter]);

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

  const handleCreateExtraCharge = async (extraChargeCatalogId) => {
    if (!selectedService?.serviceId || !extraChargeCatalogId) return;

    try {
      const res = await fetch(`${API_URL}/api/service-extra-charge-catalog`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          serviceId: Number(selectedService.serviceId),
          extraChargeCatalogId: Number(extraChargeCatalogId),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Thêm phí phát sinh thất bại");
      }

      toast.success("Đã thêm phí phát sinh.");
      await fetchServices();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    }
  };

  const handleUpdateExtraCharge = async (
    serviceExtraChargeCatalogId,
    extraChargeCatalogId,
  ) => {
    if (
      !selectedService?.serviceId ||
      !serviceExtraChargeCatalogId ||
      !extraChargeCatalogId
    ) {
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/service-extra-charge-catalog/${serviceExtraChargeCatalogId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            serviceId: Number(selectedService.serviceId),
            extraChargeCatalogId: Number(extraChargeCatalogId),
          }),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Cập nhật phí phát sinh thất bại");
      }

      toast.success("Đã cập nhật phí phát sinh.");
      await fetchServices();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    }
  };

  const handleDeleteExtraCharge = async (serviceExtraChargeCatalogId) => {
    if (!serviceExtraChargeCatalogId) return;

    const confirmed = window.confirm("Bạn có chắc muốn xóa phí phát sinh này?");
    if (!confirmed) return;

    try {
      const res = await fetch(
        `${API_URL}/api/service-extra-charge-catalog/${serviceExtraChargeCatalogId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(false),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Xóa phí phát sinh thất bại");
      }

      toast.success("Đã xóa phí phát sinh.");
      await fetchServices();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    }
  };

  const selectedServiceExtraCharges = selectedService?.serviceId
    ? extraChargesByServiceId[Number(selectedService.serviceId)] || []
    : [];

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
                  Quản lý thông tin dịch vụ và các phí phát sinh áp dụng theo
                  từng dịch vụ.
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
                  placeholder="Tìm dịch vụ, mô tả hoặc phí phát sinh"
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
                  extraCharges={
                    extraChargesByServiceId[Number(service.serviceId)] || []
                  }
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
          extraCharges={[]}
          extraChargeCatalogs={extraChargeCatalogs}
          onCreateExtraCharge={handleCreateExtraCharge}
          onUpdateExtraCharge={handleUpdateExtraCharge}
          onDeleteExtraCharge={handleDeleteExtraCharge}
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
          extraCharges={selectedServiceExtraCharges}
          extraChargeCatalogs={extraChargeCatalogs}
          onCreateExtraCharge={handleCreateExtraCharge}
          onUpdateExtraCharge={handleUpdateExtraCharge}
          onDeleteExtraCharge={handleDeleteExtraCharge}
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
  extraCharges,
  extraChargeCatalogs,
  onCreateExtraCharge,
  onUpdateExtraCharge,
  onDeleteExtraCharge,
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
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = generateTextLogo(
                        form.serviceName || "Logo",
                      );
                    }}
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

          <ExtraChargePanel
            extraCharges={extraCharges}
            extraChargeCatalogs={extraChargeCatalogs}
            serviceId={form.serviceId}
            onCreate={onCreateExtraCharge}
            onUpdate={onUpdateExtraCharge}
            onDelete={onDeleteExtraCharge}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Giá cơ bản
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatVndInput(form.basePrice)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      basePrice: sanitizeMoneyInput(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-14 outline-none focus:border-[#E8712E]"
                  required
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  VNĐ
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              {showDelete ? (
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        status: prev.status === "1" ? "0" : "1",
                      }))
                    }
                    className="h-10 w-full rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    {form.status === "1"
                      ? "Chuyển sang Ngừng cung cấp"
                      : "Chuyển sang Đang mở"}
                  </button>

                  <div className="mt-1">
                    <div
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                        form.status,
                      )}`}
                    >
                      {getStatusLabel(form.status)}
                    </div>
                  </div>
                </div>
              ) : (
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
              )}
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

function ServiceCard({ service, extraCharges, onClick }) {
  const isActive = Number(service.status) === 1;
  const imageUrl = normalizeServiceImage(service.img);
  const visibleExtraCharges = extraCharges.slice(0, 3);
  const hiddenExtraChargeCount = Math.max(0, extraCharges.length - 3);

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
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = generateTextLogo(service.serviceName);
            }}
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

        <div className="mt-4 border-t border-[#F2E2D7] pt-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-600">
            <Tags className="h-4 w-4 text-[#E8712E]" />
            Phí phát sinh ({extraCharges.length})
          </div>

          {extraCharges.length === 0 ? (
            <div className="text-xs text-gray-400">Chưa gán phí phát sinh</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {visibleExtraCharges.map((item) => (
                <span
                  key={item.serviceExtraChargeCatalogId}
                  className="rounded-full bg-[#FFF3EA] px-2.5 py-1 text-xs font-semibold text-[#E8712E]"
                >
                  {item.extraChargeCatalogTitle}
                </span>
              ))}

              {hiddenExtraChargeCount > 0 && (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                  +{hiddenExtraChargeCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function ExtraChargePanel({
  extraCharges,
  extraChargeCatalogs,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [newCatalogId, setNewCatalogId] = React.useState("");

  React.useEffect(() => {
    setNewCatalogId("");
  }, [extraCharges]);

  const usedCatalogIds = React.useMemo(
    () =>
      new Set(extraCharges.map((item) => Number(item.extraChargeCatalogId))),
    [extraCharges],
  );

  const availableCatalogs = React.useMemo(() => {
    return extraChargeCatalogs.filter(
      (item) => !usedCatalogIds.has(Number(item.extraChargeCatalogId)),
    );
  }, [extraChargeCatalogs, usedCatalogIds]);

  const handleAdd = () => {
    if (!newCatalogId) {
      toast.error("Vui lòng chọn phí phát sinh cần thêm.");
      return;
    }

    onCreate?.(newCatalogId);
  };

  return (
    <div className="rounded-2xl border border-[#F2E2D7] bg-[#FFFDFC] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Tags className="h-4 w-4 text-[#E8712E]" />
            Phí phát sinh áp dụng
          </div>
        </div>

        <div className="rounded-full bg-[#FFF3EA] px-3 py-1 text-xs font-bold text-[#E8712E]">
          {extraCharges.length} phí
        </div>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
        <select
          value={newCatalogId}
          onChange={(e) => setNewCatalogId(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#E8712E]"
        >
          <option value="">Chọn phí phát sinh để thêm</option>
          {availableCatalogs.map((item) => (
            <option
              key={item.extraChargeCatalogId}
              value={item.extraChargeCatalogId}
            >
              {item.title || item.extraChargeCatalogTitle}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!newCatalogId}
          className="h-10 rounded-lg bg-[#E8712E] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Thêm phí
        </button>
      </div>

      {extraCharges.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-400">
          Dịch vụ này chưa có phí phát sinh.
        </div>
      ) : (
        <div className="space-y-2">
          {extraCharges.map((item) => (
            <ExtraChargeRow
              key={item.serviceExtraChargeCatalogId}
              item={item}
              catalogs={extraChargeCatalogs}
              usedCatalogIds={usedCatalogIds}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExtraChargeRow({
  item,
  catalogs,
  usedCatalogIds,
  onUpdate,
  onDelete,
}) {
  const [editing, setEditing] = React.useState(false);
  const [catalogId, setCatalogId] = React.useState(
    String(item.extraChargeCatalogId || ""),
  );

  React.useEffect(() => {
    setCatalogId(String(item.extraChargeCatalogId || ""));
    setEditing(false);
  }, [item.extraChargeCatalogId]);

  const editableCatalogs = React.useMemo(() => {
    return catalogs.filter((catalog) => {
      const id = Number(catalog.extraChargeCatalogId);
      return (
        id === Number(item.extraChargeCatalogId) || !usedCatalogIds.has(id)
      );
    });
  }, [catalogs, item.extraChargeCatalogId, usedCatalogIds]);

  const selectedCatalog = catalogs.find(
    (catalog) => Number(catalog.extraChargeCatalogId) === Number(catalogId),
  );

  const handleSave = () => {
    if (!catalogId) {
      toast.error("Vui lòng chọn phí phát sinh.");
      return;
    }

    onUpdate?.(item.serviceExtraChargeCatalogId, catalogId);
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          {editing ? (
            <select
              value={catalogId}
              onChange={(e) => setCatalogId(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#E8712E]"
            >
              {editableCatalogs.map((catalog) => (
                <option
                  key={catalog.extraChargeCatalogId}
                  value={catalog.extraChargeCatalogId}
                >
                  {catalog.title || catalog.extraChargeCatalogTitle} -{" "}
                  {catalog.extraChargeType || catalog.type || "Khác"}
                </option>
              ))}
            </select>
          ) : (
            <>
              <div className="text-sm font-semibold text-gray-800">
                {item.extraChargeCatalogTitle}
              </div>
            </>
          )}

          <div className="mt-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {editing
                ? selectedCatalog?.extraChargeType ||
                  selectedCatalog?.type ||
                  "Khác"
                : item.extraChargeType || "Khác"}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onDelete?.(item.serviceExtraChargeCatalogId)}
            className="inline-flex h-9 items-center gap-1 rounded-lg bg-red-50 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xóa
          </button>
        </div>
      </div>
    </div>
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

function generateTextLogo(name) {
  const canvas = document.createElement("canvas");
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#E8712E";
  ctx.fillRect(0, 0, 100, 100);

  ctx.fillStyle = "white";
  ctx.font = "bold 50px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const initial = (name || "").charAt(0).toUpperCase() || "?";
  ctx.fillText(initial, 50, 50);

  return canvas.toDataURL();
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} VNĐ`;
}

function sanitizeMoneyInput(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatVndInput(value) {
  const numeric = String(value || "").replace(/\D/g, "");
  if (!numeric) return "";
  return Number(numeric).toLocaleString("vi-VN");
}

function getStatusBadgeClass(status) {
  return status === "1"
    ? "bg-green-100 text-green-700"
    : "bg-gray-100 text-gray-700";
}

function getStatusLabel(status) {
  return status === "1" ? "Đang mở" : "Ngừng cung cấp";
}
