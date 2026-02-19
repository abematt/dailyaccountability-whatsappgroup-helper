/**
 * Week calculation utilities for weekly goals
 * Uses ISO 8601 standard: Monday as week start, Sunday as end
 */

export interface WeekInfo {
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string; // YYYY-MM-DD (Sunday)
  weekNumber: number; // ISO week number (1-53)
  year: number; // Year for the week
}

/**
 * Get the ISO week number for a given date
 * Uses ISO 8601 definition where week 1 is the first week with Thursday in it
 */
function getISOWeekNumber(date: Date): { weekNumber: number; year: number } {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  target.setDate(target.getDate() - dayNr + 3); // Nearest Thursday
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target.getTime() - firstThursday.getTime();
  const weekNumber = 1 + Math.round(diff / 604800000); // 604800000 = 7 * 24 * 60 * 60 * 1000

  return {
    weekNumber,
    year: target.getFullYear(),
  };
}

/**
 * Get the Monday of the week for a given date
 */
function getMondayOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get the current week's information
 */
export function getCurrentWeek(): WeekInfo {
  const now = new Date();
  const monday = getMondayOfWeek(now);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const weekStart = monday.toISOString().split("T")[0];
  const weekEnd = sunday.toISOString().split("T")[0];

  const { weekNumber, year } = getISOWeekNumber(monday);

  return {
    weekStart,
    weekEnd,
    weekNumber,
    year,
  };
}

/**
 * Get week information for a specific date string (YYYY-MM-DD)
 */
export function getWeekForDate(dateString: string): WeekInfo {
  const date = new Date(dateString + "T00:00:00");
  const monday = getMondayOfWeek(date);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const weekStart = monday.toISOString().split("T")[0];
  const weekEnd = sunday.toISOString().split("T")[0];

  const { weekNumber, year } = getISOWeekNumber(monday);

  return {
    weekStart,
    weekEnd,
    weekNumber,
    year,
  };
}

/**
 * Get the previous week's start date (Monday)
 */
export function getPreviousWeekStart(weekStart: string): string {
  const date = new Date(weekStart + "T00:00:00");
  date.setDate(date.getDate() - 7);
  return date.toISOString().split("T")[0];
}

/**
 * Format week for display: "Week 4 - 16 Feb - 22 Feb"
 */
export function formatWeekDisplay(weekInfo: WeekInfo): string {
  const startDate = new Date(weekInfo.weekStart + "T00:00:00");
  const endDate = new Date(weekInfo.weekEnd + "T00:00:00");

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const startDay = startDate.getDate();
  const startMonth = monthNames[startDate.getMonth()];

  const endDay = endDate.getDate();
  const endMonth = monthNames[endDate.getMonth()];

  return `Week ${weekInfo.weekNumber} - ${startDay} ${startMonth} - ${endDay} ${endMonth}`;
}
