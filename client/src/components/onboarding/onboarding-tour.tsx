/**
 * Onboarding Tour Component
 * Interactive step-by-step tour guide for new users
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useOnboarding, OnboardingStep } from '@/hooks/use-onboarding';
import { cn } from '@/lib/utils';

interface OnboardingTourProps {
  className?: string;
}

export function OnboardingTour({ className }: OnboardingTourProps) {
  const {
    activeTour,
    currentStep,
    isActive,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    getCurrentStepData,
  } = useOnboarding();

  const [stepPosition, setStepPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const stepData = getCurrentStepData();

  // Calculate position for current step
  useEffect(() => {
    if (!isActive || !stepData) {
      setStepPosition(null);
      setHighlightedElement(null);
      return;
    }

    const element = document.querySelector(stepData.target) as HTMLElement;
    if (!element) {
      // If element not found, center the tooltip
      setStepPosition({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        width: 0,
        height: 0,
      });
      setHighlightedElement(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    setHighlightedElement(element);
    setStepPosition({
      top: rect.top + scrollY,
      left: rect.left + scrollX,
      width: rect.width,
      height: rect.height,
    });

    // Scroll element into view if needed
    if (element && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [isActive, stepData, currentStep]);

  // Handle step actions
  useEffect(() => {
    if (!isActive || !stepData?.action) return;

    const handleAction = () => {
      if (stepData.action?.type === 'click' && stepData.action.selector) {
        const target = document.querySelector(stepData.action.selector) as HTMLElement;
        if (target) {
          target.click();
        }
      } else if (stepData.action?.type === 'navigate' && stepData.action.route) {
        window.location.hash = stepData.action.route;
      }
    };

    // Small delay to ensure UI is ready
    const timer = setTimeout(handleAction, 300);
    return () => clearTimeout(timer);
  }, [isActive, stepData, currentStep]);

  if (!isActive || !stepData || !activeTour) {
    return null;
  }

  const progress = ((currentStep + 1) / activeTour.steps.length) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === activeTour.steps.length - 1;

  // Calculate tooltip position based on step position preference
  const getTooltipPosition = () => {
    if (!stepPosition) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const position = stepData.position || 'bottom';
    const offset = 20;
    const tooltipWidth = 400;
    const tooltipHeight = 200;

    switch (position) {
      case 'top':
        return {
          top: `${stepPosition.top - tooltipHeight - offset}px`,
          left: `${stepPosition.left + stepPosition.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          top: `${stepPosition.top + stepPosition.height + offset}px`,
          left: `${stepPosition.left + stepPosition.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          top: `${stepPosition.top + stepPosition.height / 2}px`,
          left: `${stepPosition.left - tooltipWidth - offset}px`,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          top: `${stepPosition.top + stepPosition.height / 2}px`,
          left: `${stepPosition.left + stepPosition.width + offset}px`,
          transform: 'translateY(-50%)',
        };
      case 'center':
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  const tooltipStyle = getTooltipPosition();

  return createPortal(
    <>
      {/* Overlay with highlight */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9998] bg-black/60 transition-opacity"
        onClick={(e) => {
          // Only close on overlay click, not on tooltip click
          if (e.target === overlayRef.current) {
            skipTour();
          }
        }}
      >
        {/* Highlight cutout */}
        {highlightedElement && stepPosition && (
          <div
            className="absolute border-4 border-primary rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none"
            style={{
              top: `${stepPosition.top}px`,
              left: `${stepPosition.left}px`,
              width: `${stepPosition.width}px`,
              height: `${stepPosition.height}px`,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <Card
        className={cn(
          'fixed z-[9999] w-[400px] max-w-[90vw] shadow-2xl animate-in fade-in-0 zoom-in-95',
          className
        )}
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{stepData.title}</CardTitle>
              <CardDescription className="mt-1">
                Step {currentStep + 1} of {activeTour.steps.length}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={skipTour}
              aria-label="Skip tour"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{stepData.content}</p>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {Math.round(progress)}% complete
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex gap-2">
              {!isFirstStep && (
                <Button variant="outline" size="sm" onClick={previousStep}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={skipTour}>
                <SkipForward className="h-4 w-4 mr-1" />
                Skip Tour
              </Button>
            </div>
            <Button size="sm" onClick={isLastStep ? completeTour : nextStep}>
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>,
    document.body
  );
}

