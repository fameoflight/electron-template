import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react';
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import { motion } from '@ui/Components/Motion';
import { useAuth } from '@ui/contexts/AuthRelayProvider';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Chats', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Documents', href: '/documents/list', icon: DocumentTextIcon },
  { name: 'Settings', href: '/settings/connections', icon: Cog6ToothIcon },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

function SidebarContent() {
  const { user } = useAuth();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-[border-light]">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-primary tracking-tight">
            Codeblocks
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item, index) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-[var(--duration-fast)] ${
                isActive
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-secondary hover:text-primary hover:bg-background-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <motion.div
                className="flex items-center gap-3 w-full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    className="absolute left-0 w-0.5 h-6 bg-primary-600 rounded-r-full"
                    layoutId="activeIndicator"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <item.icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-primary-600' : 'text-tertiary group-hover:text-primary'
                  }`}
                />
                <span>{item.name}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-[border-light] p-4">
        <NavLink
          to="/update"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background-secondary transition-all duration-[var(--duration-fast)] group"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-medium text-sm">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-tertiary truncate">
              @{user?.username || 'user'}
            </p>
          </div>
          <Cog6ToothIcon className="w-4 h-4 text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
        </NavLink>
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile sidebar */}
      <Dialog open={isOpen} onClose={() => onToggle(false)} className="relative z-50 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-[var(--ease-smooth)] data-closed:opacity-0"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-[var(--ease-smooth)] data-closed:-translate-x-full"
          >
            <TransitionChild>
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5 transition-opacity duration-300 ease-[var(--ease-smooth)] data-closed:opacity-0">
                <button
                  type="button"
                  onClick={() => onToggle(false)}
                  className="-m-2.5 p-2.5 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </TransitionChild>

            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-surface shadow-xl">
              <SidebarContent />
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto bg-surface border-r border-[border-light]">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => onToggle(true)}
          className="inline-flex items-center justify-center p-2 rounded-lg text-secondary hover:text-primary hover:bg-background-secondary transition-all duration-[var(--duration-fast)]"
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
