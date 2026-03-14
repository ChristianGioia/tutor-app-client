import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { UserType } from '../api/client'
import { registerUser, getUser } from '../api/client'

interface PortalContextType {
  userType: UserType | null
  setUserType: (type: UserType) => void
  isLoadingUserType: boolean
  syncUserWithBackend: (auth0Id: string, email: string, name?: string) => Promise<void>
}

const PortalContext = createContext<PortalContextType | undefined>(undefined)

export function PortalProvider({ children }: { children: ReactNode }) {
  const [userType, setUserType] = useState<UserType | null>(null)
  const [isLoadingUserType, setIsLoadingUserType] = useState(false)

  // Sync user type with backend after Auth0 login
  const syncUserWithBackend = useCallback(
    async (auth0Id: string, email: string, name?: string) => {
      setIsLoadingUserType(true)
      try {
        // Check if user exists in database
        const existingUser = await getUser(auth0Id)

        if (existingUser) {
          // User exists, use their stored type
          setUserType(existingUser.userType)
        } else if (userType) {
          // New user, register with the selected type
          await registerUser({
            auth0Id,
            email,
            name,
            userType,
          })
        }
      } catch (error) {
        console.error('Failed to sync user with backend:', error)
        // Continue anyway - user can still access the app
        // Backend will handle on next sync
      } finally {
        setIsLoadingUserType(false)
      }
    },
    [userType]
  )

  return (
    <PortalContext.Provider
      value={{
        userType,
        setUserType,
        isLoadingUserType,
        syncUserWithBackend,
      }}
    >
      {children}
    </PortalContext.Provider>
  )
}

export function usePortal() {
  const context = useContext(PortalContext)
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider')
  }
  return context
}
