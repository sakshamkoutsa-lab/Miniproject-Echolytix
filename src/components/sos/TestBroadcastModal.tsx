import React, { useState } from 'react';
import { X, Send, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface TestBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  caretakerName: string;
  caretakerPhone: string;
}

export const TestBroadcastModal: React.FC<TestBroadcastModalProps> = ({
  isOpen,
  onClose,
  caretakerName,
  caretakerPhone,
}) => {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [resultMessage, setResultMessage] = useState('');

  if (!isOpen) return null;

  const handleTest = async () => {
    setStatus('testing');
    try {
      const res = await fetch('/api/emergency/sos/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientPhone: caretakerPhone, caregiverName: caretakerName })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setResultMessage(data.message || `Test broadcast simulated successfully to ${caretakerName}`);
      } else {
        setStatus('error');
        setResultMessage(data.error || 'Diagnostic test failed.');
      }
    } catch (err: any) {
      setStatus('error');
      setResultMessage(err?.message || 'Connection error while transmitting test signal.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0F0F2] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF1EC] text-[#F4512A]">
              <Send size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17213A]">Test Broadcast</h3>
              <p className="text-xs text-[#6B7280]">Diagnostic simulation to verify channels</p>
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

        {/* Info */}
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
            <ShieldCheck size={18} className="shrink-0 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold">Safe Diagnostic Test</p>
              <p className="text-blue-700 mt-0.5">
                This will verify your backend connection, SMS gateway readiness, and recipient formatting for <strong>{caretakerName} ({caretakerPhone})</strong> without initiating false alarms.
              </p>
            </div>
          </div>

          {status === 'success' && (
            <div className="rounded-xl border border-green-200 bg-[#ECFDF5] p-3 text-xs text-green-800 flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-green-600 mt-0.5" />
              <span>{resultMessage}</span>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
              <span>{resultMessage}</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-2 border-t border-[#F0F0F2] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={status === 'testing'}
            className="flex items-center gap-1.5 rounded-xl bg-[#F4512A] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#E0441E] disabled:opacity-60"
          >
            <Send size={13} className={status === 'testing' ? 'animate-pulse' : ''} />
            <span>{status === 'testing' ? 'Verifying...' : 'Run Test Broadcast'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
