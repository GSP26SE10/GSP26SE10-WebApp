import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import API_URL from "@/config/api";
import { Star, Image as ImageIcon, X, Bot } from "lucide-react";
import { toast } from "sonner";

const FEEDBACK_MENU_ENDPOINT = `${API_URL}/api/feedback-menu`;
const FEEDBACK_SERVICE_ENDPOINT = `${API_URL}/api/feedback-service`;
const MENU_ENDPOINT = `${API_URL}/api/menu`;
const SERVICE_ENDPOINT = `${API_URL}/api/service`;

const PAGE_SIZE = 100;

export default function OwnerFeedback() {
  const [sbExpanded, setSbExpanded] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState("menu");
  const [search, setSearch] = React.useState("");

  const [menuFeedbacks, setMenuFeedbacks] = React.useState([]);
  const [serviceFeedbacks, setServiceFeedbacks] = React.useState([]);
  const [menus, setMenus] = React.useState([]);
  const [services, setServices] = React.useState([]);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [openDetailModal, setOpenDetailModal] = React.useState(false);
  const [selectedGroup, setSelectedGroup] = React.useState(null);

  const [previewImages, setPreviewImages] = React.useState([]);
  const [previewIndex, setPreviewIndex] = React.useState(0);
  const [openImageViewer, setOpenImageViewer] = React.useState(false);

  const fetchAllPages = React.useCallback(async (baseUrl) => {
    let page = 1;
    let allItems = [];
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(`${baseUrl}?page=${page}&pageSize=${PAGE_SIZE}`, {
        headers: { accept: "*/*" },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || `Không thể tải dữ liệu từ ${baseUrl}`);
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
  }, []);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [menuFb, serviceFb, menuList, serviceList] = await Promise.all([
        fetchAllPages(FEEDBACK_MENU_ENDPOINT),
        fetchAllPages(FEEDBACK_SERVICE_ENDPOINT),
        fetchAllPages(MENU_ENDPOINT).catch(() => []),
        fetchAllPages(SERVICE_ENDPOINT).catch(() => []),
      ]);

      setMenuFeedbacks(Array.isArray(menuFb) ? menuFb : []);
      setServiceFeedbacks(Array.isArray(serviceFb) ? serviceFb : []);
      setMenus(Array.isArray(menuList) ? menuList : []);
      setServices(Array.isArray(serviceList) ? serviceList : []);
    } catch (err) {
      const message = err.message || "Đã có lỗi xảy ra";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [fetchAllPages]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const menuMap = React.useMemo(() => {
    const map = new Map();
    menus.forEach((item) => {
      map.set(Number(item.menuId), item);
    });
    return map;
  }, [menus]);

  const serviceMap = React.useMemo(() => {
    const map = new Map();
    services.forEach((item) => {
      map.set(Number(item.serviceId), item);
    });
    return map;
  }, [services]);

  const groupedMenus = React.useMemo(() => {
    const groups = new Map();

    for (const fb of menuFeedbacks) {
      const key = Number(fb.menuId);
      if (!groups.has(key)) {
        const menu = menuMap.get(key);

        groups.set(key, {
          id: key,
          type: "menu",
          name: fb.menuName || menu?.menuName || `Menu #${key}`,
          image: getEntityImage(menu),
          feedbacks: [],
          aiSummary: "",
          averageRating: 0,
          totalFeedbacks: 0,
        });
      }

      groups.get(key).feedbacks.push(fb);
    }

    return Array.from(groups.values())
      .map((group) => {
        const total = group.feedbacks.length;
        const avg =
          total > 0
            ? group.feedbacks.reduce(
                (sum, item) => sum + Number(item.rating || 0),
                0,
              ) / total
            : 0;

        const aiSummary =
          group.feedbacks.find(
            (item) =>
              typeof item.aisMenuSummary === "string" &&
              item.aisMenuSummary.trim(),
          )?.aisMenuSummary || "";

        return {
          ...group,
          aiSummary,
          averageRating: avg,
          totalFeedbacks: total,
          feedbacks: [...group.feedbacks].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
          ),
        };
      })
      .sort((a, b) => b.averageRating - a.averageRating);
  }, [menuFeedbacks, menuMap]);

  const groupedServices = React.useMemo(() => {
    const groups = new Map();

    for (const fb of serviceFeedbacks) {
      const key = Number(fb.serviceId);

      if (!groups.has(key)) {
        const service = serviceMap.get(key);

        groups.set(key, {
          id: key,
          type: "service",
          name: fb.serviceName || service?.serviceName || `Dịch vụ #${key}`,
          image: getEntityImage(service),
          feedbacks: [],
          aiSummary: "",
          averageRating: 0,
          totalFeedbacks: 0,
        });
      }

      groups.get(key).feedbacks.push(fb);
    }

    return Array.from(groups.values())
      .map((group) => {
        const total = group.feedbacks.length;
        const avg =
          total > 0
            ? group.feedbacks.reduce(
                (sum, item) => sum + Number(item.rating || 0),
                0,
              ) / total
            : 0;

        const aiSummary =
          group.feedbacks.find(
            (item) =>
              typeof item.aisServiceSummary === "string" &&
              item.aisServiceSummary.trim(),
          )?.aisServiceSummary || "";

        return {
          ...group,
          aiSummary,
          averageRating: avg,
          totalFeedbacks: total,
          feedbacks: [...group.feedbacks].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
          ),
        };
      })
      .sort((a, b) => b.averageRating - a.averageRating);
  }, [serviceFeedbacks, serviceMap]);

  const displayedGroups = React.useMemo(() => {
    const source = activeTab === "menu" ? groupedMenus : groupedServices;
    const keyword = search.trim().toLowerCase();

    if (!keyword) return source;

    return source.filter((item) => {
      return (
        item.name?.toLowerCase().includes(keyword) ||
        item.aisMenuSummary?.toLowerCase().includes(keyword) ||
        item.feedbacks.some(
          (fb) =>
            fb.customerName?.toLowerCase().includes(keyword) ||
            fb.comment?.toLowerCase().includes(keyword),
        )
      );
    });
  }, [activeTab, groupedMenus, groupedServices, search]);

  const openDetail = (group) => {
    setSelectedGroup(group);
    setOpenDetailModal(true);
  };

  const closeDetail = () => {
    setSelectedGroup(null);
    setOpenDetailModal(false);
  };

  const handleOpenImageViewer = (images, index = 0) => {
    setPreviewImages(Array.isArray(images) ? images : []);
    setPreviewIndex(index);
    setOpenImageViewer(true);
  };

  const closeImageViewer = () => {
    setPreviewImages([]);
    setPreviewIndex(0);
    setOpenImageViewer(false);
  };

  const showPrevImage = () => {
    setPreviewIndex((prev) =>
      prev === 0 ? previewImages.length - 1 : prev - 1,
    );
  };

  const showNextImage = () => {
    setPreviewIndex((prev) =>
      prev === previewImages.length - 1 ? 0 : prev + 1,
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFAF0] font-main">
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
              <span className="text-gray-900">FEEDBACK</span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm menu, dịch vụ, khách hàng, nội dung"
        />

        <main className="px-7 py-6 pb-10">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-[20px] font-bold text-[#E54B2D]">
              Feedback menu và dịch vụ
            </h1>
          </div>

          <div className="mb-6 w-full">
            <div className="relative">
              <div className="flex items-center gap-8 px-2 text-sm font-semibold text-[#E8712E]">
                <button
                  type="button"
                  onClick={() => setActiveTab("menu")}
                  className={`relative pb-4 transition ${
                    activeTab === "menu"
                      ? "text-[#E8712E]"
                      : "text-[#E8712E]/70"
                  }`}
                >
                  Menu
                  {activeTab === "menu" && (
                    <span className="absolute bottom-0 left-0 h-[3px] w-12 bg-[#E54B2D]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("service")}
                  className={`relative pb-4 transition ${
                    activeTab === "service"
                      ? "text-[#E8712E]"
                      : "text-[#E8712E]/70"
                  }`}
                >
                  Service
                  {activeTab === "service" && (
                    <span className="absolute bottom-0 left-0 h-[3px] w-14 bg-[#E54B2D]" />
                  )}
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2d2d2d]/70" />
            </div>
          </div>

          {loading ? (
            <div className="mt-16 text-sm text-gray-500">
              Đang tải dữ liệu...
            </div>
          ) : error ? (
            <div className="mt-16 text-sm text-red-500">{error}</div>
          ) : displayedGroups.length === 0 ? (
            <div className="mt-16 text-sm text-gray-500">
              Không có feedback phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {displayedGroups.map((group) => (
                <FeedbackSummaryCard
                  key={`${group.type}-${group.id}`}
                  group={group}
                  onClick={() => openDetail(group)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {openDetailModal && selectedGroup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedGroup.name}
                </h2>

                <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span>
                    Đánh giá trung bình:{" "}
                    <span
                      className={`font-semibold ${
                        selectedGroup.averageRating < 2
                          ? "text-red-600"
                          : "text-[#E8712E]"
                      }`}
                    >
                      {selectedGroup.averageRating.toFixed(1)}/5
                    </span>
                  </span>
                  <span>{selectedGroup.totalFeedbacks} feedback</span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDetail}
                className="rounded-full p-2 transition hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="hide-scrollbar max-h-[calc(90vh-76px)] overflow-y-auto p-6">
              {selectedGroup.aiSummary && (
                <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-700">
                    <div className="h-4 " />
                    AI đánh giá{" "}
                    {selectedGroup.type === "menu" ? "menu" : "dịch vụ"}
                  </div>
                  <div className="text-sm leading-6 text-orange-900">
                    {selectedGroup.aiSummary}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {selectedGroup.feedbacks.map((fb) => (
                  <FeedbackDetailCard
                    key={getDetailFeedbackKey(fb, selectedGroup.type)}
                    item={fb}
                    type={selectedGroup.type}
                    onPreviewImages={handleOpenImageViewer}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {openImageViewer && previewImages.length > 0 && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-4xl">
            <button
              type="button"
              onClick={closeImageViewer}
              className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-2 shadow hover:bg-white"
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>

            {previewImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPrevImage}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-lg font-bold shadow hover:bg-white"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-lg font-bold shadow hover:bg-white"
                >
                  ›
                </button>
              </>
            )}

            <div className="overflow-hidden rounded-2xl bg-white p-3 shadow-2xl">
              <img
                src={previewImages[previewIndex]}
                alt={`preview-${previewIndex + 1}`}
                className="max-h-[80vh] w-full rounded-xl object-contain"
              />
            </div>

            {previewImages.length > 1 && (
              <div className="mt-3 text-center text-sm text-white">
                {previewIndex + 1}/{previewImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackSummaryCard({ group, onClick }) {
  const isBad = group.averageRating < 2;
  const hasaiSummary = !!group.aiSummary;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left shadow-sm transition hover:shadow-md ${
        isBad ? "border-red-200 bg-red-50/50" : "border-[#F1E3D8] bg-white"
      }`}
    >
      <div className="mb-4 flex items-start gap-4">
        <div
          className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl ${
            isBad ? "bg-red-100" : "bg-[#FFF3EA]"
          }`}
        >
          {group.image ? (
            <img
              src={group.image}
              alt={group.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon
                className={`h-8 w-8 ${
                  isBad ? "text-red-500" : "text-[#E8712E]"
                }`}
              />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={`line-clamp-2 text-[18px] font-bold ${
              isBad ? "text-red-700" : "text-[#2D9C3C]"
            }`}
          >
            {group.name}
          </div>

          <div className="mt-1 text-sm text-gray-500">
            {group.type === "menu" ? "Menu" : "Dịch vụ"}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Star
              className={`h-4 w-4 ${
                isBad
                  ? "fill-red-500 text-red-500"
                  : "fill-[#F59E0B] text-[#F59E0B]"
              }`}
            />
            <span
              className={`text-sm font-semibold ${
                isBad ? "text-red-600" : "text-gray-700"
              }`}
            >
              {group.averageRating.toFixed(1)}/5
            </span>
          </div>
        </div>
      </div>

      {hasaiSummary && (
        <div className="mb-4 rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-800">
          <span className="font-semibold">AI tóm tắt đánh giá</span>{" "}
          <span className="line-clamp-2">{group.aiSummary}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isBad ? "bg-red-100 text-red-700" : "bg-[#FFF3EA] text-[#E8712E]"
          }`}
        >
          {group.totalFeedbacks} feedback
        </div>

        <div
          className={`text-xs font-semibold ${
            isBad ? "text-red-600" : "text-[#E8712E]"
          }`}
        >
          Xem chi tiết
        </div>
      </div>
    </button>
  );
}

function FeedbackDetailCard({ item, type, onPreviewImages }) {
  const rating = Number(item.rating || 0);
  const images = normalizeImageList(item.img);
  const isBad = rating <= 2;

  return (
    <div className="rounded-2xl border border-[#F1E3D8] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-gray-900">
            {item.customerName || "Ẩn danh"}
          </div>

          <div className="mt-1 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
              const filled = index < rating;
              return (
                <Star
                  key={index}
                  className={`h-4 w-4 ${
                    filled ? "fill-[#F59E0B] text-[#F59E0B]" : "text-gray-300"
                  }`}
                />
              );
            })}
            <span className="ml-2 text-sm font-medium text-gray-600">
              {rating}/5
            </span>
          </div>
        </div>

        <div className="text-xs text-gray-400">
          {formatDateTime(item.createdAt)}
        </div>
      </div>

      <div
        className={`mt-4 rounded-xl px-4 py-3 text-sm leading-6 ${
          isBad ? "bg-red-50 text-red-700" : "bg-[#FFF9F4] text-gray-700"
        }`}
      >
        {item.comment || "Không có nội dung feedback"}
      </div>

      {images.length > 0 && (
        <div className="mt-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Ảnh khách hàng gửi
          </div>

          <div className="flex flex-wrap gap-2">
            {images.map((url, idx) => (
              <button
                key={`${url}-${idx}`}
                type="button"
                onClick={() => onPreviewImages(images, idx)}
                className="overflow-hidden rounded-xl border border-[#F1E3D8] bg-white"
              >
                <img
                  src={url}
                  alt={`feedback-${idx + 1}`}
                  className="h-24 w-24 object-cover transition hover:scale-105"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span>Mã đơn: #{item.orderId}</span>
        <span>
          {type === "menu"
            ? `OrderDetail #${item.orderDetailId}`
            : `BookingDetail #${item.bookingDetailId || item.orderDetailId || "—"}`}
        </span>
      </div>
    </div>
  );
}

function getDetailFeedbackKey(item, type) {
  if (type === "menu") return `menu-detail-${item.feedbackMenuId}`;
  return `service-detail-${item.feedbackServiceId}`;
}

function getEntityImage(entity) {
  if (!entity) return "";

  const candidates = [
    entity.img,
    entity.image,
    entity.thumbnail,
    entity.avatar,
    entity.imageUrl,
    entity.imgUrl,
  ];

  for (const value of candidates) {
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (typeof first === "string" && first.trim()) {
        return normalizeImageUrl(first);
      }
    }

    if (typeof value === "string" && value.trim()) {
      return normalizeImageUrl(value);
    }
  }

  return "";
}

function normalizeImageList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === "string" && item.trim())
      .map((item) => normalizeImageUrl(item));
  }

  if (typeof value === "string" && value.trim()) {
    return [normalizeImageUrl(value)];
  }

  return [];
}

function normalizeImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_URL}${url}`;
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN");
}
