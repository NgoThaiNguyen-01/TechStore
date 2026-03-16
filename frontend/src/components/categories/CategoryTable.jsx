import React from "react";
import Badge from "../common/Badge";

export default function CategoryTable({
    categories,
    selected,
    onToggleSelect,
    onToggleAll,
    onEdit,
    onView,
    onDelete,
    onViewSubcategories,
    canEdit = true,
    canDelete = true,
    t,
}) {
    const selectedSet = new Set(selected);
    const isAllSelected = categories.length > 0 && categories.every((cat) => selectedSet.has(cat._id));

    const statusLabel = (s) =>
        ({ active: t.statusActive, hidden: t.statusHidden, draft: t.statusDraft, archived: t.statusArchived }[s] || s);

    if (categories.length === 0) {
        return (
            <div className="py-16 text-center text-slate-400 border-t border-slate-100">
                <span className="material-symbols-outlined text-4xl block mb-2">inbox</span>
                {t.notFound || "No categories found"}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto w-full">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-4 py-3 w-10">
                            <input
                                type="checkbox"
                                className="rounded border-slate-300"
                                checked={isAllSelected}
                                onChange={onToggleAll}
                            />
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {t.colName}
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {t.colSlug}
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                            {t.colParent}
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                            {t.colProducts}
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                            {t.colStatus}
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                            {t.colActions}
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {categories.map((cat) => (
                        <tr
                            key={cat._id}
                            className={`hover:bg-slate-50 transition-colors group ${selected.includes(cat._id) ? "bg-primary/5" : ""
                                }`}
                        >
                            <td className="px-4 py-4">
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 accent-primary"
                                    checked={selected.includes(cat._id)}
                                    onChange={() => onToggleSelect(cat._id)}
                                />
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100 text-slate-600">
                                        <span className="material-symbols-outlined text-[20px]">
                                            {cat.icon || "folder"}
                                        </span>
                                    </div>
                                    <div className="max-w-[150px] lg:max-w-xs">
                                        <p
                                            onClick={() => cat._id && onViewSubcategories(cat._id)}
                                            className="text-sm font-semibold text-primary hover:underline cursor-pointer truncate"
                                            title={cat.name.length > 20 ? cat.name : t.viewSubcategories}
                                        >
                                            {cat.name}
                                        </p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-4 text-xs text-slate-500 font-mono">
                                /{cat.slug}
                            </td>
                            <td className="px-4 py-4 text-center">
                                {cat.parent ? (
                                    <span
                                        onClick={() => cat.parent?._id && onViewSubcategories(cat.parent._id)}
                                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer text-xs font-semibold rounded-full truncate max-w-[120px] inline-block transition-colors"
                                        title={t.viewSiblings}
                                    >
                                        {cat.parent.name}
                                    </span>
                                ) : (
                                    <span className="text-slate-400 text-lg font-semibold inline-block w-full text-center">-</span>
                                )}
                            </td>
                            <td className="px-4 py-4 text-sm font-semibold text-slate-900 text-center">
                                {cat.productCount}
                            </td>
                            <td className="px-4 py-4 text-center">
                                <Badge status={cat.status} label={statusLabel(cat.status)} />
                            </td>
                            <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <button
                                        onClick={() => onView(cat)}
                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                        title={t.viewDetail}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            visibility
                                        </span>
                                    </button>
                                    {canEdit ? (
                                        <button
                                            onClick={() => onEdit(cat)}
                                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                            title={t.editAction}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                                edit
                                            </span>
                                        </button>
                                    ) : null}
                                    {canDelete ? (
                                        <div title={
                                            cat.canDelete === false && cat.deleteBlockReason
                                                ? t[`blockReason_${cat.deleteBlockReason}`]
                                                : t.deleteAction
                                        }>
                                            <button
                                                onClick={() => cat.canDelete !== false && onDelete(cat)}
                                                disabled={cat.canDelete === false}
                                                className={`p-1.5 rounded-lg transition-colors ${cat.canDelete === false
                                                        ? 'text-slate-300 cursor-not-allowed'
                                                        : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">
                                                    delete
                                                </span>
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
