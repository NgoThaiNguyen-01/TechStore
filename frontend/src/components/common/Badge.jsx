import React from "react";

const STYLES = {
    active: "bg-green-100 text-green-700",
    hidden: "bg-yellow-100 text-yellow-700",
    draft: "bg-slate-100 text-slate-600",
    archived: "bg-red-100 text-red-700",
};

const DOTS = {
    active: "bg-green-500",
    hidden: "bg-yellow-500",
    draft: "bg-slate-400",
    archived: "bg-red-500",
};

export default function Badge({ status, label }) {
    const s = status ? status.toLowerCase() : "draft";
    const bgClass = STYLES[s] || STYLES.draft;
    const dotClass = DOTS[s] || DOTS.draft;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${bgClass}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            {label || status}
        </span>
    );
}
