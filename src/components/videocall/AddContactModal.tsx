import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { ContactItem } from './ContactListPanel';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (contact: Omit<ContactItem, 'id'>) => Promise<void>;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  onAddContact,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [category, setCategory] = useState('caregivers');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) {
      setError('Please provide both contact name and relationship role.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const initials = name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      await onAddContact({
        name: name.trim(),
        role: role.trim(),
        category,
        phone: phone.trim() || null,
        email: email.trim() || null,
        avatar_initials: initials,
        presence_status: 'online',
      });
      setName('');
      setRole('');
      setPhone('');
      setEmail('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#E8E8EB] bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0EFEA] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF1EC] text-[#F4512A]">
              <UserPlus size={16} />
            </div>
            <h3 className="text-sm font-bold text-[#202938]">Add New Contact</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#202938]"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block font-medium text-[#4B5563] mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Ramesh Gupta"
              className="w-full rounded-xl border border-[#E8E8EB] bg-[#F7F7F8] p-2.5 text-xs text-[#202938] outline-none focus:border-[#F4512A] focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-medium text-[#4B5563] mb-1">Relationship / Role *</label>
            <input
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Speech Therapist or Sister"
              className="w-full rounded-xl border border-[#E8E8EB] bg-[#F7F7F8] p-2.5 text-xs text-[#202938] outline-none focus:border-[#F4512A] focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-medium text-[#4B5563] mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-[#E8E8EB] bg-[#F7F7F8] p-2.5 text-xs text-[#202938] outline-none focus:border-[#F4512A] focus:bg-white"
            >
              <option value="caregivers">Caregivers</option>
              <option value="family">Family</option>
              <option value="healthcare">Healthcare</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-[#4B5563] mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9811..."
                className="w-full rounded-xl border border-[#E8E8EB] bg-[#F7F7F8] p-2.5 text-xs text-[#202938] outline-none focus:border-[#F4512A] focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-medium text-[#4B5563] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@care.com"
                className="w-full rounded-xl border border-[#E8E8EB] bg-[#F7F7F8] p-2.5 text-xs text-[#202938] outline-none focus:border-[#F4512A] focus:bg-white"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-[#F0EFEA]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E8E8EB] px-3.5 py-2 font-semibold text-[#6B7280] hover:bg-[#F3F4F6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#F4512A] px-4 py-2 font-semibold text-white hover:bg-[#E0441F] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
