import React from "react";
import { Search, Mail, Bell, ChevronDown } from "lucide-react";

export default function Topbar({
  title,
  breadcrumb,
  showSearch = true,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Tìm",
  actions,
  avatarSrc = "https://gocnhobecon.com/wp-content/uploads/2025/08/meme-con-meo-cuoi.webp",
}) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b">
      <div className="min-h-16 px-7 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          {breadcrumb ? (
            <div className="text-sm font-semibold tracking-wide truncate">
              {breadcrumb}
            </div>
          ) : (
            <h2 className="text-lg font-semibold tracking-wide text-[#1f2937]">
              {title}
            </h2>
          )}
        </div>

        <div className="flex items-center gap-3">
          {actions ? (
            <div className="flex items-center gap-3">{actions}</div>
          ) : null}

          {showSearch && (
            <div className="hidden md:flex items-center gap-2 bg-[#F6F7FB] border border-[#EEF0F6] rounded-full px-4 py-2 w-[360px]">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="bg-transparent outline-none text-sm w-full text-gray-700 placeholder:text-gray-400"
                placeholder={searchPlaceholder}
              />
            </div>
          )}

          <button className="p-2 rounded-full hover:bg-gray-100">
            <Mail className="h-5 w-5 text-gray-600" />
          </button>

          <button className="p-2 rounded-full hover:bg-gray-100 relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <div className="flex items-center gap-2">
            <img
              src={avatarSrc}
              alt="avatar"
              className="h-9 w-9 rounded-full object-cover"
            />
            <button className="hidden md:inline-flex items-center gap-1 text-sm text-gray-700">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
