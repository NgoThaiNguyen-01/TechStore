import React from "react";

export default function SkeletonTable({ columns = 6, rows = 5 }) {
    return (
        <div className="overflow-x-auto w-full rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="px-4 py-3">
                                <div className="h-4 bg-slate-200 rounded w-full max-w-[120px] animate-pulse"></div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {Array.from({ length: rows }).map((_, i) => (
                        <tr key={i}>
                            {Array.from({ length: columns }).map((_, colIdx) => (
                                <td key={colIdx} className="px-4 py-4">
                                    <div
                                        className={`h-4 bg-slate-100 rounded animate-pulse ${colIdx === 0 ? "w-8" : "w-full"
                                            } max-w-[200px]`}
                                    ></div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
