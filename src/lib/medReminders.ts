export interface MedReminder {
  id: string;
  medName: string;
  time: string; // "HH:MM"
  days: number[]; // 0=Sun … 6=Sat, empty = every day
  createdAt: string;
}

const KEY = "cc-med-reminders";

export function getReminders(): MedReminder[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveReminder(r: Omit<MedReminder, "id" | "createdAt">): MedReminder {
  const reminders = getReminders();
  const item: MedReminder = {
    ...r,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  reminders.push(item);
  localStorage.setItem(KEY, JSON.stringify(reminders));
  return item;
}

export function deleteReminder(id: string): void {
  const reminders = getReminders().filter((r) => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(reminders));
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return Promise.resolve("denied");
  if (Notification.permission === "granted") return Promise.resolve("granted");
  return Notification.requestPermission();
}

export function scheduleNotifications(reminders: MedReminder[], notifyTitle: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const now = new Date();
  const today = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (const r of reminders) {
    const [hh, mm] = r.time.split(":").map(Number);
    const targetMinutes = hh * 60 + mm;
    const activeDays = r.days.length === 0 ? [0, 1, 2, 3, 4, 5, 6] : r.days;

    if (!activeDays.includes(today)) continue;
    const diff = (targetMinutes - nowMinutes) * 60 * 1000;
    if (diff < 0 || diff > 60 * 60 * 1000) continue; // only schedule within next hour

    setTimeout(() => {
      new Notification(notifyTitle, {
        body: r.medName,
        icon: "/favicon.ico",
      });
    }, diff);
  }
}
