const getDefaultCurrency = (): string => {
  try {
    const raw = localStorage.getItem('zenith-preferences');
    if (raw) {
      const prefs = JSON.parse(raw);
      if (prefs && typeof prefs.defaultCurrency === 'string') {
        return prefs.defaultCurrency;
      }
    }
  } catch {}
  return 'AED';
};

const getDefaultDateFormat = (): string => {
  try {
    const raw = localStorage.getItem('zenith-preferences');
    if (raw) {
      const prefs = JSON.parse(raw);
      if (prefs && typeof prefs.dateFormat === 'string') {
        return prefs.dateFormat;
      }
    }
  } catch {}
  return 'YYYY-MM-DD';
};

export const formatCurrency = (amount: number | string | null | undefined): string => {
  const defaultCurrency = getDefaultCurrency();

  // Handle null, undefined, or NaN values
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: defaultCurrency }).format(0);
    } catch {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(0);
    }
  }

  const numericAmount = Number(amount);

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: defaultCurrency,
    }).format(numericAmount);
  } catch (e) {
    // Fallback for invalid currency code
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numericAmount);
  }
};

export const formatDate = (date: string | Date | null | undefined): string => {
  const defaultDateFormat = getDefaultDateFormat();

  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '-';

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    switch (defaultDateFormat) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD-MM-YYYY':
        return `${day}-${month}-${year}`;
      case 'YYYY-MM-DD':
      default:
        return `${year}-${month}-${day}`;
    }
  } catch (e) {
    console.error('Error formatting date:', e);
    return '-';
  }
};
