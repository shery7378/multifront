'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function GuidedNavigation({ steps = [], onComplete, skipOnboarding }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const overlayRef = useRef(null);
  const highlightRef = useRef(null);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed') === 'true';
    
    if (hasCompletedOnboarding || skipOnboarding) {
      return;
    }

    // Check if this is first visit
    const isFirstVisit = !localStorage.getItem('has_visited');
    
    if (isFirstVisit && steps.length > 0) {
      setIsVisible(true);
      localStorage.setItem('has_visited', 'true');
    }
  }, [steps.length, skipOnboarding]);

  useEffect(() => {
    if (!isVisible || currentStep >= steps.length) return;

    const step = steps[currentStep];
    if (!step) return;

    // Find target element
    const targetElement = document.querySelector(step.target);
    
    if (targetElement) {
      // Highlight target element
      highlightElement(targetElement);
    }

    // Cleanup on unmount
    return () => {
      removeHighlight();
    };
  }, [currentStep, isVisible, steps]);

  const highlightElement = (element) => {
    removeHighlight();
    
    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    // Create highlight overlay
    const highlight = document.createElement('div');
    highlight.className = 'onboarding-highlight';
    highlight.style.cssText = `
      position: absolute;
      top: ${rect.top + scrollY}px;
      left: ${rect.left + scrollX}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 3px solid #ef4444;
      border-radius: 8px;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
      z-index: 9998;
      pointer-events: none;
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(highlight);
    highlightRef.current = highlight;

    // Scroll to element
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const removeHighlight = () => {
    if (highlightRef.current) {
      highlightRef.current.remove();
      highlightRef.current = null;
    }
  };

  const handleNext = () => {
    const step = steps[currentStep];
    if (step?.onNext) {
      step.onNext();
    }

    setCompletedSteps(prev => new Set([...prev, currentStep]));
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    removeHighlight();
    localStorage.setItem('onboarding_completed', 'true');
    if (onComplete) {
      onComplete();
    }
  };

  if (!isVisible || currentStep >= steps.length) {
    return null;
  }

  const step = steps[currentStep];
  if (!step) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-[9997]"
        onClick={handleSkip}
        aria-label="Skip onboarding"
      />
      
      {/* Tooltip */}
      <div
        className="fixed z-[9999] bg-white rounded-lg shadow-2xl p-6 max-w-sm"
        style={{
          top: step.position?.top || '50%',
          left: step.position?.left || '50%',
          transform: 'translate(-50%, -50%)',
        }}
        role="dialog"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 id="onboarding-title" className="text-lg font-bold text-gray-900 mb-2">
              {step.title}
            </h3>
            <p id="onboarding-description" className="text-sm text-gray-600">
              {step.description}
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Skip onboarding"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 text-sm font-medium text-white bg-[#F24E2E] rounded-md hover:bg-red-700"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

