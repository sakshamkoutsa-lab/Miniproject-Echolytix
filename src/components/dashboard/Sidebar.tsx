import React from 'react';
import {
  LayoutGrid,
  Eye,
  Hand,
  Grip,
  MessageSquareText,
  Video,
  TriangleAlert,
  FileChartColumn,
  Settings,
  X,
  type LucideIcon,
} from 'lucide-react';
import { EchoLytixLogo } from './EchoLytixLogo';
import type { NavTab } from '../../types';

export type SidebarAction =
  | { type: 'tab'; tab: NavTab }
  | { type: 'sos' }
  | { type: 'reports' }
  | { type: 'settings' };

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  action: SidebarAction;
}

const PRIMARY_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, action: { type: 'tab', tab: 'dashboard' } },
  { id: 'blink', label: 'Blink to Text', icon: Eye, action: { type: 'tab', tab: 'blink' } },
  { id: 'sign', label: 'Hand Sign', icon: Hand, action: { type: 'tab', tab: 'sign' } },
  { id: 'morse', label: 'Morse Code', icon: Grip, action: { type: 'tab', tab: 'morse' } },
  { id: 'tts', label: 'TTS', icon: MessageSquareText, action: { type: 'tab', tab: 'tts' } },
  { id: 'remote', label: 'Video Call', icon: Video, action: { type: 'tab', tab: 'remote' } },
  { id: 'sos', label: 'SOS', icon: TriangleAlert, action: { type: 'tab', tab: 'sos' } },
];

const SECONDARY_NAV: NavItem[] = [
  { id: 'reports', label: 'Usage Reports', icon: FileChartColumn, action: { type: 'reports' } },
  { id: 'settings', label: 'Settings', icon: Settings, action: { type: 'settings' } },
];

interface SidebarProps {
  activeId: string;
  onAction: (action: SidebarAction) => void;
  userName: string;
  userRole: string;
  initials: string;
  /** Mobile drawer state; ignored on desktop (lg+) where the sidebar is always visible. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeId,
  onAction,
  userName,
  userRole,
  initials,
  mobileOpen,
  onCloseMobile,
}) => {
  const renderItem = (item: NavItem) => {
    const active = item.id === activeId;
    const Icon = item.icon;
    return (
      <li key={item.id}>
        <button
          type="button"
          onClick={() => {
            onAction(item.action);
            onCloseMobile();
          }}
          aria-current={active ? 'page' : undefined}
          className={`group relative w-full flex items-center gap-3.5 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors duration-200 ${
            active
              ? 'bg-[#FFF1EC] text-[#F4512A]'
              : 'text-[#3A4256] hover:bg-[#F7F7F8] hover:text-[#17213A]'
          }`}
        >
          {active && (
            <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[#F4512A]" aria-hidden="true" />
          )}
          <Icon
            size={20}
            strokeWidth={1.8}
            className={active ? 'text-[#F4512A]' : 'text-[#5B6375] group-hover:text-[#17213A]'}
          />
          <span>{item.label}</span>
        </button>
      </li>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-[#17213A]/30 backdrop-blur-[2px] transition-opacity lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-[#E8E8EB] bg-white transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        aria-label="Primary navigation"
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-6 pt-6 pb-7">
          <button
            type="button"
            onClick={() => onAction({ type: 'tab', tab: 'dashboard' })}
            className="flex items-center gap-3 text-left"
          >
            <EchoLytixLogo size={42} />
            <div className="leading-tight">
              <div className="text-[22px] font-extrabold tracking-tight text-[#F4512A]">ECHOLYTIX</div>
              <div className="text-[10.5px] font-medium text-[#6B7280]">Assist · Communicate · Empower</div>
            </div>
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-2 text-[#6B7280] hover:bg-[#F7F7F8] lg:hidden"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4">
          <ul className="flex flex-col gap-1">{PRIMARY_NAV.map(renderItem)}</ul>
          <div className="my-5 mx-2 border-t border-[#E8E8EB]" />
          <ul className="flex flex-col gap-1">{SECONDARY_NAV.map(renderItem)}</ul>
        </nav>

        {/* User */}
        <div className="border-t border-[#E8E8EB] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F4512A] to-[#E23A3A] text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold text-[#17213A]">{userName}</div>
              <div className="truncate text-xs text-[#6B7280]">{userRole}</div>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-[#159B68] ring-4 ring-[#159B68]/15" title="Online" />
          </div>
        </div>
      </aside>
    </>
  );
};
