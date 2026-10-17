import React, { createContext, useContext, useEffect } from 'react';

export type Theme = 'light';

interface ThemeContextType {
  theme: 'light';
  toggleTheme: () => void;
  setTheme: (theme: string) => void;
}

const noop = () => {};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: noop,
  setTheme: noop,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Purge any legacy dark theme preference from browser storage
    try {
      localStorage.removeItem('optopick_theme');
    } catch (e) {
      // ignore
    }

    // Force clinical light theme
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.colorScheme = 'light';
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme: noop, setTheme: noop }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  return context || { theme: 'light', toggleTheme: noop, setTheme: noop };
};
