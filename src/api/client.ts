/**
 * API client for backend communication
 * Handles JWT token injection and role-based access control
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export type UserType = 'tutor' | 'client'

/**
 * Store for Auth0 token getter function
 * This is populated by the app on initialization to avoid circular dependencies
 */
let getAuth0TokenFn: (() => Promise<string | null>) | null = null

/**
 * Register the Auth0 token getter function
 * Should be called from a component that has access to useAuth0 hook
 */
export function registerAuth0TokenGetter(fn: () => Promise<string | null>) {
  getAuth0TokenFn = fn
}

/**
 * Create fetch headers with JWT token from Auth0
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (getAuth0TokenFn) {
    try {
      const token = await getAuth0TokenFn()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
        console.log('[API] JWT token injected')
      }
    } catch (error) {
      console.warn('[API] Could not get Auth0 token:', error)
    }
  }

  return headers
}

export interface User {
  id: string
  email: string
  name?: string
  userType: UserType
  createdAt: string
}

export interface RegistrationErrorResponse {
  message: string
  code?: string
  existingRole?: UserType
}

/**
 * Register or update user in the database with their user type
 * Called after Auth0 login to track user type in postgres
 * Validates that user type matches their registered role
 */
export async function registerUser(params: {
  auth0Id: string
  email: string
  name?: string
  userType: UserType
}): Promise<User> {
  const url = `${BASE_URL}/users/register`
  const headers = await getAuthHeaders()
  
  console.log('POST', url, params)
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  })

  console.log('Response status:', response.status, response.statusText)

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as RegistrationErrorResponse
    const err = new Error(error.message || `Failed to register user: ${response.statusText}`) as any
    err.code = error.code
    err.existingRole = error.existingRole
    err.status = response.status
    throw err
  }

  const result = await response.json()
  console.log('registerUser success:', result)
  return result
}

/**
 * Get user by Auth0 ID
 * Used to check if user exists and retrieve their stored user type
 */
export async function getUser(auth0Id: string): Promise<User | null> {
  const url = `${BASE_URL}/users/${auth0Id}`
  const headers = await getAuthHeaders()
  
  console.log('GET', url)
  
  const response = await fetch(url, { headers })
  console.log('Response status:', response.status, response.statusText)

  if (response.status === 404) {
    console.log('User not found (404)')
    return null
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to fetch user: ${response.statusText}`)
  }

  const result = await response.json()
  console.log('getUser success:', result)
  return result
}

/**
 * Update user type (in case they switch portals)
 */
export async function updateUserType(
  auth0Id: string,
  userType: UserType
): Promise<User> {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${BASE_URL}/users/${auth0Id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ userType }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to update user: ${response.statusText}`)
  }

  return response.json()
}
