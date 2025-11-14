/**
 * Module 6: Onboarding & Guidance - use-onboarding Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboarding } from '../use-onboarding';
import { OnboardingTour } from '@/components/onboarding/onboarding-steps';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Module 6: use-onboarding Hook', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with no active tour', () => {
    const { result } = renderHook(() => useOnboarding());

    expect(result.current.isActive).toBe(false);
    expect(result.current.activeTour).toBe(null);
    expect(result.current.currentStep).toBe(0);
  });

  it('should start a tour', () => {
    const mockTour: OnboardingTour = {
      id: 'test-tour',
      name: 'Test Tour',
      description: 'Test description',
      steps: [
        {
          id: 'step-1',
          target: '#test',
          title: 'Step 1',
          content: 'Step 1 content',
        },
      ],
    };

    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.startTour(mockTour);
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.activeTour).toEqual(mockTour);
    expect(result.current.currentStep).toBe(0);
  });

  it('should not start a tour if already completed', () => {
    const mockTour: OnboardingTour = {
      id: 'completed-tour',
      name: 'Completed Tour',
      description: 'Test',
      steps: [],
    };

    // Mark tour as completed
    localStorageMock.setItem(
      'wealthrm_onboarding_completed',
      JSON.stringify(['completed-tour'])
    );

    const { result } = renderHook(() => useOnboarding());

    act(() => {
      const started = result.current.startTour(mockTour);
      expect(started).toBe(false);
    });

    expect(result.current.isActive).toBe(false);
  });

  it('should move to next step', () => {
    const mockTour: OnboardingTour = {
      id: 'test-tour',
      name: 'Test Tour',
      description: 'Test',
      steps: [
        { id: 'step-1', target: '#1', title: 'Step 1', content: 'Content 1' },
        { id: 'step-2', target: '#2', title: 'Step 2', content: 'Content 2' },
      ],
    };

    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.startTour(mockTour);
    });

    expect(result.current.currentStep).toBe(0);

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(1);
  });

  it('should complete tour when reaching last step', () => {
    const mockTour: OnboardingTour = {
      id: 'test-tour',
      name: 'Test Tour',
      description: 'Test',
      steps: [
        { id: 'step-1', target: '#1', title: 'Step 1', content: 'Content 1' },
      ],
    };

    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.startTour(mockTour);
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.currentStep).toBe(0);

    act(() => {
      result.current.nextStep(); // Should complete tour (step 0 -> 1, which is >= steps.length)
    });

    expect(result.current.isActive).toBe(false);
    const completed = localStorageMock.getItem('wealthrm_onboarding_completed');
    expect(completed).toBeTruthy();
    if (completed) {
      const completedArray = JSON.parse(completed);
      expect(completedArray).toContain('test-tour');
    }
  });

  it('should skip tour', () => {
    const mockTour: OnboardingTour = {
      id: 'test-tour',
      name: 'Test Tour',
      description: 'Test',
      steps: [],
    };

    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.startTour(mockTour);
    });

    expect(result.current.isActive).toBe(true);

    act(() => {
      result.current.skipTour();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.activeTour).toBe(null);
    expect(result.current.currentStep).toBe(0);
    
    // Verify the tour was marked as completed in state
    // The skipTour function updates both localStorage and state
    expect(result.current.isTourCompleted('test-tour')).toBe(true);
  });

  it('should check if tour is completed', () => {
    localStorageMock.setItem(
      'wealthrm_onboarding_completed',
      JSON.stringify(['test-tour'])
    );

    const { result } = renderHook(() => useOnboarding());

    expect(result.current.isTourCompleted('test-tour')).toBe(true);
    expect(result.current.isTourCompleted('other-tour')).toBe(false);
  });

  it('should reset tour', () => {
    localStorageMock.setItem(
      'wealthrm_onboarding_completed',
      JSON.stringify(['test-tour'])
    );
    localStorageMock.setItem('wealthrm_tour_test-tour', '2');

    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.resetTour('test-tour');
    });

    expect(result.current.isTourCompleted('test-tour')).toBe(false);
    expect(localStorageMock.getItem('wealthrm_tour_test-tour')).toBeNull();
  });

  it('should get current step data', () => {
    const mockTour: OnboardingTour = {
      id: 'test-tour',
      name: 'Test Tour',
      description: 'Test',
      steps: [
        { id: 'step-1', target: '#1', title: 'Step 1', content: 'Content 1' },
        { id: 'step-2', target: '#2', title: 'Step 2', content: 'Content 2' },
      ],
    };

    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.startTour(mockTour);
    });

    const stepData = result.current.getCurrentStepData();
    expect(stepData).toEqual(mockTour.steps[0]);

    act(() => {
      result.current.nextStep();
    });

    const nextStepData = result.current.getCurrentStepData();
    expect(nextStepData).toEqual(mockTour.steps[1]);
  });
});

