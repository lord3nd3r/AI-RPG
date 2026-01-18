'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'cyberpunk' | 'fantasy'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Default to dark if system prefers it
      setTheme('dark')
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const root = window.document.documentElement
    // Remove old theme attributes if any (though we are just setting one)
    root.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  // Return a provider even if not mounted to avoid hydration mismatch on children
  // But we can only show the correct theme after mount.
  // To avoid flicker, we might want to do script in head, but for now this is fine.
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
