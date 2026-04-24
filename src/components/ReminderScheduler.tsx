"use client";

import { useEffect } from "react";
import { getReminders, scheduleNotifications } from "@/lib/medReminders";
import { useLang } from "@/contexts/LanguageContext";

export default function ReminderScheduler() {
  const { t } = useLang();

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    scheduleNotifications(getReminders(), t.reminder.notify_title);
  }, [t.reminder.notify_title]);

  return null;
}
