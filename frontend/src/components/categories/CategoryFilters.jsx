import React from "react";

export default function CategoryFilters({
    search,
    setSearch,
    productCountMin,
    setProductCountMin,
    statusFilter,
    setStatusFilter,
    parentFilter,
    setParentFilter,
    sort,
    setSort,
    createdDate,
    setCreatedDate,
    updatedDate,
    setUpdatedDate,
    parents,
    onReset,
    t,
}) {
    const isFiltered =
        search
        || statusFilter !== "all"
        || parentFilter !== "all"
        || sort !== "createdAt:desc"
        || createdDate
        || updatedDate
        || (productCountMin !== "" && productCountMin !== undefined && productCountMin !== null);

    return (
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-end gap-3">
            <div className="w-full sm:max-w-[320px] lg:max-w-[380px] flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-500 leading-none">Tên danh mục</label>
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                        search
                    </span>
                    <input
                        className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-400"
                        placeholder={t.searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-500 leading-none">{t.allStatuses}</label>
                <select
                    className="pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary outline-none text-slate-700 cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">{t.allStatuses}</option>
                    <option value="active">{t.statusActive}</option>
                    <option value="hidden">{t.statusHidden}</option>
                    <option value="draft">{t.statusDraft}</option>
                    <option value="archived">{t.statusArchived}</option>
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-500 leading-none">{t.allParents}</label>
                <select
                    className="pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary outline-none text-slate-700 cursor-pointer max-w-[220px] truncate"
                    value={parentFilter}
                    onChange={(e) => setParentFilter(e.target.value)}
                >
                    <option value="all">{t.allParentsAll}</option>
                    <option value="root">{t.rootCategoriesOnly}</option>
                    {parents?.map(p => (
                        <option key={p._id} value={p._id}>
                            {p.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-500 leading-none">{t.sortLabel}</label>
                <select
                    className="pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary outline-none text-slate-700 cursor-pointer"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                >
                    <option value="createdAt:desc">{t.sortNewest || t.sortLabel}</option>
                    <option value="createdAt:asc">{t.sortOldest || t.sortLabel}</option>
                    <option value="name:asc">{t.sortAZ}</option>
                    <option value="name:desc">{t.sortZA}</option>
                </select>
            </div>

            <div className="w-full flex flex-wrap items-end gap-3 pt-2">
                <div className="flex flex-col gap-1 min-w-[160px]">
                    <label className="text-[11px] font-semibold text-slate-500 leading-none">{t.filterUpdatedDate}</label>
                    <input
                        type="date"
                        value={updatedDate}
                        onChange={(e) => setUpdatedDate(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary outline-none text-slate-700"
                        aria-label={t.filterUpdatedDate}
                    />
                </div>
                <div className="flex flex-col gap-1 min-w-[160px]">
                    <label className="text-[11px] font-semibold text-slate-500 leading-none">{t.filterCreatedDate}</label>
                    <input
                        type="date"
                        value={createdDate}
                        onChange={(e) => setCreatedDate(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary outline-none text-slate-700"
                        aria-label={t.filterCreatedDate}
                    />
                </div>
                <div className="flex flex-col gap-1 min-w-[200px]">
                    <label className="text-[11px] font-semibold text-slate-500 leading-none">Số sản phẩm</label>
                    <input
                        type="number"
                        min="0"
                        value={productCountMin}
                        onChange={(e) => setProductCountMin(e.target.value)}
                        placeholder="Nhập số sản phẩm cần tìm"
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary outline-none text-slate-700"
                        aria-label="Min product count"
                    />
                </div>
                {isFiltered && (
                    <button
                        onClick={onReset}
                        className="ml-auto flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-full bg-white hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors h-10 shadow-[0_0_0_1px_rgba(15,23,42,0.02)]"
                    >
                        <span className="material-symbols-outlined text-[16px] leading-none">close</span>
                        <span>{t.reset}</span>
                    </button>
                )}
            </div>
        </div>
    );
}
