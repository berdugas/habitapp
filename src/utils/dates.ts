function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function toDeviceDateString(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getWeekStartDate(date = new Date()) {
  const localDate = new Date(date);
  localDate.setHours(0, 0, 0, 0);

  const offset = (localDate.getDay() + 6) % 7;
  localDate.setDate(localDate.getDate() - offset);

  return localDate;
}

export function getWeekStartDateString(date = new Date()) {
  return toDeviceDateString(getWeekStartDate(date));
}
