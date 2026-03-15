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

// Availability types and API functions (recurring weekly schedule)
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface AvailabilitySlot {
  id: string
  tutorId: string
  dayOfWeek: DayOfWeek
  startTime: string  // HH:MM format (e.g., "09:00")
  endTime: string    // HH:MM format (e.g., "17:00")
  createdAt: string
  updatedAt: string
}

export interface CreateAvailabilityParams {
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
}

export interface UpdateAvailabilityParams {
  dayOfWeek?: DayOfWeek
  startTime?: string
  endTime?: string
}

/**
 * Get tutor's weekly availability schedule
 */
export async function getTutorAvailability(): Promise<AvailabilitySlot[]> {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${BASE_URL}/availability`, { headers })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to fetch availability: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get public availability for a specific tutor
 */
export async function getPublicTutorAvailability(tutorId: string): Promise<AvailabilitySlot[]> {
  const response = await fetch(`${BASE_URL}/tutors/${tutorId}/availability`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to fetch tutor availability: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Create a new availability slot
 */
export async function createAvailability(params: CreateAvailabilityParams): Promise<AvailabilitySlot> {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${BASE_URL}/availability`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to create availability: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Update an availability slot
 */
export async function updateAvailability(
  id: string,
  params: UpdateAvailabilityParams
): Promise<AvailabilitySlot> {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${BASE_URL}/availability/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to update availability: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Delete an availability slot
 */
export async function deleteAvailability(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${BASE_URL}/availability/${id}`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to delete availability: ${response.statusText}`)
  }
}

// Appointment types and API functions
export type AppointmentStatus = 'available' | 'booked' | 'cancelled' | 'completed'

export interface Appointment {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  tutorId: string
  clientId?: string
  status: AppointmentStatus
  createdAt: string
  updatedAt: string
  tutor?: {
    id: string
    name?: string
    email: string
  }
  client?: {
    id: string
    name?: string
    email: string
  }
}

export interface CreateAppointmentParams {
  title: string
  description?: string
  startTime: string
  endTime: string
}

export interface UpdateAppointmentParams {
  title?: string
  description?: string
  startTime?: string
  endTime?: string
  status?: AppointmentStatus
}

/**
 * Get all appointments for the authenticated tutor
 */
export async function getTutorAppointments(): Promise<Appointment[]> {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${BASE_URL}/appointments`, { headers })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to fetch appointments: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Create a new appointment
 */
export async function createAppointment(params: CreateAppointmentParams): Promise<Appointment> {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${BASE_URL}/appointments`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to create appointment: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Update an existing appointment
 */
export async function updateAppointment(
  id: string,
  params: UpdateAppointmentParams
): Promise<Appointment> {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${BASE_URL}/appointments/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to update appointment: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Delete an appointment
 */
export async function deleteAppointment(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${BASE_URL}/appointments/${id}`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to delete appointment: ${response.statusText}`)
  }
}

/**
 * Get public appointments for a specific tutor (no auth required)
 */
export async function getPublicTutorAppointments(tutorId: string): Promise<Appointment[]> {
  const response = await fetch(`${BASE_URL}/tutors/${tutorId}/appointments`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to fetch tutor appointments: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get client's booked appointments
 */
export async function getClientAppointments(tutorId?: string): Promise<Appointment[]> {
  const headers = await getAuthHeaders()
  const url = tutorId 
    ? `${BASE_URL}/appointments/client?tutorId=${tutorId}`
    : `${BASE_URL}/appointments/client`
  
  const response = await fetch(url, { headers })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to fetch appointments: ${response.statusText}`)
  }

  return response.json()
}

// Booking request types and API functions
export type BookingRequestStatus = 'pending' | 'accepted' | 'declined'

export interface BookingRequest {
  id: string
  clientId: string
  tutorId: string
  startTime: string
  endTime: string
  title: string
  message?: string
  status: BookingRequestStatus
  appointmentId?: string
  createdAt: string
  updatedAt: string
  client?: {
    id: string
    name?: string
    email: string
  }
  tutor?: {
    id: string
    name?: string
    email: string
  }
}

export interface CreateBookingRequestParams {
  tutorId: string
  startTime: string
  endTime: string
  title: string
  message?: string
}

export interface Tutor {
  id: string
  name?: string
  email: string
}

/**
 * Get all tutors (for client to browse)
 */
export async function getAllTutors(): Promise<Tutor[]> {
  const response = await fetch(`${BASE_URL}/tutors`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to fetch tutors: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get all clients that have interacted with the tutor
 */
export async function getTutorClients(): Promise<Tutor[]> {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${BASE_URL}/clients`, { headers })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to fetch clients: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Create a booking request (client only)
 */
export async function createBookingRequest(params: CreateBookingRequestParams): Promise<BookingRequest> {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${BASE_URL}/booking-requests`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to create booking request: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get client's booking requests
 */
export async function getClientBookingRequests(tutorId?: string): Promise<BookingRequest[]> {
  const headers = await getAuthHeaders()
  const url = tutorId 
    ? `${BASE_URL}/booking-requests/client?tutorId=${tutorId}`
    : `${BASE_URL}/booking-requests/client`
  
  const response = await fetch(url, { headers })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to fetch booking requests: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get tutor's received booking requests
 */
export async function getTutorBookingRequests(clientId?: string, status?: string): Promise<BookingRequest[]> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams()
  if (clientId) params.append('clientId', clientId)
  if (status) params.append('status', status)
  
  const url = params.toString() 
    ? `${BASE_URL}/booking-requests/tutor?${params.toString()}`
    : `${BASE_URL}/booking-requests/tutor`
  
  const response = await fetch(url, { headers })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to fetch booking requests: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Update booking request status (tutor accept/decline)
 */
export async function updateBookingRequestStatus(
  id: string,
  status: 'accepted' | 'declined'
): Promise<BookingRequest> {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${BASE_URL}/booking-requests/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to update booking request: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Cancel a booking request (client only, pending only)
 */
export async function cancelBookingRequest(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${BASE_URL}/booking-requests/${id}`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to cancel booking request: ${response.statusText}`)
  }
}
