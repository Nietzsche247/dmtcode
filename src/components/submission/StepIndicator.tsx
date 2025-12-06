import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  name: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export const StepIndicator = ({ steps, currentStep }: StepIndicatorProps) => {
  return (
    <nav aria-label="Submission progress" className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <li key={step.id} className="flex-1 relative">
              <div className="flex flex-col items-center">
                {/* Step circle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isCompleted 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : isCurrent 
                        ? "border-primary text-primary bg-primary/10" 
                        : "border-muted-foreground/30 text-muted-foreground"
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                
                {/* Step label */}
                <div className="mt-2 text-center">
                  <p className={cn(
                    "text-sm font-medium transition-colors",
                    isCurrent || isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.name}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    "absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 transition-colors duration-300",
                    currentStep > step.id + 1 || (currentStep > step.id) 
                      ? "bg-primary" 
                      : "bg-muted-foreground/30"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};