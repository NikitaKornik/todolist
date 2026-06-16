export const DEADLINE_FILTERS = [
  { id: "all", name: "Все" },
  { id: "today", name: "Сегодня" },
  { id: "tomorrow", name: "Завтра" },
  { id: "week", name: "Неделя" },
  { id: "overdue", name: "Просрочено" },
  { id: "noDate", name: "Без даты" },
];

export function getDeadlineDate(deadline) {
  return deadline ? String(deadline).split("T")[0] : "";
}

export function getDeadlineTime(deadline) {
  return String(deadline || "").split("T")[1] || "";
}

export function buildDeadline(date, time = "") {
  if (!date) {
    return "";
  }

  return time ? `${date}T${time}` : date;
}

function parseDateInputValue(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = getDeadlineDate(value).split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function getDayDiff(dateValue, today = new Date()) {
  const date = parseDateInputValue(dateValue);

  if (!date) {
    return null;
  }

  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return Math.round((dateStart - todayStart) / 86400000);
}

export function formatDeadline(
  deadline,
  today = new Date(),
  options = {}
) {
  const locale = options.locale || "ru-RU";
  const t = options.t;
  const diff = getDayDiff(deadline, today);
  const time = getDeadlineTime(deadline);
  const timeSuffix = time ? `, ${time}` : "";

  if (diff === null) {
    return "";
  }

  if (diff < 0) {
    return `${t ? t("deadline.overdue") : "Просрочено"}${timeSuffix}`;
  }

  if (diff === 0) {
    return `${t ? t("deadline.today") : "Сегодня"}${timeSuffix}`;
  }

  if (diff === 1) {
    return `${t ? t("deadline.tomorrow") : "Завтра"}${timeSuffix}`;
  }

  const date = parseDateInputValue(deadline);

  return `${date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}${timeSuffix}`;
}

export function isDeadlineInFilter(deadline, filter, customDate, today = new Date()) {
  if (filter === "all") {
    return true;
  }

  if (filter === "date") {
    return Boolean(deadline) && getDeadlineDate(deadline) === customDate;
  }

  if (filter === "noDate") {
    return !deadline;
  }

  const diff = getDayDiff(deadline, today);

  if (diff === null) {
    return false;
  }

  if (filter === "today") {
    return diff === 0;
  }

  if (filter === "tomorrow") {
    return diff === 1;
  }

  if (filter === "week") {
    return diff >= 0 && diff <= 6;
  }

  if (filter === "overdue") {
    return diff < 0;
  }

  return true;
}
