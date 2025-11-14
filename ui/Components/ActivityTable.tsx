interface UserInfo {
  name: string
  imageUrl: string
}

interface ActivityItem {
  user: UserInfo
  commit: string
  branch: string
  status: 'Completed' | 'Error' | 'Pending' | string
  duration: string
  date: string
  dateTime: string
}

interface ActivityTableProps {
  title?: string
  items: ActivityItem[]
  statusStyles?: Record<string, string>
  className?: string
}

function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

const defaultStatusStyles = {
  Completed: 'text-green-500 bg-green-500/10',
  Error: 'text-rose-500 bg-rose-500/10',
  Pending: 'text-yellow-500 bg-yellow-500/10',
}

function ActivityTable({
  title = "Latest activity",
  items,
  statusStyles = defaultStatusStyles,
  className = ""
}: ActivityTableProps) {
  return (
    <div className={`border-t border-gray-200 pt-11 ${className}`}>
      <h2 className="px-4 text-base/7 font-semibold text-gray-900 sm:px-6 lg:px-8">{title}</h2>
      <table className="mt-6 w-full text-left whitespace-nowrap">
        <colgroup>
          <col className="w-full sm:w-4/12" />
          <col className="lg:w-4/12" />
          <col className="lg:w-2/12" />
          <col className="lg:w-1/12" />
          <col className="lg:w-1/12" />
        </colgroup>
        <thead className="border-b border-gray-200 text-sm/6 text-gray-900">
          <tr>
            <th scope="col" className="py-2 pr-8 pl-4 font-semibold sm:pl-6 lg:pl-8">
              User
            </th>
            <th scope="col" className="hidden py-2 pr-8 pl-0 font-semibold sm:table-cell">
              Commit
            </th>
            <th scope="col" className="py-2 pr-4 pl-0 text-right font-semibold sm:pr-8 sm:text-left lg:pr-20">
              Status
            </th>
            <th scope="col" className="hidden py-2 pr-8 pl-0 font-semibold md:table-cell lg:pr-20">
              Duration
            </th>
            <th
              scope="col"
              className="hidden py-2 pr-4 pl-0 text-right font-semibold sm:table-cell sm:pr-6 lg:pr-8"
            >
              Deployed at
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr key={item.commit}>
              <td className="py-4 pr-8 pl-4 sm:pl-6 lg:pl-8">
                <div className="flex items-center gap-x-4">
                  <img
                    alt=""
                    src={item.user.imageUrl}
                    className="size-8 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5"
                  />
                  <div className="truncate text-sm/6 font-medium text-gray-900">{item.user.name}</div>
                </div>
              </td>
              <td className="hidden py-4 pr-4 pl-0 sm:table-cell sm:pr-8">
                <div className="flex gap-x-3">
                  <div className="font-mono text-sm/6 text-gray-500">{item.commit}</div>
                  <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-300 ring-inset">
                    {item.branch}
                  </span>
                </div>
              </td>
              <td className="py-4 pr-4 pl-0 text-sm/6 sm:pr-8 lg:pr-20">
                <div className="flex items-center justify-end gap-x-2 sm:justify-start">
                  <time dateTime={item.dateTime} className="text-gray-500 sm:hidden">
                    {item.date}
                  </time>
                  <div className={classNames(statusStyles[item.status] || 'text-gray-500 bg-gray-500/10', 'flex-none rounded-full p-1')}>
                    <div className="size-1.5 rounded-full bg-current" />
                  </div>
                  <div className="hidden text-gray-900 sm:block">{item.status}</div>
                </div>
              </td>
              <td className="hidden py-4 pr-8 pl-0 text-sm/6 text-gray-500 md:table-cell lg:pr-20">
                {item.duration}
              </td>
              <td className="hidden py-4 pr-4 pl-0 text-right text-sm/6 text-gray-500 sm:table-cell sm:pr-6 lg:pr-8">
                <time dateTime={item.dateTime}>{item.date}</time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ActivityTable;