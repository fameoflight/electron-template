import { classNames } from "@ui/Components/utils"

interface StatItem {
  name: string
  value: string
  unit?: string
}

interface StatsGridProps {
  stats: StatItem[]
  className?: string
}


function StatsGrid({ stats, className = "" }: StatsGridProps) {
  return (
    <div className={`grid grid-cols-1 bg-gray-50 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {stats.map((stat, statIdx) => (
        <div
          key={stat.name}
          className={classNames(
            statIdx % 2 === 1 ? 'sm:border-l' : statIdx === 2 ? 'lg:border-l' : '',
            'border-t border-gray-200/50 px-4 py-6 sm:px-6 lg:px-8',
          )}
        >
          <p className="text-sm/6 font-medium text-gray-500">{stat.name}</p>
          <p className="mt-2 flex items-baseline gap-x-2">
            <span className="text-4xl font-semibold tracking-tight text-gray-900">{stat.value}</span>
            {stat.unit ? <span className="text-sm text-gray-500">{stat.unit}</span> : null}
          </p>
        </div>
      ))}
    </div>
  )
}

export default StatsGrid