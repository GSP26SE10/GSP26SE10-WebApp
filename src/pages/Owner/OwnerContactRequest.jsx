import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import API_URL from "@/config/api";
import { MailQuestion, RefreshCcw, X } from "lucide-react";
import { toast } from "sonner";

const CONTACT_REQUEST_ENDPOINT = `${API_URL}/api/contact-request`;
const PAGE_SIZE = 100;

const STATUS_MAP = {
  1: {
    label: "Chưa phản hồi",
    className: "bg-[#FEF3C7] text-[#B45309]",
  },
  2: {
    label: "Đã phản hồi",
    className: "bg-[#DCFCE7] text-[#15803D]",
  },
};

export default function OwnerContactRequest() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [requests, setRequests] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [activeStatus, setActiveStatus] = React.useState("all");
  const [updatingId, setUpdatingId] = React.useState(null);
  const [selectedRequest, setSelectedRequest] = React.useState(null);

  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  const fetchAllPages = React.useCallback(
    async (baseUrl) => {
      let page = 1;
      let allItems = [];
      let hasMore = true;

      while (hasMore) {
        const res = await fetch(
          `${baseUrl}?page=${page}&pageSize=${PAGE_SIZE}`,
          {
            headers: {
              accept: "*/*",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.message || "Không thể tải danh sách thắc mắc");
        }

        const items = Array.isArray(data?.items) ? data.items : [];
        allItems = [...allItems, ...items];

        const totalPages = Number(data?.totalPages || 1);
        if (page >= totalPages || items.length === 0) {
          hasMore = false;
        } else {
          page += 1;
        }
      }

      return allItems;
    },
    [token],
  );

  const fetchRequests = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const items = await fetchAllPages(CONTACT_REQUEST_ENDPOINT);
      setRequests(Array.isArray(items) ? items : []);
    } catch (err) {
      const message = err.message || "Đã có lỗi xảy ra";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [fetchAllPages]);

  React.useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleMarkResponded = async (contactRequestId) => {
    setUpdatingId(contactRequestId);

    try {
      const res = await fetch(
        `${CONTACT_REQUEST_ENDPOINT}/${contactRequestId}`,
        {
          method: "PUT",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            status: 2,
          }),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Không thể cập nhật trạng thái");
      }

      setRequests((prev) =>
        prev.map((item) =>
          item.contactRequestId === contactRequestId
            ? {
                ...item,
                status: 2,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );

      toast.success("Đã đánh dấu là đã phản hồi.");
    } catch (err) {
      toast.error(
        err.message ||
          "Cập nhật thất bại. Nếu backend dùng endpoint khác thì cần đổi API.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = React.useMemo(() => {
    const pending = requests.filter((item) => Number(item.status) === 1).length;
    const done = requests.filter((item) => Number(item.status) === 2).length;

    return {
      all: requests.length,
      pending,
      done,
    };
  }, [requests]);

  const filteredRequests = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return requests.filter((item) => {
      const matchesStatus =
        activeStatus === "all"
          ? true
          : activeStatus === "pending"
            ? Number(item.status) === 1
            : Number(item.status) === 2;

      const matchesKeyword =
        !keyword ||
        String(item.fullName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.customerName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.email || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.phone || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.subject || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.content || "")
          .toLowerCase()
          .includes(keyword);

      return matchesStatus && matchesKeyword;
    });
  }, [requests, search, activeStatus]);

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
              <span className="mx-2 text-gray-400">/</span>
              <span className="font-bold text-[#2F3A67]">
                CHĂM SÓC KHÁCH HÀNG
              </span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm theo tên, email, số điện thoại, nội dung..."
        />

        <main className="px-7 py-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <SummaryCard
              title="Tổng yêu cầu"
              value={counts.all}
              active={activeStatus === "all"}
              onClick={() => setActiveStatus("all")}
            />
            <SummaryCard
              title="Chưa phản hồi"
              value={counts.pending}
              active={activeStatus === "pending"}
              onClick={() => setActiveStatus("pending")}
            />
            <SummaryCard
              title="Đã phản hồi"
              value={counts.done}
              active={activeStatus === "done"}
              onClick={() => setActiveStatus("done")}
            />
          </div>

          <div className="mt-6 rounded-3xl border border-[#ECE7DF] bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-[24px] font-bold text-[#2F3A67]">
                  Danh sách thắc mắc khách hàng
                </h1>
              </div>

              <button
                type="button"
                onClick={fetchRequests}
                className="inline-flex items-center gap-2 rounded-xl border border-[#D6DFEF] bg-white px-4 py-2 text-sm font-medium text-[#2F3A67] hover:bg-gray-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Tải lại
              </button>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <FilterChip
                label={`Tất cả (${counts.all})`}
                active={activeStatus === "all"}
                onClick={() => setActiveStatus("all")}
              />
              <FilterChip
                label={`Chưa phản hồi (${counts.pending})`}
                active={activeStatus === "pending"}
                onClick={() => setActiveStatus("pending")}
              />
              <FilterChip
                label={`Đã phản hồi (${counts.done})`}
                active={activeStatus === "done"}
                onClick={() => setActiveStatus("done")}
              />
            </div>

            {loading ? (
              <div className="rounded-2xl bg-[#FAFBFD] p-6 text-sm text-gray-500">
                Đang tải dữ liệu...
              </div>
            ) : error ? (
              <div className="rounded-2xl bg-[#FEF2F2] p-6 text-sm text-red-600">
                {error}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFBFD] p-8 text-center text-sm text-gray-500">
                Không có yêu cầu nào phù hợp.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-2xl">
                  <thead>
                    <tr>
                      <th className="border-b border-[#E5E7EB] bg-[#F8F5F1] px-4 py-4 text-left text-sm font-semibold text-[#2F3A67]">
                        #
                      </th>
                      <th className="border-b border-[#E5E7EB] bg-[#F8F5F1] px-4 py-4 text-left text-sm font-semibold text-[#2F3A67]">
                        Người gửi
                      </th>
                      <th className="border-b border-[#E5E7EB] bg-[#F8F5F1] px-4 py-4 text-left text-sm font-semibold text-[#2F3A67]">
                        Liên hệ
                      </th>
                      <th className="border-b border-[#E5E7EB] bg-[#F8F5F1] px-4 py-4 text-left text-sm font-semibold text-[#2F3A67]">
                        Chủ đề
                      </th>
                      <th className="border-b border-[#E5E7EB] bg-[#F8F5F1] px-4 py-4 text-left text-sm font-semibold text-[#2F3A67]">
                        Nội dung
                      </th>
                      <th className="border-b border-[#E5E7EB] bg-[#F8F5F1] px-4 py-4 text-left text-sm font-semibold text-[#2F3A67]">
                        Trạng thái
                      </th>
                      <th className="border-b border-[#E5E7EB] bg-[#F8F5F1] px-4 py-4 text-center text-sm font-semibold text-[#2F3A67]">
                        Đánh dấu đã phản hồi
                      </th>
                      <th className="border-b border-[#E5E7EB] bg-[#F8F5F1] px-4 py-4 text-left text-sm font-semibold text-[#2F3A67]">
                        Ngày gửi
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRequests.map((item, index) => {
                      const isDone = Number(item.status) === 2;
                      const isUpdating = updatingId === item.contactRequestId;

                      return (
                        <tr
                          key={item.contactRequestId}
                          className="transition hover:bg-[#FCFCFD]"
                        >
                          <td className="border-b border-[#F1F2F6] px-4 py-4 text-sm text-[#2B2B2B]">
                            {index + 1}
                          </td>

                          <td className="border-b border-[#F1F2F6] px-4 py-4">
                            <div className="font-semibold text-[#2B2B2B]">
                              {item.fullName || item.customerName || "--"}
                            </div>
                          </td>

                          <td className="border-b border-[#F1F2F6] px-4 py-4">
                            <div className="text-sm text-[#2B2B2B]">
                              {item.email || "--"}
                            </div>
                            <div className="mt-1 text-sm text-[#8DA1C1]">
                              {item.phone || "--"}
                            </div>
                          </td>

                          <td className="border-b border-[#F1F2F6] px-4 py-4 text-sm font-medium text-[#2F3A67]">
                            {item.subject || "--"}
                          </td>

                          <td className="border-b border-[#F1F2F6] px-4 py-4 text-sm text-[#2B2B2B]">
                            <ExpandableTextCell
                              text={item.content}
                              onOpen={() => setSelectedRequest(item)}
                            />
                          </td>

                          <td className="border-b border-[#F1F2F6] px-4 py-4">
                            <StatusBadge status={item.status} />
                          </td>

                          <td className="border-b border-[#F1F2F6] px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={isDone}
                              disabled={isDone || isUpdating}
                              onChange={() =>
                                handleMarkResponded(item.contactRequestId)
                              }
                              className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[#2F3A67] disabled:cursor-not-allowed"
                            />
                          </td>

                          <td className="border-b border-[#F1F2F6] px-4 py-4 text-sm text-[#6B7280]">
                            {formatDateTime(item.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {selectedRequest && (
        <RequestDetailModal
          item={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}

function SummaryCard({ title, value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-white p-5 text-left transition ${
        active
          ? "border-[#7CA3FF] shadow-[0_8px_30px_rgba(96,133,255,0.16)]"
          : "border-[#ECE7DF] hover:border-[#D9E4F5]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-[#8DA1C1]">{title}</div>
          <div className="mt-2 text-3xl font-bold text-[#1F2937]">{value}</div>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#4C7BFF]">
          <MailQuestion className="h-5 w-5" />
        </div>
      </div>
    </button>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-[#2F3A67] text-white"
          : "bg-[#F5F7FB] text-[#42526B] hover:bg-[#E9EEF8]"
      }`}
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }) {
  const item = STATUS_MAP[Number(status)] || {
    label: `Trạng thái ${status}`,
    className: "bg-[#F3F4F6] text-[#374151]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
}

function ExpandableTextCell({ text, onOpen }) {
  if (!text) return <span>--</span>;

  const maxLength = 90;
  const isLong = text.length > maxLength;
  const preview = isLong ? `${text.slice(0, maxLength)}...` : text;

  return (
    <div className="max-w-[380px]">
      <div className="whitespace-pre-wrap break-words">{preview}</div>

      {isLong ? (
        <button
          type="button"
          onClick={onOpen}
          className="mt-1 text-xs font-medium text-[#4C7BFF] hover:underline"
        >
          Xem thêm
        </button>
      ) : null}
    </div>
  );
}

function RequestDetailModal({ item, onClose }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <div className="text-lg font-bold text-[#2F3A67]">
              Chi tiết thắc mắc
            </div>
            <div className="mt-1 text-sm text-[#8DA1C1]">
              #{item.contactRequestId} • {formatDateTime(item.createdAt)}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 transition hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DetailBox
              label="Người gửi"
              value={item.fullName || item.customerName || "--"}
            />
            <DetailBox
              label="Trạng thái"
              value={<StatusBadge status={item.status} />}
            />
            <DetailBox label="Email" value={item.email || "--"} />
            <DetailBox label="Số điện thoại" value={item.phone || "--"} />
          </div>

          <div className="mt-4">
            <DetailBox label="Chủ đề" value={item.subject || "--"} />
          </div>

          <div className="mt-4 rounded-2xl border border-[#E5E7EB] bg-[#FAFBFD] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
              Nội dung
            </div>
            <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#2B2B2B]">
              {item.content || "--"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
        {label}
      </div>
      <div className="mt-2 text-sm text-[#2B2B2B]">{value}</div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
