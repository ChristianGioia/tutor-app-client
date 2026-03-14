/**
 * API client stub for backend communication
 * TODO: Replace BASE_URL with actual backend URL when backend is ready
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export type UserType = 'tutor' | 'client'

export interface User {
  id: string
  email: string
  name?: string
  userType: UserType
  createdAt: string
}

/**
 * Register or update user in the database with their user type
 * Called after Auth0 login to track user type in postgres
 */
export async function registerUser(params: {
  auth0Id: string
  email: string
  name?: string
  userType: UserType
}): Promise<User> {
  const response = await fetch(`${BASE_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      error.message || `Failed to register user: ${response.statusText}`
    )
  }

  return response.json()
}

/**
 * Get user by Auth0 ID
 * Used to check if user exists and retrieve their stored user type
 */
export async function getUser(auth0Id: string): Promise<User | null> {
  const response = await fetch(`${BASE_URL}/users/${auth0Id}`)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to fetch user: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Update user type (in case they switch portals)
 */
export async function updateUserType(
  auth0Id: string,
  userType: UserType
): Promise<User> {
  const response = await fetch(`${BASE_URL}/users/${auth0Id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userType }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to update user: ${response.statusText}`)
  }

  return response.json()
}
