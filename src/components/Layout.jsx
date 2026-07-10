import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Footer } from './Footer';

/**
 * Layout component with global header, progress bar, and footer
 */
export const Layout = ({ children }) => {
  const { state, setStep, toggleDarkMode } = useApp();
  const [isStacked, setIsStacked] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [prevStepIndex, setPrevStepIndex] = useState(-1);
  const [animationDirection, setAnimationDirection] = useState('forward'); // 'forward' or 'backward'

  // Duration in seconds for a single segment animation
  const TRANSITION_DURATION = 1.0;
  // Overlap to make step circle light up right as the line finish is reached
  const OVERLAP = 0.15;

  const steps = [
    { id: 'parameters', label: 'Parameters', number: 1 },
    { id: 'input', label: 'Input', number: 2 },
    { id: 'output', label: 'Output', number: 3 },
  ];

  const currentStepIndex =
    state.currentStep === 'home' ? -1 : steps.findIndex((step) => step.id === state.currentStep);

  // Detect direction and trigger animation when step changes
  useEffect(() => {
    if (currentStepIndex !== prevStepIndex) {
      const effPrev = prevStepIndex === -1 ? 0 : prevStepIndex;
      const effCurr = currentStepIndex === -1 ? 0 : currentStepIndex;

      if (effPrev !== effCurr) {
        const direction = currentStepIndex > prevStepIndex ? 'forward' : 'backward';
        setAnimationDirection(direction);

        const stepsDiff = Math.abs(effCurr - effPrev);
        const totalDurationMs = stepsDiff * TRANSITION_DURATION * 1000;

        const timer = setTimeout(() => {
          setPrevStepIndex(currentStepIndex);
        }, totalDurationMs);

        return () => clearTimeout(timer);
      } else {
        setPrevStepIndex(currentStepIndex);
      }
    }
  }, [currentStepIndex, prevStepIndex]);

  // Monitor header width to determine layout
  useEffect(() => {
    const headerElement = document.getElementById('main-header-content');

    const handleResize = () => {
      if (headerElement) {
        const width = headerElement.offsetWidth;
        setContainerWidth(width);

        // Stack when there's not enough space for horizontal layout
        // Title + gap + progress bar + gap + toggle needs comfortable spacing
        // Using 800px threshold to allow stacking before overcrowding
        setIsStacked(width < 800);
      }
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    if (headerElement) {
      resizeObserver.observe(headerElement);
      handleResize(); // Initial check
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  const handleStepClick = (stepId) => {
    setStep(stepId);
  };

  const handleHomeClick = () => {
    setStep('home');
  };

  /**
   * Helper to calculate transition styles for a step circle
   */
  const getCircleTransitionStyle = (index) => {
    const effPrev = prevStepIndex === -1 ? 0 : prevStepIndex;
    const effCurr = currentStepIndex === -1 ? 0 : currentStepIndex;

    if (prevStepIndex === -1 && currentStepIndex === -1) {
      return {
        transition: 'background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1), color 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      };
    }

    if (effPrev === effCurr) {
      return {
        transition: 'background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1), color 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      };
    }

    const isForward = currentStepIndex > prevStepIndex;
    let delay = 0;

    if (isForward) {
      const wasActiveOrPassed = prevStepIndex !== -1 && index <= prevStepIndex;
      const isActiveOrPassed = currentStepIndex !== -1 && index <= currentStepIndex;

      if (isActiveOrPassed && !wasActiveOrPassed) {
        delay = Math.max(0, (index - effPrev) * TRANSITION_DURATION - OVERLAP);
      }
    } else {
      const wasActiveOrPassed = prevStepIndex !== -1 && index <= prevStepIndex;
      const isActiveOrPassed = currentStepIndex !== -1 && index <= currentStepIndex;

      if (!isActiveOrPassed && wasActiveOrPassed) {
        delay = Math.max(0, (effPrev - index) * TRANSITION_DURATION - OVERLAP);
      }
    }

    return {
      transition: 'background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1), color 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDelay: `${delay}s`,
    };
  };

  /**
   * Helper to calculate transition styles for a step label
   */
  const getLabelTransitionStyle = (index) => {
    const effPrev = prevStepIndex === -1 ? 0 : prevStepIndex;
    const effCurr = currentStepIndex === -1 ? 0 : currentStepIndex;

    if (prevStepIndex === -1 && currentStepIndex === -1) {
      return {
        transition: 'color 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      };
    }

    if (effPrev === effCurr) {
      return {
        transition: 'color 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      };
    }

    let delay = 0;
    if (index === currentStepIndex) {
      delay = Math.max(0, Math.abs(effCurr - effPrev) * TRANSITION_DURATION - OVERLAP);
    } else if (index === prevStepIndex) {
      delay = 0;
    }

    return {
      transition: 'color 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDelay: `${delay}s`,
    };
  };

  /**
   * Helper to calculate transition styles for a connecting line fill
   */
  const getLineTransitionStyle = (index) => {
    const effPrev = prevStepIndex === -1 ? 0 : prevStepIndex;
    const effCurr = currentStepIndex === -1 ? 0 : currentStepIndex;

    if (prevStepIndex === -1 && currentStepIndex === -1) {
      return {
        transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      };
    }

    if (effPrev === effCurr) {
      return {
        transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      };
    }

    const isForward = currentStepIndex > prevStepIndex;
    let delay = 0;

    if (isForward) {
      const wasPassed = prevStepIndex !== -1 && index < prevStepIndex;
      const isPassed = currentStepIndex !== -1 && index < currentStepIndex;

      if (isPassed && !wasPassed) {
        delay = (index - effPrev) * TRANSITION_DURATION;
      }
    } else {
      const wasPassed = prevStepIndex !== -1 && index < prevStepIndex;
      const isPassed = currentStepIndex !== -1 && index < currentStepIndex;

      if (!isPassed && wasPassed) {
        delay = (effPrev - index - 1) * TRANSITION_DURATION;
      }
    }

    return {
      transition: `width ${TRANSITION_DURATION}s ease-in-out`,
      transitionDelay: `${delay}s`,
    };
  };

  /**
   * Render the progress bar with numbered steps and labels
   * All elements scale proportionally together
   * In stacked mode: takes full width
   * In horizontal mode: constrained width to prevent overstretch
   * Includes animated fill effect when transitioning between pages
   */
  const renderProgressBar = (isStackedLayout = false) => {
    return (
      <div className={`flex items-stretch justify-center gap-0 flex-1 relative ${!isStackedLayout ? 'max-w-2xl' : 'w-full'}`}>
        {steps.map((step, index) => {
          const isActive = step.id === state.currentStep;
          const isPassed = currentStepIndex !== -1 && index < currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step Column - Circle and Label */}
              <div className="flex flex-col items-center justify-start flex-1 gap-2">
                {/* Step Circle */}
                <button
                  onClick={() => handleStepClick(step.id)}
                  className={`w-8 h-8 rounded-full font-semibold text-xs flex items-center justify-center flex-shrink-0 cursor-pointer ${isActive || isPassed
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500'
                    }`}
                  style={getCircleTransitionStyle(index)}
                  title={step.label}
                >
                  {step.number}
                </button>

                {/* Step Label - Centered below circle */}
                <span
                  className={`text-xs font-medium text-center whitespace-nowrap ${isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400'
                    }`}
                  style={getLabelTransitionStyle(index)}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting Line - Fills gap between circles */}
              {index < steps.length - 1 && (
                <div className="flex items-center justify-center flex-1 gap-0 min-w-0">
                  <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-600 flex-1 relative overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-blue-600"
                      style={{
                        width: isPassed ? '100%' : '0%',
                        ...getLineTransitionStyle(index),
                      }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className={state.isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col">
        {/* Header */}
        <header className="border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-slate-800">
          <div id="main-header-content" className="max-w-6xl mx-auto px-6 py-4">
            {isStacked ? (
              // Stacked Layout - when space is tight
              <div className="space-y-4 flex flex-col items-center">
                <div className="flex items-center justify-between gap-4 w-full">
                  <button
                    onClick={handleHomeClick}
                    className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2.5 min-w-0"
                  >
                    <img src={`${import.meta.env.BASE_URL}cysteine.svg`} alt="Cysteine logo" className="w-8 h-8 object-contain flex-shrink-0" />
                    <span className="leading-tight text-left">Cysteine Detectability Predictor</span>
                  </button>

                  {/* Theme Toggle */}
                  <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                    aria-label="Toggle dark mode"
                  >
                    {state.isDarkMode ? (
                      <Sun className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <Moon className="w-5 h-5 text-slate-700" />
                    )}
                  </button>
                </div>

                {/* Progress Bar - Below Title */}
                {renderProgressBar(true)}
              </div>
            ) : (
              // Horizontal Layout - when there's plenty of space
              <div className="flex items-center justify-between gap-6">
                {/* Title - Left */}
                <button
                  onClick={handleHomeClick}
                  className="text-2xl font-bold text-slate-900 dark:text-slate-50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0 flex items-center gap-2.5"
                >
                  <img src={`${import.meta.env.BASE_URL}cysteine.svg`} alt="Cysteine logo" className="w-8 h-8 object-contain" />
                  Cysteine Detectability Predictor
                </button>

                {/* Progress Bar - Center (Scales with available space) */}
                {renderProgressBar(false)}

                {/* Theme Toggle - Right */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                  aria-label="Toggle dark mode"
                >
                  {state.isDarkMode ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-slate-700" />
                  )}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-6 py-6 md:py-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};
