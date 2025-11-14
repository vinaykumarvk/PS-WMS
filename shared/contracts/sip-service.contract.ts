/**
 * Foundation Layer - F2: SIP Service Contract
 * Defines the interface contract for SIP Service
 */

import type { 
  SIPPlan,
  SIPCalculatorResult,
  SIPCalendarEvent,
  SIPPerformance,
  APIResponse 
} from '../types/sip.types';

export interface ISIPService {
  /**
   * Create a new SIP plan
   */
  createSIP(planData: {
    clientId: number;
    schemeId: number;
    amount: number;
    frequency: string;
    startDate: string;
    installments: number;
  }): Promise<APIResponse<SIPPlan>>;

  /**
   * Get SIP plan by ID
   */
  getSIPById(planId: string): Promise<APIResponse<SIPPlan | null>>;

  /**
   * Get SIP plans for a client
   */
  getSIPsByClient(clientId: number, status?: string): Promise<APIResponse<SIPPlan[]>>;

  /**
   * Modify SIP plan
   */
  modifySIP(planId: string, updates: {
    newAmount?: number;
    newFrequency?: string;
  }): Promise<APIResponse<SIPPlan>>;

  /**
   * Pause SIP plan
   */
  pauseSIP(planId: string, pauseUntil?: string): Promise<APIResponse<SIPPlan>>;

  /**
   * Resume SIP plan
   */
  resumeSIP(planId: string): Promise<APIResponse<SIPPlan>>;

  /**
   * Cancel SIP plan
   */
  cancelSIP(planId: string, reason: string): Promise<APIResponse<SIPPlan>>;

  /**
   * Calculate SIP returns
   */
  calculateSIP(input: {
    amount: number;
    frequency: string;
    duration: number;
    expectedReturn: number;
  }): Promise<APIResponse<SIPCalculatorResult>>;

  /**
   * Get SIP calendar events
   */
  getSIPCalendar(clientId: number, startDate: string, endDate: string): Promise<APIResponse<SIPCalendarEvent[]>>;

  /**
   * Get SIP performance
   */
  getSIPPerformance(planId: string): Promise<APIResponse<SIPPerformance>>;
}

