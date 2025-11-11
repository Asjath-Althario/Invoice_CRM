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
