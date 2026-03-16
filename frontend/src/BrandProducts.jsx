import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getBrandById } from "./services/brandApi";
import { getProducts } from "./services/productApi";
import Footer from "./components/Footer";
import { addToCart, buildCartItemFromProduct } from "./utils/cartStorage";
import { collectColorFilterOptions, productMatchesColorFilter } from "./utils/colorFilter";
import { loadWishlist, toggleWishlist } from "./utils/wishlistStorage";

const T = {
    vi: {
        back: "Quay lại",
        brandTitle: "Thương hiệu",
        brandFallbackDesc: (name) => `Khám phá toàn bộ hệ sinh thái ${name || "thương hiệu"} với bộ lọc chi tiết và sản phẩm chính hãng.`,
        loading: "Đang tải...",
        empty: "Chưa có sản phẩm phù hợp trong thương hiệu này.",
        loadMore: "Xem thêm",
        searchLabel: "Tìm kiếm",
        searchPlaceholder: "Tìm sản phẩm...",
        sortLabel: "Sắp xếp",
        sortNewest: "Mới nhất",
        sortOldest: "Cũ nhất",
        sortAZ: "A-Z",
        sortZA: "Z-A",
        priceLabel: "Khoảng giá",
        priceMin: "Từ",
        priceMax: "Đến",
        categoryLabel: "Danh mục",
        stockIn: "Còn hàng",
        addToCart: "Thêm vào giỏ",
        addToCartSuccess: "Đã thêm vào giỏ hàng",
        favoriteAdded: "Đã thêm vào yêu thích",
        favoriteRemoved: "Đã bỏ khỏi yêu thích",
        colorLabel: "Màu sắc",
        selectedColor: "Màu đã chọn",
        colorRequired: "Vui lòng chọn màu",
        clearFilters: "Xóa bộ lọc",
        filtersTitle: "Bộ lọc tìm kiếm",
        totalFound: (count) => `${count} sản phẩm được tìm thấy`,
        noData: "Không có dữ liệu.",
        unknownError: "Đã xảy ra lỗi, vui lòng thử lại",
    },
    en: {
        back: "Back",
        brandTitle: "Brand",
        brandFallbackDesc: (name) => `Explore the full ${name || "brand"} lineup with richer filters and official products.`,
        loading: "Loading...",
        empty: "No matching products found for this brand.",
        loadMore: "Load more",
        searchLabel: "Search",
        searchPlaceholder: "Search products...",
        sortLabel: "Sort",
        sortNewest: "Newest",
        sortOldest: "Oldest",
        sortAZ: "A-Z",
        sortZA: "Z-A",
        priceLabel: "Price range",
        priceMin: "Min",
        priceMax: "Max",
        categoryLabel: "Category",
        stockIn: "In stock",
        addToCart: "Add to cart",
        addToCartSuccess: "Added to cart",
        favoriteAdded: "Added to favorites",
        favoriteRemoved: "Removed from favorites",
        colorLabel: "Color",
        selectedColor: "Selected color",
        colorRequired: "Please choose a color",
        clearFilters: "Clear filters",
        filtersTitle: "Filters",
        totalFound: (count) => `${count} products found`,
        noData: "No data.",
        unknownError: "Something went wrong, please try again",
    },
};

const selectClass = "pl-3 pr-9 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none cursor-pointer transition-colors hover:border-slate-300";
const getProductKey = (product) => String(product?._id || product?.id || product?.name || "");
const getWishlistKeys = () => loadWishlist().map((item) => getProductKey(item)).filter(Boolean);

export default function BrandProducts({ lang = "vi", setLang, brandId, onNavigateHome, onNavigateProduct }) {
    const t = T[lang] || T.vi;
    const [brand, setBrand] = useState(null);
    const [products, setProducts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [totalFound, setTotalFound] = useState(0);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("createdAt:desc");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [stockFilter, setStockFilter] = useState("all");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [selectedColorKeys, setSelectedColorKeys] = useState([]);
    const [selectedColors, setSelectedColors] = useState({});
    const [favorites, setFavorites] = useState(() => getWishlistKeys());
    const errorRef = useRef(t.unknownError);

    useEffect(() => {
        errorRef.current = t.unknownError;
    }, [t.unknownError]);

    const selectColor = (productId, color) => {
        setSelectedColors((prev) => ({ ...prev, [productId]: color }));
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined || value === "") return "";
        try {
            return new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
                maximumFractionDigits: 0,
            }).format(value);
        } catch {
            return String(value);
        }
    };

    const handleAddToCart = (product) => {
        const productId = product?._id || product?.id || product?.name;
        if (product.colors && product.colors.length > 0) {
            const selected = selectedColors[productId];
            if (!selected) {
                toast.error(t.colorRequired);
                return;
            }
            addToCart(buildCartItemFromProduct({ product, qty: 1, selectedColor: selected }));
            toast.success(`${t.addToCartSuccess}: ${product.name} (${selected.name})`);
            return;
        }
        addToCart(buildCartItemFromProduct({ product, qty: 1 }));
        toast.success(`${t.addToCartSuccess}: ${product.name}`);
    };

    const toggleFavorite = (product) => {
        const productKey = getProductKey(product);
        const exists = favorites.includes(productKey);
        const next = toggleWishlist(product);
        setFavorites(next.map((item) => getProductKey(item)).filter(Boolean));
        toast.success(`${exists ? t.favoriteRemoved : t.favoriteAdded}: ${product.name}`);
    };

    useEffect(() => {
        setProducts([]);
        setPage(1);
        setHasMore(false);
    }, [brandId, search, sort, selectedCategories, stockFilter, minPrice, maxPrice]);

    useEffect(() => {
        const syncFavorites = () => setFavorites(getWishlistKeys());
        window.addEventListener("wishlist:updated", syncFavorites);
        window.addEventListener("user:updated", syncFavorites);
        window.addEventListener("storage", syncFavorites);
        return () => {
            window.removeEventListener("wishlist:updated", syncFavorites);
            window.removeEventListener("user:updated", syncFavorites);
            window.removeEventListener("storage", syncFavorites);
        };
    }, []);

    useEffect(() => {
        if (!brandId) return;
        const fetchBrand = async () => {
            try {
                const res = await getBrandById(brandId);
                setBrand(res?.data || null);
            } catch {
                setBrand(null);
            }
        };
        fetchBrand();
    }, [brandId]);

    useEffect(() => {
        if (!brandId) return;
        const fetchFilterOptions = async () => {
            try {
                const res = await getProducts({ page: 1, limit: 200, status: "active", brand: brandId });
                const items = res?.data || [];
                const categoryMap = new Map();

                items.forEach((product) => {
                    const id = product?.category?._id || product?.category;
                    const name = product?.category?.name || product?.category || "";
                    if (!id || !name) return;
                    categoryMap.set(String(id), { id: String(id), name: String(name) });
                });

                const names = Array.from(
                    new Set(items.map((product) => String(product?.name || "").trim()).filter(Boolean))
                ).sort((a, b) => a.localeCompare(b));

                setCategoryOptions(Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
                setSuggestions(names);
            } catch {
                setCategoryOptions([]);
                setSuggestions([]);
            }
        };
        fetchFilterOptions();
    }, [brandId]);

    useEffect(() => {
        if (!brandId) return;
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const limit = 12;
                const params = { page, limit, status: "active", brand: brandId, sort };
                if (search.trim()) params.search = search.trim();
                if (selectedCategories.length === 1) params.category = selectedCategories[0];
                if (minPrice !== "") params.minPrice = minPrice;
                if (maxPrice !== "") params.maxPrice = maxPrice;
                if (stockFilter === "in") params.minStock = 1;
                if (stockFilter === "out") params.maxStock = 0;

                const res = await getProducts(params);
                const items = res?.data || [];
                setProducts((prev) => (page === 1 ? items : [...prev, ...items]));

                const totalPages = res?.pagination?.totalPages ?? res?.pagination?.pages ?? 1;
                const totalItems = res?.pagination?.totalItems ?? res?.pagination?.total;
                if (page === 1) setTotalFound(typeof totalItems === "number" ? totalItems : items.length);
                setHasMore(page < totalPages);
            } catch (error) {
                toast.error(error?.response?.data?.message || errorRef.current);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [brandId, page, search, sort, selectedCategories, minPrice, maxPrice, stockFilter]);

    const colorOptions = useMemo(() => collectColorFilterOptions(products), [products]);

    const displayedProducts = useMemo(() => {
        let list = products;
        if (selectedCategories.length > 0) {
            const categorySet = new Set(selectedCategories.map(String));
            list = list.filter((product) => categorySet.has(String(product?.category?._id || product?.category || "")));
        }
        if (selectedColorKeys.length > 0) {
            list = list.filter((product) => productMatchesColorFilter(product, selectedColorKeys));
        }
        return list;
    }, [products, selectedCategories, selectedColorKeys]);

    const brandName = useMemo(() => brand?.name || t.brandTitle, [brand?.name, t.brandTitle]);
    const brandVisual = brand?.logo || brand?.image || "";
    const brandDescription = useMemo(
        () => String(brand?.description || "").trim() || t.brandFallbackDesc(brand?.name),
        [brand?.description, brand?.name, t]
    );
    const totalLabelCount = useMemo(() => {
        const hasClientOnlyFilter = selectedCategories.length > 1 || selectedColorKeys.length > 0;
        if (hasClientOnlyFilter) return displayedProducts.length;
        return totalFound || displayedProducts.length;
    }, [displayedProducts.length, selectedCategories.length, selectedColorKeys.length, totalFound]);

    const resetFilters = () => {
        setSearch("");
        setSort("createdAt:desc");
        setSelectedCategories([]);
        setSelectedColorKeys([]);
        setStockFilter("all");
        setMinPrice("");
        setMaxPrice("");
        setPage(1);
    };

    const renderProductCard = (product) => {
        const productKey = getProductKey(product);
        const isFavorite = favorites.includes(productKey);

        return (
            <div
                key={productKey}
                className="group bg-white dark:bg-slate-900/30 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/50 hover:shadow-xl transition-all flex flex-col h-full"
            >
                <div className="h-48 relative rounded-xl bg-slate-50 dark:bg-slate-800/80 mb-4 overflow-hidden flex items-center justify-center">
                    {typeof product.salePrice === "number" && product.salePrice < product.price && (
                        <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold">
                            -{Math.round((1 - (product.salePrice / product.price)) * 100)}%
                        </span>
                    )}
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => toggleFavorite(product)}
                            className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${isFavorite ? "bg-red-500 text-white" : "bg-white/90 text-slate-500 hover:text-red-500"}`}
                            aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích"}
                        >
                            <span
                                className="material-symbols-outlined text-[18px]"
                                style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
                            >
                                favorite
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="h-8 w-8 rounded-full flex items-center justify-center transition-all bg-white/90 text-slate-500 hover:text-primary"
                            aria-label={t.addToCart}
                        >
                            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                        </button>
                    </div>
                    <img
                        className="max-h-full max-w-full object-contain"
                        alt={product.alt || product.name}
                        src={product.img || product.images?.[0] || ""}
                    />
                </div>
                <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {product.category?.name || ""}
                            </span>
                            {product.brand?.name && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded truncate max-w-[90px]">
                                    {product.brand.name}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                                star
                            </span>
                            <span className="text-xs font-bold">{Number(product.ratingAverage ?? product.rating ?? 0).toFixed(1)}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onNavigateProduct(product._id || product.id)}
                        className="mt-2 font-bold text-lg leading-tight text-left hover:text-primary transition-colors min-h-[52px]"
                    >
                        {product.name}
                    </button>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mt-3">
                        <span className="text-lg sm:text-xl font-black whitespace-nowrap">
                            {formatCurrency(product.salePrice ?? product.price) || product.price}
                        </span>
                        {(product.original || (product.salePrice && product.salePrice < product.price)) && (
                            <span className="text-xs sm:text-sm text-slate-400 line-through whitespace-nowrap">
                                {formatCurrency(product.original || product.price) || product.original}
                            </span>
                        )}
                    </div>
                    <div className="mt-3 min-h-[88px]">
                        {product.colors && product.colors.length > 0 ? (
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-2">{t.colorLabel}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {product.colors.map((color) => {
                                        const isActive = selectedColors[productKey]?.hex?.toLowerCase() === color.hex.toLowerCase();
                                        return (
                                            <button
                                                type="button"
                                                key={color.hex}
                                                onClick={() => selectColor(productKey, color)}
                                                className={`w-7 h-7 rounded-full border ${isActive ? "ring-2 ring-primary ring-offset-1 border-primary" : "border-slate-200"} transition`}
                                                title={color.name}
                                                style={{ backgroundColor: color.hex }}
                                            />
                                        );
                                    })}
                                </div>
                                {selectedColors[productKey] && (
                                    <p className="text-xs text-slate-500 mt-2 truncate">
                                        {t.selectedColor}: <span className="font-semibold text-slate-700">{selectedColors[productKey].name}</span>
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div />
                        )}
                    </div>
                    <div className="mt-auto pt-3">
                        <button
                            onClick={() => handleAddToCart(product)}
                            className="w-full h-11 bg-primary text-white rounded-xl font-extrabold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                            type="button"
                        >
                            <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                            {t.addToCart}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            <main className="max-w-[1440px] mx-auto px-4 lg:px-10 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
                    <aside className="h-fit">
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/40 backdrop-blur p-5">
                            <div className="flex items-center gap-2 font-extrabold">
                                <span className="material-symbols-outlined text-[18px]">tune</span>
                                <span>{t.filtersTitle}</span>
                            </div>

                            <div className="mt-5 space-y-5">
                                <div>
                                    <div className="text-sm font-bold">{t.priceLabel} (đ)</div>
                                    <div className="mt-2 flex gap-2">
                                        <input
                                            value={minPrice}
                                            onChange={(event) => setMinPrice(event.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                            type="number"
                                            min="0"
                                            placeholder={t.priceMin}
                                        />
                                        <input
                                            value={maxPrice}
                                            onChange={(event) => setMaxPrice(event.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                            type="number"
                                            min="0"
                                            placeholder={t.priceMax}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm font-bold">{t.categoryLabel}</div>
                                    <div className="mt-2 space-y-2">
                                        {categoryOptions.map((category) => {
                                            const checked = selectedCategories.includes(String(category.id));
                                            return (
                                                <label key={category.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(event) => {
                                                            const id = String(category.id);
                                                            setSelectedCategories((prev) =>
                                                                event.target.checked
                                                                    ? Array.from(new Set([...prev, id]))
                                                                    : prev.filter((item) => item !== id)
                                                            );
                                                        }}
                                                        className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                    />
                                                    <span>{category.name}</span>
                                                </label>
                                            );
                                        })}
                                        {categoryOptions.length === 0 && <div className="text-sm text-slate-500">{t.noData}</div>}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm font-bold">{t.colorLabel}</div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {colorOptions.slice(0, 10).map((color) => {
                                            const active = selectedColorKeys.includes(color.key);
                                            return (
                                                <button
                                                    key={color.key}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedColorKeys((prev) =>
                                                            prev.includes(color.key)
                                                                ? prev.filter((item) => item !== color.key)
                                                                : [...prev, color.key]
                                                        )
                                                    }
                                                    className={`size-8 rounded-full border ${active ? "ring-2 ring-primary ring-offset-2 border-primary" : "border-slate-200"} transition`}
                                                    style={{ backgroundColor: color.hex }}
                                                    title={color.name || color.hex}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={stockFilter === "in"}
                                            onChange={(event) => setStockFilter(event.target.checked ? "in" : "all")}
                                            className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        {t.stockIn}
                                    </label>
                                </div>

                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-100 font-bold transition-colors"
                                >
                                    {t.clearFilters}
                                </button>
                            </div>
                        </div>
                    </aside>

                    <section className="min-w-0">
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/40 backdrop-blur p-5">
                            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                                <div className="min-w-0">
                                    <button
                                        onClick={onNavigateHome}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold shadow-sm transition-colors"
                                        type="button"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                                        {t.back}
                                    </button>

                                    <div className="mt-5 flex flex-col md:flex-row md:items-center gap-4">
                                        {brandVisual ? (
                                            <div className="size-20 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-center overflow-hidden shrink-0">
                                                <img src={brandVisual} alt={brandName} className="h-full w-full object-contain p-3" />
                                            </div>
                                        ) : null}
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                                                {t.brandTitle}
                                            </div>
                                            <div className="mt-2 text-4xl md:text-5xl font-black tracking-tight text-orange-500 dark:text-orange-400">
                                                {brandName}
                                            </div>
                                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                                {brandDescription}
                                            </p>
                                            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                                                {t.totalFound(totalLabelCount)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold text-slate-500">{t.sortLabel}</span>
                                        <select value={sort} onChange={(event) => setSort(event.target.value)} className={selectClass}>
                                            <option value="createdAt:desc">{t.sortNewest}</option>
                                            <option value="createdAt:asc">{t.sortOldest}</option>
                                            <option value="name:asc">{t.sortAZ}</option>
                                            <option value="name:desc">{t.sortZA}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[18px]">search</span>
                                    <input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder={t.searchPlaceholder}
                                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:bg-white focus:border-primary transition-all outline-none placeholder:text-slate-400 text-slate-800"
                                        type="text"
                                        list="brand-product-suggestions"
                                    />
                                    <datalist id="brand-product-suggestions">
                                        {suggestions.map((name) => (
                                            <option key={name} value={name} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            {loading && displayedProducts.length === 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {Array.from({ length: 8 }).map((_, index) => (
                                        <div key={index} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse">
                                            <div className="h-44 rounded-xl bg-slate-200" />
                                            <div className="mt-4 h-4 bg-slate-200 rounded" />
                                            <div className="mt-2 h-4 bg-slate-200 rounded w-2/3" />
                                            <div className="mt-4 h-10 bg-slate-200 rounded-xl" />
                                        </div>
                                    ))}
                                </div>
                            ) : displayedProducts.length === 0 ? (
                                <div className="text-sm text-slate-500 dark:text-slate-400">{t.empty}</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {displayedProducts.map(renderProductCard)}
                                </div>
                            )}

                            <div className="mt-8 flex justify-center">
                                {hasMore && (
                                    <button
                                        type="button"
                                        onClick={() => setPage((prev) => prev + 1)}
                                        disabled={loading}
                                        className="px-6 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                                    >
                                        {loading ? t.loading : t.loadMore}
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <Footer lang={lang} setLang={setLang} />
        </div>
    );
}
