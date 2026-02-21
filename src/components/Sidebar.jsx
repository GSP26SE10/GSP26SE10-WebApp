import React from "react";
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
      <div className="h-20 flex items-center justify-center">
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
        {/* Tổng quan */}
        <NavItem
          expanded={expanded}
          icon={<LayoutGrid className="h-5 w-5" />}
          label="Tổng quan"
          active
        />

        {expanded && <SectionTitle>NHÀ HÀNG</SectionTitle>}

        {/* Quản lý */}
        <Dropdown
          expanded={expanded}
          icon={<List className="h-5 w-5" />}
          label="Quản lý"
          open={openManage}
          onToggle={() => setOpenManage((v) => !v)}
        >
          <SubItem icon={<BookOpen className="h-4 w-4" />} label="Menu" />
          <SubItem icon={<Soup className="h-4 w-4" />} label="Món ăn" />
          <SubItem icon={<Folder className="h-4 w-4" />} label="Danh mục" />
          <SubItem
            icon={<ConciergeBell className="h-4 w-4" />}
            label="Dịch vụ"
          />
          <SubItem icon={<Gift className="h-4 w-4" />} label="Tiệc" />
          <SubItem icon={<Warehouse className="h-4 w-4" />} label="Kho" />
        </Dropdown>

        {/* Đơn hàng */}
        <Dropdown
          expanded={expanded}
          icon={<ClipboardList className="h-5 w-5" />}
          label="Đơn hàng"
          open={openOrders}
          onToggle={() => setOpenOrders((v) => !v)}
        >
          <SubItem
            icon={<ClipboardList className="h-4 w-4" />}
            label="Quản lí đơn hàng"
          />
          <SubItem icon={<Search className="h-4 w-4" />} label="Tra cứu" />
        </Dropdown>

        {/* Phân công */}
        <Dropdown
          expanded={expanded}
          icon={<Users className="h-5 w-5" />}
          label="Phân công"
          open={openAssign}
          onToggle={() => setOpenAssign((v) => !v)}
        >
          <SubItem icon={<Users className="h-4 w-4" />} label="Nhân viên" />
          <SubItem
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

        <NavItem
          expanded={expanded}
          icon={<User className="h-5 w-5" />}
          label="Tài khoản"
        />
      </nav>
    </aside>
  );
}

/* ---------- COMPONENTS ---------- */

function SectionTitle({ children }) {
  return (
    <div className="mt-5 mb-2 px-2 text-xs font-semibold tracking-widest text-gray-400">
      {children}
    </div>
  );
}

function NavItem({ icon, label, active, expanded }) {
  return (
    <button
      type="button"
      className={`w-full flex items-center ${
        expanded ? "gap-3 px-4" : "justify-center"
      } py-3 rounded-xl text-sm transition
        ${
          active
            ? "bg-[#FBE7D5] text-[#E8712E] font-semibold"
            : "hover:bg-gray-100"
        }`}
      title={!expanded ? label : undefined}
    >
      <span className={active ? "text-[#E8712E]" : "text-gray-500"}>
        {icon}
      </span>
      {expanded && <span>{label}</span>}
    </button>
  );
}

function Dropdown({ icon, label, open, onToggle, children, expanded }) {
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={expanded ? onToggle : undefined}
        className={`w-full flex items-center ${
          expanded ? "justify-between px-4" : "justify-center"
        } py-3 rounded-xl text-sm hover:bg-gray-100 transition`}
        title={!expanded ? label : undefined}
      >
        <div className={`flex items-center ${expanded ? "gap-3" : ""}`}>
          <span className="text-gray-500">{icon}</span>
          {expanded && <span className="font-semibold">{label}</span>}
        </div>

        {expanded && (
          <ChevronDown
            className={`h-4 w-4 text-gray-500 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
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

function SubItem({ icon, label, expanded }) {
  return (
    <button
      type="button"
      className={`${
        expanded
          ? "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-100"
          : "h-11 w-11 flex items-center justify-center rounded-xl hover:bg-gray-100"
      } transition`}
      title={!expanded ? label : undefined}
    >
      <span className="text-gray-500">
        {expanded ? icon : React.cloneElement(icon, { className: "h-5 w-5" })}
      </span>
      {expanded && <span className="text-gray-800 font-medium">{label}</span>}
    </button>
  );
}
