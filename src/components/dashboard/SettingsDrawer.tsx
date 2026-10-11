import React, { useEffect, useState } from 'react';
import { X, UserCog, LifeBuoy, FileChartColumn, Save, Send, Loader2, CheckCircle2, AlertCircle, MapPin, Play } from 'lucide-react';
import type { RecentPhrase } from '../../types';
import { playBeep, speakText } from '../../utils/sound';

/**
 * Profile settings, support form and caregiver logs.
 *
 * This functionality previously lived inline on the old Dashboard. It is kept
 * intact (same API calls / payloads) and is now opened from the sidebar
 * "Settings" and "Usage Reports" items.
 */
export type SettingsTab = 'settings' | 'support' | 'admin';

interface SettingsDrawerProps {
  open: boolean;
  initialTab: SettingsTab;
  onClose: () => void;
  patient: any;
  sessionToken: string | null;
  recentPhrases: RecentPhrase[];
  onProfileUpdate: (updatedPatient: any) => void;
}

const inputCls =
  'w-full rounded-lg border border-[#E8E8EB] bg-white px-3 py-2.5 text-sm text-[#17213A] outline-none transition focus:border-[#F4512A]/60 focus:ring-4 focus:ring-[#F4512A]/10';
const labelCls = 'mb-1 block text-xs font-medium text-[#6B7280]';

const TABS: { id: SettingsTab; label: string; icon: typeof UserCog }[] = [
  { id: 'settings', label: 'Profile & Settings', icon: UserCog },
  { id: 'support', label: 'Support', icon: LifeBuoy },
  { id: 'admin', label: 'Usage Reports & Logs', icon: FileChartColumn },
];

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  open,
  initialTab,
  onClose,
  patient,
  sessionToken,
  recentPhrases,
  onProfileUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  useEffect(() => {
    if (open) setActiveTab(initialTab);
  }, [open, initialTab]);

  // Profile Settings State
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [medicalId, setMedicalId] = useState('');
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverPhone, setCaregiverPhone] = useState('');
  const [emergencyEmail, setEmergencyEmail] = useState('');
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  const [blinkThreshold, setBlinkThreshold] = useState(0.18);
  const [commitDelay, setCommitDelay] = useState(1800);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Support / Feedback Form State
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [supportError, setSupportError] = useState('');

  // Admin Logs State
  const [sosAlerts, setSosAlerts] = useState<any[]>([]);
  const [supportRequests, setSupportRequests] = useState<any[]>([]);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // Sync state values when patient prop changes
  useEffect(() => {
    if (!patient) return;
    setPatientName(patient.name || '');
    setPatientAge(String(patient.age || ''));
    setMedicalId(patient.medical_id || '');
    setCaregiverName(patient.caregiver_name || '');
    setCaregiverPhone(patient.caregiver_phone || '');
    setEmergencyEmail(patient.emergency_email || '');
    setTtsSpeed(Number(patient.tts_speed || 1.0));
    setBlinkThreshold(Number(patient.blink_threshold || 0.18));
    setCommitDelay(Number(patient.commit_delay || 1800));
  }, [patient]);

  // Fetch admin logs when tab is selected
  useEffect(() => {
    if (!open || activeTab !== 'admin' || !sessionToken) return;
    setIsAdminLoading(true);
    const fetchSos = fetch('/api/emergency/sos?limit=20')
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => []);
    const fetchSupport = fetch('/api/support?limit=20', {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => []);
    Promise.all([fetchSos, fetchSupport])
      .then(([sosLogs, feedbackLogs]) => {
        setSosAlerts(Array.isArray(sosLogs) ? sosLogs : []);
        setSupportRequests(Array.isArray(feedbackLogs) ? feedbackLogs : []);
      })
      .catch((err) => console.error('Error loading caregiver logs:', err))
      .finally(() => setIsAdminLoading(false));
  }, [open, activeTab, sessionToken]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    if (!patientName.trim()) {
      alert('Name is required.');
      setIsSaving(false);
      return;
    }
    const payload = {
      id: patient?.id,
      name: patientName,
      age: Number(patientAge || 0),
      medical_id: medicalId,
      caregiver_name: caregiverName,
      caregiver_phone: caregiverPhone,
      emergency_email: emergencyEmail,
      tts_speed: ttsSpeed,
      blink_threshold: blinkThreshold,
      commit_delay: commitDelay,
    };
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        onProfileUpdate(data);
        setSaveSuccess(true);
        playBeep(900, 0.12);
        setTimeout(() => playBeep(1100, 0.12), 100);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert(data.error || 'Failed to update profile settings.');
      }
    } catch (err) {
      console.error('Profile API request error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportError('');
    setSupportSuccess(false);
    setIsSubmittingSupport(true);
    if (!supportName.trim() || !supportEmail.trim() || !supportMessage.trim()) {
      setSupportError('All fields (name, email, message) are required.');
      playBeep(250, 0.3);
      setIsSubmittingSupport(false);
      return;
    }
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: supportName.trim(),
          email: supportEmail.trim(),
          message: supportMessage.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSupportSuccess(true);
        playBeep(900, 0.12);
        setSupportMessage('');
      } else {
        setSupportError(data.error || 'Failed to submit feedback.');
        playBeep(250, 0.3);
      }
    } catch (err) {
      console.error(err);
      setSupportError('Connection lost. Unable to submit support form.');
      playBeep(250, 0.3);
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-[#17213A]/30 backdrop-blur-[2px] transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className={`fixed inset-y-0 right-0 z-[70] flex w-full max-w-[640px] flex-col bg-[#F7F7F8] shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E8E8EB] bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-[#17213A]">Account & Reports</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#6B7280] hover:bg-[#F7F7F8]" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-[#E8E8EB] bg-white px-4">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                  active ? 'border-[#F4512A] text-[#F4512A]' : 'border-transparent text-[#6B7280] hover:text-[#17213A]'
                }`}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
              <p className="text-sm text-[#6B7280]">
                Update communication parameters, emergency contacts, and calibration rates. Changes are stored in the EchoLytix database.
              </p>

              <fieldset className="rounded-xl border border-[#E8E8EB] bg-white p-5">
                <legend className="px-1 text-sm font-semibold text-[#17213A]">Personal information</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <label><span className={labelCls}>Full name</span>
                    <input className={inputCls} value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
                  </label>
                  <label><span className={labelCls}>Age</span>
                    <input type="number" className={inputCls} value={patientAge} onChange={(e) => setPatientAge(e.target.value)} />
                  </label>
                  <label><span className={labelCls}>Medical file ID</span>
                    <input className={inputCls} value={medicalId} onChange={(e) => setMedicalId(e.target.value)} />
                  </label>
                </div>
              </fieldset>

              <fieldset className="rounded-xl border border-[#E8E8EB] bg-white p-5">
                <legend className="px-1 text-sm font-semibold text-[#17213A]">Caregiver contact & alerts</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <label><span className={labelCls}>Caregiver name</span>
                    <input className={inputCls} value={caregiverName} onChange={(e) => setCaregiverName(e.target.value)} />
                  </label>
                  <label><span className={labelCls}>Caregiver mobile</span>
                    <input className={inputCls} value={caregiverPhone} onChange={(e) => setCaregiverPhone(e.target.value)} />
                  </label>
                  <label><span className={labelCls}>Emergency alert email</span>
                    <input type="email" className={inputCls} value={emergencyEmail} onChange={(e) => setEmergencyEmail(e.target.value)} />
                  </label>
                </div>
              </fieldset>

              <fieldset className="rounded-xl border border-[#E8E8EB] bg-white p-5">
                <legend className="px-1 text-sm font-semibold text-[#17213A]">Calibration & preferences</legend>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <label>
                    <span className="mb-1 flex justify-between text-xs font-medium text-[#6B7280]">
                      Speech rate <span className="text-[#F4512A]">{ttsSpeed.toFixed(1)}x</span>
                    </span>
                    <input type="range" min={0.5} max={2} step={0.1} value={ttsSpeed} onChange={(e) => setTtsSpeed(parseFloat(e.target.value))} className="w-full accent-[#F4512A]" />
                  </label>
                  <label>
                    <span className="mb-1 flex justify-between text-xs font-medium text-[#6B7280]">
                      EAR threshold <span className="text-[#F4512A]">{blinkThreshold.toFixed(2)}</span>
                    </span>
                    <input type="range" min={0.12} max={0.24} step={0.01} value={blinkThreshold} onChange={(e) => setBlinkThreshold(parseFloat(e.target.value))} className="w-full accent-[#F4512A]" />
                  </label>
                  <label><span className={labelCls}>Commit speed</span>
                    <select className={inputCls} value={commitDelay} onChange={(e) => setCommitDelay(Number(e.target.value))}>
                      <option value={1200}>Fast (1.2s)</option>
                      <option value={1800}>Medium (1.8s)</option>
                      <option value={2500}>Slow (2.5s)</option>
                      <option value={3500}>Extra Slow (3.5s)</option>
                    </select>
                  </label>
                </div>
              </fieldset>

              <div className="flex items-center justify-between gap-3">
                <span>
                  {saveSuccess && (
                    <span className="flex items-center gap-1.5 text-sm text-[#159B68]">
                      <CheckCircle2 size={16} /> Settings saved
                    </span>
                  )}
                </span>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg bg-[#F4512A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#E0441F] disabled:opacity-60"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSaving ? 'Saving…' : 'Save profile'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'support' && (
            <form onSubmit={handleSupportSubmit} className="flex flex-col gap-4">
              <p className="text-sm text-[#6B7280]">Submit technical feedback, report bugs, or reach caregiver support engineers.</p>
              {supportError && (
                <div className="flex items-start gap-2 rounded-lg border border-[#E23A3A]/20 bg-[#FDECEC] px-3 py-2 text-sm text-[#E23A3A]">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" /> {supportError}
                </div>
              )}
              {supportSuccess && (
                <div className="flex items-start gap-2 rounded-lg border border-[#159B68]/20 bg-[#E9F7F0] px-3 py-2 text-sm text-[#159B68]">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> Support ticket submitted! Response time is typically under 1 hour.
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label><span className={labelCls}>Your name</span>
                  <input className={inputCls} value={supportName} onChange={(e) => setSupportName(e.target.value)} required />
                </label>
                <label><span className={labelCls}>Email address</span>
                  <input type="email" className={inputCls} value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} required />
                </label>
              </div>
              <label><span className={labelCls}>Message</span>
                <textarea rows={6} className={`${inputCls} resize-none`} value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} placeholder="Describe the assistance you need…" required />
              </label>
              <button
                type="submit"
                disabled={isSubmittingSupport}
                className="flex items-center justify-center gap-2 self-start rounded-lg bg-[#F4512A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#E0441F] disabled:opacity-60"
              >
                {isSubmittingSupport ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {isSubmittingSupport ? 'Submitting…' : 'Submit request'}
              </button>
            </form>
          )}

          {activeTab === 'admin' && (
            <div className="flex flex-col gap-6">
              {isAdminLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#6B7280]">
                  <Loader2 size={16} className="animate-spin" /> Loading logs…
                </div>
              ) : (
                <>
                  <section>
                    <h3 className="mb-3 text-sm font-semibold text-[#17213A]">Dispatched SOS signals ({sosAlerts.length})</h3>
                    <div className="flex flex-col gap-2">
                      {sosAlerts.map((alert: any) => (
                        <div key={alert.id} className="rounded-xl border border-[#E8E8EB] bg-white p-4 text-sm">
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase text-[#E23A3A]">Status: {alert.status}</span>
                            <span className="text-xs text-[#9CA3AF]">{new Date(alert.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="font-medium text-[#17213A]">“{alert.message}”</p>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7280]">
                            <span>Caretaker: <strong className="text-[#17213A]">{alert.caregiver_phone || 'None'}</strong></span>
                            <span className={`rounded px-1.5 py-0.5 font-semibold ${alert.broadcast_status?.includes('DELIVERED') || alert.broadcast_status?.includes('SENT') ? 'bg-[#E9F7F0] text-[#159B68]' : 'bg-[#FEF3C7] text-[#B45309]'}`}>
                              {alert.broadcast_status || 'BROADCAST_READY'} ({alert.broadcast_channel || 'Multi-Channel'})
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[#6B7280]">
                            <span className="truncate" title={alert.address || ''}>
                              {alert.address ? `${alert.address} • ` : ''}
                              {(Number(alert.latitude) || 0).toFixed(4)}°N, {(Number(alert.longitude) || 0).toFixed(4)}°E
                            </span>
                            <a
                              href={`https://www.openstreetmap.org/?mlat=${Number(alert.latitude) || 0}&mlon=${Number(alert.longitude) || 0}#map=15/${Number(alert.latitude) || 0}/${Number(alert.longitude) || 0}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex shrink-0 items-center gap-1 font-medium text-[#F4512A] hover:underline"
                            >
                              <MapPin size={12} /> Track map
                            </a>
                          </div>
                        </div>
                      ))}
                      {sosAlerts.length === 0 && (
                        <div className="rounded-xl border border-dashed border-[#E8E8EB] bg-white py-8 text-center text-sm text-[#9CA3AF]">No distress signals logged.</div>
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-3 text-sm font-semibold text-[#17213A]">Support requests ({supportRequests.length})</h3>
                    <div className="flex flex-col gap-2">
                      {supportRequests.map((req: any) => (
                        <div key={req.id} className="rounded-xl border border-[#E8E8EB] bg-white p-4 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-[#17213A]">{req.name}</span>
                            <span className="text-xs text-[#9CA3AF]">{new Date(req.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="text-xs text-[#9CA3AF]">{req.email}</div>
                          <p className="mt-1.5 text-[#3A4256]">“{req.message}”</p>
                        </div>
                      ))}
                      {supportRequests.length === 0 && (
                        <div className="rounded-xl border border-dashed border-[#E8E8EB] bg-white py-8 text-center text-sm text-[#9CA3AF]">No support forms recorded.</div>
                      )}
                    </div>
                  </section>
                </>
              )}

              <section>
                <h3 className="mb-3 text-sm font-semibold text-[#17213A]">Speech history ({recentPhrases.length})</h3>
                <div className="flex flex-col gap-2">
                  {recentPhrases.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#E8E8EB] bg-white px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-[#17213A]">{item.text}</div>
                        <div className="text-xs text-[#9CA3AF]">{item.mode} • {item.timestamp}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => speakText(item.text.replace(/"/g, ''))}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E8E8EB] text-[#6B7280] transition hover:border-[#F4512A] hover:bg-[#F4512A] hover:text-white"
                        aria-label="Speak phrase"
                      >
                        <Play size={14} />
                      </button>
                    </div>
                  ))}
                  {recentPhrases.length === 0 && <p className="text-sm text-[#9CA3AF]">No speech logged yet.</p>}
                </div>
              </section>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
