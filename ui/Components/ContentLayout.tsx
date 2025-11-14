import React from 'react';

import { classNames } from './utils';

interface IContentLayoutProps {
  title: string;
  subTitle: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

function ContentLayout(props: IContentLayoutProps) {
  const { title, subTitle, children } = props;

  return (
    <div
      className={classNames(
        'relative py-16 bg-white overflow-hidden',
        props.className
      )}
    >
      <div className="hidden lg:block lg:absolute lg:inset-y-0 lg:h-full lg:w-full">
        <div
          className="relative h-full text-lg max-w-prose mx-auto"
          aria-hidden="true"
        >
          <svg
            className="absolute top-1/2 right-full transform -translate-y-1/2 -translate-x-32"
            width={320}
            height={320}
            fill="none"
            viewBox="0 0 320 320"
          >
            <defs>
              <pattern
                id="f210dbf6-a58d-4871-961e-36d5016a0f49"
                x={0}
                y={0}
                width={20}
                height={20}
                patternUnits="userSpaceOnUse"
              >
                <rect
                  x={0}
                  y={0}
                  width={4}
                  height={4}
                  className="text-gray-200"
                  fill="currentColor"
                />
              </pattern>
            </defs>
            <rect
              width={320}
              height={320}
              fill="url(#f210dbf6-a58d-4871-961e-36d5016a0f49)"
            />
          </svg>
          <svg
            className="absolute bottom-12 left-full transform translate-x-32"
            width={320}
            height={320}
            fill="none"
            viewBox="0 0 320 320"
          >
            <defs>
              <pattern
                id="d3eb07ae-5182-43e6-857d-35c643af9034"
                x={0}
                y={0}
                width={20}
                height={20}
                patternUnits="userSpaceOnUse"
              >
                <rect
                  x={0}
                  y={0}
                  width={4}
                  height={4}
                  className="text-gray-200"
                  fill="currentColor"
                />
              </pattern>
            </defs>
            <rect
              width={320}
              height={320}
              fill="url(#d3eb07ae-5182-43e6-857d-35c643af9034)"
            />
          </svg>
        </div>
      </div>
      <div className="relative px-4 sm:px-6 lg:px-8">
        <div className="text-lg max-w-prose mx-auto">
          <h1 className="mt-2 block text-3xl text-center leading-8 font-extrabold tracking-tight text-picasso-primary-900 sm:text-4xl">
            {title}
          </h1>
          <div className="text-picasso-primary-900 font-light text-center mt-4 text-sm">
            {subTitle}
          </div>
        </div>
        <div className="mt-8 prose lg:prose-xl max-w-7xl se-antext-gray-500 mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default ContentLayout;
