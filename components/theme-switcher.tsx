'use client'

import { useTheme } from './theme-context'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Theme:</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as any)}
        className="form-select block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-900 bg-white"
        aria-label="Select theme"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="cyberpunk">Cyberpunk</option>
        <option value="fantasy">Fantasy</option>
        <option value="gothic">Gothic</option>
      </select>
    </div>
  )
}
