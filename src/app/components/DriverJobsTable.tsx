"use client";

import React, { useState } from "react";

interface Job {
    job_id: number;
    company_name: string;
    job_status_name: string;
    priority: number;
    driver_id: number | null;
    driver_name: string | null;
    customer_name: string | null;
}

interface DriverJobs {
    driverId: number | null;
    driverName: string;
    jobs: Job[];
}

interface DriverJobsTableProps {
    data: DriverJobs[];
}

const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "bg-amber-50", text: "text-amber-700" },
    completed: { bg: "bg-emerald-50", text: "text-emerald-700" },
    in_progress: { bg: "bg-blue-50", text: "text-blue-700" },
    cancelled: { bg: "bg-slate-50", text: "text-slate-700" },
};

const getPriorityColor = (priority: number): string => {
    if (priority >= 8) return "text-red-600";
    if (priority >= 5) return "text-orange-600";
    return "text-yellow-600";
};

const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase().replace(/\s+/g, "_");
    return statusColors[normalized] || statusColors.pending;
};

export default function DriverJobsTable({ data }: DriverJobsTableProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Filter drivers based on search query
    const filteredData = data.filter((driver) =>
        driver.driverName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const maxJobs = Math.max(...filteredData.map((d) => d.jobs.length), 0);

    if (!filteredData.length) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-white">
                <div className="text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-2xl font-light text-slate-600">
                        {searchQuery ? `No drivers found matching "${searchQuery}"` : "No jobs found"}
                    </h3>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-4xl font-light text-slate-900 mb-2">
                            Driver Jobs
                        </h1>
                        <p className="text-slate-500 text-sm">
                            {filteredData.length} of {data.length} drivers • {filteredData.reduce((acc, d) => acc + d.jobs.length, 0)} jobs total
                        </p>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg
                                className="h-5 w-5 text-slate-400"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search drivers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-10 py-2.5 w-80 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <table className="w-full">
                    {/* Header */}
                    <thead>
                        <tr className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                Driver
                            </th>
                            {Array.from({ length: maxJobs }).map((_, i) => (
                                <th
                                    key={i}
                                    className="px-6 py-4 text-left text-sm font-semibold text-slate-200"
                                >
                                    <span className="text-xs uppercase tracking-wide opacity-75">
                                        Job {i + 1}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* Body */}
                    <tbody className="divide-y divide-slate-200">
                        {filteredData.map((driver, driverIdx) => (
                            <tr
                                key={driver.driverId}
                                className={`transition-colors duration-200 hover:bg-slate-50 ${driverIdx % 2 === 0 ? "bg-white" : "bg-slate-50"
                                    }`}
                            >
                                {/* Driver Cell */}
                                <td className="px-6 py-4 sticky left-0 z-10 bg-inherit  ">
                                    <div className="flex items-center gap-3 ">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                            {driver.driverName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                {driver.driverName}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {driver.jobs.length} job{driver.jobs.length !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                {/* Job Cells */}
                                {Array.from({ length: maxJobs }).map((_, jobIdx) => {
                                    const job = driver.jobs[jobIdx];
                                    const colors = job ? getStatusColor(job.job_status_name) : statusColors.pending;

                                    return (
                                        <td
                                            key={jobIdx}
                                            className="px-6 py-4 text-sm transition-colors duration-200"
                                        >
                                            {job ? (
                                                <div className="space-y-2">
                                                    {/* Customer & Company */}
                                                    <div>
                                                        <p className="font-medium text-slate-900 truncate text-sm">
                                                            {job.customer_name || "—"}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate">
                                                            {job.company_name}
                                                        </p>
                                                    </div>

                                                    {/* Status & Priority */}
                                                    <div className="flex gap-2 flex-wrap">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                                                        >
                                                            {job.job_status_name}
                                                        </span>
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityColor(job.priority)}`}
                                                        >
                                                            Priority: {job.priority}
                                                        </span>
                                                    </div>

                                                    {/* Job ID */}
                                                    <p className="text-xs text-slate-400 font-mono">
                                                        #{job.job_id}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-sm">—</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer Info */}
            <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                <p>Showing {filteredData.length} drivers with up to {maxJobs} jobs each</p>
                <p>Last updated: {new Date().toLocaleString()}</p>
            </div>
        </div>
    );
}