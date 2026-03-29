import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  ChevronDown,
  List,
  BookOpen,
  Soup,
  Folder,
  ConciergeBell,
  Gift,
  Warehouse,
  ClipboardList,
  Search,
  Users,
  CalendarDays,
  User,
} from "lucide-react";

export default function Sidebar({ onExpandChange }) {
  const [expanded, setExpanded] = React.useState(false);

  const [openManage, setOpenManage] = React.useState(true);
  const [openOrders, setOpenOrders] = React.useState(true);
  const [openAssign, setOpenAssign] = React.useState(true);

  const { pathname } = useLocation();

  const isManageActive = [
    "/menu",
    "/mon-an",
    "/danh-muc",
    "/dich-vu",
    "/tiec",
    "/kho",
  ].some((p) => pathname.startsWith(p));

  const isOrdersActive = ["/orders", "/tra-cuu"].some((p) =>
    pathname.startsWith(p),
  );

  const isAssignActive = ["/nhan-vien", "/lich-trinh"].some((p) =>
    pathname.startsWith(p),
  );

  const handleEnter = () => {
    setExpanded(true);
    onExpandChange?.(true);
  };

  const handleLeave = () => {
    setExpanded(false);
    onExpandChange?.(false);
  };

  return (
    <aside
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`fixed left-0 top-0 z-50 h-screen bg-white border-r font-main flex flex-col
      overflow-y-auto transition-all duration-300 ease-in-out
      ${expanded ? "w-72" : "w-20"}`}
    >
      {/* LOGO */}
      <div className="h-20 flex items-center justify-center ">
        <div className="font-logo text-[#E8712E] tracking-wide">
          {expanded ? (
            <span className="text-4xl">BOOKFET</span>
          ) : (
            <span className="text-4xl">B</span>
          )}
        </div>
      </div>

      <nav
        className={`flex-1 py-5 ${expanded ? "px-4" : "px-2"} text-gray-800`}
      >
        <NavItemLink
          to="/owner/dashboard"
          expanded={expanded}
          icon={<LayoutGrid className="h-5 w-5" />}
          label="Tổng quan"
        />

        {expanded && <SectionTitle>NHÀ HÀNG</SectionTitle>}

        {/* Quản lý */}
        <Dropdown
          expanded={expanded}
          label="Quản lý"
          icon={<List className="h-5 w-5" />}
          open={openManage}
          onToggle={() => setOpenManage((v) => !v)}
          forceActive={isManageActive}
        >
          <SubItemLink
            to="/owner/menu"
            expanded={expanded}
            icon={<BookOpen className="h-4 w-4" />}
            label="Menu"
          />
          <SubItemLink
            to="/owner/dish"
            expanded={expanded}
            icon={<Soup className="h-4 w-4" />}
            label="Món ăn"
          />
          <SubItemLink
            to="/owner/dish-category"
            expanded={expanded}
            icon={<Folder className="h-4 w-4" />}
            label="Danh mục món ăn"
          />
          <SubItemLink
            to="/owner/service"
            expanded={expanded}
            icon={<ConciergeBell className="h-4 w-4" />}
            label="Dịch vụ"
          />
          <SubItemLink
            to="/owner/party-category"
            expanded={expanded}
            icon={<Gift className="h-4 w-4" />}
            label="Tiệc"
          />
          <SubItemLink
            to="/owner/ingredient"
            expanded={expanded}
            icon={<Warehouse className="h-4 w-4" />}
            label="Kho"
          />
        </Dropdown>

        {/* Đơn hàng */}
        <Dropdown
          expanded={expanded}
          label="Đơn hàng"
          icon={<ClipboardList className="h-5 w-5" />}
          open={openOrders}
          onToggle={() => setOpenOrders((v) => !v)}
          forceActive={isOrdersActive}
        >
          <SubItemLink
            to="/owner/orders/pending"
            expanded={expanded}
            icon={<ClipboardList className="h-4 w-4" />}
            label="Chờ duyệt"
          />
          <SubItemLink
            to="/owner/orders/tracking"
            expanded={expanded}
            icon={<Search className="h-4 w-4" />}
            label="Tra cứu"
          />
        </Dropdown>

        {/* Phân công */}
        <Dropdown
          expanded={expanded}
          label="Phân công"
          icon={<Users className="h-5 w-5" />}
          open={openAssign}
          onToggle={() => setOpenAssign((v) => !v)}
          forceActive={isAssignActive}
        >
          <SubItemLink
            to="/owner/staff"
            expanded={expanded}
            icon={<Users className="h-4 w-4" />}
            label="Nhân viên"
          />
          <SubItemLink
            to="/owner/schedule"
            expanded={expanded}
            icon={<CalendarDays className="h-4 w-4" />}
            label="Lịch trình"
          />
        </Dropdown>

        {/* Cài đặt */}
        {expanded && (
          <>
            <div className="my-6 border-t" />
            <SectionTitle>CÀI ĐẶT</SectionTitle>
          </>
        )}

        <NavItemLink
          to="/owner/account"
          expanded={expanded}
          icon={<User className="h-5 w-5" />}
          label="Tài khoản"
        />
      </nav>
    </aside>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="mt-5 mb-2 px-2 text-xs font-semibold tracking-widest text-gray-400">
      {children}
    </div>
  );
}

function NavItemLink({ to, icon, label, expanded }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `w-full flex items-center py-3 rounded-xl text-sm transition
         ${expanded ? "px-4 gap-3" : "justify-center px-0"}
         ${
           isActive
             ? "bg-[#FBE7D5] text-[#E8712E] font-semibold"
             : "text-gray-800 hover:bg-gray-100"
         }`
      }
      title={!expanded ? label : undefined}
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? "text-[#E8712E]" : "text-gray-500"}>
            {icon}
          </span>
          <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out
              ${
                expanded
                  ? "max-w-[220px] opacity-100 translate-x-0"
                  : "max-w-0 opacity-0 -translate-x-2"
              }`}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

function Dropdown({
  icon,
  label,
  open,
  onToggle,
  children,
  expanded,
  forceActive,
}) {
  const active = !!forceActive;

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={expanded ? onToggle : undefined}
        className={`w-full flex items-center py-3 rounded-xl text-sm transition
          ${expanded ? "justify-between px-4" : "justify-center px-0"}
          ${active ? "bg-[#F3F4F6]" : "hover:bg-gray-100"}
        `}
        title={!expanded ? label : undefined}
      >
        <div className={`flex items-center ${expanded ? "gap-3" : ""}`}>
          <span className="text-gray-500">{icon}</span>

          <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out
              ${
                expanded
                  ? "max-w-[220px] opacity-100 translate-x-0"
                  : "max-w-0 opacity-0 -translate-x-2"
              }`}
          >
            <span className={`font-semibold ${active ? "text-gray-900" : ""}`}>
              {label}
            </span>
          </span>
        </div>

        <span
          className={`transition-all duration-300 ease-out
            ${expanded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"}
          `}
        >
          <ChevronDown
            className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {open && (
        <div
          className={`mt-1 space-y-1 ${
            expanded ? "ml-10" : "flex flex-col items-center"
          }`}
        >
          {React.Children.map(children, (child) =>
            React.cloneElement(child, { expanded }),
          )}
        </div>
      )}
    </div>
  );
}

function SubItemLink({ to, icon, label, expanded }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${
          expanded
            ? "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
            : "h-11 w-11 flex items-center justify-center rounded-xl"
        } transition ${isActive ? "bg-[#FBE7D5] text-[#E8712E]" : "hover:bg-gray-100"}`
      }
      title={!expanded ? label : undefined}
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? "text-[#E8712E]" : "text-gray-500"}>
            {expanded
              ? icon
              : React.cloneElement(icon, { className: "h-5 w-5" })}
          </span>

          <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out
              ${
                expanded
                  ? "max-w-[200px] opacity-100 translate-x-0"
                  : "max-w-0 opacity-0 -translate-x-2"
              }`}
          >
            <span className={`font-medium ${isActive ? "" : "text-gray-800"}`}>
              {label}
            </span>
          </span>
        </>
      )}
    </NavLink>
  );
}
