import React from 'react';

interface ITailwindListItemProps {
  link: string;
  title: string;
  description: string;
  extras?: React.ReactNode;
}

function TailwindListItem(props: ITailwindListItemProps) {
  return (
    <div className="relative bg-white py-5 px-4 focus-within:ring-2 focus-within:ring-inset focus-within:ring-picasso-primary-800 hover:bg-gray-50">
      <div className="flex justify-between space-x-3">
        <div className="min-w-0 flex-1">
          <a href={props.link} className="block focus:outline-none">
            <span className="absolute inset-0" aria-hidden="true" />
            <p className="truncate text-sm font-medium text-gray-900">
              {props.title}
            </p>
          </a>
        </div>

        {props.extras && <div className="mt-2">{props.extras}</div>}
      </div>
      <div className="mt-1">
        <p className="text-sm text-gray-600 line-clamp-2">
          {props.description}
        </p>
      </div>
    </div>
  );
}

interface ITailwindListProps {
  children?: any;
  items: ITailwindListItemProps[];
}

function TailwindList(props: ITailwindListProps) {
  return (
    <div role="list" className="divide-y divide-gray-200">
      {props.items.map((item, idx) => (
        <TailwindListItem key={idx} {...item} />
      ))}
    </div>
  );
}

export default TailwindList;
