/**
 * Financial and Date helper functions for Ema Finance Tracker
 */

// Helper to format date as DD/MM/YYYY
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper to format currency
export const formatCurrency = (amount, symbol = 'R') => {
  const num = parseFloat(amount || 0);
  return `${symbol} ${num.toLocaleString('pt-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Get the Monday and Sunday dates of the week for a given date
export const getWeekRange = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust so Monday is 0, Sunday is 6
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
};

// Parse a date string YYYY-MM-DD into a local Date object
export const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Month is 0-indexed in JS Date
  return new Date(year, month - 1, day);
};

// Check if a date falls within a start and end range (inclusive)
export const isDateInRange = (checkDateStr, startDate, endDate) => {
  // Use parseLocalDate to avoid timezone shifts
  const checkDate = parseLocalDate(checkDateStr);
  
  // Set times to boundary for comparison
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return checkDate >= start && checkDate <= end;
};

// Get a list of past weeks (completed weeks) starting from a signup/start date up to the week before the current week.
// Each week will have: start, end, label, and key
export const getPastCompletedWeeks = (signUpDateStr = null) => {
  const now = new Date();
  const { monday: currentMonday } = getWeekRange(now);
  
  // Start tracking from 4 weeks ago, or the signup date, whichever is earlier
  let startDate = new Date();
  startDate.setDate(startDate.getDate() - 28); // Default 4 weeks ago
  
  if (signUpDateStr) {
    const parsedSignUp = new Date(signUpDateStr);
    if (!isNaN(parsedSignUp.getTime())) {
      startDate = parsedSignUp;
    }
  }
  
  const { monday: startMonday } = getWeekRange(startDate);
  const pastWeeks = [];
  
  let iterMonday = new Date(startMonday);
  // Loop through weeks, stopping when we reach the current week's Monday
  while (iterMonday < currentMonday) {
    const iterSunday = new Date(iterMonday);
    iterSunday.setDate(iterMonday.getDate() + 6);
    iterSunday.setHours(23, 59, 59, 999);
    
    // Format label as "DD/MM a DD/MM"
    const startDay = String(iterMonday.getDate()).padStart(2, '0');
    const startMonth = String(iterMonday.getMonth() + 1).padStart(2, '0');
    const endDay = String(iterSunday.getDate()).padStart(2, '0');
    const endMonth = String(iterSunday.getMonth() + 1).padStart(2, '0');
    
    pastWeeks.push({
      start: new Date(iterMonday),
      end: iterSunday,
      label: `${startDay}/${startMonth} a ${endDay}/${endMonth}`,
      key: `${iterMonday.getFullYear()}-W${getWeekNumber(iterMonday)}`
    });
    
    // Move to next Monday
    iterMonday.setDate(iterMonday.getDate() + 7);
  }
  
  // Return in descending order (newest past weeks first)
  return pastWeeks.reverse();
};

// Get week number in year (standard helper)
function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}
