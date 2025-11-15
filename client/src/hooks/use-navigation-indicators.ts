import { useQuery } from "@tanstack/react-query"

export interface NavigationIndicators {
  hasAppointmentsToday: boolean
  hasOverdueTasks: boolean
  hasRecentTalkingPoints: boolean
  hasRecentAnnouncements: boolean
  hasRecentClients: boolean
}

export function useNavigationIndicators(): NavigationIndicators {
  const { data: appointments } = useQuery({
    queryKey: ["/api/appointments/today"],
    staleTime: 5 * 60 * 1000,
  })

  const { data: tasks } = useQuery({
    queryKey: ["/api/tasks"],
    staleTime: 5 * 60 * 1000,
  })

  const { data: talkingPoints } = useQuery({
    queryKey: ["/api/talking-points"],
    staleTime: 5 * 60 * 1000,
  })

  const { data: announcements } = useQuery({
    queryKey: ["/api/announcements"],
    staleTime: 5 * 60 * 1000,
  })

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
    staleTime: 5 * 60 * 1000,
  })

  const hasAppointmentsToday =
    Array.isArray(appointments) && appointments.length > 0

  const hasOverdueTasks =
    Array.isArray(tasks) &&
    tasks.some((task: any) => {
      const dueDate = new Date(task.dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return dueDate <= today && task.status !== "completed"
    })

  const hasRecentTalkingPoints =
    Array.isArray(talkingPoints) &&
    talkingPoints.some((point: any) => {
      const createdDate = new Date(point.created_at)
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      return createdDate >= threeDaysAgo && point.is_active
    })

  const hasRecentAnnouncements =
    Array.isArray(announcements) &&
    announcements.some((announcement: any) => {
      const createdDate = new Date(announcement.created_at)
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      return createdDate >= threeDaysAgo && announcement.is_active
    })

  const hasRecentClients =
    Array.isArray(clients) &&
    clients.some((client: any) => {
      const createdDate = new Date(client.createdAt)
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      return createdDate >= threeDaysAgo
    })

  return {
    hasAppointmentsToday,
    hasOverdueTasks,
    hasRecentTalkingPoints,
    hasRecentAnnouncements,
    hasRecentClients,
  }
}
