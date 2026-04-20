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
  Pencil,
  Trash2,
  X,
  Save,
  Wallet,
  ListFilter,
} from "lucide-react";

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  chargeType: "",
  title: "",
  description: "",
  unit: "",
  unitPrice: "",
  status: "1",
};

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "1", label: "Đang hoạt động" },
  { value: "0", label: "Ngừng hoạt động" },
];

export default function OwnerExtraChargeCatalog() {
  const [sbExpanded, setSbExpanded] = React.useState(false);

  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(PAGE_SIZE);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);

  const [openModal, setOpenModal] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [form, setForm] = React.useState(EMPTY_FORM);

  const [submitting, setSubmitting] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState(null);

  const fetchJson = React.useCallback(async (url, options = {}) => {
    const res = await fetch(url, {
      headers: {
        accept: "*/*",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.message || "Yêu cầu API thất bại");
    }

    return data;
  }, []);

  const fetchCatalog = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchJson(
        `${API_URL}/api/extra-charge-catalog?page=${page}&pageSize=${pageSize}`,
      );

      const rawItems = Array.isArray(data?.items) ? data.items : [];
      let filtered = rawItems;

      const keyword = search.trim().toLowerCase();
      if (keyword) {
        filtered = filtered.filter((item) => {
          return (
            String(item.chargeType || "")
              .toLowerCase()
              .includes(keyword) ||
            String(item.title || "")
              .toLowerCase()
              .includes(keyword) ||
            String(item.description || "")
              .toLowerCase()
              .includes(keyword) ||
            String(item.unit || "")
              .toLowerCase()
              .includes(keyword)
          );
        });
      }

      if (statusFilter !== "all") {
        filtered = filtered.filter(
          (item) => String(item.status) === String(statusFilter),
        );
      }

      setItems(filtered);
      setTotalPages(Number(data?.totalPages || 1));
      setTotalItems(
        Number(data?.totalCount || data?.totalItems || rawItems.length || 0),
      );
    } catch (err) {
      const message = err.message || "Đã có lỗi xảy ra";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [fetchJson, page, pageSize, search, statusFilter]);

  React.useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const resetForm = () => {
    setSelectedItem(null);
    setForm(EMPTY_FORM);
  };

  const openCreateModal = () => {
    resetForm();
    setOpenModal(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setForm({
      chargeType: item.chargeType || "",
      title: item.title || "",
      description: item.description || "",
      unit: item.unit || "",
      unitPrice:
        item.unitPrice === null || item.unitPrice === undefined
          ? ""
          : String(item.unitPrice),
      status:
        item.status === 0 || item.status === "0"
          ? "0"
          : item.status === 1 || item.status === "1"
            ? "1"
            : "1",
    });
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    resetForm();
  };

  const validateForm = () => {
    if (!form.chargeType.trim()) return "Vui lòng nhập loại chi phí.";
    if (!form.title.trim()) return "Vui lòng nhập tiêu đề chi phí.";
    if (!form.unit.trim()) return "Vui lòng nhập đơn vị tính.";
    if (String(form.unitPrice).trim() === "") return "Vui lòng nhập đơn giá.";

    const price = Number(form.unitPrice);
    if (Number.isNaN(price) || price < 0) {
      return "Đơn giá không hợp lệ.";
    }

    if (form.status !== "0" && form.status !== "1") {
      return "Vui lòng chọn trạng thái hợp lệ.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        chargeType: form.chargeType.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        unit: form.unit.trim(),
        unitPrice: Number(form.unitPrice),
        status: form.status === "0" || form.status === 0 ? 0 : 1,
      };

      if (selectedItem?.extraChargeCatalogId) {
        await fetchJson(
          `${API_URL}/api/extra-charge-catalog/${selectedItem.extraChargeCatalogId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              extraChargeCatalogId: selectedItem.extraChargeCatalogId,
              ...payload,
            }),
          },
        );
        toast.success("Cập nhật chi phí phát sinh thành công.");
      } else {
        await fetchJson(`${API_URL}/api/extra-charge-catalog`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Tạo chi phí phát sinh thành công.");
      }

      closeModal();
      fetchCatalog();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa "${item.title}" không?`,
    );
    if (!confirmed) return;

    setDeletingId(item.extraChargeCatalogId);

    try {
      await fetchJson(
        `${API_URL}/api/extra-charge-catalog/${item.extraChargeCatalogId}`,
        {
          method: "DELETE",
        },
      );

      toast.success("Xóa chi phí phát sinh thành công.");
      fetchCatalog();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setDeletingId(null);
    }
  };

  const stats = React.useMemo(() => {
    const activeCount = items.filter(
      (item) => Number(item.status) === 1,
    ).length;

    return [
      {
        title: "Tổng danh mục phí",
        value: totalItems || items.length,
      },
      {
        title: "Đang hoạt động",
        value: activeCount,
      },
      {
        title: "Trang hiện tại",
        value: page,
      },
    ];
  }, [items, totalItems, page]);

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
              <span className="mx-2 text-gray-400">/</span>
              <span className="font-bold text-[#2F3A67]">
                CHI PHÍ PHÁT SINH
              </span>
            </>
          }
        />

        <main className="px-7 py-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-4 rounded-2xl bg-white px-6 py-5 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <Wallet className="h-5 w-5" />
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
              Danh mục chi phí phát sinh
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm charge type, tiêu đề, mô tả, đơn vị"
                  className="w-[280px] rounded-xl border border-[#D6DFEF] bg-white py-2 pl-10 pr-4 text-sm text-[#2F3A67] outline-none"
                />
              </div>

              <div className="relative">
                <ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-[#D6DFEF] bg-white py-2 pl-10 pr-8 text-sm font-medium text-[#2F3A67] outline-none"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2F3A67] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Thêm chi phí
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-[24px] font-bold text-[#2F3A67]">
                Bảng chi phí phát sinh mẫu
              </h2>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D6DFEF] bg-white text-[#2F3A67] disabled:opacity-50"
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
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D6DFEF] bg-white text-[#2F3A67] disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-[#FAFBFD] p-6 text-sm text-gray-500">
                Đang tải danh mục chi phí...
              </div>
            ) : error ? (
              <div className="rounded-2xl bg-[#FAFBFD] p-6 text-sm text-red-500">
                {error}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFBFD] p-6 text-sm text-gray-500">
                Không có dữ liệu chi phí phát sinh.
              </div>
            ) : (
              <div className="hide-scrollbar overflow-x-auto">
                <table className="min-w-full overflow-hidden rounded-2xl">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-left text-sm text-[#64748B]">
                      <th className="px-4 py-3 font-semibold">ID</th>
                      <th className="px-4 py-3 font-semibold">Loại phí</th>
                      <th className="px-4 py-3 font-semibold">Tiêu đề</th>
                      <th className="px-4 py-3 font-semibold">Mô tả</th>
                      <th className="px-4 py-3 font-semibold">Đơn giá</th>
                      <th className="px-4 py-3 font-semibold">Đơn vị</th>
                      <th className="px-4 py-3 font-semibold">Trạng thái</th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Thao tác
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item, index) => (
                      <tr
                        key={item.extraChargeCatalogId}
                        className={`border-t border-[#EDF2F7] text-sm text-[#334155] ${
                          index % 2 === 0 ? "bg-white" : "bg-[#FFFCFA]"
                        }`}
                      >
                        <td className="px-4 py-4 font-semibold text-[#2F3A67]">
                          #{item.extraChargeCatalogId}
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#2F3A67]">
                            {item.chargeType || "--"}
                          </span>
                        </td>

                        <td className="px-4 py-4 font-medium">
                          {item.title || "--"}
                        </td>

                        <td className="max-w-[320px] px-4 py-4">
                          <div className="line-clamp-2">
                            {item.description || "--"}
                          </div>
                        </td>

                        <td className="px-4 py-4 font-semibold text-[#E8712E]">
                          {formatCurrency(item.unitPrice)}
                        </td>

                        <td className="px-4 py-4">{item.unit || "--"}</td>

                        <td className="px-4 py-4">
                          <StatusBadge status={item.status} />
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="inline-flex items-center gap-2 rounded-lg border border-[#D6DFEF] bg-white px-3 py-2 text-xs font-semibold text-[#2F3A67] hover:bg-[#F8FAFC]"
                            >
                              <Pencil className="h-4 w-4" />
                              Sửa
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              disabled={
                                deletingId === item.extraChargeCatalogId
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-[#F6D7D7] bg-white px-3 py-2 text-xs font-semibold text-[#C24141] hover:bg-[#FFF5F5] disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              {deletingId === item.extraChargeCatalogId
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

      {openModal && (
        <ExtraChargeModal
          form={form}
          setForm={setForm}
          selectedItem={selectedItem}
          onClose={closeModal}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
}

function ExtraChargeModal({
  form,
  setForm,
  selectedItem,
  onClose,
  onSubmit,
  submitting,
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-[#2F3A67]">
              {selectedItem
                ? "Cập nhật chi phí phát sinh"
                : "Thêm chi phí phát sinh"}
            </h3>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Loại phí (chargeType)" required>
              <input
                type="text"
                value={form.chargeType}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, chargeType: e.target.value }))
                }
                placeholder="Ví dụ: DAMAGE"
                className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
              />
            </FormField>

            <FormField label="Đơn vị" required>
              <input
                type="text"
                value={form.unit}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, unit: e.target.value }))
                }
                placeholder="Ví dụ: item / hour / service"
                className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
              />
            </FormField>
          </div>

          <FormField label="Tiêu đề" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Ví dụ: Bồi thường hư hỏng"
              className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
            />
          </FormField>

          <FormField label="Mô tả">
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Nhập mô tả chi tiết"
              className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
            />
          </FormField>

          <FormField label="Đơn giá" required>
            <input
              type="number"
              min="0"
              step="1000"
              value={form.unitPrice}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, unitPrice: e.target.value }))
              }
              placeholder="Ví dụ: 50000"
              className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
            />
          </FormField>

          <FormField label="Trạng thái" required>
            <select
              value={form.status ?? "1"}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
            >
              <option value="1">Đang hoạt động</option>
              <option value="0">Ngừng hoạt động</option>
            </select>
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
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
              {submitting
                ? "Đang lưu..."
                : selectedItem
                  ? "Lưu thay đổi"
                  : "Tạo mới"}
            </button>
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

function StatusBadge({ status }) {
  if (status === "ACTIVE" || status === "1" || status === 1) {
    return (
      <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-[#DCFCE7] text-[#15803D]">
        Đang hoạt động
      </span>
    );
  }

  if (status === "INACTIVE" || status === "0" || status === 0) {
    return (
      <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-[#F3F4F6] text-[#6B7280]">
        Ngừng hoạt động
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700">
      Không rõ
    </span>
  );
}
function formatCurrency(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString("vi-VN") + " đ";
}
