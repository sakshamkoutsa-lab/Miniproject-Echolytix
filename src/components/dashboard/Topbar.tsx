import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Home, ChevronRight, Search, Bell, ChevronDown, Menu, Settings, LogOut, ArrowRight } from 'lucide-react';

export interface SearchEntry {
  id: string;
  label: string;
  hint: string;
  onSelect: () => void;
}

export interface NotificationEntry {
  id: string;
  title: string;
  detail: string;
  time: string;
}

interface TopbarProps {
  userName: string;
  userRole: string;
  initials: string;
  searchEntries: SearchEntry[];
  notifications: NotificationEntry[];
  onOpenMobileNav: () => void;
  onHome: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  breadcrumbTitle?: string;
}

/** Close a popover when clicking outside of it. */
function useOutsideClick<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);
  return ref;
}

export const Topbar: React.FC<TopbarProps> = ({
  userName,
  userRole,
  initials,
  searchEntries,
  notifications,
  onOpenMobileNav,
  onHome,
  onOpenSettings,
  onLogout,
  breadcrumbTitle = 'Dashboard',
}) => {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const searchRef = useOutsideClick<HTMLDivElement>(searchOpen, () => setSearchOpen(false));
  const bellRef = useOutsideClick<HTMLDivElement>(bellOpen, () => setBellOpen(false));
  const userRef = useOutsideClick<HTMLDivElement>(userOpen, () => setUserOpen(false));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchEntries
      .filter((e) => e.label.toLowerCase().includes(q) || e.hint.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, searchEntries]);

  const pick = (entry: SearchEntry) => {
    entry.onSelect();
    setQuery('');
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-[#E8E8EB] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      {/* Mobile menu */}
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="-ml-1 flex h-10 w-10 items-center justify-center rounded-lg text-[#17213A] hover:bg-[#F7F7F8] lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={22} />
      </button>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={onHome}
          className="rounded-md p-1 text-[#6B7280] transition-colors hover:text-[#17213A]"
          aria-label="Home"
        >
          <Home size={18} strokeWidth={1.8} />
        </button>
        <ChevronRight size={14} className="text-[#C2C6CF]" aria-hidden="true" />
        <span className="font-medium text-[#F4512A]">{breadcrumbTitle}</span>
      </nav>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        {/* Search */}
        <div ref={searchRef} className="relative hidden md:block">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) pick(results[0]);
              if (e.key === 'Escape') setSearchOpen(false);
            }}
            placeholder="Search here..."
            aria-label="Search features"
            className="h-10 w-[220px] rounded-xl border border-[#E8E8EB] bg-[#F7F7F8] pl-10 pr-3 text-sm text-[#17213A] outline-none transition-all placeholder:text-[#9CA3AF] focus:w-[280px] focus:border-[#F4512A]/50 focus:bg-white focus:ring-4 focus:ring-[#F4512A]/10"
          />
          {searchOpen && query.trim() && (
            <div className="absolute right-0 top-12 w-full min-w-[280px] overflow-hidden rounded-xl border border-[#E8E8EB] bg-white shadow-lg">
              {results.length === 0 ? (
                <div className="px-4 py-3 text-sm text-[#6B7280]">No matches for “{query}”</div>
              ) : (
                <ul className="py-1">
                  {results.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => pick(r)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-[#F7F7F8]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[#17213A]">{r.label}</span>
                          <span className="block truncate text-xs text-[#6B7280]">{r.hint}</span>
                        </span>
                        <ArrowRight size={14} className="shrink-0 text-[#9CA3AF]" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={bellRef} className="relative">
          <button
            type="button"
            onClick={() => setBellOpen((o) => !o)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#3A4256] transition-colors hover:bg-[#F7F7F8]"
            aria-label={`Notifications (${notifications.length})`}
          >
            <Bell size={20} strokeWidth={1.8} />
            {notifications.length > 0 && (
              <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F4512A] px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>
          {bellOpen && (
            <div className="absolute right-0 top-12 w-[300px] overflow-hidden rounded-xl border border-[#E8E8EB] bg-white shadow-lg">
              <div className="border-b border-[#E8E8EB] px-4 py-3 text-sm font-semibold text-[#17213A]">Notifications</div>
              {notifications.length === 0 ? (
                <div className="px-4 py-4 text-sm text-[#6B7280]">You're all caught up.</div>
              ) : (
                <ul className="max-h-[320px] overflow-y-auto">
                  {notifications.map((n) => (
                    <li key={n.id} className="border-b border-[#F1F1F3] px-4 py-3 last:border-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-[#17213A]">{n.title}</span>
                        <span className="shrink-0 text-[11px] text-[#9CA3AF]">{n.time}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-[#6B7280]">{n.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => setUserOpen((o) => !o)}
            className="flex items-center gap-3 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-[#F7F7F8]"
            aria-haspopup="menu"
            aria-expanded={userOpen}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#F4512A] to-[#E23A3A] text-sm font-bold text-white">
              {initials}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-[140px] truncate text-sm font-semibold text-[#17213A]">{userName}</span>
              <span className="block text-xs text-[#6B7280]">{userRole}</span>
            </span>
            <ChevronDown size={16} className={`hidden text-[#6B7280] transition-transform sm:block ${userOpen ? 'rotate-180' : ''}`} />
          </button>
          {userOpen && (
            <div role="menu" className="absolute right-0 top-14 w-48 overflow-hidden rounded-xl border border-[#E8E8EB] bg-white py-1 shadow-lg">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setUserOpen(false);
                  onOpenSettings();
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#17213A] hover:bg-[#F7F7F8]"
              >
                <Settings size={16} className="text-[#6B7280]" /> Profile & Settings
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setUserOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#E23A3A] hover:bg-[#FDECEC]"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
