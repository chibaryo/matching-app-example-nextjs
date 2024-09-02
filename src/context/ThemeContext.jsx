'use client'
import React, { createContext, useContext, useState, useEffect } from "react";
const ThemeContext = createContext({ bgColor: "cyan", theme: null });

export const useThemeContext = () => {
  return useContext(ThemeContext)
}

export const themes = {
  light: {
//    bgColor: 'indigo',
    name: "light",
    main: 100,
    profile: 400,
    notify: 600,
    text:700
  },
  dark: {
//    bgColor: 'indigo',
    name: "dark",
    main: 700,
    profile: 400,
    notify: 200,
    text: 100
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(themes.dark);
  const [bgColor, setBgColor] = useState("indigo");

  useEffect(() => {
    (async() => {
//      setTheme(themes.dark)
//      setBgColor("indigo")
    })()
  }, [])

  return <ThemeContext.Provider value={{ bgColor, theme, setBgColor, setTheme }}>{children}</ThemeContext.Provider>
}