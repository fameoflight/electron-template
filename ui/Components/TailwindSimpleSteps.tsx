import React from 'react';

import { CheckIcon } from '@heroicons/react/24/solid';

import motion from './Motion';

export interface ITailwindSimpleStep {
  name: string;
  id: number;
  status: 'complete' | 'current' | 'upcoming';
  onClick?: () => void;
}

function TailwindStep(props: ITailwindSimpleStep) {
  const icon =
    props.status === 'complete' ? (
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-picasso-primary-800 group-hover:bg-picasso-primary-800">
        <CheckIcon className="h-6 w-6 text-white" aria-hidden="true" />
      </span>
    ) : props.status === 'current' ? (
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-picasso-primary-800">
        <span className="text-picasso-primary-800">{props.id}</span>
      </span>
    ) : (
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
        <span className="text-gray-500 group-hover:text-gray-900">
          {props.id}
        </span>
      </span>
    );

  return (
    <div className="group flex w-full items-center" onClick={props.onClick}>
      <span className="flex items-center px-6 py-4 text-sm font-medium">
        {icon}
        <span className="ml-4 text-sm font-medium text-gray-900">
          {props.name}
        </span>
      </span>
    </div>
  );
}

interface ITailwindSimpleStepsProps {
  steps: ITailwindSimpleStep[];
  children: React.ReactNode;
  onStepClick?: (step: ITailwindSimpleStep) => void;
}

function TailwindSimpleSteps(props: ITailwindSimpleStepsProps) {
  const current = props.steps.find((s) => s.status === 'current');
  return (
    <>
      <div className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0">
        {props.steps.map((step, stepIdx) => (
          <div key={step.name} className="relative md:flex md:flex-1">
            <TailwindStep {...step} onClick={() => props.onStepClick?.(step)} />

            {stepIdx !== props.steps.length - 1 ? (
              <>
                {/* Arrow separator for lg screens and up */}
                <div
                  className="absolute top-0 right-0 hidden h-full w-5 md:block"
                  aria-hidden="true"
                >
                  <svg
                    className="h-full w-full text-gray-300"
                    viewBox="0 0 22 80"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 -2L20 40L0 82"
                      vectorEffect="non-scaling-stroke"
                      stroke="currentcolor"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-8 px-4">
        <motion.shift motionKey={current?.id} values={{ x: 0, y: 10 }}>
          {props.children}
        </motion.shift>
      </div>
    </>
  );
}

export default TailwindSimpleSteps;
