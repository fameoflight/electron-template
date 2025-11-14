import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'

interface SecondaryNavigation {
  name: string
  href: string
  current: boolean
}

interface ProjectInfo {
  name: string
  subproject?: string
  description?: string
  status?: {
    text: string
    bgColor: string
    textColor: string
    ringColor: string
  }
  isActive?: boolean
}

interface HeaderProps {
  secondaryNavigation: SecondaryNavigation[]
  projectInfo: ProjectInfo
  searchPlaceholder?: string
  onSearch?: (query: string) => void
}


function Header({
  secondaryNavigation,
  projectInfo,
  searchPlaceholder = "Search",
  onSearch
}: HeaderProps) {
  return (
    <>
      {/* Sticky search header */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-6 border-b border-gray-200 bg-white px-4 shadow-xs sm:px-6 lg:px-8">
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <form action="#" method="GET" className="grid flex-1 grid-cols-1" onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const query = formData.get('search') as string
            if (onSearch) onSearch(query)
          }}>
            <input
              name="search"
              placeholder={searchPlaceholder}
              aria-label="Search"
              className="col-start-1 row-start-1 block size-full bg-transparent pl-8 text-base text-gray-900 outline-hidden placeholder:text-gray-400 sm:text-sm/6"
            />
            <MagnifyingGlassIcon
              aria-hidden="true"
              className="pointer-events-none col-start-1 row-start-1 size-5 self-center text-gray-400"
            />
          </form>
        </div>
      </div>

      <header>
        {/* Secondary navigation */}
        <nav className="flex overflow-x-auto border-b border-gray-200 py-4">
          <ul
            role="list"
            className="flex min-w-full flex-none gap-x-6 px-4 text-sm/6 font-semibold text-gray-500 sm:px-6 lg:px-8"
          >
            {secondaryNavigation.map((item) => (
              <li key={item.name}>
                <a href={item.href} className={item.current ? 'text-indigo-600' : ''}>
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Project heading */}
        <div className="flex flex-col items-start justify-between gap-x-8 gap-y-4 bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-x-3">
              {projectInfo.isActive && (
                <div className="flex-none rounded-full bg-green-500/10 p-1 text-green-500">
                  <div className="size-2 rounded-full bg-current" />
                </div>
              )}
              <h1 className="flex gap-x-3 text-base/7">
                <span className="font-semibold text-gray-900">{projectInfo.name}</span>
                {projectInfo.subproject && (
                  <>
                    <span className="text-gray-400">/</span>
                    <span className="font-semibold text-gray-900">{projectInfo.subproject}</span>
                  </>
                )}
              </h1>
            </div>
            {projectInfo.description && (
              <p className="mt-2 text-xs/6 text-gray-500">{projectInfo.description}</p>
            )}
          </div>
          {projectInfo.status && (
            <div className={`order-first flex-none rounded-full ${projectInfo.status.bgColor} px-2 py-1 text-xs font-medium ${projectInfo.status.textColor} ring-1 ${projectInfo.status.ringColor} ring-inset sm:order-0`}>
              {projectInfo.status.text}
            </div>
          )}
        </div>
      </header>
    </>
  )
}

export default Header