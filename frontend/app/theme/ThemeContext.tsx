import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from './colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Theme {
  colors: typeof lightColors;
  isDark: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<Theme>({
  colors: lightColors,
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme !== null) {
          setIsDark(savedTheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme from storage', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark ? 'dark' : 'light';
      await AsyncStorage.setItem('theme', newTheme);
      setIsDark(!isDark);
    } catch (error) {
      console.error('Failed to save theme to storage', error);
    }
  };

  const theme = {
    colors: isDark ? darkColors : lightColors,
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 