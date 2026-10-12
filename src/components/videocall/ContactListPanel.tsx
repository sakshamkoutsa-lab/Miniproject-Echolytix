import React, { useState } from 'react';
import { Shield, Search, Video, Plus, PhoneCall } from 'lucide-react';

export interface ContactItem {
  id: number;
  name: string;
  role: string;
  category: string;
  phone?: string | null;
  email?: string | null;
  avatar_initials?: string;
  presence_status?: 'online' | 'offline' | '24/7' | string;
}

interface ContactListPanelProps {
  contacts: ContactItem[];
  selectedContactId: number | null;
  onSelectContact: (contact: ContactItem) => void;
  onCallContact: (contact: ContactItem) => void;
  onCallPhone?: (phone: string) => void;
  onOpenAddContact: () => void;
  isLoading?: boolean;
}

const CATEGORY_TABS = [
  { id: 'caregivers', label: 'Caregivers' },
  { id: 'family', label: 'Family' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'emergency', label: 'Emergency' },
];

const AVATAR_BG_MAP: Record<string, string> = {
  CG: 'bg-[#E5B2A1] text-white',
  DS: 'bg-[#E1C588] text-white',
  PA: 'bg-[#D3A091] text-white',
  EH: 'bg-[#E26955] text-white',
};

export const ContactListPanel: React.FC<ContactListPanelProps> = ({
  contacts,
  selectedContactId,
  onSelectContact,
  onCallContact,
  onCallPhone,
  onOpenAddContact,
  isLoading = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('caregivers');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const trimmedQuery = searchQuery.trim();
  const isLikelyPhone = trimmedQuery.startsWith('+') || /^[0-9\s\-()]{5,}$/.test(trimmedQuery);

  // Filter contacts by category & search query
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      !trimmedQuery ||
      c.name.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(trimmedQuery));

    if (activeCategory === 'caregivers') {
      // In reference screenshot, all 4 contacts are displayed with Caregivers tab active
      return matchesSearch;
    }
    return c.category.toLowerCase() === activeCategory.toLowerCase() && matchesSearch;
  });

  return (
    <section className="flex h-full flex-col rounded-2xl border border-[#E8E8EB] bg-white p-4 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-5">
      {/* Title */}
      <header className="flex items-center gap-2 pb-3">
        <Shield size={20} className="text-[#F4512A]" strokeWidth={2.2} />
        <h2 className="text-base font-bold text-[#202938]">Who to Call?</h2>
      </header>

      {/* Search / Phone Input */}
      <div className="relative mb-3">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isLikelyPhone && onCallPhone) {
              onCallPhone(trimmedQuery);
            }
          }}
          placeholder="Search name or dial phone (+91...)"
          className="w-full rounded-xl border border-[#E8E8EB] bg-[#F7F7F8] py-2 pl-9 pr-3 text-xs text-[#202938] placeholder-[#9CA3AF] outline-none transition focus:border-[#F4512A] focus:bg-white"
        />
      </div>

      {/* Quick Direct Dial Row if user is typing phone number */}
      {isLikelyPhone && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-[#F4512A]/40 bg-[#FFF8F5] p-2.5 transition animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F4512A] text-white">
              <PhoneCall size={14} />
            </div>
            <div className="min-w-0 truncate">
              <p className="text-[11px] font-semibold text-[#202938] truncate">
                Call phone: <span className="font-mono text-[#F4512A]">{trimmedQuery}</span>
              </p>
              <p className="text-[10px] text-[#6B7280]">Connect to registered user</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onCallPhone?.(trimmedQuery)}
            className="flex items-center gap-1.5 rounded-lg bg-[#F4512A] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#d8421c] active:scale-95 shadow-sm"
          >
            <Video size={13} strokeWidth={2.4} />
            <span>Call</span>
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`rounded-lg px-2.5 py-1 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#FFF1EC] text-[#F4512A] border border-[#F4512A]/30'
                  : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#202938]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contacts List */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-0.5">
        {isLoading && contacts.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#9CA3AF]">Loading contacts...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#9CA3AF]">
            No contacts found. Type a phone number above to call directly.
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const isSelected = selectedContactId === contact.id;
            const initials =
              contact.avatar_initials ||
              contact.name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() ||
              'CT';

            const bgClass =
              AVATAR_BG_MAP[initials] || 'bg-[#F4512A]/80 text-white';

            return (
              <div
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className={`group flex items-center justify-between rounded-xl border p-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#F4512A] bg-[#FFF8F5]'
                    : 'border-[#F0EFEA] bg-white hover:border-[#E8E8EB] hover:bg-[#FAFAFA]'
                }`}
              >
                {/* Left: Avatar + Details */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold tracking-tight shadow-sm ${bgClass}`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-[#202938] leading-tight truncate">
                      {contact.name}
                    </h3>
                    <p className="text-[11px] text-[#6B7280] truncate">
                      {contact.role} {contact.phone ? `• ${contact.phone}` : ''}
                    </p>
                    {/* Presence Indicator */}
                    <div className="mt-0.5 flex items-center gap-1">
                      {contact.presence_status === 'online' ? (
                        <>
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A36A]" />
                          <span className="text-[10px] font-medium text-[#16A36A]">Online</span>
                        </>
                      ) : contact.presence_status === '24/7' ? (
                        <>
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A36A]" />
                          <span className="text-[10px] font-semibold text-[#16A36A]">24/7</span>
                        </>
                      ) : (
                        <>
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#9CA3AF]" />
                          <span className="text-[10px] font-medium text-[#9CA3AF]">Offline</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Video Call Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCallContact(contact);
                  }}
                  title={`Call ${contact.name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#F4512A] bg-white text-[#F4512A] transition hover:bg-[#F4512A] hover:text-white active:scale-95 shadow-sm"
                >
                  <Video size={15} strokeWidth={2.2} />
                </button>
              </div>
            );
          })
        )}

        {/* Custom Contact Row */}
        <button
          type="button"
          onClick={onOpenAddContact}
          className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-[#D1D5DB] bg-white p-2.5 text-left transition hover:border-[#F4512A] hover:bg-[#FFF8F5]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#F4512A] text-[#F4512A] bg-white">
            <Plus size={18} strokeWidth={2.4} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#202938]">Custom Contact</h3>
            <p className="text-[11px] text-[#6B7280]">Add a new contact</p>
          </div>
        </button>
      </div>
    </section>
  );
};
