/**
 * use-onboarding Hook
 * Custom hook for managing onboarding tour state and progress
 */

import { useState, useEffect, useCallback } from 'react';

export interface OnboardingStep {
  id: string;
  target: string; // CSS selector or element ID
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    type: 'click' | 'navigate';
    selector?: string;
    route?: string;
  };
}

export interface OnboardingTour {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
  completed?: boolean;
}

const STORAGE_KEY = 'wealthrm_onboarding_completed';
const TOUR_STORAGE_PREFIX = 'wealthrm_tour_';

/**
 * Get completed tours from localStorage
 */
function getCompletedTours(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Save completed tour to localStorage
 */
function saveCompletedTour(tourId: string): void {
  try {
    const completed = getCompletedTours();
    completed.add(tourId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(completed)));
  } catch (error) {
    console.error('Failed to save completed tour:', error);
  }
}

/**
 * Get tour progress from localStorage
 */
function getTourProgress(tourId: string): number {
  try {
    const stored = localStorage.getItem(`${TOUR_STORAGE_PREFIX}${tourId}`);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Save tour progress to localStorage
 */
function saveTourProgress(tourId: string, stepIndex: number): void {
  try {
    localStorage.setItem(`${TOUR_STORAGE_PREFIX}${tourId}`, stepIndex.toString());
  } catch (error) {
    console.error('Failed to save tour progress:', error);
  }
}

export function useOnboarding() {
  const [activeTour, setActiveTour] = useState<OnboardingTour | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);
  const [completedTours, setCompletedTours] = useState<Set<string>>(getCompletedTours());

  /**
   * Start an onboarding tour
   */
  const startTour = useCallback((tour: OnboardingTour) => {
    // Check if tour is already completed
    if (completedTours.has(tour.id)) {
      return false;
    }

    setActiveTour(tour);
    const savedProgress = getTourProgress(tour.id);
    setCurrentStep(savedProgress);
    setIsActive(true);
    return true;
  }, [completedTours]);

  /**
   * Complete tour
   */
  const completeTour = useCallback(() => {
    if (activeTour) {
      saveCompletedTour(activeTour.id);
      setCompletedTours(prev => new Set([...prev, activeTour.id]));
    }
    setIsActive(false);
    setActiveTour(null);
    setCurrentStep(0);
  }, [activeTour]);

  /**
   * Go to next step
   */
  const nextStep = useCallback(() => {
    if (!activeTour) return;

    const nextIndex = currentStep + 1;
    if (nextIndex >= activeTour.steps.length) {
      completeTour();
    } else {
      setCurrentStep(nextIndex);
      saveTourProgress(activeTour.id, nextIndex);
    }
  }, [activeTour, currentStep, completeTour]);

  /**
   * Go to previous step
   */
  const previousStep = useCallback(() => {
    if (!activeTour || currentStep === 0) return;

    const prevIndex = currentStep - 1;
    setCurrentStep(prevIndex);
    if (activeTour) {
      saveTourProgress(activeTour.id, prevIndex);
    }
  }, [activeTour, currentStep]);

  /**
   * Skip tour
   */
  const skipTour = useCallback(() => {
    if (activeTour) {
      saveCompletedTour(activeTour.id);
      setCompletedTours(prev => new Set([...prev, activeTour.id]));
    }
    setIsActive(false);
    setActiveTour(null);
    setCurrentStep(0);
  }, [activeTour]);

  /**
   * Reset tour (for testing/admin purposes)
   */
  const resetTour = useCallback((tourId: string) => {
    try {
      const completed = getCompletedTours();
      completed.delete(tourId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(completed)));
      localStorage.removeItem(`${TOUR_STORAGE_PREFIX}${tourId}`);
      setCompletedTours(new Set(completed));
    } catch (error) {
      console.error('Failed to reset tour:', error);
    }
  }, []);

  /**
   * Check if a tour is completed
   */
  const isTourCompleted = useCallback((tourId: string): boolean => {
    return completedTours.has(tourId);
  }, [completedTours]);

  /**
   * Get current step data
   */
  const getCurrentStepData = useCallback((): OnboardingStep | null => {
    if (!activeTour || currentStep >= activeTour.steps.length) {
      return null;
    }
    return activeTour.steps[currentStep];
  }, [activeTour, currentStep]);

  return {
    activeTour,
    currentStep,
    isActive,
    completedTours,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    resetTour,
    isTourCompleted,
    getCurrentStepData,
    setIsActive,
  };
}

