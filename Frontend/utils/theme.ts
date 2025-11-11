export const applyTheme = (theme?: 'Light' | 'Dark') => {
    try {
        let resolved = theme;
        if (!resolved) {
            const raw = localStorage.getItem('zenith-preferences');
            if (raw) {
                const prefs = JSON.parse(raw);
                resolved = prefs?.theme;
            }
        }
        const isDark = resolved === 'Dark';
        document.documentElement.classList.toggle('dark', !!isDark);
    } catch (e) {
        // Fallback to light if anything goes wrong
        document.documentElement.classList.remove('dark');
    }
};
