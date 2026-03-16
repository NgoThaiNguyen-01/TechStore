import React from "react";

export default function Pagination({
    page,
    limit,
    total,
    totalPages,
    onPageChange,
    showingText = "Showing",
    toText = "to",
    ofText = "of",
    resultsText = "results",
    prevText = "Previous",
    nextText = "Next",
}) {
    return (
        <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
                {showingText}{" "}
                <span className="font-bold text-slate-900">
                    {Math.min((page - 1) * limit + 1, total)}
                </span>{" "}
                {toText}{" "}
                <span className="font-bold text-slate-900">
                    {Math.min(page * limit, total)}
                </span>{" "}
                {ofText}{" "}
                <span className="font-bold text-slate-900">{total}</span>{" "}
                {resultsText}
            </p>
            <div className="flex items-center gap-2">
                <button
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                    className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                    {prevText}
                </button>
                <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`w-9 h-9 text-sm font-semibold rounded-lg transition-colors ${p === page
                                    ? "bg-primary text-white"
                                    : "border border-slate-200 hover:bg-slate-50 text-slate-700"
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
                <button
                    disabled={page === totalPages || totalPages === 0}
                    onClick={() => onPageChange(page + 1)}
                    className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                    {nextText}
                </button>
            </div>
        </div>
    );
}
