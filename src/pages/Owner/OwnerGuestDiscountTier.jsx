import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import API_URL from "@/config/api";
import { toast } from "sonner";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  Trash2,
  Save,
  Percent,
  Users,
  ClipboardList,
} from "lucide-react";

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  minGuestCount: "",
  discountPercent: "",
  note: "",
  status: "1",
};

export default function OwnerGuestDiscountTier() {
  const [sbExpanded, setSbExpanded] = React.useState(false);

  const [allTiers, setAllTiers] = React.useState([]);
  const [tiers, setTiers] = React.useState([]);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [openDetailModal, setOpenDetailModal] = React.useState(false);
  const [selectedTier, setSelectedTier] = React.useState(null);

  const [form, setForm] = React.useState(EMPTY_FORM);

  const [submitting, setSubmitting] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

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

  const fetchTiers = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const items = await fetchAllPages("/api/guest-discount-tier", 50);
      setAllTiers(items);
    } catch (err) {
      const message = err.message || "Đã có lỗi xảy ra";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [fetchAllPages]);

  React.useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  const filteredTiers = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return allTiers.filter((item) => {
      const matchSearch =
        !keyword ||
        String(item.guestDiscountTierId || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.minGuestCount || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.discountPercent || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.note || "")
          .toLowerCase()
          .includes(keyword) ||
        String(formatDate(item.createdAt) || "")
          .toLowerCase()
          .includes(keyword) ||
        String(formatDate(item.updatedAt) || "")
          .toLowerCase()
          .includes(keyword);

      const matchStatus =
        statusFilter === "all" ||
        String(normalizeStatusValue(item.status)) === String(statusFilter);

      return matchSearch && matchStatus;
    });
  }, [allTiers, search, statusFilter]);

  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  React.useEffect(() => {
    const nextTotalPages = Math.max(
      1,
      Math.ceil(filteredTiers.length / PAGE_SIZE),
    );
    setTotalPages(nextTotalPages);

    const safePage = Math.min(page, nextTotalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    if (safePage !== page) {
      setPage(safePage);
      return;
    }

    setTiers(filteredTiers.slice(start, end));
  }, [filteredTiers, page]);

  const stats = React.useMemo(
    () => [
      {
        title: "Tổng mức giảm",
        value: allTiers.length,
        icon: <ClipboardList className="h-5 w-5" />,
        bg: "bg-blue-100",
        text: "text-blue-600",
      },
      {
        title: "Đang hoạt động",
        value: allTiers.filter((item) => Number(item.status) === 1).length,
        icon: <Users className="h-5 w-5" />,
        bg: "bg-green-100",
        text: "text-green-600",
      },
      {
        title: "Giảm cao nhất",
        value: `${Math.max(0, ...allTiers.map((item) => Number(item.discountPercent) || 0))}%`,
        icon: <Percent className="h-5 w-5" />,
        bg: "bg-orange-100",
        text: "text-orange-600",
      },
    ],
    [allTiers],
  );

  const resetForm = React.useCallback(() => {
    setForm(EMPTY_FORM);
  }, []);

  const openCreate = () => {
    setSelectedTier(null);
    resetForm();
    setOpenCreateModal(true);
  };

  const openDetail = (item) => {
    setSelectedTier(item);
    setForm({
      minGuestCount: String(item.minGuestCount || ""),
      discountPercent: String(item.discountPercent || ""),
      note: item.note || "",
      status: String(normalizeStatusValue(item.status)),
    });
    setOpenDetailModal(true);
  };

  const closeModals = () => {
    setOpenCreateModal(false);
    setOpenDetailModal(false);
    setSelectedTier(null);
    resetForm();
  };

  const validateForm = () => {
    if (!form.minGuestCount || Number(form.minGuestCount) <= 0) {
      return "Vui lòng nhập số khách tối thiểu hợp lệ.";
    }

    if (
      form.discountPercent === "" ||
      Number(form.discountPercent) < 0 ||
      Number(form.discountPercent) > 100
    ) {
      return "Vui lòng nhập phần trăm giảm từ 0 đến 100.";
    }

    return "";
  };

  const buildPayload = ({ includeStatus = false } = {}) => {
    const validationError = validateForm();
    if (validationError) {
      throw new Error(validationError);
    }

    const payload = {
      minGuestCount: Number(form.minGuestCount),
      discountPercent: Number(form.discountPercent),
      note: form.note.trim(),
    };

    if (includeStatus) {
      payload.status = normalizeStatusValue(form.status);
    }

    return payload;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const body = buildPayload({ includeStatus: false });

      const res = await fetch(`${API_URL}/api/guest-discount-tier`, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Tạo mức giảm thất bại");
      }

      toast.success("Tạo mức giảm thành công.");
      await fetchTiers();
      closeModals();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTier?.guestDiscountTierId) return;

    setUpdating(true);

    try {
      const body = buildPayload({ includeStatus: true });

      const res = await fetch(
        `${API_URL}/api/guest-discount-tier/${selectedTier.guestDiscountTierId}`,
        {
          method: "PUT",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Cập nhật mức giảm thất bại");
      }

      toast.success("Cập nhật mức giảm thành công.");
      await fetchTiers();
      closeModals();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTier?.guestDiscountTierId) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa mức giảm từ ${selectedTier.minGuestCount} khách không?`,
    );
    if (!confirmed) return;

    setDeleting(true);

    try {
      const res = await fetch(
        `${API_URL}/api/guest-discount-tier/${selectedTier.guestDiscountTierId}`,
        {
          method: "DELETE",
          headers: { accept: "*/*" },
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Xóa mức giảm thất bại");
      }

      toast.success("Xóa mức giảm thành công.");
      await fetchTiers();
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
              <span className="text-[#2F3A67] font-bold">
                GIẢM GIÁ THEO SỐ KHÁCH
              </span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm mức giảm"
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
              Quản lý giảm giá theo số khách
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
                Thêm mức giảm
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-[24px] font-bold text-[#2F3A67]">
                Danh sách mức giảm
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
                Đang tải mức giảm...
              </div>
            ) : error ? (
              <div className="rounded-2xl bg-[#FAFBFD] p-6 text-sm text-red-500">
                {error}
              </div>
            ) : filteredTiers.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFBFD] p-6 text-sm text-gray-500">
                Không tìm thấy mức giảm nào.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr>
                      <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                        Số khách tối thiểu
                      </th>
                      <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                        Phần trăm giảm
                      </th>
                      <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                        Ghi chú
                      </th>
                      <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                        Trạng thái
                      </th>
                      <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                        Ngày tạo
                      </th>
                      <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                        Cập nhật
                      </th>
                      <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
                        Thao tác
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {tiers.map((item) => (
                      <tr
                        key={item.guestDiscountTierId}
                        className="overflow-hidden rounded-2xl bg-[#FAFBFD]"
                      >
                        <td className="px-4 py-4 align-middle">
                          <div className="font-semibold text-[#2F3A67]">
                            Từ {item.minGuestCount || 0} khách
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <span className="inline-flex rounded-full bg-[#FFF1E8] px-3 py-1 text-sm font-bold text-[#E54B2D]">
                            {item.discountPercent || 0}%
                          </span>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="max-w-[320px] text-sm leading-6 text-[#42526B] line-clamp-2">
                            {item.note || "--"}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <StatusPill status={item.status} />
                        </td>

                        <td className="px-4 py-4 align-middle text-sm text-[#42526B]">
                          {formatDate(item.createdAt)}
                        </td>

                        <td className="px-4 py-4 align-middle text-sm text-[#42526B]">
                          {formatDate(item.updatedAt)}
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <button
                            type="button"
                            onClick={() => openDetail(item)}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#D6DFEF] bg-white px-3 py-2 text-sm font-medium text-[#2F3A67] hover:bg-[#F7F9FC]"
                          >
                            <Pencil className="h-4 w-4" />
                            Sửa
                          </button>
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
        <GuestDiscountTierModal
          title="Thêm mức giảm"
          form={form}
          setForm={setForm}
          onClose={closeModals}
          onSubmit={handleCreate}
          submitting={submitting}
          submitLabel={submitting ? "Đang tạo..." : "Tạo mức giảm"}
          deleteButton={null}
        />
      )}

      {openDetailModal && selectedTier && (
        <GuestDiscountTierModal
          title="Cập nhật mức giảm"
          form={form}
          setForm={setForm}
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

function GuestDiscountTierModal({
  title,
  form,
  setForm,
  onClose,
  onSubmit,
  submitting,
  submitLabel,
  deleteButton,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-[#2F3A67]">{title}</h3>
            <p className="mt-1 text-sm text-[#8DA1C1]">
              Thiết lập mức giảm dựa trên số lượng khách tối thiểu.
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
            <FormField label="Số khách tối thiểu" required>
              <input
                type="number"
                min="1"
                value={form.minGuestCount}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    minGuestCount: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
                placeholder="Ví dụ: 50"
              />
            </FormField>

            <FormField label="Phần trăm giảm" required>
              <input
                type="number"
                min="0"
                max="100"
                value={form.discountPercent}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    discountPercent: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
                placeholder="Ví dụ: 5"
              />
            </FormField>
          </div>

          <FormField label="Ghi chú">
            <textarea
              rows={4}
              value={form.note}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  note: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
              placeholder="Ví dụ: Đặt từ 50 khách giảm 5%"
            />
          </FormField>

          <FormField label="Trạng thái" required>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
            >
              <option value="1">Đang hoạt động</option>
              <option value="0">Ngừng hoạt động</option>
            </select>
          </FormField>

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

function formatDate(value) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
