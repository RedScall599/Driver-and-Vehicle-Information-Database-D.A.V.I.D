'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = loading, null = not signed in

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : { user: null })
      .then(data => setUser(data.user ?? null))
      .catch(() => setUser(null))
  }, [])

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>
}

/** Returns the current user object, null (not logged in), or undefined (still loading) */
export function useUser() {
  return useContext(AuthContext)
}


