"use client";
// components/onboarding/StepIndicator.tsx
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  icon: string;
}

interface StepIndicatorProps {
  steps: Step[];
  current: number; // 0-indexed
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${((current) / (steps.length - 1)) * 100}%` }}
        />
      </div>

      {/* Step dots — desktop */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  done  && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-primary/10 text-primary",
                  !done && !active && "border-border bg-background text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <span>{step.icon}</span>}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile: just show current step label */}
      <div className="flex sm:hidden items-center justify-between text-sm">
        <span className="font-semibold text-primary">
          {steps[current].icon} {steps[current].label}
        </span>
        <span className="text-muted-foreground">
          Step {current + 1} of {steps.length}
        </span>
      </div>
    </div>
  );
}
