"use client";

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, UsersRound, LogOut, User, Settings, ChevronDown, Menu } from 'lucide-react';

export default function Header({ user }: { user: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // The Navigation Object
    const navLinks = [
        { name: 'Jobs', href: '/jobs' },
        { name: 'Customers', href: '/customers' },
        { name: 'Bins', href: '/bins' },
        { name: 'Inventory', href: '/inventory' },
        { name: 'Driver Jobs', href: '/driver-jobs' },
        { name: 'Color Schemes', href: '/color-schemes' },
    ];

    const handleLogout = async () => {
        try {
            const response = await fetch("/api/auth/logout", { method: 'POST' });
            if (response.ok) {
                setIsOpen(false);
                router.push("/");
            }
        } catch (error) {
            console.error("Error logging out", error);
        }
    };

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo Section */}
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="bg-green-600 rounded-lg p-1.5">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
                                <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
                                <circle cx="7" cy="18" r="2" />
                                <circle cx="17" cy="18" r="2" />
                            </svg>
                        </div>
                        <span className="font-bold text-gray-900 text-lg tracking-tight">RML Transport</span>
                    </Link>

                    {/* Main Navigation */}
                    <nav className="hidden md:block">
                        <ul className='flex gap-1'>
                            {navLinks.map((link) => {
                                const isActive = pathname.startsWith(link.href);
                                return (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className={`
                                                relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                                                ${isActive
                                                    ? 'text-green-700 bg-green-50'
                                                    : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3">
                    <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-full transition-colors relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>

                    <div className="h-6 w-px bg-gray-200 mx-1"></div>

                    {/* User Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                        >
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-medium text-gray-700 leading-none">{user?.name || 'User'}</p>
                                <p className="text-xs text-gray-500 leading-none mt-1">{user?.role || 'Staff'}</p>
                            </div>
                            <ChevronDown size={16} className="text-gray-400" />
                        </button>

                        {isOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-20 border border-gray-100 ring-1 ring-black/5">
                                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>

                                    <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-700">
                                        <User className="mr-3 h-4 w-4" /> Profile
                                    </Link>
                                    <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-700">
                                        <Settings className="mr-3 h-4 w-4" /> Settings
                                    </Link>
                                    <Link href="/users" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-700">
                                        <UsersRound className="mr-3 h-4 w-4" /> Manage Users
                                    </Link>

                                    <div className="my-1 border-t border-gray-100"></div>

                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <LogOut className="mr-3 h-4 w-4" /> Sign out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}