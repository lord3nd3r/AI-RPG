'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'cyberpunk' | 'fantasy' | 'gothic'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(t)
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
