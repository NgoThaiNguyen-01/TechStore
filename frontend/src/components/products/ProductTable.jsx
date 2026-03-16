import React from "react";

const fmtPrice = (price) =>
    new Intl.NumberFormat("vi-VN").format(price) + "đ";

const fmtDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN");
};


function StatusBadge({ status, stock, t }) {
    if (status === "archived") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 flex-shrink-0" />
                {t.statusArchived}
            </span>
        );
    }
    if (stock === 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {t.statusOutOfStock}
            </span>
        );
    }
    const map = {
        active: { bg: "bg-green-50 text-green-700", dot: "bg-green-500", label: t.statusActive },
        hidden: { bg: "bg-slate-100 text-slate-600", dot: "bg-slate-400", label: t.statusHidden },
        draft: { bg: "bg-amber-50 text-amber-700", dot: "bg-amber-400", label: t.statusDraft },
        archived: { bg: "bg-slate-200 text-slate-700", dot: "bg-slate-500", label: t.statusArchived },
        out_of_stock: { bg: "bg-red-50 text-red-600", dot: "bg-red-500", label: t.statusOutOfStock },
    };
    const s = map[status] || map.draft;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot} flex-shrink-0`} />
            {s.label}
        </span>
    );
}

export default function ProductTable({
    products,
    selected,
    onToggleSelect,
    onToggleAll,
    onView,
    onEdit,
    onDelete,
    canEdit = true,
    canDelete = true,
    t,
}) {
    const selectedSet = new Set(selected);
    const allSelected = products.length > 0 && products.every((p) => selectedSet.has(p._id));
    const someSelected = products.some((p) => selectedSet.has(p._id)) && !allSelected;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                        <th className="px-5 py-3 w-10">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                onChange={onToggleAll}
                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                            />
                        </th>
                        <th className="px-4 py-3 min-w-[240px]">{t.colProduct}</th>
                        <th className="px-4 py-3">{t.colBrand}</th>
                        <th className="px-4 py-3">{t.colCategory}</th>
                        <th className="px-4 py-3 text-right">{t.colPrice}</th>
                        <th className="px-4 py-3 text-center">{t.colStock}</th>
                        <th className="px-4 py-3">{t.colStatus}</th>
                        <th className="px-4 py-3">{t.colDate}</th>
                        <th className="px-4 py-3">{t.colUpdatedAt}</th>
                        <th className="px-4 py-3 text-right">{t.colActions}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {products.length === 0 ? (
                        <tr>
                            <td colSpan={10} className="text-center py-16 text-slate-400">
                                <span className="material-symbols-outlined text-5xl block mb-2 opacity-30">inventory_2</span>
                                <p className="text-sm font-medium">{t.notFound}</p>
                            </td>
                        </tr>
                    ) : products.map((product) => {
                        const isSelected = selected.includes(product._id);
                        const brandName = product.brand?.name || product.brand || "—";
                        return (
                            <tr
                                key={product._id}
                                className={`group transition-colors cursor-pointer ${isSelected ? "bg-primary/5" : "hover:bg-slate-50"}`}
                                onClick={() => onView(product)}
                            >
                                <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onToggleSelect(product._id)}
                                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                                    />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                            {product.images?.[0] ? (
                                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-xl text-slate-300">image</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-slate-900 truncate max-w-[180px] group-hover:text-primary transition-colors">
                                                {product.name}
                                            </p>
                                            {product.sku && (
                                                <p className="text-xs text-slate-400 mt-0.5 font-mono">{product.sku}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-slate-700 text-sm">
                                    {brandName}
                                </td>
                                <td className="px-4 py-4">
                                    {product.category?.name ? (
                                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                            {product.category.name}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 text-xs">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <div>
                                        {product.salePrice && product.salePrice < product.price ? (
                                            <>
                                                <p className="text-sm font-bold text-slate-900">{fmtPrice(product.salePrice)}</p>
                                                <p className="text-xs text-slate-400 line-through">{fmtPrice(product.price)}</p>
                                            </>
                                        ) : (
                                            <p className="text-sm font-bold text-slate-900">{fmtPrice(product.price)}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className={`text-sm font-bold ${product.stock === 0 ? "text-red-600" : "text-slate-800"}`}>
                                        {product.stock ?? 0}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <StatusBadge status={product.status} stock={product.stock} t={t} />
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-xs text-slate-500">{fmtDate(product.createdAt)}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-xs text-slate-500">{fmtDate(product.updatedAt)}</span>
                                </td>
                                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => onView(product)}
                                            title={t.viewDetail}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                                        </button>
                                        {canEdit ? (
                                            <button
                                                onClick={() => onEdit(product)}
                                                title={t.editAction}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                        ) : null}
                                        {canDelete ? (
                                            <button
                                                onClick={() => onDelete(product)}
                                                title={t.deleteAction}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        ) : null}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
