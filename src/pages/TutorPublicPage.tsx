import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import type { EventInput, EventClickArg } from '@fullcalendar/core'
import styled from '@emotion/styled'
import { getPublicTutorAvailability, type AvailabilitySlot, type DayOfWeek } from '../api/client'

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

const BackLink = styled(Link)`
  font-size: 14px;
  padding: 6px 16px;
  border-radius: 6px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid var(--accent-border);
  font-family: var(--sans);
  text-decoration: none;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: var(--shadow);
  }
`

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const CalendarWrapper = styled.div`
  flex: 1;
  padding: 20px;
  
  .fc {
    height: 100%;
    font-family: var(--sans);
  }
  
  .fc-toolbar-title {
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .fc-button {
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
    color: var(--accent);
    font-family: var(--sans);
    padding: 6px 12px;
    border-radius: 6px;
    transition: box-shadow 0.2s;
    
    &:hover {
      background: var(--accent-bg);
      box-shadow: var(--shadow);
    }
    
    &:disabled {
      opacity: 0.5;
    }
    
    &.fc-button-active {
      background: var(--accent);
      color: white;
    }
  }
  
  .fc-event {
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 0.85rem;
  }
  
  .fc-event-available {
    background: var(--accent);
    border-color: var(--accent);
    cursor: pointer;
  }
  
  .fc-event-unavailable {
    background: #9ca3af;
    border-color: #9ca3af;
    cursor: default;
    opacity: 0.6;
    pointer-events: none;
  }
  
  .fc-daygrid-day-number,
  .fc-col-header-cell-cushion {
    color: var(--text);
  }
  
  .fc-day-today {
    background: var(--accent-bg) !important;
  }
`

const LoadingContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  color: var(--text);
`

const ErrorContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px;
  text-align: center;
`

const ErrorMessage = styled.div`
  background: #fef2f2;
  color: #dc2626;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 1rem;
`

// Helper to get dates for a day of week
function getNextDateForDay(dayOfWeek: DayOfWeek, baseDate: Date): Date {
  const dayMap: Record<DayOfWeek, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  }
  
  const targetDay = dayMap[dayOfWeek]
  const currentDay = baseDate.getDay()
  let daysUntil = targetDay - currentDay
  if (daysUntil < 0) daysUntil += 7
  
  const result = new Date(baseDate)
  result.setDate(result.getDate() + daysUntil)
  return result
}

// Generate availability events for visible date range
function generateAvailabilityEvents(
  slots: AvailabilitySlot[],
  startDate: Date,
  endDate: Date
): EventInput[] {
  const events: EventInput[] = []
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  
  while (current <= endDate) {
    for (const slot of slots) {
      const slotDate = getNextDateForDay(slot.dayOfWeek, current)
      
      if (slotDate >= startDate && slotDate <= endDate) {
        const [startHour, startMin] = slot.startTime.split(':').map(Number)
        const [endHour, endMin] = slot.endTime.split(':').map(Number)
        
        const eventStart = new Date(slotDate)
        eventStart.setHours(startHour, startMin, 0, 0)
        
        const eventEnd = new Date(slotDate)
        eventEnd.setHours(endHour, endMin, 0, 0)
        
        // Only show future slots
        if (eventStart > new Date()) {
          events.push({
            id: `${slot.id}-${slotDate.toISOString()}`,
            title: 'Available',
            start: eventStart.toISOString(),
            end: eventEnd.toISOString(),
            classNames: ['fc-event-available'],
            extendedProps: { type: 'available' },
          })
        }
      }
    }
    current.setDate(current.getDate() + 7)
  }
  
  return events
}

export function TutorPublicPage() {
  const { tutorId } = useParams<{ tutorId: string }>()
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  useEffect(() => {
    if (tutorId) {
      fetchAvailability()
    }
  }, [tutorId])

  async function fetchAvailability() {
    if (!tutorId) return
    
    try {
      setLoading(true)
      const data = await getPublicTutorAvailability(tutorId)
      setAvailability(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch availability')
    } finally {
      setLoading(false)
    }
  }

  // Generate availability events from weekly schedule
  const events = generateAvailabilityEvents(availability, visibleRange.start, visibleRange.end)

  const handleEventClick = (_clickInfo: EventClickArg) => {
    // Public page is view-only, clicking does nothing
    // Users need to log in to book
  }

  const handleDatesSet = (dateInfo: { start: Date; end: Date }) => {
    setVisibleRange({ start: dateInfo.start, end: dateInfo.end })
  }

  if (!tutorId) {
    return (
      <Container>
        <Header>
          <Logo>Tutor Calendar</Logo>
          <BackLink to="/">Back to Home</BackLink>
        </Header>
        <ErrorContainer>
          <ErrorMessage>No tutor ID provided</ErrorMessage>
          <BackLink to="/">Go to Home</BackLink>
        </ErrorContainer>
      </Container>
    )
  }

  return (
    <Container>
      <Header>
        <Logo>Tutor Availability</Logo>
        <BackLink to="/">Back to Home</BackLink>
      </Header>

      <Main>
        {loading ? (
          <LoadingContainer>Loading calendar...</LoadingContainer>
        ) : error ? (
          <ErrorContainer>
            <ErrorMessage>{error}</ErrorMessage>
            <BackLink to="/">Go to Home</BackLink>
          </ErrorContainer>
        ) : availability.length === 0 ? (
          <LoadingContainer>This tutor has not set their availability yet.</LoadingContainer>
        ) : (
          <CalendarWrapper>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              events={events}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={false}
              nowIndicator={true}
              height="100%"
            />
          </CalendarWrapper>
        )}
      </Main>
    </Container>
  )
}
