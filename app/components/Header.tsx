'use client';

import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/">
            <h1 className="text-2xl font-bold text-gray-900">Auth Logs</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <nav className="space-x-4">
              <Link
                href="/applications"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Applications
              </Link>
              <Link
                href="/events"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Events
              </Link>
            </nav>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  );
}
