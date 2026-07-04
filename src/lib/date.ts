const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const diffMs = timestamp - Date.now();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return relativeFormatter.format(diffDays, "day");
}

export function todayIsoDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

