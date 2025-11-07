'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Individuals', href: '/' },
    { name: 'Instructors', href: '/instructors' },
  ]

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
        {/* Logo */}
        <div className="flex lg:flex-1 items-center space-x-2">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center space-x-2">
            <div className="h-9 w-9 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-base">P</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">
              Plotmix
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} className="text-sm font-semibold text-gray-900 hover:text-indigo-600">
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <Link href="/login" className="text-sm font-semibold text-gray-900 hover:text-indigo-600">
            Sign in <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {/* Mobile button */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-sm bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center space-x-2">
              <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-base">P</span>
              </div>
              <span className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Plotmix
              </span>
            </Link>
            <button onClick={() => setMobileMenuOpen(false)} className="-m-2.5 p-2.5 text-gray-700 rounded-md">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-6 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-base font-semibold text-gray-900 hover:bg-gray-50"
              >
                {item.name}
              </Link>
            ))}
            <Link href="/login" className="block rounded-lg px-3 py-2 text-base font-semibold text-gray-900 hover:bg-gray-50">
              Sign in
            </Link>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  )
}

