import {
  addDays,
  addMinutes,
  differenceInHours,
  differenceInMinutes,
  format,
  isAfter,
  isBefore,
  isSameDay,
  roundToNearestMinutes,
  set,
  startOfDay,
} from 'date-fns';

export type AppointmentType = 'call' | 'meeting' | 'video_call';
export type AppointmentPriority = 'low' | 'medium' | 'high';

export interface AppointmentLike {
  id?: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: AppointmentType;
  priority: AppointmentPriority;
  clientName?: string;
  location?: string;
}

export interface AppointmentRecommendation {
  date: string;
  startTime: string;
  endTime: string;
  type: AppointmentType;
  confidence: number;
  rationale: string;
}

export interface ShowUpAssessment {
  likelihood: number;
  riskLevel: 'low' | 'medium' | 'high';
  signals: string[];
}

const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 17;
const DEFAULT_DURATION_MINUTES = 60;

function getWorkingDayBounds(date: Date) {
  const start = set(startOfDay(date), { hours: BUSINESS_START_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });
  const end = set(startOfDay(date), { hours: BUSINESS_END_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });
  return { start, end };
}

function normaliseToQuarterHour(date: Date) {
  return roundToNearestMinutes(date, { nearestTo: 15 });
}

function prepareHistoryByType(appointments: AppointmentLike[]) {
  const typeWeights: Record<AppointmentType, number> = {
    meeting: 0,
    call: 0,
    video_call: 0,
  };

  const recent = [...appointments]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 10);

  recent.forEach((appointment, index) => {
    const weight = 1 - index * 0.08;
    typeWeights[appointment.type] += Math.max(weight, 0.2);
  });

  let recommendedType: AppointmentType = 'meeting';
  let highestWeight = -Infinity;

  (Object.keys(typeWeights) as AppointmentType[]).forEach((type) => {
    if (typeWeights[type] > highestWeight) {
      recommendedType = type;
      highestWeight = typeWeights[type];
    }
  });

  const totalWeight = (Object.values(typeWeights) as number[]).reduce((acc, value) => acc + value, 0) || 1;
  const confidence = Math.min(0.95, Math.max(0.5, highestWeight / totalWeight));

  return { recommendedType, confidence };
}

function findSlotForDate(date: Date, dayAppointments: AppointmentLike[]) {
  const { start: workStart, end: workEnd } = getWorkingDayBounds(date);
  const now = new Date();

  let candidate = workStart;
  if (isSameDay(date, now) && isAfter(now, candidate)) {
    candidate = normaliseToQuarterHour(addMinutes(now, 30));
  }

  const sorted = [...dayAppointments].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  for (const appointment of sorted) {
    const appointmentStart = new Date(appointment.startTime);
    const appointmentEnd = new Date(appointment.endTime);

    if (differenceInMinutes(appointmentStart, candidate) >= DEFAULT_DURATION_MINUTES) {
      break;
    }

    if (isBefore(candidate, appointmentEnd) && isAfter(appointmentEnd, candidate)) {
      candidate = normaliseToQuarterHour(addMinutes(appointmentEnd, 15));
    }

    if (!isBefore(candidate, workEnd)) {
      return null;
    }
  }

  if (differenceInMinutes(workEnd, addMinutes(candidate, DEFAULT_DURATION_MINUTES)) < 0) {
    return null;
  }

  const end = addMinutes(candidate, DEFAULT_DURATION_MINUTES);

  return { start: candidate, end };
}

export function getSuggestedAppointmentDetails(
  appointments: AppointmentLike[],
  options: { preferredDate?: Date } = {},
): AppointmentRecommendation | null {
  const baseDate = options.preferredDate ? new Date(options.preferredDate) : new Date();
  const sortedAppointments = [...appointments].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  let currentDate = baseDate;
  let slot: { start: Date; end: Date } | null = null;

  for (let attempts = 0; attempts < 5 && !slot; attempts += 1) {
    const dayAppointments = sortedAppointments.filter((appointment) =>
      isSameDay(new Date(appointment.startTime), currentDate),
    );
    slot = findSlotForDate(currentDate, dayAppointments);

    if (!slot) {
      currentDate = addDays(currentDate, 1);
    }
  }

  if (!slot) {
    const { start, end } = getWorkingDayBounds(addDays(baseDate, 1));
    slot = { start, end: addMinutes(start, DEFAULT_DURATION_MINUTES) };
  }

  const { recommendedType, confidence } = prepareHistoryByType(sortedAppointments);

  return {
    date: format(slot.start, 'yyyy-MM-dd'),
    startTime: format(slot.start, 'HH:mm'),
    endTime: format(slot.end, 'HH:mm'),
    type: recommendedType,
    confidence,
    rationale: `Based on recent scheduling patterns and availability on ${format(slot.start, 'MMM d')}.`,
  };
}

export function evaluateShowUpLikelihood(appointment: AppointmentLike): ShowUpAssessment {
  const signals: string[] = [];
  let likelihood = 0.78;

  if (appointment.priority === 'high') {
    likelihood += 0.12;
    signals.push('High priority engagement');
  } else if (appointment.priority === 'low') {
    likelihood -= 0.1;
    signals.push('Low priority meeting');
  }

  if (appointment.type === 'video_call') {
    likelihood -= 0.06;
    signals.push('Virtual meeting');
  } else if (appointment.type === 'meeting') {
    likelihood += 0.05;
  }

  const hoursUntil = differenceInHours(new Date(appointment.startTime), new Date());
  if (hoursUntil < 0) {
    signals.push('Appointment already completed');
  } else if (hoursUntil <= 24) {
    likelihood += 0.05;
    signals.push('Confirmed within 24 hours');
  } else if (hoursUntil > 72) {
    likelihood -= 0.04;
    signals.push('Scheduled far in advance');
  }

  if (!appointment.clientName) {
    likelihood -= 0.05;
    signals.push('Prospect without confirmed contact');
  }

  likelihood = Math.max(0.2, Math.min(0.98, likelihood));

  let riskLevel: ShowUpAssessment['riskLevel'] = 'low';
  if (likelihood < 0.55) {
    riskLevel = 'high';
  } else if (likelihood < 0.7) {
    riskLevel = 'medium';
  }

  return {
    likelihood,
    riskLevel,
    signals,
  };
}

export function generateAgendaTemplate(appointment: AppointmentLike): string {
  const scheduledFor = format(new Date(appointment.startTime), "EEEE, MMMM d 'at' h:mm a");
  const client = appointment.clientName ?? 'the client';

  return [
    `Agenda: ${appointment.title}`,
    `Scheduled for ${scheduledFor}`,
    '',
    '1. Warm welcome and relationship check-in',
    `2. Review current financial position with ${client}`,
    `3. Discuss key priorities for the ${appointment.type.replace('_', ' ')}`,
    '4. Capture action items and next steps',
  ].join('\n');
}

export function generateFollowUpTemplate(appointment: AppointmentLike): string {
  const client = appointment.clientName ?? 'client';
  const meetingDate = format(new Date(appointment.startTime), 'MMMM d, yyyy');

  return [
    `Subject: Thank you for meeting on ${meetingDate}`,
    '',
    `Hi ${client.split(' ')[0] ?? client},`,
    '',
    `Thank you for taking the time for our ${appointment.type.replace('_', ' ')} today.`,
    'Here is a quick summary of what we discussed and the immediate next steps:',
    '',
    '- Key decisions and confirmations',
    '- Outstanding questions to address',
    '- Follow-up materials promised during the meeting',
    '',
    'Please let me know if there is anything else you need in the meantime.',
    '',
    'Best regards,',
    'Your Wealth RM Team',
  ].join('\n');
}
