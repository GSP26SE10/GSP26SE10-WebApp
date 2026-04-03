import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ChatPanel from "@/components/ChatPanel";
import API_URL from "@/config/api";
import {
  ClipboardList,
  Filter,
  CheckCircle2,
  Clock3,
  Users,
  CalendarDays,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

const TASK_STATUS_MAP = {
  1: { label: "Chờ thực hiện", className: "bg-[#FEF3C7] text-[#B45309]" },
  2: { label: "Đang làm", className: "bg-[#DBEAFE] text-[#1D4ED8]" },
  3: { label: "Hoàn thành", className: "bg-[#D1FAE5] text-[#047857]" },
  4: { label: "Đã hủy", className: "bg-[#FEE2E2] text-[#B91C1C]" },
};

const WEEKDAY_LABELS = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

export default function StaffSchedulePage() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [openChat, setOpenChat] = React.useState(false);
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [selectedTaskId, setSelectedTaskId] = React.useState(null);
  const [currentWeekStart, setCurrentWeekStart] = React.useState(
    getStartOfWeek(new Date()),
  );

  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  const fetchTasks = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_URL}/api/order-detail-staff-task?page=1&pageSize=100`,
        {
          headers: {
            accept: "*/*",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải lịch trình nhân viên");
      }

      const items = Array.isArray(data?.items) ? data.items : [];
      setTasks(items);

      if (items.length > 0) {
        setSelectedTaskId((prev) => {
          const exists = items.some((item) => item.taskId === prev);
          return exists ? prev : items[0].taskId;
        });
      } else {
        setSelectedTaskId(null);
      }
    } catch (err) {
      setError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return tasks;

    return tasks.filter((task) => {
      return (
        String(task.taskName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(task.staffName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(task.note || "")
          .toLowerCase()
          .includes(keyword) ||
        String(task.orderDetailId || "").includes(keyword)
      );
    });
  }, [tasks, search]);

  const weekTasks = React.useMemo(() => {
    const start = new Date(currentWeekStart);
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 7);

    return filteredTasks.filter((task) => {
      const taskStart = new Date(task.startTime);
      return taskStart >= start && taskStart < end;
    });
  }, [filteredTasks, currentWeekStart]);

  const selectedTask =
    weekTasks.find((task) => task.taskId === selectedTaskId) ||
    weekTasks[0] ||
    null;

  React.useEffect(() => {
    const firstTask = weekTasks[0] || null;

    setSelectedTaskId((prev) => {
      const exists = weekTasks.some((task) => task.taskId === prev);
      return exists ? prev : (firstTask?.taskId ?? null);
    });
  }, [weekTasks]);

  const weekDays = React.useMemo(
    () => buildWeekDays(currentWeekStart),
    [currentWeekStart],
  );

  const stats = React.useMemo(
    () => [
      {
        title: "Tổng công việc",
        value: tasks.length,
        icon: <ClipboardList className="h-5 w-5" />,
        bg: "bg-[#FFF1E8]",
        text: "text-[#E8712E]",
      },
      {
        title: "Chờ thực hiện",
        value: tasks.filter((item) => Number(item.taskStatus) === 1).length,
        icon: <Clock3 className="h-5 w-5" />,
        bg: "bg-[#FEF3C7]",
        text: "text-[#B45309]",
      },
      {
        title: "Đang làm",
        value: tasks.filter((item) => Number(item.taskStatus) === 2).length,
        icon: <CalendarDays className="h-5 w-5" />,
        bg: "bg-[#EAF2FF]",
        text: "text-[#6B8FFB]",
      },
      {
        title: "Hoàn thành",
        value: tasks.filter((item) => Number(item.taskStatus) === 3).length,
        icon: <CheckCircle2 className="h-5 w-5" />,
        bg: "bg-[#DCFCE7]",
        text: "text-[#15803D]",
      },
    ],
    [tasks],
  );

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
                LỊCH TRÌNH NHÂN VIÊN
              </span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm công việc"
          onMailClick={() => setOpenChat(true)}
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
              Tất cả công việc trong tuần
            </h1>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentWeekStart((prev) => addDays(prev, -7))}
                className="inline-flex items-center gap-2 rounded-xl border border-[#D6DFEF] bg-white px-4 py-2 text-sm font-medium text-[#8DA1C1] hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Tuần trước
              </button>

              <button
                type="button"
                onClick={() => setCurrentWeekStart(getStartOfWeek(new Date()))}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2F3A67] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Hôm nay
              </button>

              <button
                type="button"
                onClick={() => setCurrentWeekStart((prev) => addDays(prev, 7))}
                className="inline-flex items-center gap-2 rounded-xl border border-[#D6DFEF] bg-white px-4 py-2 text-sm font-medium text-[#8DA1C1] hover:bg-gray-50"
              >
                Tuần sau
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start xl:h-[calc(100vh-220px)]">
            <section className="min-h-0 xl:h-full flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[28px] font-bold text-[#2F3A67]">Tất cả</h2>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#D6DFEF] bg-white px-4 py-2 text-sm font-medium text-[#8DA1C1] hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4" />
                  Lọc
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar space-y-4 pr-1">
                {loading ? (
                  <div className="rounded-2xl bg-white p-5 text-sm text-gray-500">
                    Đang tải công việc...
                  </div>
                ) : error ? (
                  <div className="rounded-2xl bg-white p-5 text-sm text-red-500">
                    {error}
                  </div>
                ) : weekTasks.length === 0 ? (
                  <div className="rounded-2xl bg-white p-5 text-sm text-gray-500">
                    Không có công việc trong tuần này.
                  </div>
                ) : (
                  weekTasks
                    .sort(
                      (a, b) =>
                        new Date(a.startTime).getTime() -
                        new Date(b.startTime).getTime(),
                    )
                    .map((task) => {
                      const active = selectedTask?.taskId === task.taskId;

                      return (
                        <button
                          key={task.taskId}
                          type="button"
                          onClick={() => setSelectedTaskId(task.taskId)}
                          className={`w-full rounded-3xl border bg-white p-5 text-left transition-all duration-200 ${
                            active
                              ? "border-[#7CA3FF] shadow-[0_8px_30px_rgba(96,133,255,0.16)]"
                              : "border-[#EEF2F7] hover:border-[#D9E4F5] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8DA1C1]">
                                Công việc
                              </div>
                              <div className="mt-1 text-base font-bold text-[#2F3A67]">
                                #{String(task.taskId).padStart(3, "0")}
                              </div>
                            </div>

                            <StatusBadge status={task.taskStatus} />
                          </div>

                          <div className="mt-4">
                            <div className="text-[28px] leading-tight font-bold text-[#2B2B2B] break-words">
                              {task.taskName || "--"}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <div className="inline-flex items-center rounded-xl bg-[#F5F7FB] px-3 py-2 text-sm font-medium text-[#42526B]">
                                {task.staffName || "--"}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl bg-[#FAFBFD] px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 text-[#6B8FFB]">
                                  <Clock3 className="h-4 w-4 shrink-0" />
                                  <span className="text-xs font-medium text-[#9AA9C2]">
                                    Thời gian
                                  </span>
                                </div>

                                <div className="mt-1 line-clamp-2 text-sm leading-6 text-[#2F3A67]">
                                  {formatDateTime(task.startTime)} -{" "}
                                  {formatHour(task.endTime)}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenChat(true);
                                }}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-[#6B8FFB] hover:bg-[#dfeaff]"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </button>
                      );
                    })
                )}
              </div>
            </section>

            <section className="min-h-0 xl:h-full overflow-y-auto hide-scrollbar pr-1">
              {!selectedTask ? (
                <div className="rounded-2xl bg-white p-6 text-sm text-gray-500">
                  Chọn một công việc để xem chi tiết.
                </div>
              ) : (
                <TaskDetailPanel
                  task={selectedTask}
                  weekDays={weekDays}
                  weekTasks={weekTasks}
                  message={message}
                  error={error}
                />
              )}
            </section>
          </div>
        </main>
      </div>

      <ChatPanel open={openChat} onClose={() => setOpenChat(false)} />
    </div>
  );
}

function TaskDetailPanel({ task, weekDays, weekTasks, message, error }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#2F3A67]">
              Công việc #{String(task.taskId).padStart(3, "0")}
            </div>

            <div className="mt-2 text-[38px] leading-none font-bold text-[#2B2B2B]">
              {task.taskName || "--"}
            </div>

            <div className="mt-2 text-xs text-[#8DA1C1]">
              {formatHour(task.startTime)} &nbsp; | &nbsp;
              {formatDate(task.startTime)}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <StatusBadge status={task.taskStatus} />
          </div>
        </div>

        <div className="mt-4 w-full rounded-2xl border border-[#FDE7C7] bg-[#FFF9F2] px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFEAD5] text-[#E8712E]">
              <AlertTriangle className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#B08968]">
                Lưu ý công việc
              </div>

              <div className="mt-1 text-sm leading-6 text-[#5B4636] whitespace-pre-wrap break-words">
                Kiểm tra thời gian bắt đầu, thời gian kết thúc và trạng thái
                công việc trước khi cập nhật.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[30px] font-bold text-[#2F3A67]">Chi tiết</h3>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-5">
          <div className="space-y-5">
            <div className="rounded-2xl bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold text-[#2F3A67]">
                  Thông tin công việc
                </div>
                <div className="text-xs font-medium text-[#8DA1C1]">
                  Task #{String(task.taskId).padStart(3, "0")}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoBox
                  icon={<Users className="h-4 w-4" />}
                  label="Nhân viên"
                  value={task.staffName || "--"}
                />
                <InfoBox
                  icon={<ClipboardList className="h-4 w-4" />}
                  label="Order Detail"
                  value={task.orderDetailId || "--"}
                />
                <InfoBox
                  icon={<Clock3 className="h-4 w-4" />}
                  label="Bắt đầu"
                  value={formatDateTime(task.startTime)}
                />
                <InfoBox
                  icon={<Clock3 className="h-4 w-4" />}
                  label="Kết thúc"
                  value={formatDateTime(task.endTime)}
                />
              </div>

              <div className="mt-4 w-full rounded-2xl border border-[#FDE7C7] bg-[#FFF9F2] px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFEAD5] text-[#E8712E]">
                    <ClipboardList className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#B08968]">
                      Ghi chú công việc
                    </div>

                    <div className="mt-1 text-sm leading-6 text-[#5B4636] whitespace-pre-wrap break-words">
                      {task.note || "Không có ghi chú cho công việc này."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {(message || error) && (
              <div className="rounded-2xl bg-white p-5">
                {message ? (
                  <div className="text-sm text-green-600">{message}</div>
                ) : null}
                {error ? (
                  <div className="text-sm text-red-500">{error}</div>
                ) : null}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl bg-white p-5">
              <div className="text-lg font-semibold text-[#2F3A67] mb-4">
                Lịch trong tuần
              </div>

              <div className="space-y-4">
                {weekDays.map((day) => {
                  const dayTasks = weekTasks
                    .filter((item) =>
                      isSameDate(new Date(item.startTime), day.date),
                    )
                    .sort(
                      (a, b) =>
                        new Date(a.startTime).getTime() -
                        new Date(b.startTime).getTime(),
                    );

                  return (
                    <div
                      key={day.key}
                      className="rounded-2xl border border-[#EEF2F7] bg-[#FAFBFD] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium uppercase tracking-wide text-[#8DA1C1]">
                            {day.label}
                          </div>
                          <div
                            className={`mt-1 text-lg font-bold ${
                              day.isToday ? "text-[#E54B2D]" : "text-[#2F3A67]"
                            }`}
                          >
                            {formatDate(day.date)}
                          </div>
                        </div>

                        <div className="text-xs text-[#8DA1C1]">
                          {dayTasks.length} công việc
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        {dayTasks.length > 0 ? (
                          dayTasks.map((item) => {
                            const badge = TASK_STATUS_MAP[
                              Number(item.taskStatus)
                            ] || {
                              label: `Trạng thái ${item.taskStatus}`,
                              className: "bg-[#F3F4F6] text-[#374151]",
                            };

                            return (
                              <div
                                key={item.taskId}
                                className={`rounded-xl border px-3 py-3 ${
                                  item.taskId === task.taskId
                                    ? "border-[#7CA3FF] bg-[#F4F8FF]"
                                    : "border-[#E5E7EB] bg-white"
                                }`}
                              >
                                <div className="text-xs font-semibold text-[#6B8FFB]">
                                  {formatHour(item.startTime)} -{" "}
                                  {formatHour(item.endTime)}
                                </div>
                                <div className="mt-1 text-sm font-bold text-[#2F3A67]">
                                  {item.taskName}
                                </div>
                                <div className="mt-1 text-xs text-[#8DA1C1]">
                                  {item.staffName}
                                </div>
                                <div className="mt-2">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}
                                  >
                                    {badge.label}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-xl bg-white px-4 py-3 text-sm text-gray-500">
                            Không có công việc.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <div className="rounded-xl bg-[#F8F5F1] px-4 py-3">
      <div className="flex items-center gap-2 text-[#8DA1C1] text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 font-medium text-[#2B2B2B] break-words">{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const item = TASK_STATUS_MAP[Number(status)] || {
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

function buildWeekDays(startDate) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(startDate, index);
    return {
      key: `${date.toISOString()}-${index}`,
      date,
      label: WEEKDAY_LABELS[date.getDay()],
      isToday: isSameDate(date, new Date()),
    };
  });
}

function getStartOfWeek(date) {
  const cloned = new Date(date);
  const day = cloned.getDay();
  cloned.setHours(0, 0, 0, 0);
  cloned.setDate(cloned.getDate() - day);
  return cloned;
}

function addDays(date, amount) {
  const cloned = new Date(date);
  cloned.setDate(cloned.getDate() + amount);
  return cloned;
}

function isSameDate(a, b) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function formatHour(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("vi-VN");
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
