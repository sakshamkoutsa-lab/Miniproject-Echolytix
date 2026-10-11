import React, { useState } from 'react';
import { X, Check, Phone, User, Plus, Edit3, ShieldAlert } from 'lucide-react';

export interface ContactItem {
  id: number;
  name: string;
  role: string;
  phone?: string | null;
  email?: string | null;
  category: string;
  avatar_initials?: string;
  presence_status?: string;
}

interface CaretakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: ContactItem[];
  selectedContactId: number;
  onSelectContact: (contact: ContactItem) => void;
  onUpdateContact: (id: number, phone: string, name: string) => Promise<void>;
  onAddContact: (name: string, role: string, phone: string) => Promise<void>;
}

export const CaretakerModal: React.FC<CaretakerModalProps> = ({
  isOpen,
  onClose,
  contacts,
  selectedContactId,
  onSelectContact,
  onUpdateContact,
  onAddContact,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Caregiver');
  const [newPhone, setNewPhone] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const startEdit = (c: ContactItem) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditPhone(c.phone || '');
  };

  const saveEdit = async (id: number) => {
    if (!editPhone.trim()) return;
    setLoading(true);
    try {
      await onUpdateContact(id, editPhone.trim(), editName.trim());
      setEditingId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    setLoading(true);
    try {
      await onAddContact(newName.trim(), newRole.trim(), newPhone.trim());
      setIsAdding(false);
      setNewName('');
      setNewPhone('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0F0F2] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF1EC] text-[#F4512A]">
              <User size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17213A]">Manage Caretakers</h3>
              <p className="text-xs text-[#6B7280]">Select or update emergency broadcast recipients</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contacts list */}
        <div className="mt-4 max-h-[340px] space-y-3 overflow-y-auto pr-1">
          {contacts.map((c) => {
            const isSelected = c.id === selectedContactId;
            const isEditingThis = editingId === c.id;

            return (
              <div
                key={c.id}
                className={`relative rounded-xl border p-3.5 transition-all ${
                  isSelected
                    ? 'border-[#F4512A] bg-[#FFF8F5] shadow-xs'
                    : 'border-[#E8E8EB] bg-white hover:border-gray-300'
                }`}
              >
                {isEditingThis ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                        className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-[#F4512A] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+91 Phone"
                        className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-[#F4512A] focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(c.id)}
                        disabled={loading}
                        className="rounded-lg bg-[#F4512A] px-3 py-1 text-xs font-semibold text-white hover:bg-[#E0441E]"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className="flex flex-1 cursor-pointer items-center gap-3 min-w-0"
                      onClick={() => onSelectContact(c)}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF1EC] text-xs font-bold text-[#F4512A]">
                        {c.avatar_initials || c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold text-[#17213A]">{c.name}</p>
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                            {c.role}
                          </span>
                        </div>
                        <p className="mt-0.5 font-mono text-xs text-[#12A66A] font-semibold flex items-center gap-1">
                          <Phone size={11} />
                          {c.phone || 'No phone set'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        title="Edit Caretaker"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectContact(c)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-[#F4512A] text-white'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Select'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add new contact form / toggle */}
        {isAdding ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#F4512A]/40 bg-[#FFFBF9] p-3 space-y-2">
            <h4 className="text-xs font-bold text-[#F4512A]">Add Emergency Contact</h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Full Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs focus:border-[#F4512A] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Phone (e.g. +91 9876543210)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs focus:border-[#F4512A] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="rounded-lg px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                className="rounded-lg bg-[#F4512A] px-3 py-1 text-xs font-semibold text-white hover:bg-[#E0441E]"
              >
                Add Contact
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:border-[#F4512A] hover:text-[#F4512A]"
          >
            <Plus size={14} />
            <span>Add Another Emergency Contact</span>
          </button>
        )}

        <div className="mt-5 border-t border-[#F0F0F2] pt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#17213A] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#202938]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
