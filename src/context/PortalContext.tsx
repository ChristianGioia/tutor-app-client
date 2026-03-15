import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { UserType } from '../api/client'
import { registerUser, getUser } from '../api/client'

interface PortalContextType {
  userType: UserType | null
  setUserType: (type: UserType) => void
  isLoadingUserType: boolean
  registrationError: string | null
  syncUserWithBackend: (auth0Id: string, email: string, name?: string) => Promise<void>
}

const PortalContext = createContext<PortalContextType | undefined>(undefined)
const USERTYPE_STORAGE_KEY = 'tutor_app_usertype'

export function PortalProvider({ children }: { children: ReactNode }) {
  const [userType, setUserTypeState] = useState<UserType | null>(() => {
    // Initialize from localStorage if available
    const stored = localStorage.getItem(USERTYPE_STORAGE_KEY)
    console.log('[PortalContext] Initializing userType from localStorage:', stored)
    return (stored as UserType) || null
  })
  const [isLoadingUserType, setIsLoadingUserType] = useState(false)
  const [registrationError, setRegistrationError] = useState<string | null>(null)

  // Wrapper around setUserType that also persists to localStorage
  const setUserType = useCallback((type: UserType) => {
    console.log('[PortalContext] setUserType called with:', type)
    setUserTypeState(type)
    localStorage.setItem(USERTYPE_STORAGE_KEY, type)
  }, [])

  // Sync user type with backend after Auth0 login
  const syncUserWithBackend = useCallback(
    async (auth0Id: string, email: string, name?: string) => {
      console.log('[PortalContext] syncUserWithBackend called:', { auth0Id, email, name })
      console.log('[PortalContext] Current userType:', userType)
      setIsLoadingUserType(true)
      try {
        // Check if user exists in database
        console.log('[PortalContext] Checking if user exists...')
        const existingUser = await getUser(auth0Id)
        console.log('[PortalContext] getUser result:', existingUser)

        if (existingUser) {
          // User exists, use their stored type
          console.log('[PortalContext] User exists, setting userType to:', existingUser.userType)
          setUserType(existingUser.userType)
        } else {
          // New user, register with the selected type
          // Use the current userType state, or fall back to localStorage
          const typeToRegister = userType || (localStorage.getItem(USERTYPE_STORAGE_KEY) as UserType | null)
          console.log('[PortalContext] New user, userType from state:', userType, 'from storage:', localStorage.getItem(USERTYPE_STORAGE_KEY), 'will use:', typeToRegister)
          
          if (typeToRegister) {
            const result = await registerUser({
              auth0Id,
              email,
              name,
              userType: typeToRegister,
            })
            console.log('[PortalContext] registerUser result:', result)
            setUserType(typeToRegister)
          } else {
            console.warn('[PortalContext] Cannot register: userType is null in both state and localStorage')
            setRegistrationError('User type not selected. Please select a portal type before logging in.')
          }
        }
       } catch (error) {
          console.error('[PortalContext] Failed to sync user with backend:', error)
          const errorMsg = error instanceof Error ? error.message : 'Failed to register user'
          setRegistrationError(errorMsg)
        } finally {
          setIsLoadingUserType(false)
        }
    },
    [userType, setUserType]
  )

  return (
    <PortalContext.Provider
      value={{
        userType,
        setUserType,
        isLoadingUserType,
        registrationError,
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
