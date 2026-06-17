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

export function isDeadlineExpired(deadline, now = new Date()) {
  const expirationTime = getDeadlineExpirationTime(deadline);

  if (expirationTime === null) {
    return false;
  }

  return expirationTime <= now.getTime();
}

export function getDeadlineExpirationTime(deadline) {
  const date = parseDateInputValue(deadline);

  if (!date) {
    return null;
  }

  const time = getDeadlineTime(deadline);

  if (time) {
    const [hours, minutes] = time.split(":").map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes
    ).getTime();
  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1
  ).getTime();
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
