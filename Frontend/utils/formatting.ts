import { getPreferences } from '../data/mockData';

export const formatCurrency = (amount: number | string | null | undefined): string => {
    const { defaultCurrency } = getPreferences();

    // Handle null, undefined, or NaN values
    if (amount === null || amount === undefined || isNaN(Number(amount))) {
        return `${defaultCurrency} 0.00`;
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
