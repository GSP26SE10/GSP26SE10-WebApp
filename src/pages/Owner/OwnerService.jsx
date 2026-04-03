import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ChatPanel from "@/components/ChatPanel";
import API_URL from "@/config/api";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function OwnerService() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [openChat, setOpenChat] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [services, setServices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_URL}/api/service`, {
          headers: { accept: "*/*" },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Không thể tải danh sách dịch vụ");
        }

        setServices(Array.isArray(data?.items) ? data.items : []);
      } catch (err) {
        const errMessage = err.message || "Đã có lỗi xảy ra";
        setError(errMessage);
        toast.error(errMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const filteredServices = services.filter((service) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;

    return (
      service.serviceName?.toLowerCase().includes(keyword) ||
      service.description?.toLowerCase().includes(keyword)
    );
  });

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
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-gray-900">DỊCH VỤ</span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm dịch vụ"
          onMailClick={() => setOpenChat(true)}
        />

        <main className="px-7 py-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-[20px] font-bold text-[#E54B2D]">
              Tất cả Dịch vụ
            </h1>

            <button
              type="button"
              className="h-10 px-4 rounded-lg bg-[#E8712E] text-white font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition"
            >
              <Plus className="h-4 w-4" />
              Thêm Dịch vụ
            </button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-8">
              {filteredServices.map((service) => (
                <ServiceCard key={service.serviceId} service={service} />
              ))}
            </div>
          )}
        </main>
      </div>

      <ChatPanel open={openChat} onClose={() => setOpenChat(false)} />
    </div>
  );
}

function ServiceCard({ service }) {
  const isActive = Number(service.status) === 1;

  return (
    <div className="rounded-xl overflow-hidden bg-white shadow-sm border border-[#E9E2D8]">
      <div className="h-[180px] w-full overflow-hidden bg-[#F5F5F5]">
        {service.img ? (
          <img
            src={service.img}
            alt={service.serviceName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">
            Không có ảnh
          </div>
        )}
      </div>

      <div className="px-4 pt-4 pb-3 text-center">
        <div className="text-[18px] font-bold text-[#E54B2D] leading-snug">
          {service.serviceName}
        </div>

        <div className="mt-1 text-[14px] font-bold text-[#2F3A67]">
          {formatPrice(service.basePrice)}
        </div>

        <div className="text-[#E54B2D] leading-none">.</div>

        <div className="mt-1 text-[14px] text-[#8A8A8A] leading-relaxed min-h-[42px]">
          {service.description || "Chưa có mô tả"}
        </div>
      </div>

      <div
        className={`py-3 text-center text-sm font-semibold ${
          isActive
            ? "bg-[#DCEFD9] text-[#2D9C3C]"
            : "bg-[#F6DAD4] text-[#D9534F]"
        }`}
      >
        {isActive ? "Đang mở" : "Ngừng cung cấp"}
      </div>
    </div>
  );
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} VNĐ`;
}
