import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import API_URL from "@/config/api";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Users,
  ClipboardList,
  UserRound,
  UtensilsCrossed,
  FileText,
} from "lucide-react";

const VIEW_OPTIONS = [
  { key: "day", label: "Ngày" },
  { key: "week", label: "Tuần" },
  { key: "month", label: "Tháng" },
];

const EVENT_COLOR_PALETTE = [
  {
    card: "border-[#BFEDEA] bg-[#F7FEFD] hover:bg-[#F1FBFA]",
    active: "border-[#88D8D1] bg-[#F1FBFA]",
    badge: "bg-[#E8F7F6] text-[#19ACA0]",
  },
  {
    card: "border-[#F8D7B8] bg-[#FFF8F2] hover:bg-[#FFF1E8]",
    active: "border-[#F0B27A] bg-[#FFF1E8]",
    badge: "bg-[#FFF1E8] text-[#E8712E]",
  },
  {
    card: "border-[#D9D6FE] bg-[#F8F7FF] hover:bg-[#F1EFFF]",
    active: "border-[#B8B1FF] bg-[#F1EFFF]",
    badge: "bg-[#EEF2FF] text-[#635BFF]",
  },
  {
    card: "border-[#CFE6C8] bg-[#F7FCF5] hover:bg-[#EEF8EA]",
    active: "border-[#9FD18F] bg-[#EEF8EA]",
    badge: "bg-[#ECF8E8] text-[#4F8A3C]",
  },
  {
    card: "border-[#F4CFE0] bg-[#FFF8FB] hover:bg-[#FFF0F6]",
    active: "border-[#E8A8C6] bg-[#FFF0F6]",
    badge: "bg-[#FDECF4] text-[#C2558A]",
  },
  {
    card: "border-[#D7E7F8] bg-[#F8FBFF] hover:bg-[#EFF6FF]",
    active: "border-[#9FC6F0] bg-[#EFF6FF]",
    badge: "bg-[#EDF5FF] text-[#3B82F6]",
  },
];

export default function OwnerStaffSchedule() {
  const [sbExpanded, setSbExpanded] = React.useState(false);

  const [orders, setOrders] = React.useState([]);
  const [staffTasks, setStaffTasks] = React.useState([]);

  const [loadingOrders, setLoadingOrders] = React.useState(true);
  const [loadingStaffTasks, setLoadingStaffTasks] = React.useState(true);

  const [errorOrders, setErrorOrders] = React.useState("");
  const [errorStaffTasks, setErrorStaffTasks] = React.useState("");

  const [search, setSearch] = React.useState("");
  const [view, setView] = React.useState("month");

  const [currentDate, setCurrentDate] = React.useState(() =>
    startOfDay(new Date()),
  );
  const [selectedDate, setSelectedDate] = React.useState(() =>
    startOfDay(new Date()),
  );
  const [selectedEvent, setSelectedEvent] = React.useState(null);

  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  const fetchOrders = React.useCallback(async () => {
    setLoadingOrders(true);
    setErrorOrders("");

    try {
      const res = await fetch(`${API_URL}/api/order`, {
        headers: {
          accept: "*/*",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải lịch đơn hàng");
      }

      setOrders(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      const msg = err.message || "Không thể tải lịch đơn hàng";
      setErrorOrders(msg);
      toast.error(msg);
    } finally {
      setLoadingOrders(false);
    }
  }, [token]);

  const fetchStaffTasks = React.useCallback(async () => {
    setLoadingStaffTasks(true);
    setErrorStaffTasks("");

    try {
      const res = await fetch(
        `${API_URL}/api/order-detail-staff-task?page=1&pageSize=200`,
        {
          headers: {
            accept: "*/*",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải lịch staff");
      }

      setStaffTasks(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      const msg = err.message || "Không thể tải lịch staff";
      setErrorStaffTasks(msg);
      setStaffTasks([]);
      toast.error(msg);
    } finally {
      setLoadingStaffTasks(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchOrders();
    fetchStaffTasks();
  }, [fetchOrders, fetchStaffTasks]);

  const orderEvents = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const result = [];

    orders.forEach((order) => {
      const details = Array.isArray(order?.orderDetails)
        ? order.orderDetails
        : [];

      details.forEach((detail) => {
        const start = detail?.startTime ? new Date(detail.startTime) : null;
        const end = detail?.endTime ? new Date(detail.endTime) : start;

        if (!start || Number.isNaN(start.getTime())) return;

        const orderDetailId = detail.orderDetailId;
        const colorKey = getColorKeyFromOrderDetailId(orderDetailId);

        const event = {
          id: `order-${order.orderId}-${orderDetailId}`,
          eventType: "order",
          orderId: order.orderId,
          orderDetailId,
          customerId: order.customerId,
          customerName: order.customerName || "--",
          phone: order.customerPhone || order.phone || "--",
          start,
          end: end && !Number.isNaN(end.getTime()) ? end : start,
          address: detail?.address || "",
          menuName: detail?.menuName || detail?.menuSnapshot?.menuName || "--",
          numberOfGuests: detail?.numberOfGuests || 0,
          note: detail?.noteOrderDetail || order?.noteOrder || "",
          type: detail?.type,
          status: detail?.status,
          statusLabel: getOrderStatusLabel(detail?.status),
          colorKey,
        };

        if (!keyword) {
          result.push(event);
          return;
        }

        const matched =
          String(event.orderId).toLowerCase().includes(keyword) ||
          String(event.customerName).toLowerCase().includes(keyword) ||
          String(event.address).toLowerCase().includes(keyword) ||
          String(event.menuName).toLowerCase().includes(keyword) ||
          String(event.statusLabel).toLowerCase().includes(keyword);

        if (matched) result.push(event);
      });
    });

    return result.sort((a, b) => a.start - b.start);
  }, [orders, search]);

  const staffEvents = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return staffTasks
      .map((task) => {
        const start = task?.startTime ? new Date(task.startTime) : null;
        const end = task?.endTime ? new Date(task.endTime) : start;

        if (!start || Number.isNaN(start.getTime())) return null;

        const orderDetailId = task.orderDetailId;
        const colorKey = getColorKeyFromOrderDetailId(orderDetailId);

        const event = {
          id: `staff-${task.taskId}`,
          eventType: "staff",
          taskId: task.taskId,
          orderDetailId,
          staffId: task.staffId,
          staffName: task.staffName || "--",
          taskName: task.taskName || "Công việc staff",
          taskStatus: task.taskStatus,
          statusLabel: getTaskStatusLabel(task.taskStatus),
          start,
          end: end && !Number.isNaN(end.getTime()) ? end : start,
          note: task.note || "",
          colorKey,
        };

        if (!keyword) return event;

        const matched =
          String(event.taskName).toLowerCase().includes(keyword) ||
          String(event.staffName).toLowerCase().includes(keyword) ||
          String(event.orderDetailId).toLowerCase().includes(keyword) ||
          String(event.statusLabel).toLowerCase().includes(keyword);

        return matched ? event : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);
  }, [staffTasks, search]);

  const allEvents = React.useMemo(() => {
    return [...orderEvents, ...staffEvents].sort((a, b) => a.start - b.start);
  }, [orderEvents, staffEvents]);

  const eventsByDate = React.useMemo(() => {
    const map = new Map();

    allEvents.forEach((event) => {
      const startDate = new Date(event.start);
      const endDate = normalizeEventEnd(event);

      if (Number.isNaN(startDate.getTime())) return;

      const startDay = startOfDay(startDate);
      const endDay = startOfDay(endDate);

      let cursor = new Date(startDay);

      while (cursor <= endDay) {
        const key = formatDateKey(cursor);
        if (!map.has(key)) map.set(key, []);

        map.get(key).push({
          ...event,
          displayDate: new Date(cursor),
          isMultiDay: startDay.getTime() !== endDay.getTime(),
        });

        cursor = addDays(cursor, 1);
      }
    });

    for (const [key, events] of map.entries()) {
      map.set(
        key,
        events.sort((a, b) => new Date(a.start) - new Date(b.start)),
      );
    }

    return map;
  }, [allEvents]);

  const selectedDateEvents = React.useMemo(() => {
    return eventsByDate.get(formatDateKey(selectedDate)) || [];
  }, [eventsByDate, selectedDate]);

  const selectedOrderStaffTasks = React.useMemo(() => {
    if (!selectedEvent || selectedEvent.eventType !== "order") return [];

    return staffTasks
      .filter(
        (task) =>
          Number(task.orderDetailId) === Number(selectedEvent.orderDetailId),
      )
      .sort(
        (a, b) =>
          new Date(a.startTime || 0).getTime() -
          new Date(b.startTime || 0).getTime(),
      );
  }, [staffTasks, selectedEvent]);

  const stats = React.useMemo(() => {
    const todayEvents = eventsByDate.get(formatDateKey(new Date())) || [];

    return [
      { label: "Đơn hàng", value: orderEvents.length },
      { label: "Lịch staff", value: staffEvents.length },
      { label: "Hôm nay", value: todayEvents.length },
    ];
  }, [orderEvents.length, staffEvents.length, eventsByDate]);

  const headerTitle =
    view === "day"
      ? formatFullDate(selectedDate)
      : view === "week"
        ? getWeekRangeLabel(currentDate)
        : `Tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}`;

  const handlePrev = () => {
    setSelectedEvent(null);

    if (view === "day") {
      const next = addDays(selectedDate, -1);
      setSelectedDate(next);
      setCurrentDate(next);
      return;
    }

    if (view === "week") {
      setCurrentDate(addDays(currentDate, -7));
      return;
    }

    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNext = () => {
    setSelectedEvent(null);

    if (view === "day") {
      const next = addDays(selectedDate, 1);
      setSelectedDate(next);
      setCurrentDate(next);
      return;
    }

    if (view === "week") {
      setCurrentDate(addDays(currentDate, 7));
      return;
    }

    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const handleToday = () => {
    const today = startOfDay(new Date());
    setCurrentDate(today);
    setSelectedDate(today);
    setSelectedEvent(null);
  };

  const isLoading = loadingOrders || loadingStaffTasks;
  const pageError = errorOrders || errorStaffTasks;

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
              <span className="text-gray-400">PHÂN CÔNG</span>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-[#2F3A67] font-bold">LỊCH TRÌNH</span>
            </>
          }
          showSearch={false}
        />

        <main className="px-7 py-6">
          <div className="mb-6 rounded-2xl bg-white px-5 py-4 border border-[#ECE7DF]">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-sm text-[#8DA1C1]">Tìm theo ngày</div>
                <div className="mt-1 text-lg font-bold text-[#2F3A67]">
                  Chọn ngày để xem nhanh lịch trình
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-[220px]">
                  <input
                    type="date"
                    value={formatInputDate(selectedDate)}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const nextDate = new Date(`${e.target.value}T00:00:00`);
                      if (Number.isNaN(nextDate.getTime())) return;

                      const normalized = startOfDay(nextDate);
                      setSelectedDate(normalized);
                      setCurrentDate(normalized);
                      setSelectedEvent(null);
                    }}
                    className="h-11 w-full rounded-xl border border-[#E6E0D7] px-4 text-sm text-[#2F3A67] outline-none focus:border-[#E8712E]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#ECE7DF] overflow-hidden">
            <div className="sticky top-0 z-20 bg-white px-5 py-4 border-b border-[#F0ECE5] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="h-10 w-10 rounded-xl border border-[#E6E0D7] flex items-center justify-center text-[#E8712E] hover:bg-[#FFF6F0]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleToday}
                  className="rounded-xl border border-[#F3B28C] px-5 py-3 text-sm font-semibold text-[#E8712E] hover:bg-[#FFF6F0]"
                >
                  Hôm nay
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="h-10 w-10 rounded-xl border border-[#E6E0D7] flex items-center justify-center text-[#E8712E] hover:bg-[#FFF6F0]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="text-[18px] md:text-[32px] font-bold text-[#E8712E]">
                {headerTitle}
              </div>

              <div className="flex items-center rounded-xl bg-[#F7F2EA] p-1">
                {VIEW_OPTIONS.map((item) => {
                  const active = view === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setView(item.key);
                        setSelectedEvent(null);
                      }}
                      className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                        active
                          ? "bg-[#E8712E] text-white"
                          : "text-[#8B6B56] hover:bg-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] xl:h-[calc(100vh-250px)]">
              <section className="min-h-0 xl:h-full border-r border-[#F0ECE5] overflow-y-auto hide-scrollbar">
                {view === "month" ? (
                  <MonthView
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    setCurrentDate={setCurrentDate}
                    events={allEvents}
                    selectedEvent={selectedEvent}
                    setSelectedEvent={setSelectedEvent}
                  />
                ) : view === "week" ? (
                  <WeekView
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    events={allEvents}
                    selectedEvent={selectedEvent}
                    setSelectedEvent={setSelectedEvent}
                  />
                ) : (
                  <DayView24h
                    selectedDate={selectedDate}
                    events={selectedDateEvents}
                    selectedEvent={selectedEvent}
                    setSelectedEvent={setSelectedEvent}
                  />
                )}
              </section>

              <aside className="min-h-0 xl:h-full bg-[#FFFDFA] overflow-y-auto hide-scrollbar">
                <div className="sticky top-0 z-10 bg-[#FFFDFA] p-5 border-b border-[#F0ECE5]">
                  <div className="text-lg font-bold text-[#2F3A67]">
                    Chi tiết lịch trình
                  </div>
                </div>

                <div className="p-5">
                  {!selectedEvent ? (
                    <div className="rounded-2xl bg-[#FAF7F2] px-4 py-4 text-sm text-[#8DA1C1]">
                      Chọn một lịch để xem chi tiết.
                    </div>
                  ) : selectedEvent.eventType === "order" ? (
                    <CompactOrderDetail
                      event={selectedEvent}
                      staffTasks={selectedOrderStaffTasks}
                      loadingStaffTasks={loadingStaffTasks}
                      errorStaffTasks={errorStaffTasks}
                    />
                  ) : (
                    <CompactStaffDetail event={selectedEvent} />
                  )}

                  {(isLoading || pageError) && !selectedEvent ? (
                    <div className="mt-5">
                      {isLoading ? (
                        <div className="text-sm text-[#8DA1C1]">
                          Đang tải lịch trình...
                        </div>
                      ) : (
                        <div className="text-sm text-red-500">{pageError}</div>
                      )}
                    </div>
                  ) : null}
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function MonthView({
  currentDate,
  selectedDate,
  setSelectedDate,
  setCurrentDate,
  events,
  selectedEvent,
  setSelectedEvent,
}) {
  const weekDays = [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ];

  const days = React.useMemo(() => getMonthGrid(currentDate), [currentDate]);
  const weeks = React.useMemo(() => chunkArray(days, 7), [days]);

  return (
    <div>
      <div className="sticky top-0 z-10 grid grid-cols-7 border-b border-[#F0ECE5] bg-[#FCFAF6]">
        {weekDays.map((day) => (
          <div
            key={day}
            className="px-3 py-3 text-center text-xs font-semibold text-[#8B6B56]"
          >
            {day}
          </div>
        ))}
      </div>

      <div>
        {weeks.map((week, weekIndex) => {
          const { multiDayRows, dayColumns, hasAnyEvent, maxDayEventCount } =
            buildMonthWeekSegments(week, events);

          const multiRowCount = multiDayRows.length;
          const hasMultiDayEvents = multiRowCount > 0;

          const baseHeight = 170;
          const extraHeight =
            maxDayEventCount >= 3
              ? Math.min((maxDayEventCount - 2) * 36, 180)
              : 0;

          const weekMinHeight = hasAnyEvent
            ? baseHeight + extraHeight + multiRowCount * 34
            : 160;

          return (
            <div
              key={`month-week-${weekIndex}`}
              className="border-b border-[#F0ECE5]"
            >
              <div className="grid grid-cols-7">
                {week.map((item) => {
                  const key = formatDateKey(item.date);
                  const selected = isSameDay(item.date, selectedDate);

                  return (
                    <button
                      key={`month-head-${key}`}
                      type="button"
                      onClick={() => {
                        setSelectedDate(startOfDay(item.date));
                        setCurrentDate(startOfDay(item.date));
                        setSelectedEvent(null);
                      }}
                      className={`border-r border-[#F0ECE5] px-3 py-3 text-left last:border-r-0 ${
                        selected
                          ? "bg-[#FFF7F2]"
                          : "bg-white hover:bg-[#FCFAF6]"
                      }`}
                    >
                      <div
                        className={`text-sm font-semibold ${
                          item.isCurrentMonth
                            ? "text-[#2F3A67]"
                            : "text-[#C8BFB2]"
                        }`}
                      >
                        {item.date.getDate()}
                      </div>
                    </button>
                  );
                })}
              </div>

              {hasMultiDayEvents ? (
                <div className="border-t border-[#F7F2EA] bg-[#FFFDFA] px-2 py-2">
                  <div className="space-y-1">
                    {Array.from({ length: multiRowCount }, (_, rowIndex) => {
                      const rowItems = multiDayRows[rowIndex] || [];

                      return (
                        <div
                          key={`month-multi-row-${rowIndex}`}
                          className="grid grid-cols-7 gap-2"
                        >
                          {Array.from({ length: 7 }, (_, dayIndex) => {
                            const item = rowItems.find(
                              (entry) => entry.weekStartIndex === dayIndex,
                            );

                            if (!item) {
                              const occupied = rowItems.some(
                                (entry) =>
                                  entry.weekStartIndex < dayIndex &&
                                  entry.weekEndIndex >= dayIndex,
                              );

                              if (occupied) return null;

                              return (
                                <div key={`month-multi-empty-${dayIndex}`} />
                              );
                            }

                            const theme = getEventTheme(
                              item.colorKey,
                              selectedEvent?.id === item.id,
                            );

                            return (
                              <button
                                key={`${item.id}-month-${rowIndex}`}
                                type="button"
                                onClick={() => {
                                  setSelectedDate(
                                    startOfDay(item.monthDisplayStart),
                                  );
                                  setCurrentDate(
                                    startOfDay(item.monthDisplayStart),
                                  );
                                  setSelectedEvent(item);
                                }}
                                className={`min-w-0 rounded-xl border px-3 py-2 text-left shadow-sm transition ${theme.wrapper}`}
                                style={{
                                  gridColumn: `${dayIndex + 1} / span ${item.weekSpan}`,
                                }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0 flex items-center gap-2">
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${theme.badge}`}
                                    >
                                      {item.eventType === "order"
                                        ? "Order"
                                        : "Staff"}
                                    </span>

                                    <span className="truncate text-[12px] font-semibold text-[#2F3A67]">
                                      {item.eventType === "order"
                                        ? `Đơn hàng #${item.orderId}`
                                        : item.taskName}
                                    </span>
                                  </div>

                                  <span className="shrink-0 text-[10px] text-[#8DA1C1]">
                                    {formatTime(item.start)} -{" "}
                                    {formatTime(item.end)}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div
                className="grid grid-cols-7"
                style={{ minHeight: `${weekMinHeight}px` }}
              >
                {week.map((item, dayIndex) => {
                  const key = formatDateKey(item.date);
                  const selected = isSameDay(item.date, selectedDate);
                  const dayEvents = dayColumns.get(key) || [];

                  const hasSpanningEvent = multiDayRows.some((row) =>
                    row.some(
                      (event) =>
                        event.weekStartIndex <= dayIndex &&
                        event.weekEndIndex >= dayIndex,
                    ),
                  );

                  return (
                    <div
                      key={`month-body-${key}`}
                      className={`border-r border-[#F0ECE5] last:border-r-0 ${
                        selected ? "bg-[#FFF7F2]" : "bg-white"
                      }`}
                    >
                      <div className="h-full overflow-y-auto hide-scrollbar p-2 space-y-2">
                        {dayEvents.length === 0 && !hasSpanningEvent ? (
                          <div className="rounded-xl border border-dashed border-[#EFE7DC] px-3 py-3 text-[12px] text-[#C6BAAD] text-center">
                            Không có lịch
                          </div>
                        ) : (
                          dayEvents.map((event) => (
                            <ScheduleEventCard
                              key={`${event.id}-${key}`}
                              event={event}
                              active={selectedEvent?.id === event.id}
                              onClick={() => {
                                setSelectedDate(startOfDay(item.date));
                                setCurrentDate(startOfDay(item.date));
                                setSelectedEvent(event);
                              }}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  currentDate,
  selectedDate,
  setSelectedDate,
  events,
  selectedEvent,
  setSelectedEvent,
}) {
  const days = React.useMemo(() => getWeekDays(currentDate), [currentDate]);

  const { multiDayRows, dayColumns } = React.useMemo(() => {
    return buildWeekSegments(days, events);
  }, [days, events]);

  const multiRowCount = multiDayRows.length;
  const hasMultiDayEvents = multiRowCount > 0;

  return (
    <div className="min-h-full bg-white">
      <div className="sticky top-0 z-20 bg-white border-b border-[#F0ECE5]">
        <div className="grid grid-cols-7 border-b border-[#F0ECE5] bg-[#FCFAF6]">
          {days.map((date) => {
            const selected = isSameDay(date, selectedDate);

            return (
              <button
                key={formatDateKey(date)}
                type="button"
                onClick={() => {
                  setSelectedDate(startOfDay(date));
                  setSelectedEvent(null);
                }}
                className={`px-3 py-4 text-center border-r border-[#F0ECE5] last:border-r-0 ${
                  selected ? "bg-[#FFF7F2]" : ""
                }`}
              >
                <div className="text-xs text-[#8B6B56]">
                  {getWeekdayLabel(date)}
                </div>
                <div className="mt-2 text-lg font-bold text-[#2F3A67]">
                  {date.getDate()}
                </div>
              </button>
            );
          })}
        </div>

        {hasMultiDayEvents ? (
          <div
            className="border-b border-[#F0ECE5] bg-[#FFFDFA] px-2 py-2"
            style={{ minHeight: `${multiRowCount * 44 + 16}px` }}
          >
            <div className="space-y-1">
              {Array.from({ length: multiRowCount }, (_, rowIndex) => {
                const rowItems = multiDayRows[rowIndex] || [];

                return (
                  <div key={rowIndex} className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const item = rowItems.find(
                        (entry) => entry.weekStartIndex === dayIndex,
                      );

                      if (!item) {
                        const occupied = rowItems.some(
                          (entry) =>
                            entry.weekStartIndex < dayIndex &&
                            entry.weekEndIndex >= dayIndex,
                        );

                        if (occupied) return null;

                        return <div key={dayIndex} />;
                      }

                      return (
                        <button
                          key={`${item.id}-${rowIndex}`}
                          type="button"
                          onClick={() => {
                            setSelectedDate(startOfDay(item.weekDisplayStart));
                            setSelectedEvent(item);
                          }}
                          className={`min-w-0 rounded-xl border px-3 py-2 text-left shadow-sm transition ${
                            getEventTheme(
                              item.colorKey,
                              selectedEvent?.id === item.id,
                            ).wrapper
                          }`}
                          style={{
                            gridColumn: `${dayIndex + 1} / span ${item.weekSpan}`,
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${
                                  getEventTheme(
                                    item.colorKey,
                                    selectedEvent?.id === item.id,
                                  ).badge
                                }`}
                              >
                                {item.eventType === "order" ? "Order" : "Staff"}
                              </span>

                              <span className="truncate text-[12px] font-semibold text-[#2F3A67]">
                                {item.eventType === "order"
                                  ? `Đơn hàng #${item.orderId}`
                                  : item.taskName}
                              </span>
                            </div>

                            <span className="shrink-0 text-[10px] text-[#8DA1C1]">
                              {formatTime(item.start)} - {formatTime(item.end)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-7 min-h-[560px]">
        {days.map((date, index) => {
          const key = formatDateKey(date);
          const selected = isSameDay(date, selectedDate);
          const events = dayColumns.get(key) || [];

          const hasSpanningEvent = multiDayRows.some((row) =>
            row.some(
              (event) =>
                event.weekStartIndex <= index && event.weekEndIndex >= index,
            ),
          );

          return (
            <div
              key={key}
              className={`border-r border-[#F0ECE5] last:border-r-0 ${
                selected ? "bg-[#FFF7F2]" : "bg-white"
              }`}
            >
              <div className="max-h-[560px] overflow-y-auto hide-scrollbar p-2 space-y-2">
                {events.length === 0 && !hasSpanningEvent ? (
                  <div className="rounded-xl border border-dashed border-[#EFE7DC] px-3 py-3 text-[12px] text-[#C6BAAD] text-center">
                    Không có lịch
                  </div>
                ) : (
                  events.map((event) => (
                    <ScheduleEventCard
                      key={`${event.id}-${key}`}
                      event={event}
                      active={selectedEvent?.id === event.id}
                      onClick={() => {
                        setSelectedDate(startOfDay(date));
                        setSelectedEvent(event);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekSpanEventCard({
  event,
  active,
  rowIndex,
  startIndex,
  span,
  onClick,
}) {
  const theme = getEventTheme(event.colorKey, active);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute rounded-xl border px-3 py-2 text-left shadow-sm transition overflow-hidden ${theme.wrapper} ${
        active ? "z-[3]" : "z-[2]"
      }`}
      style={{
        top: `${rowIndex * 56 + 8}px`,
        left: `calc(${(startIndex / 7) * 100}% + 6px)`,
        width: `calc(${(span / 7) * 100}% - 12px)`,
        height: "40px",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${theme.badge}`}
          >
            {event.eventType === "order" ? "Order" : "Staff"}
          </span>

          <span className="truncate text-[12px] font-semibold text-[#2F3A67]">
            {event.eventType === "order"
              ? `Đơn hàng #${event.orderId}`
              : event.taskName}
          </span>
        </div>

        <span className="shrink-0 text-[10px] text-[#8DA1C1]">
          {formatTime(event.start)} - {formatTime(event.end)}
        </span>
      </div>
    </button>
  );
}

function DayView24h({ selectedDate, events, selectedEvent, setSelectedEvent }) {
  const scrollRef = React.useRef(null);

  const baseHourHeight = 72;
  const expandedHourHeight = baseHourHeight * 2;
  const minEventHeight = 52;

  const dayEvents = React.useMemo(() => {
    return events
      .map((event) => clampEventToDay(event, selectedDate))
      .filter(Boolean)
      .sort((a, b) => new Date(a.displayStart) - new Date(b.displayStart));
  }, [events, selectedDate]);

  const expandedHours = React.useMemo(() => {
    const set = new Set();

    dayEvents.forEach((event) => {
      const startMinutes = getMinutesInSelectedDay(
        event.displayStart,
        selectedDate,
        false,
      );

      let endMinutes = getMinutesInSelectedDay(
        event.displayEnd,
        selectedDate,
        true,
      );

      if (endMinutes <= startMinutes) {
        endMinutes = Math.min(startMinutes + 30, 24 * 60);
      }

      const startHour = Math.floor(startMinutes / 60);
      const endHour = Math.floor(Math.max(endMinutes - 1, startMinutes) / 60);

      for (let hour = startHour; hour <= Math.min(endHour, 23); hour += 1) {
        set.add(hour);
      }
    });
    return set;
  }, [dayEvents]);

  const hourHeights = React.useMemo(() => {
    return Array.from({ length: 24 }, (_, hour) =>
      expandedHours.has(hour) ? expandedHourHeight : baseHourHeight,
    );
  }, [expandedHours]);

  const hourOffsets = React.useMemo(() => {
    const offsets = [];
    let acc = 0;

    for (let i = 0; i < 24; i += 1) {
      offsets.push(acc);
      acc += hourHeights[i];
    }

    return offsets;
  }, [hourHeights]);

  const totalHeight = React.useMemo(() => {
    return hourHeights.reduce((sum, value) => sum + value, 0);
  }, [hourHeights]);

  const getYFromMinutes = React.useCallback(
    (minutes) => {
      const safeMinutes = Math.max(0, Math.min(minutes, 24 * 60));
      const hour = Math.floor(safeMinutes / 60);

      if (hour >= 24) return totalHeight;

      const minuteInHour = safeMinutes % 60;
      const currentHourHeight = hourHeights[hour];

      return hourOffsets[hour] + (minuteInHour / 60) * currentHourHeight;
    },
    [hourHeights, hourOffsets, totalHeight],
  );

  const positionedEvents = React.useMemo(() => {
    const raw = dayEvents
      .map((event) => {
        const startMinutes = getMinutesInSelectedDay(
          event.displayStart,
          selectedDate,
          false,
        );

        let endMinutes = getMinutesInSelectedDay(
          event.displayEnd,
          selectedDate,
          true,
        );

        if (endMinutes <= startMinutes) {
          endMinutes = Math.min(startMinutes + 30, 24 * 60);
        }

        const top = getYFromMinutes(startMinutes);
        const bottom = getYFromMinutes(endMinutes);
        const height = Math.max(bottom - top, minEventHeight);

        return {
          ...event,
          startMinutes,
          endMinutes,
          top,
          height,
        };
      })
      .sort((a, b) => {
        if (a.startMinutes !== b.startMinutes) {
          return a.startMinutes - b.startMinutes;
        }
        return b.endMinutes - a.endMinutes;
      });

    const clusters = [];
    raw.forEach((event) => {
      const lastCluster = clusters[clusters.length - 1];

      if (!lastCluster || event.startMinutes >= lastCluster.maxEnd) {
        clusters.push({
          events: [event],
          maxEnd: event.endMinutes,
        });
      } else {
        lastCluster.events.push(event);
        lastCluster.maxEnd = Math.max(lastCluster.maxEnd, event.endMinutes);
      }
    });

    return clusters.flatMap((cluster) => {
      const columns = [];

      const laidOut = cluster.events.map((event) => {
        let columnIndex = 0;

        while (columnIndex < columns.length) {
          const last = columns[columnIndex];
          if (last.endMinutes <= event.startMinutes) break;
          columnIndex += 1;
        }

        columns[columnIndex] = event;

        return {
          ...event,
          columnIndex,
        };
      });

      const columnCount = Math.max(columns.length, 1);

      return laidOut.map((event) => ({
        ...event,
        columnCount,
      }));
    });
  }, [dayEvents, getYFromMinutes]);

  React.useEffect(() => {
    if (!scrollRef.current || !positionedEvents.length) return;

    const firstEvent = positionedEvents[0];
    scrollRef.current.scrollTo({
      top: Math.max(firstEvent.top - 24, 0),
      behavior: "smooth",
    });
  }, [positionedEvents, selectedDate]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto hide-scrollbar">
      <div className="sticky top-0 z-10 bg-white border-b border-[#F0ECE5] px-5 py-3">
        <div className="text-sm text-[#8DA1C1]">
          Lịch ngày {formatFullDate(selectedDate)}
        </div>
      </div>

      <div className="relative flex">
        <div className="sticky left-0 z-[5] w-[72px] shrink-0 border-r border-[#F0ECE5] bg-[#FCFAF6]">
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={hour}
              className={`relative border-b border-[#F0ECE5] text-xs text-[#8B6B56] ${
                expandedHours.has(hour) ? "bg-[#FFF7F2]" : ""
              }`}
              style={{ height: `${hourHeights[hour]}px` }}
            >
              <span className="absolute -top-2 right-3 bg-inherit px-1">
                {String(hour).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        <div
          className="relative flex-1"
          style={{ minHeight: `${totalHeight}px` }}
        >
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={hour}
              className={`border-b border-[#F0ECE5] ${
                expandedHours.has(hour) ? "bg-[#FFFDFC]" : ""
              }`}
              style={{ height: `${hourHeights[hour]}px` }}
            />
          ))}

          {positionedEvents.map((event) => (
            <DayTimeEventCard
              key={`${event.id}-${formatDateKey(selectedDate)}`}
              event={event}
              active={selectedEvent?.id === event.id}
              top={event.top}
              height={event.height}
              columnIndex={event.columnIndex}
              columnCount={event.columnCount}
              onClick={() => setSelectedEvent(event)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayTimeEventCard({
  event,
  active,
  top,
  height,
  columnIndex = 0,
  columnCount = 1,
  onClick,
}) {
  const theme = getEventTheme(event.colorKey, active);
  const gap = 8;
  const width = `calc((100% - ${(columnCount + 1) * gap}px) / ${columnCount})`;
  const left = `calc(${gap}px + ${columnIndex} * (${width} + ${gap}px))`;
  const compact = height < 96;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute rounded-2xl border px-3 py-2 text-left shadow-sm transition overflow-hidden ${theme.wrapper} ${
        active ? "z-[4]" : "z-[2]"
      }`}
      style={{
        top: `${top}px`,
        left,
        width,
        height: `${height}px`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${theme.badge}`}
        >
          {event.eventType === "order" ? "Order" : "Staff"}
        </span>

        <span className="text-[10px] text-[#8DA1C1] whitespace-nowrap text-right shrink-0">
          {event.isStartClamped ? "00:00" : formatTime(event.displayStart)} -{" "}
          {event.isEndClamped ? "24:00" : formatTime(event.displayEnd)}
        </span>
      </div>

      <div className="mt-2 text-[13px] font-bold text-[#2F3A67] line-clamp-1 break-words">
        {event.eventType === "order"
          ? `Đơn hàng #${event.orderId}`
          : event.taskName}
      </div>

      {!compact ? (
        <>
          <div className="mt-1 text-[12px] text-[#8B6B56] line-clamp-1 break-words">
            {event.eventType === "order" ? event.customerName : event.staffName}
          </div>

          <div className="mt-1 text-[11px] text-[#6B7280] line-clamp-1 break-words">
            {event.statusLabel}
          </div>

          {event.eventType === "order" ? (
            <div className="mt-1 text-[11px] text-[#8DA1C1] line-clamp-1 break-words">
              {event.address || "Không có địa chỉ"}
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-[#8DA1C1] line-clamp-1 break-words">
              OrderDetail #{event.orderDetailId}
            </div>
          )}
        </>
      ) : null}
    </button>
  );
}

function ScheduleEventCard({ event, active, onClick }) {
  const theme = getEventTheme(event.colorKey, active);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-3 py-2 text-left transition ${theme.wrapper}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${theme.badge}`}
        >
          {event.eventType === "order" ? "Order" : "Staff"}
        </span>

        <span className="text-[10px] text-[#8DA1C1] whitespace-nowrap">
          {getCompactTimeLabel(event)}
        </span>
      </div>

      <div className="mt-1 font-bold text-[#2F3A67] text-[12px] line-clamp-1">
        {event.eventType === "order"
          ? `Đơn hàng #${event.orderId}`
          : event.taskName}
      </div>

      <div className="mt-1 text-[11px] text-[#8B6B56] line-clamp-1">
        {event.eventType === "order" ? event.customerName : event.staffName}
      </div>

      <div className="mt-1 text-[10px] text-[#6B7280] line-clamp-1">
        {event.statusLabel}
      </div>

      <div className="mt-1 text-[11px] text-[#8DA1C1] line-clamp-1">
        {event.eventType === "order"
          ? event.address || "Không có địa chỉ"
          : `OrderDetail #${event.orderDetailId}`}
      </div>
    </button>
  );
}

function CompactOrderDetail({
  event,
  staffTasks,
  loadingStaffTasks,
  errorStaffTasks,
}) {
  return (
    <div className="mt-4 space-y-5">
      <div className="rounded-2xl bg-white border border-[#EEE8DE] p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="font-bold text-[#2F3A67] text-[22px]">
            Đơn hàng #{event.orderId}
          </div>
          <span className="rounded-full bg-[#FFF1E8] px-2.5 py-1 text-[11px] font-semibold text-[#E8712E]">
            {event.statusLabel}
          </span>
        </div>

        <div className="text-sm text-[#8B6B56]">{event.customerName}</div>

        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
          <Clock3 className="h-4 w-4" />
          <span>
            {formatDateTime(event.start)} - {formatDateTime(event.end)}
          </span>
        </div>

        <div className="flex items-start gap-2 text-sm text-[#6B7280]">
          <MapPin className="h-4 w-4 mt-0.5" />
          <span>{event.address || "Không có địa chỉ"}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
          <UtensilsCrossed className="h-4 w-4" />
          <span>{event.menuName || "--"}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
          <Users className="h-4 w-4" />
          <span>{event.numberOfGuests || 0} khách</span>
        </div>

        <div className="rounded-xl bg-[#FAF7F2] px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-[#8DA1C1]">
            <FileText className="h-4 w-4" />
            <span>Ghi chú</span>
          </div>
          <div className="mt-1 text-sm text-[#2B2B2B]">
            {event.note || "Không có ghi chú."}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-[#EEE8DE] p-4">
        <div className="text-[18px] font-bold text-[#2F3A67]">
          Lịch làm của staff
        </div>

        {loadingStaffTasks ? (
          <div className="mt-4 text-sm text-[#8DA1C1]">
            Đang tải lịch staff...
          </div>
        ) : errorStaffTasks ? (
          <div className="mt-4 text-sm text-red-500">{errorStaffTasks}</div>
        ) : staffTasks.length === 0 ? (
          <div className="mt-4 rounded-xl bg-[#FAF7F2] px-4 py-4 text-sm text-[#8DA1C1]">
            Chưa có lịch làm staff cho đơn này.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {staffTasks.map((task) => (
              <div
                key={task.taskId}
                className="rounded-xl border border-[#E8E3DA] bg-[#FCFBF8] px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-[#2F3A67] text-[18px] leading-snug">
                      {task.taskName || "Công việc"}
                    </div>
                    <div className="mt-1 text-sm text-[#8B6B56]">
                      {task.staffName || "Nhân viên"}
                    </div>
                  </div>

                  <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-semibold text-[#4F46E5] whitespace-nowrap">
                    {getTaskStatusLabel(task.taskStatus)}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm text-[#6B7280]">
                  <Clock3 className="h-4 w-4" />
                  <span>
                    {formatDateTime(task.startTime)} -{" "}
                    {formatDateTime(task.endTime)}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2 text-sm text-[#6B7280]">
                  <UserRound className="h-4 w-4" />
                  <span>Staff ID: {task.staffId ?? "--"}</span>
                </div>

                <div className="mt-3 rounded-lg bg-[#FAF7F2] px-3 py-2">
                  <div className="text-xs text-[#8DA1C1]">Ghi chú</div>
                  <div className="mt-1 text-sm text-[#2B2B2B]">
                    {task.note || "Không có ghi chú."}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CompactStaffDetail({ event }) {
  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-2xl bg-white border border-[#EEE8DE] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-[#2F3A67] text-[20px] leading-snug">
              {event.taskName || "--"}
            </div>
            <div className="mt-1 text-sm text-[#8B6B56]">
              {event.staffName || "--"}
            </div>
          </div>

          <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-semibold text-[#4F46E5] whitespace-nowrap">
            {event.statusLabel}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <Clock3 className="h-4 w-4" />
            <span>
              {formatDateTime(event.start)} - {formatDateTime(event.end)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <UserRound className="h-4 w-4" />
            <span>{event.staffName || "--"}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <ClipboardList className="h-4 w-4" />
            <span>OrderDetail #{event.orderDetailId || "--"}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <ClipboardList className="h-4 w-4" />
            <span>Staff ID: {event.staffId ?? "--"}</span>
          </div>

          <div className="rounded-xl bg-[#FAF7F2] px-3 py-2">
            <div className="text-xs text-[#8DA1C1]">Ghi chú</div>
            <div className="mt-1 text-sm text-[#2B2B2B]">
              {event.note || "Không có ghi chú."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getOrderStatusLabel(status) {
  const value = Number(status);
  const map = {
    1: "Chờ duyệt",
    2: "Đã duyệt",
    3: "Từ chối",
    4: "Chuẩn bị",
    5: "Đang thực hiện",
    6: "Hoàn thành",
    7: "Đã hủy",
  };
  return map[value] || `Trạng thái ${status ?? "--"}`;
}

function getTaskStatusLabel(status) {
  const value = Number(status);
  const map = {
    1: "Chưa thực hiện",
    2: "Đang thực hiện",
    3: "Hoàn thành",
    4: "Hủy",
    5: "Quá hạn",
  };
  return map[value] || `Status ${status ?? "--"}`;
}

function getColorKeyFromOrderDetailId(orderDetailId) {
  const value = Number(orderDetailId || 0);
  return Math.abs(value) % EVENT_COLOR_PALETTE.length;
}

function getEventTheme(colorKey, active = false) {
  const palette =
    EVENT_COLOR_PALETTE[Number.isInteger(colorKey) ? colorKey : 0] ||
    EVENT_COLOR_PALETTE[0];

  return {
    wrapper: active ? palette.active : palette.card,
    badge: palette.badge,
  };
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return startOfDay(next);
}

function diffInDays(a, b) {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthGrid(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const start = addDays(firstDay, -firstDay.getDay());
  const end = addDays(lastDay, 6 - lastDay.getDay());

  const days = [];
  let cursor = new Date(start);

  while (cursor <= end) {
    days.push({
      date: new Date(cursor),
      isCurrentMonth: cursor.getMonth() === month,
    });
    cursor = addDays(cursor, 1);
  }

  return days;
}

function getWeekDays(date) {
  const base = startOfDay(date);
  const day = base.getDay();
  const start = addDays(base, -day);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function getWeekdayLabel(date) {
  const names = [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ];
  return names[date.getDay()];
}

function getWeekRangeLabel(date) {
  const days = getWeekDays(date);
  const start = days[0];
  const end = days[6];
  return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
}

function formatTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFullDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDayBounds(date) {
  const start = startOfDay(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function normalizeEventEnd(event) {
  const start = new Date(event.start);
  const endRaw = new Date(event.end);

  if (Number.isNaN(start.getTime())) return endRaw;
  if (Number.isNaN(endRaw.getTime()) || endRaw <= start) {
    return new Date(start.getTime() + 30 * 60 * 1000);
  }
  return endRaw;
}

function clampEventToDay(event, date) {
  const { start: dayStart, end: dayEnd } = getDayBounds(date);

  const eventStart = new Date(event.start);
  const eventEnd = normalizeEventEnd(event);

  if (Number.isNaN(eventStart.getTime())) return null;

  const clampedStart = eventStart < dayStart ? dayStart : eventStart;
  const clampedEnd = eventEnd > dayEnd ? dayEnd : eventEnd;

  if (clampedEnd <= clampedStart) return null;

  return {
    ...event,
    displayStart: clampedStart,
    displayEnd: clampedEnd,
    originalStart: eventStart,
    originalEnd: eventEnd,
    isStartClamped: eventStart < dayStart,
    isEndClamped: eventEnd > dayEnd,
  };
}

function getCompactTimeLabel(event) {
  const start = new Date(event.start);
  const end = normalizeEventEnd(event);
  const sameDay = isSameDay(start, end);

  if (sameDay) {
    return formatTime(start);
  }

  if (event.displayDate) {
    const displayDay = startOfDay(event.displayDate);
    if (isSameDay(displayDay, startOfDay(start))) {
      return `${formatTime(start)} →`;
    }
    if (isSameDay(displayDay, startOfDay(end))) {
      return `→ ${formatTime(end)}`;
    }
  }

  return `${formatTime(start)} - ${formatTime(end)}`;
}

function getMaxRowIndex(items) {
  if (!items.length) return 0;
  return Math.max(...items.map((item) => item.rowIndex || 0));
}

function getMinutesInSelectedDay(date, selectedDate, isEnd = false) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return 0;

  const dayStart = startOfDay(selectedDate);
  const nextDay = addDays(selectedDate, 1);

  if (isEnd && value.getTime() === nextDay.getTime()) {
    return 24 * 60;
  }

  if (value < dayStart) return 0;
  if (value > nextDay) return 24 * 60;

  return value.getHours() * 60 + value.getMinutes();
}

function buildWeekSegments(days, events) {
  const weekStart = startOfDay(days[0]);
  const weekEnd = endOfDay(days[6]);

  const normalized = events
    .map((event) => {
      const start = new Date(event.start);
      const end = normalizeEventEnd(event);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
      }

      if (end < weekStart || start > weekEnd) {
        return null;
      }

      const displayStart = start < weekStart ? weekStart : start;
      const displayEnd = end > weekEnd ? weekEnd : end;

      const weekStartIndex = diffInDays(startOfDay(displayStart), weekStart);
      const weekEndIndex = diffInDays(startOfDay(displayEnd), weekStart);
      const weekSpan = Math.max(1, weekEndIndex - weekStartIndex + 1);

      return {
        ...event,
        weekDisplayStart: displayStart,
        weekDisplayEnd: displayEnd,
        weekStartIndex,
        weekEndIndex,
        weekSpan,
      };
    })
    .filter(Boolean);

  const multiDayEvents = normalized
    .filter((event) => event.weekSpan > 1)
    .sort((a, b) => {
      if (a.weekStartIndex !== b.weekStartIndex) {
        return a.weekStartIndex - b.weekStartIndex;
      }
      if (b.weekSpan !== a.weekSpan) {
        return b.weekSpan - a.weekSpan;
      }
      return new Date(a.start) - new Date(b.start);
    });

  const multiDayRows = [];

  multiDayEvents.forEach((event) => {
    let placed = false;

    for (let rowIndex = 0; rowIndex < multiDayRows.length; rowIndex += 1) {
      const row = multiDayRows[rowIndex];

      const overlaps = row.some(
        (item) =>
          !(
            event.weekEndIndex < item.weekStartIndex ||
            event.weekStartIndex > item.weekEndIndex
          ),
      );

      if (!overlaps) {
        row.push(event);
        placed = true;
        break;
      }
    }

    if (!placed) {
      multiDayRows.push([event]);
    }
  });

  const dayColumns = new Map(days.map((date) => [formatDateKey(date), []]));

  normalized
    .filter((event) => event.weekSpan === 1)
    .forEach((event) => {
      const key = formatDateKey(startOfDay(event.weekDisplayStart));
      if (!dayColumns.has(key)) {
        dayColumns.set(key, []);
      }
      dayColumns.get(key).push(event);
    });

  for (const [key, list] of dayColumns.entries()) {
    dayColumns.set(
      key,
      list.sort((a, b) => {
        const timeDiff = new Date(a.start) - new Date(b.start);
        if (timeDiff !== 0) return timeDiff;
        return new Date(a.end) - new Date(b.end);
      }),
    );
  }

  return {
    multiDayRows,
    dayColumns,
  };
}

function buildMonthWeekSegments(week, events) {
  const weekStart = startOfDay(week[0].date);
  const weekEnd = endOfDay(week[6].date);

  const normalized = events
    .map((event) => {
      const start = new Date(event.start);
      const end = normalizeEventEnd(event);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
      }

      if (end < weekStart || start > weekEnd) {
        return null;
      }

      const displayStart = start < weekStart ? weekStart : start;
      const displayEnd = end > weekEnd ? weekEnd : end;

      const weekStartIndex = diffInDays(startOfDay(displayStart), weekStart);
      const weekEndIndex = diffInDays(startOfDay(displayEnd), weekStart);
      const weekSpan = Math.max(1, weekEndIndex - weekStartIndex + 1);

      return {
        ...event,
        monthDisplayStart: displayStart,
        monthDisplayEnd: displayEnd,
        weekStartIndex,
        weekEndIndex,
        weekSpan,
      };
    })
    .filter(Boolean);

  const multiDayEvents = normalized
    .filter((event) => event.weekSpan > 1)
    .sort((a, b) => {
      if (a.weekStartIndex !== b.weekStartIndex) {
        return a.weekStartIndex - b.weekStartIndex;
      }
      if (b.weekSpan !== a.weekSpan) {
        return b.weekSpan - a.weekSpan;
      }
      return new Date(a.start) - new Date(b.start);
    });

  const multiDayRows = [];

  multiDayEvents.forEach((event) => {
    let placed = false;

    for (let rowIndex = 0; rowIndex < multiDayRows.length; rowIndex += 1) {
      const row = multiDayRows[rowIndex];

      const overlaps = row.some(
        (item) =>
          !(
            event.weekEndIndex < item.weekStartIndex ||
            event.weekStartIndex > item.weekEndIndex
          ),
      );

      if (!overlaps) {
        row.push(event);
        placed = true;
        break;
      }
    }

    if (!placed) {
      multiDayRows.push([event]);
    }
  });

  const dayColumns = new Map(
    week.map((item) => [formatDateKey(item.date), []]),
  );

  normalized
    .filter((event) => event.weekSpan === 1)
    .forEach((event) => {
      const key = formatDateKey(startOfDay(event.monthDisplayStart));
      if (!dayColumns.has(key)) {
        dayColumns.set(key, []);
      }
      dayColumns.get(key).push({
        ...event,
        displayDate: startOfDay(event.monthDisplayStart),
      });
    });

  for (const [key, list] of dayColumns.entries()) {
    dayColumns.set(
      key,
      list.sort((a, b) => {
        const timeDiff = new Date(a.start) - new Date(b.start);
        if (timeDiff !== 0) return timeDiff;
        return new Date(a.end) - new Date(b.end);
      }),
    );
  }

  const maxDayEventCount = Math.max(
    0,
    ...Array.from(dayColumns.values()).map((list) => list.length),
  );

  return {
    multiDayRows,
    dayColumns,
    hasAnyEvent: normalized.length > 0,
    maxDayEventCount,
  };
}
function chunkArray(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}
function formatInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
