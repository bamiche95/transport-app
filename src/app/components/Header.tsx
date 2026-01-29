"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Use Next.js Link for better performance
import { Bell, UsersRound, LogOut, User, Settings } from 'lucide-react';

export default function Header({ user }: { user: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    // The Navigation Object
    const navLinks = [
        { name: 'Jobs', href: '/jobs' },
        { name: 'Customers', href: '/customers' },
        { name: 'Bins', href: '/bins' },
        { name: 'Inventory', href: '/inventory' },
        { name: 'Driver Jobs', href: '/driver-jobs' },
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
        <header className="bg-green-400 py-4 px-6 w-full relative">
            <div className="container mx-auto flex items-center justify-between">
                <h1 className="font-bold text-lg">RML Transport Solutions LTD</h1>
                
                {/* Main Navigation */}
                <nav>
                    <ul className='flex gap-2'>
                        {navLinks.map((link) => (
                            <li key={link.name}>
                                <Link 
                                    href={link.href}
                                    className="hover:bg-green-500 py-2 px-4 rounded transition-colors font-medium text-sm"
                                >
                                    {link.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="flex gap-4 items-center">
                    {/* User Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-1 hover:bg-green-500 rounded-full transition-colors flex items-center gap-2"
                        >
                            <UsersRound />
                            {/* Optional: Show user name if available */}
                            {user?.name && <span className="text-sm font-medium">{user.name}</span>}
                        </button>

                        {isOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                                    <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <User className="mr-2 h-4 w-4" /> Profile
                                    </Link>
                                    <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <Settings className="mr-2 h-4 w-4" /> Settings
                                    </Link>
                                    <Link href="/users" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <UsersRound className="mr-2 h-4 w-4" /> Manage Users
                                    </Link>
                                    <hr className="my-1" />
                                    <button 
                                        onClick={handleLogout}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" /> Sign out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <button className="p-1 hover:bg-green-500 rounded-full transition-colors">
                        <Bell />
                    </button>
                </div>
            </div>
        </header>
    );
}