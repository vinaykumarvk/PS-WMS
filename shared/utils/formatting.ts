/**
 * Foundation Layer - F3: Formatting Utilities
 * Common formatting functions used across all modules
 */

/**
 * Format currency (Indian Rupees)
 */
export function formatCurrency(amount: number, options?: {
  showSymbol?: boolean;
  decimals?: number;
}): string {
  const { showSymbol = true, decimals = 2 } = options || {};
  
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return showSymbol ? formatted : formatted.replace('₹', '').trim();
}

/**
 * Format number with Indian number system (lakhs, crores)
 */
export function formatIndianNumber(num: number): string {
  if (num >= 10000000) {
    // Crores
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    // Lakhs
    return `₹${(num / 100000).toFixed(2)} L`;
  } else if (num >= 1000) {
    // Thousands
    return `₹${(num / 1000).toFixed(2)} K`;
  }
  return formatCurrency(num, { showSymbol: true });
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date (DD MMM YYYY)
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Format date with time (DD MMM YYYY, HH:MM)
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(d);
}

/**
 * Format units (4 decimal places)
 */
export function formatUnits(units: number, decimals: number = 4): string {
  return units.toFixed(decimals);
}

/**
 * Format NAV
 */
export function formatNAV(nav: number): string {
  return formatCurrency(nav, { decimals: 2 });
}

/**
 * Format large numbers with abbreviations
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(2)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  return num.toString();
}

/**
 * Mask sensitive information
 */
export function maskString(str: string, visibleStart: number = 2, visibleEnd: number = 2): string {
  if (str.length <= visibleStart + visibleEnd) {
    return '*'.repeat(str.length);
  }
  
  const start = str.substring(0, visibleStart);
  const end = str.substring(str.length - visibleEnd);
  const masked = '*'.repeat(str.length - visibleStart - visibleEnd);
  
  return `${start}${masked}${end}`;
}

/**
 * Mask PAN (show only last 4 characters)
 */
export function maskPAN(pan: string): string {
  if (pan.length < 4) return '****';
  return `****${pan.slice(-4)}`;
}

/**
 * Mask phone number (show only last 4 digits)
 */
export function maskPhone(phone: string): string {
  if (phone.length < 4) return '****';
  const cleaned = phone.replace(/\D/g, '');
  return `****${cleaned.slice(-4)}`;
}

/**
 * Format order ID for display
 */
export function formatOrderId(orderId: string): string {
  // Format: MO-YYYYMMDD-XXXXX
  return orderId.toUpperCase();
}

/**
 * Format status badge text
 */
export function formatStatus(status: string): string {
  return status
    .split(/(?=[A-Z])/)
    .join(' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

