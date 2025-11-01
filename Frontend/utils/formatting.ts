import { getPreferences } from '../data/mockData';

export const formatCurrency = (amount: number): string => {
    const { defaultCurrency } = getPreferences();
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: defaultCurrency,
        }).format(amount);
    } catch (e) {
        // Fallback for invalid currency code
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    }
};
