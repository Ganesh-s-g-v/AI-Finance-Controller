import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

interface ProcessingCardProps {
  onComplete: () => void;
}

const steps = [
  'Reading invoice records',
  'Validating settlements',
  'Checking bank deposits',
  'Matching transactions',
  'Detecting anomalies',
  'Preparing audit report',
];

export const ProcessingCard: React.FC<ProcessingCardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 600); // 600ms per step for visual effect
      return () => clearTimeout(timer);
    } else {
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(finishTimer);
    }
  }, [currentStep, onComplete]);

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-surface border border-border rounded-2xl p-8 shadow-card-light dark:shadow-card-dark">
        <h3 className="text-xl font-semibold tracking-tight text-foreground-primary mb-6">Processing Records</h3>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;

            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: isPending ? 0.4 : 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="w-5 h-5 rounded-full bg-success flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-accent animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-border" />
                  )}
                </div>
                <span className={`text-sm font-medium ${isCurrent ? 'text-foreground-primary' : 'text-foreground-secondary'}`}>
                  {step}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
