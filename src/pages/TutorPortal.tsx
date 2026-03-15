import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import styled from '@emotion/styled'
import { TutorCalendar } from '../components/TutorCalendar'
import { TutorAvailabilityManager } from '../components/TutorAvailabilityManager'
import {
  getTutorBookingRequests,
  getTutorClients,
  updateBookingRequestStatus,
  type BookingRequest,
  type Tutor,
} from '../api/client'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
  flex-shrink: 0;
`

const Logo = styled.h1`
  margin: 0;
  font-size: 20px;
`

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const UserEmail = styled.span`
  font-size: 14px;
  color: var(--text);
`

const LogoutBtn = styled.button`
  font-size: 14px;
  padding: 6px 16px;
  border-radius: 6px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid var(--accent-border);
  font-family: var(--sans);
  cursor: pointer;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: var(--shadow);
  }
`

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`

const CalendarSection = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const ViewTabs = styled.div`
  display: flex;
  border-bottom: 1px solid var(--border);
  padding: 0 20px;
  background: var(--bg);
`

const ViewTab = styled.button<{ active?: boolean }>`
  padding: 12px 20px;
  border: none;
  border-bottom: 2px solid ${({ active }) => active ? 'var(--accent)' : 'transparent'};
  background: transparent;
  color: ${({ active }) => active ? 'var(--accent)' : 'var(--text)'};
  font-family: var(--sans);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: var(--accent);
  }
`

const ContentArea = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const Sidebar = styled.aside`
  width: 320px;
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background: var(--bg);
`

const SidebarHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--border);
`

const SidebarTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 16px;
  color: var(--text-h);
`

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
`

const FilterSelect = styled.select`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  font-family: var(--sans);
  background: var(--bg);
  color: var(--text);
`

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid var(--border);
`

const Tab = styled.button<{ active?: boolean }>`
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-bottom: 2px solid ${({ active }) => active ? 'var(--accent)' : 'transparent'};
  background: ${({ active }) => active ? 'var(--accent-bg)' : 'transparent'};
  color: ${({ active }) => active ? 'var(--accent)' : 'var(--text)'};
  font-family: var(--sans);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--accent-bg);
  }
`

const RequestsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`

const RequestCard = styled.div<{ status: string }>`
  padding: 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  margin-bottom: 12px;
  background: var(--bg);

  ${({ status }) => {
    switch (status) {
      case 'accepted':
        return 'border-left: 3px solid #10b981;'
      case 'declined':
        return 'border-left: 3px solid #ef4444;'
      default:
        return 'border-left: 3px solid var(--accent);'
    }
  }}
`

const RequestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`

const RequestTitle = styled.div`
  font-weight: 500;
  color: var(--text-h);
`

const RequestStatus = styled.span<{ status: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;

  ${({ status }) => {
    switch (status) {
      case 'accepted':
        return 'background: #d1fae5; color: #047857;'
      case 'declined':
        return 'background: #fee2e2; color: #dc2626;'
      default:
        return 'background: #dbeafe; color: #1d4ed8;'
    }
  }}
`

const RequestClient = styled.div`
  font-size: 13px;
  color: var(--text);
  margin-bottom: 4px;
`

const RequestTime = styled.div`
  font-size: 12px;
  color: var(--text);
  margin-bottom: 8px;
`

const RequestMessage = styled.div`
  font-size: 13px;
  color: var(--text);
  padding: 8px;
  background: var(--accent-bg);
  border-radius: 4px;
  margin-bottom: 12px;
  font-style: italic;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`

const ActionBtn = styled.button<{ variant: 'accept' | 'decline' }>`
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-family: var(--sans);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${({ variant }) =>
    variant === 'accept'
      ? `
          background: #10b981;
          color: white;
          border: none;
          
          &:hover {
            background: #059669;
          }
        `
      : `
          background: transparent;
          color: #ef4444;
          border: 1px solid #ef4444;
          
          &:hover {
            background: #fee2e2;
          }
        `
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 32px 16px;
  color: var(--text);
`

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  border-radius: 9999px;
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 600;
  margin-left: 6px;
`

const ErrorMessage = styled.div`
  background: #fef2f2;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  margin: 16px;
  font-size: 0.875rem;
`

export function TutorPortal() {
  const { user, logout } = useAuth0()
  const [view, setView] = useState<'calendar' | 'availability'>('calendar')
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [clients, setClients] = useState<Tutor[]>([])
  const [filterClientId, setFilterClientId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    loadRequests()
  }, [activeTab, filterClientId])

  async function loadClients() {
    try {
      const data = await getTutorClients()
      setClients(data)
    } catch (err) {
      // Silently fail - clients list is optional
      console.error('Failed to load clients:', err)
    }
  }

  async function loadRequests() {
    try {
      setLoading(true)
      const status = activeTab === 'pending' ? 'pending' : undefined
      const data = await getTutorBookingRequests(filterClientId || undefined, status)
      setRequests(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } })
  }

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      await updateBookingRequestStatus(requestId, 'accepted')
      loadRequests()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept request')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDecline = async (requestId: string) => {
    if (!confirm('Are you sure you want to decline this request?')) return
    
    setActionLoading(requestId)
    try {
      await updateBookingRequestStatus(requestId, 'declined')
      loadRequests()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline request')
    } finally {
      setActionLoading(null)
    }
  }

  function formatDateTime(isoString: string): string {
    return new Date(isoString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <Container>
      <Header>
        <Logo>Tutor Portal</Logo>
        <UserSection>
          <UserEmail>{user?.email}</UserEmail>
          <LogoutBtn onClick={handleLogout}>Log out</LogoutBtn>
        </UserSection>
      </Header>

      <MainContent>
        <CalendarSection>
          <ViewTabs>
            <ViewTab active={view === 'calendar'} onClick={() => setView('calendar')}>
              Calendar
            </ViewTab>
            <ViewTab active={view === 'availability'} onClick={() => setView('availability')}>
              Set Availability
            </ViewTab>
          </ViewTabs>
          <ContentArea>
            {view === 'calendar' ? <TutorCalendar /> : <TutorAvailabilityManager />}
          </ContentArea>
        </CalendarSection>

        <Sidebar>
          <SidebarHeader>
            <SidebarTitle>Booking Requests</SidebarTitle>
            <FilterRow>
              <FilterSelect
                value={filterClientId}
                onChange={(e) => setFilterClientId(e.target.value)}
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name || client.email}
                  </option>
                ))}
              </FilterSelect>
            </FilterRow>
          </SidebarHeader>

          <TabContainer>
            <Tab active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>
              Pending
              {pendingCount > 0 && activeTab !== 'pending' && (
                <Badge>{pendingCount}</Badge>
              )}
            </Tab>
            <Tab active={activeTab === 'all'} onClick={() => setActiveTab('all')}>
              All
            </Tab>
          </TabContainer>

          {error && (
            <ErrorMessage>
              {error}
              <button onClick={() => setError(null)} style={{ marginLeft: '12px', cursor: 'pointer' }}>
                Dismiss
              </button>
            </ErrorMessage>
          )}

          <RequestsList>
            {loading ? (
              <EmptyState>Loading...</EmptyState>
            ) : requests.length === 0 ? (
              <EmptyState>
                {activeTab === 'pending' 
                  ? 'No pending requests'
                  : 'No booking requests yet'
                }
              </EmptyState>
            ) : (
              requests.map(request => (
                <RequestCard key={request.id} status={request.status}>
                  <RequestHeader>
                    <RequestTitle>{request.title}</RequestTitle>
                    <RequestStatus status={request.status}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </RequestStatus>
                  </RequestHeader>
                  
                  <RequestClient>
                    From: {request.client?.name || request.client?.email || 'Unknown'}
                  </RequestClient>
                  
                  <RequestTime>
                    {formatDateTime(request.startTime)} - {formatDateTime(request.endTime)}
                  </RequestTime>
                  
                  {request.message && (
                    <RequestMessage>"{request.message}"</RequestMessage>
                  )}
                  
                  {request.status === 'pending' && (
                    <ActionButtons>
                      <ActionBtn
                        variant="accept"
                        onClick={() => handleAccept(request.id)}
                        disabled={actionLoading === request.id}
                      >
                        {actionLoading === request.id ? 'Processing...' : 'Accept'}
                      </ActionBtn>
                      <ActionBtn
                        variant="decline"
                        onClick={() => handleDecline(request.id)}
                        disabled={actionLoading === request.id}
                      >
                        Decline
                      </ActionBtn>
                    </ActionButtons>
                  )}
                </RequestCard>
              ))
            )}
          </RequestsList>
        </Sidebar>
      </MainContent>
    </Container>
  )
}
