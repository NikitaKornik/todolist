const DAY_MS = 24 * 60 * 60 * 1000;

export function getDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseTodoCreatedDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const [datePart] = String(dateValue).split(" ");

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }

  const dotMatch = datePart.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);

  if (dotMatch) {
    const [, day, month, year] = dotMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const slashMatch = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsedDate = new Date(dateValue);

  return Number.isNaN(parsedDate.getTime()) ? "" : getDateInputValue(parsedDate);
}

export function formatCalendarDate(dateValue, options = {}, locale = "ru-RU") {
  const date = parseInputDate(dateValue);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  })
    .format(date)
    .replace(/\sг\.$/, "");
}

export function parseInputDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function getMonthDays(activeDateValue, weekStart = "monday") {
  const activeDate = parseInputDate(activeDateValue) || new Date();
  const year = activeDate.getFullYear();
  const month = activeDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weekStartIndex = weekStart === "sunday" ? 0 : 1;
  const startOffset = (firstDay.getDay() - weekStartIndex + 7) % 7;
  const days = [];

  for (let index = 0; index < startOffset; index += 1) {
    const date = new Date(firstDay.getTime() - (startOffset - index) * DAY_MS);
    days.push({ date, inCurrentMonth: false });
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push({ date: new Date(year, month, day), inCurrentMonth: true });
  }

  while (days.length % 7 !== 0) {
    const lastDate = days[days.length - 1].date;
    days.push({
      date: new Date(lastDate.getTime() + DAY_MS),
      inCurrentMonth: false,
    });
  }

  return days.map((dayItem) => ({
    ...dayItem,
    value: getDateInputValue(dayItem.date),
  }));
}

export function getRelativeMonth(dateValue, offset) {
  const date = parseInputDate(dateValue) || new Date();
  return getDateInputValue(new Date(date.getFullYear(), date.getMonth() + offset, 1));
}
