import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns';

// Format date for display
export const formatDate = (dateString: string, formatStr: string = 'MMM dd, yyyy'): string => {
  try {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, formatStr) : dateString;
  } catch {
    return dateString;
  }
};

// Format time for display
export const formatTime = (timeString: string): string => {
  try {
    // Assuming time is in HH:mm format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch {
    return timeString;
  }
};

// Format date and time together
export const formatDateTime = (dateString: string, timeString?: string): string => {
  const formattedDate = formatDate(dateString);
  if (timeString) {
    return `${formattedDate} at ${formatTime(timeString)}`;
  }
  return formattedDate;
};

// Get relative time (e.g., "2 hours ago")
export const getRelativeTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : dateString;
  } catch {
    return dateString;
  }
};

// Format date for API (YYYY-MM-DD)
export const formatDateForAPI = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// Format time for API (HH:mm)
export const formatTimeForAPI = (date: Date): string => {
  return format(date, 'HH:mm');
};

// Check if date is today
export const isToday = (dateString: string): boolean => {
  try {
    const date = parseISO(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
};

// Check if date is in the past
export const isPastDate = (dateString: string): boolean => {
  try {
    const date = parseISO(dateString);
    return date < new Date();
  } catch {
    return false;
  }
};
