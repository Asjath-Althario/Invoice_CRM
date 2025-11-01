import { getPreferences } from '../data/mockData';

export const applyTheme = () => {
    const theme = getPreferences().theme;
    if (theme === 'Dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};
