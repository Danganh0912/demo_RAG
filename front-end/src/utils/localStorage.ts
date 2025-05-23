export const localStorageUtils = {
  setItem: (key: string, value: any) => {
    try {
      const jsonValue = JSON.stringify(value)
      localStorage.setItem(key, jsonValue)
    } catch (error) {
      console.error('Error setting item to localStorage', error)
    }
  },

  getItem: <T = any>(key: string): T | null => {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Error getting item from localStorage', error)
      return null
    }
  },

  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing item from localStorage', error)
    }
  },

  clear: () => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage', error)
    }
  },
}
