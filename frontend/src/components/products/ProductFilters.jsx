import React from "react";

const STATUSES_VI = [
    { value: "all", label: "Trạng thái" },
    { value: "active", label: "Hoạt động" },
    { value: "hidden", label: "Ẩn" },
    { value: "draft", label: "Nháp" },
    { value: "archived", label: "Đã lưu trữ" },
    { value: "out_of_stock", label: "Hết hàng" },
];
const STATUSES_EN = [
    { value: "all", label: "Status" },
    { value: "active", label: "Active" },
    { value: "hidden", label: "Hidden" },
    { value: "draft", label: "Draft" },
    { value: "archived", label: "Archived" },
    { value: "out_of_stock", label: "Out of Stock" },
];
const PRICE_RANGES_VI = [
    { value: "all", label: "Giá (Tất cả)" },
    { value: "0-1000000", label: "Dưới 1 triệu" },
    { value: "1000000-5000000", label: "1–5 triệu" },
    { value: "5000000-20000000", label: "5–20 triệu" },
    { value: "20000000-99999999", label: "Trên 20 triệu" },
];
const PRICE_RANGES_EN = [
    { value: "all", label: "Price (All)" },
    { value: "0-1000000", label: "Under 1M" },
    { value: "1000000-5000000", label: "1–5M" },
    { value: "5000000-20000000", label: "5–20M" },
    { value: "20000000-99999999", label: "Over 20M" },
];
const STOCK_RANGES_VI = [
    { value: "all", label: "Kho hàng" },
    { value: "in", label: "Còn hàng" },
    { value: "out", label: "Hết hàng" },
];
const STOCK_RANGES_EN = [
    { value: "all", label: "Stock" },
    { value: "in", label: "In Stock" },
    { value: "out", label: "Out of Stock" },
];

/* 
 * Tailwind forms plugin handles select arrow automatically.
 * Do NOT add custom chevron icons — that causes the double-arrow bug.
 * Just use the default <select> styling from the plugin.
 */
const selectClass = "pl-3 pr-9 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none cursor-pointer transition-colors hover:border-slate-300";

export default function ProductFilters({
    lang = "vi",
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    brandFilter,
    setBrandFilter,
    categoryFilter,
    setCategoryFilter,
    stockFilter,
    setStockFilter,
    priceRange,
    setPriceRange,
    sort,
    setSort,
    createdDate,
    setCreatedDate,
    updatedDate,
    setUpdatedDate,
    brands = [],
    categories = [],
    onReset,
    t,
}) {
    const statuses = lang === "vi" ? STATUSES_VI : STATUSES_EN;
    const priceRanges = lang === "vi" ? PRICE_RANGES_VI : PRICE_RANGES_EN;
    const stockRanges = lang === "vi" ? STOCK_RANGES_VI : STOCK_RANGES_EN;

    const isFiltered =
        search
        || statusFilter !== "all"
        || brandFilter !== "all"
        || categoryFilter !== "all"
        || stockFilter !== "all"
        || priceRange !== "all"
        || sort !== "createdAt:desc"
        || createdDate
        || updatedDate;

    return (
        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-end gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[200px] max-w-xs flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">Tên sản phẩm</label>
                <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors material-symbols-outlined text-[18px]">
                        search
                    </span>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        className="w-full pl-9 pr-4 h-10 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:bg-white focus:border-primary transition-all outline-none placeholder:text-slate-400 text-slate-800"
                        type="text"
                    />
                </div>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">{lang === "vi" ? "Trạng thái" : "Status"}</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${selectClass} h-10 w-40`}>
                    {statuses.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>
            </div>

            {/* Brand */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">{lang === "vi" ? "Thương hiệu" : "Brand"}</label>
                <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className={`${selectClass} h-10 min-w-[200px]`}>
                    <option value="all">{t.allBrands}</option>
                    {brands.map((b) => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                </select>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">{lang === "vi" ? "Danh mục" : "Category"}</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={`${selectClass} h-10 min-w-[200px]`}>
                    <option value="all">{t.allCategories}</option>
                    {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Stock */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">{lang === "vi" ? "Kho hàng" : "Stock"}</label>
                <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className={`${selectClass} h-10 w-40`}>
                    {stockRanges.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>
            </div>

            {/* Price */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">{lang === "vi" ? "Giá" : "Price"}</label>
                <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className={`${selectClass} h-10 w-40`}>
                    {priceRanges.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">{t.sortLabel}</label>
                <select
                    className={`${selectClass} h-10 w-40`}
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                >
                    <option value="createdAt:desc">{t.sortNewest || t.sortLabel}</option>
                    <option value="createdAt:asc">{t.sortOldest || t.sortLabel}</option>
                    <option value="name:asc">{t.sortAZ}</option>
                    <option value="name:desc">{t.sortZA}</option>
                    <option value="price:asc">{t.sortPriceAsc}</option>
                    <option value="price:desc">{t.sortPriceDesc}</option>
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">{t.filterCreatedDate}</label>
                <input
                    type="date"
                    value={createdDate}
                    onChange={(e) => setCreatedDate(e.target.value)}
                    className={`${selectClass} h-10 w-40`}
                    aria-label={t.filterCreatedDate}
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">{t.filterUpdatedDate}</label>
                <input
                    type="date"
                    value={updatedDate}
                    onChange={(e) => setUpdatedDate(e.target.value)}
                    className={`${selectClass} h-10 w-40`}
                    aria-label={t.filterUpdatedDate}
                />
            </div>

            {/* Reset */}
            {isFiltered && (
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-full bg-white hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors h-10 shadow-[0_0_0_1px_rgba(15,23,42,0.02)]"
                >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                    {t.reset}
                </button>
            )}
        </div>
    );
}
