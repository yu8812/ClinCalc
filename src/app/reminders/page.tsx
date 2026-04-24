"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Plus, Trash2, Clock } from "lucide-react";
import {
  getReminders, saveReminder, deleteReminder,
  requestNotificationPermission, scheduleNotifications,
  type MedReminder,
} from "@/lib/medReminders";
import { useLang } from "@/contexts/LanguageContext";

const DAYS_COUNT = 7;

export default function RemindersPage() {
  const { t } = useLang();
  const [reminders, setReminders] = useState<MedReminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [medName, setMedName] = useState("");
  const [time, setTime] = useState("08:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [permStatus, setPermStatus] = useState<NotificationPermission | "unknown">("unknown");
  const [noSupport, setNoSupport] = useState(false);

  useEffect(() => {
    setReminders(getReminders());
    if (!("Notification" in window)) {
      setNoSupport(true);
    } else {
      setPermStatus(Notification.permission);
    }
  }, []);

  const scheduleAll = useCallback((rs: MedReminder[]) => {
    scheduleNotifications(rs, t.reminder.notify_title);
  }, [t.reminder.notify_title]);

  useEffect(() => {
    if (permStatus === "granted") scheduleAll(reminders);
  }, [reminders, permStatus, scheduleAll]);

  const handleEnable = async () => {
    const perm = await requestNotificationPermission();
    setPermStatus(perm);
  };

  const toggleDay = (d: number) =>
    setSelectedDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const handleSave = () => {
    if (!medName.trim()) return;
    const r = saveReminder({ medName: medName.trim(), time, days: selectedDays });
    const updated = [...reminders, r];
    setReminders(updated);
    setMedName("");
    setTime("08:00");
    setSelectedDays([]);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    deleteReminder(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const dayLabels: string[] = t.reminder.days_all as unknown as string[];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {t.reminder.title}
          </h1>
        </div>
        <Bell size={24} style={{ color: "var(--accent)" }} />
      </div>

      {/* Permission banner */}
      {noSupport ? (
        <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
          <BellOff size={15} /> {t.reminder.no_support}
        </div>
      ) : permStatus !== "granted" && (
        <button onClick={handleEnable}
          className="mb-4 w-full p-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
          style={{ background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.25)", color: "var(--accent)" }}>
          <Bell size={15} /> {t.reminder.permission_denied}
        </button>
      )}

      {/* Add form */}
      {showForm ? (
        <div className="card p-4 mb-4">
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>
                藥物名稱
              </label>
              <input
                className="input-field w-full"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="e.g. Metformin 500mg"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>
                {t.reminder.time}
              </label>
              <input
                type="time"
                className="input-field"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>
                {t.reminder.days} <span style={{ opacity: 0.6 }}>(空白 = 每天)</span>
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {dayLabels.map((label, i) => (
                  <button key={i} onClick={() => toggleDay(i)}
                    className="w-9 h-9 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: selectedDays.includes(i) ? "var(--accent)" : "var(--bg-base)",
                      color: selectedDays.includes(i) ? "#000" : "var(--text-primary)",
                      border: "1px solid var(--border)",
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} disabled={!medName.trim()}
                className="btn-primary flex-1"
                style={{ opacity: !medName.trim() ? 0.5 : 1 }}>
                {t.reminder.save}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="w-full mb-4 p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all"
          style={{ border: "2px dashed var(--border)", color: "var(--accent)", background: "transparent" }}>
          <Plus size={16} /> {t.reminder.add}
        </button>
      )}

      {/* List */}
      {reminders.length === 0 && !showForm ? (
        <div className="card p-10 text-center">
          <Bell size={36} className="mx-auto mb-3" style={{ color: "var(--text-secondary)", opacity: 0.3 }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t.reminder.empty}</p>
        </div>
      ) : (
        reminders.map((r) => (
          <div key={r.id} className="card mb-3 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--accent-dim)" }}>
              <Clock size={18} style={{ color: "var(--accent)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                {r.medName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {r.time}
                {r.days.length > 0 && (
                  <> · {r.days.map((d) => dayLabels[d]).join(", ")}</>
                )}
              </p>
            </div>
            <button onClick={() => handleDelete(r.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
              style={{ color: "var(--text-secondary)" }}>
              <Trash2 size={15} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
