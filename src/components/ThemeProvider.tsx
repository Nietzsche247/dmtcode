import { useEffect } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { useModeStore } from '@/stores/modeStore';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme, resolvedTheme, setResolvedTheme } = useThemeStore();
  const { mode } = useModeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Research Mode forces light theme
    const effectiveTheme = mode === 'research' ? 'light' : resolvedTheme;
    
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#050505' : '#fafafa');
    }
  }, [resolvedTheme, mode]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, setResolvedTheme]);

  return <>{children}</>;
};
