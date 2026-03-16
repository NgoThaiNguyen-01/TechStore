import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Footer from "./components/Footer";
import { loadWishlist, saveWishlist, toggleWishlist } from "./utils/wishlistStorage";
import { buildCartItemFromProduct, addToCart } from "./utils/cartStorage";

const T = {
    vi: {
        title: "Danh sách yêu thích",
        subtitle: (n) => `${n} sản phẩm cao cấp đã được lưu lại`,
        back: "Quay lại",
        emptyTitle: "Danh sách yêu thích trống",
        emptyDesc: "Hãy lưu lại những sản phẩm bạn yêu thích để xem sau.",
        continueShopping: "Tiếp tục mua sắm",
        addSelectedToCart: "Thêm mục đã chọn",
        selectAll: "Chọn tất cả sản phẩm",
        removeSelected: "Xóa đã chọn",
        inStock: "CÒN HÀNG",
        outOfStock: "HẾT HÀNG",
        addToCart: "Thêm vào giỏ",
        notifyMe: "Thông báo cho tôi",
        removed: "Đã xóa khỏi yêu thích",
        addedToCart: "Đã thêm vào giỏ hàng",
        selectProduct: "Vui lòng chọn sản phẩm muốn thêm vào giỏ",
        searchPlaceholder: "Tìm kiếm sản phẩm yêu thích...",
        filterTitle: "Bộ lọc tìm kiếm",
        sortLabel: "Sắp xếp theo",
        sortNewest: "Mới nhất",
        sortAZ: "A-Z",
        sortZA: "Z-A",
        sortPriceLow: "Giá: Thấp đến Cao",
        sortPriceHigh: "Giá: Cao đến Thấp",
        priceRange: "Khoảng giá (đ)",
        from: "Từ",
        to: "Đến",
        brand: "Thương hiệu",
        category: "Danh mục",
        noData: "Không có dữ liệu.",
        colors: "Màu sắc",
        clearFilter: "Xóa bộ lọc",
        selectColor: "Vui lòng chọn màu sắc trước khi thêm vào giỏ hàng",
        buyNow: "Mua ngay",
        viewAll: "Xem tất cả",
        viewLess: "Thu gọn",
    },
    en: {
        title: "My Wishlist",
        subtitle: (n) => `${n} premium items saved for later`,
        back: "Back",
        emptyTitle: "Your wishlist is empty",
        emptyDesc: "Save products you love to view them later.",
        continueShopping: "Continue shopping",
        addSelectedToCart: "Add Selected",
        selectAll: "Select all items",
        removeSelected: "Remove Selected",
        inStock: "IN STOCK",
        outOfStock: "OUT OF STOCK",
        addToCart: "Add to Cart",
        notifyMe: "Notify Me",
        removed: "Removed from wishlist",
        addedToCart: "Added to cart",
        selectProduct: "Please select products to add to cart",
        searchPlaceholder: "Search wishlist...",
        filterTitle: "Search Filters",
        sortLabel: "Sort By",
        sortNewest: "Newest",
        sortAZ: "A-Z",
        sortZA: "Z-A",
        sortPriceLow: "Price: Low to High",
        sortPriceHigh: "Price: High to Low",
        priceRange: "Price Range (đ)",
        from: "From",
        to: "To",
        brand: "Brand",
        category: "Category",
        noData: "No data.",
        colors: "Colors",
        clearFilter: "Clear Filter",
        selectColor: "Please select a color before adding to cart",
        buyNow: "Buy Now",
        viewAll: "View All",
        viewLess: "View Less",
    },
};

const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "";
    try {
        // Handle string prices with symbols if necessary
        let num = value;
        if (typeof value === "string") {
            num = Number(value.replace(/[^0-9.-]+/g, ""));
        }
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(num);
    } catch {
        return String(value);
    }
};

const parsePrice = (val) => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
        const n = Number(val.replace(/[^0-9.-]+/g, ""));
        return isNaN(n) ? 0 : n;
    }
    return 0;
};

export default function Wishlist({ lang, setLang, onNavigateHome, onNavigateProduct }) {
    const t = T[lang];
    const [items, setItems] = useState(() => loadWishlist());
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [priceFrom, setPriceFrom] = useState("");
    const [priceTo, setPriceTo] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [inStockOnly, setInStockOnly] = useState(false);
    const [sortBy, setSortBy] = useState("newest");
    const [selectedColors, setSelectedColors] = useState({}); // { productId: colorHex }
    const [showAllBrands, setShowAllBrands] = useState(false);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [showAllProducts, setShowAllProducts] = useState(false);

    useEffect(() => {
        const onUpdate = () => setItems(loadWishlist());
        window.addEventListener("wishlist:updated", onUpdate);
        window.addEventListener("storage", onUpdate);
        return () => {
            window.removeEventListener("wishlist:updated", onUpdate);
            window.removeEventListener("storage", onUpdate);
        };
    }, []);

    const brands = useMemo(() => {
        const set = new Set();
        items.forEach(it => {
            if (it.brand?.name) set.add(it.brand.name);
        });
        return Array.from(set).sort();
    }, [items]);

    const categories = useMemo(() => {
        const set = new Set();
        items.forEach(it => {
            if (it.category?.name) set.add(it.category.name);
        });
        return Array.from(set).sort();
    }, [items]);

    const filteredItems = useMemo(() => {
        let list = items.filter(it => {
            const matchesSearch = it.name.toLowerCase().includes(searchTerm.toLowerCase());
            const price = parsePrice(it.salePrice ?? it.price);
            const matchesPriceFrom = priceFrom === "" || price >= Number(priceFrom);
            const matchesPriceTo = priceTo === "" || price <= Number(priceTo);
            const matchesBrand = selectedBrand === "" || it.brand?.name === selectedBrand;
            const matchesCategory = selectedCategory === "" || it.category?.name === selectedCategory;
            const matchesStock = !inStockOnly || it.stock > 0;
            return matchesSearch && matchesPriceFrom && matchesPriceTo && matchesBrand && matchesCategory && matchesStock;
        });

        // Sorting
        if (sortBy === "az") list.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortBy === "za") list.sort((a, b) => b.name.localeCompare(a.name));
        else if (sortBy === "price_low") list.sort((a, b) => parsePrice(a.salePrice ?? a.price) - parsePrice(b.salePrice ?? b.price));
        else if (sortBy === "price_high") list.sort((a, b) => parsePrice(b.salePrice ?? b.price) - parsePrice(a.salePrice ?? a.price));
        else if (sortBy === "newest") {
            // Newest by position in the wishlist list (last added at top)
            // But loadWishlist returns items in order from localStorage. 
            // In toggleWishlist we did: next = [product, ...items]; so top is newest.
            // If the user wants specific sorting, this is fine.
        }
        
        return list;
    }, [items, searchTerm, priceFrom, priceTo, selectedBrand, selectedCategory, inStockOnly, sortBy]);

    const toggleSelect = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredItems.map((it) => it._id));
        }
    };

    const handleRemove = (product) => {
        const next = toggleWishlist(product);
        setItems(next);
        setSelectedIds((prev) => prev.filter((id) => id !== product._id));
        window.dispatchEvent(new Event("wishlist:updated"));
        toast.success(t.removed);
    };

    const handleRemoveSelected = () => {
        if (selectedIds.length === 0) return;
        const next = items.filter((it) => !selectedIds.includes(it._id));
        saveWishlist(next);
        setItems(next);
        setSelectedIds([]);
        window.dispatchEvent(new Event("wishlist:updated"));
        toast.success(t.removed);
    };

    const handleAddToCart = (product) => {
        const color = selectedColors[product._id];
        if (product.colors?.length > 0 && !color) {
            toast.error(t.selectColor);
            return;
        }
        
        const cartItem = buildCartItemFromProduct({ 
            product, 
            qty: 1,
            selectedColor: color ? product.colors.find(c => c.hex === color) : null
        });
        addToCart(cartItem);
        toast.success(t.addedToCart);
    };

    const handleAddAllToCart = () => {
        if (selectedIds.length === 0) {
            toast.error(t.selectProduct);
            return;
        }

        const targetItems = filteredItems.filter(it => selectedIds.includes(it._id));
        let addedCount = 0;
        let needColorCount = 0;

        targetItems.forEach((p) => {
            if (p.stock > 0) {
                const color = selectedColors[p._id];
                if (p.colors?.length > 0 && !color) {
                    needColorCount++;
                } else {
                    addToCart(buildCartItemFromProduct({ 
                        product: p, 
                        qty: 1,
                        selectedColor: color ? p.colors.find(c => c.hex === color) : null
                    }));
                    addedCount++;
                }
            }
        });

        if (addedCount > 0) toast.success(t.addedToCart);
        if (needColorCount > 0) toast.error(t.selectColor);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setPriceFrom("");
        setPriceTo("");
        setSelectedBrand("");
        setSelectedCategory("");
        setInStockOnly(false);
        setSortBy("newest");
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 lg:px-10 py-10">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <button onClick={onNavigateHome} className="flex items-center gap-2 text-orange-500 font-bold mb-4 hover:gap-3 transition-all">
                            <span className="material-symbols-outlined">arrow_back</span>
                            {t.back}
                        </button>
                        <h1 className="text-4xl font-black mb-2">{t.title}</h1>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <span className="material-symbols-outlined text-primary text-sm">bookmark</span>
                            <span className="text-sm font-medium">{t.subtitle(items.length)}</span>
                        </div>
                        {filteredItems.length > 3 && (
                            <button
                                type="button"
                                onClick={() => setShowAllProducts(!showAllProducts)}
                                className="mt-3 text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all group"
                            >
                                {showAllProducts ? t.viewLess : t.viewAll}
                                <span className="material-symbols-outlined text-sm font-bold group-hover:translate-x-1 transition-transform">
                                    {showAllProducts ? "expand_less" : "chevron_right"}
                                </span>
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1 mr-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.sortLabel}</span>
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer"
                            >
                                <option value="newest">{t.sortNewest}</option>
                                <option value="az">{t.sortAZ}</option>
                                <option value="za">{t.sortZA}</option>
                                <option value="price_low">{t.sortPriceLow}</option>
                                <option value="price_high">{t.sortPriceHigh}</option>
                            </select>
                        </div>
                        <button 
                            onClick={handleAddAllToCart}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm shadow-lg transition-all h-fit self-end ${selectedIds.length > 0 ? "bg-primary text-white hover:bg-blue-700 shadow-primary/25" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                        >
                            <span className="material-symbols-outlined text-lg">shopping_bag</span>
                            {t.addSelectedToCart}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filter */}
                    <div className="w-full lg:w-[450px] shrink-0">
                        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[32px] p-7 h-fit">
                            <div className="flex items-center gap-2 mb-8">
                                <span className="material-symbols-outlined text-primary text-2xl">tune</span>
                                <h2 className="font-black text-xl">{t.filterTitle}</h2>
                            </div>

                            <div className="space-y-8">
                                {/* Search */}
                                <div>
                                    <div className="relative group">
                                        <input 
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder={t.searchPlaceholder}
                                            className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-0 focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
                                        />
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary text-2xl transition-colors">search</span>
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">category</span>
                                        {t.category}
                                    </h3>
                                    {categories.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                {(showAllCategories ? categories : categories.slice(0, 3)).map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => setSelectedCategory(selectedCategory === c ? "" : c)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCategory === c ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                            {categories.length > 3 && (
                                                <button 
                                                    onClick={() => setShowAllCategories(!showAllCategories)}
                                                    className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                                                >
                                                    {showAllCategories ? t.viewLess : t.viewAll}
                                                    <span className="material-symbols-outlined text-sm">
                                                        {showAllCategories ? "expand_less" : "expand_more"}
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">{t.noData}</p>
                                    )}
                                </div>

                                {/* Price Range */}
                                <div>
                                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">payments</span>
                                        {t.priceRange}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number"
                                            value={priceFrom}
                                            onChange={(e) => setPriceFrom(e.target.value)}
                                            placeholder={t.from}
                                            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-primary"
                                        />
                                        <span className="text-slate-400">-</span>
                                        <input 
                                            type="number"
                                            value={priceTo}
                                            onChange={(e) => setPriceTo(e.target.value)}
                                            placeholder={t.to}
                                            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                {/* Brand */}
                                <div>
                                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">verified</span>
                                        {t.brand}
                                    </h3>
                                    {brands.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                {(showAllBrands ? brands : brands.slice(0, 3)).map(b => (
                                                    <button
                                                        key={b}
                                                        onClick={() => setSelectedBrand(selectedBrand === b ? "" : b)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedBrand === b ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
                                                    >
                                                        {b}
                                                    </button>
                                                ))}
                                            </div>
                                            {brands.length > 3 && (
                                                <button 
                                                    onClick={() => setShowAllBrands(!showAllBrands)}
                                                    className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                                                >
                                                    {showAllBrands ? t.viewLess : t.viewAll}
                                                    <span className="material-symbols-outlined text-sm">
                                                        {showAllBrands ? "expand_less" : "expand_more"}
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">{t.noData}</p>
                                    )}
                                </div>

                                {/* Stock */}
                                <div>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center justify-center">
                                            <input 
                                                type="checkbox" 
                                                checked={inStockOnly}
                                                onChange={(e) => setInStockOnly(e.target.checked)}
                                                className="peer h-5 w-5 rounded-md border-2 border-slate-300 dark:border-slate-700 checked:bg-primary checked:border-primary transition-all appearance-none cursor-pointer"
                                            />
                                            <span className="material-symbols-outlined absolute text-white text-[14px] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">check</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{t.inStock}</span>
                                    </label>
                                </div>

                                {/* Clear */}
                                <button 
                                    onClick={clearFilters}
                                    className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-sm hover:bg-red-500 hover:text-white transition-all mt-4"
                                >
                                    {t.clearFilter}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        {/* Bulk Actions */}
                        {filteredItems.length > 0 && (
                            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-8 flex items-center justify-between">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                        <input 
                                            type="checkbox" 
                                            className="peer h-6 w-6 rounded-md border-2 border-slate-300 dark:border-slate-700 checked:bg-primary checked:border-primary transition-all appearance-none cursor-pointer"
                                            checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                                            onChange={toggleSelectAll}
                                        />
                                        <span className="material-symbols-outlined absolute text-white text-base opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">check</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{t.selectAll}</span>
                                </label>
                                <div className="flex items-center gap-6">
                                    <button 
                                        onClick={handleRemoveSelected}
                                        disabled={selectedIds.length === 0}
                                        className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                        {t.removeSelected}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Grid */}
                        {filteredItems.length > 0 ? (
                            <div className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {(showAllProducts ? filteredItems : filteredItems.slice(0, 3)).map((product) => {
                                        const showDiscount = typeof product.salePrice === "number" && product.salePrice < product.price;
                                        const discountLabel = showDiscount
                                            ? `-${Math.round((1 - (product.salePrice / product.price)) * 100)}%`
                                            : null;

                                        return (
                                            <div key={product._id} className="group bg-white dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/50 hover:shadow-2xl transition-all hover:scale-[1.02] flex flex-col h-full relative">
                                                <div className="absolute top-4 left-4 z-20">
                                                    <label className="relative flex items-center justify-center cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            className="peer h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-700 checked:bg-primary checked:border-primary transition-all appearance-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm"
                                                            checked={selectedIds.includes(product._id)}
                                                            onChange={() => toggleSelect(product._id)}
                                                        />
                                                        <span className="material-symbols-outlined absolute text-white text-[14px] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">check</span>
                                                    </label>
                                                </div>
                                                <div className="h-56 relative rounded-xl bg-slate-50 dark:bg-slate-800/80 mb-4 overflow-hidden flex items-center justify-center">
                                                    {discountLabel && (
                                                        <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold z-10">
                                                            {discountLabel}
                                                        </span>
                                                    )}
                                                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemove(product)}
                                                            className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white/40 transition-all shadow-sm"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleAddToCart(product)}
                                                            className="h-8 w-8 rounded-full flex items-center justify-center transition-all bg-white/90 text-slate-500 hover:text-primary shadow-sm"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                                                        </button>
                                                    </div>
                                                    <img 
                                                        className="max-h-full max-w-full object-contain" 
                                                        alt={product.name} 
                                                        src={product.images?.[0] || product.img || ""} 
                                                    />
                                                </div>
                                                <div className="space-y-2 flex-1 flex flex-col">
                                                    <div className="flex items-center justify-between min-h-[24px] gap-2">
                                                        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                                                            {product.category?.name && (
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded truncate max-w-[140px] inline-block">
                                                                    {product.category.name}
                                                                </span>
                                                            )}
                                                            {product.brand?.name && (
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded truncate max-w-[140px] inline-block">
                                                                    {product.brand.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                            <span className="text-xs font-bold">{product.rating || "5.0"}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => onNavigateProduct(product._id)}
                                                        className="font-bold text-lg leading-tight text-left hover:text-primary transition-colors line-clamp-2 min-h-[3rem]"
                                                    >
                                                        {product.name}
                                                    </button>
                                                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-2 min-h-[2.5rem]">
                                                        <span className="text-lg sm:text-xl font-black whitespace-nowrap">
                                                            {formatCurrency(product.salePrice ?? product.price)}
                                                        </span>
                                                        {showDiscount && (
                                                            <span className="text-xs sm:text-sm text-slate-400 line-through whitespace-nowrap">
                                                                {formatCurrency(product.price)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="min-h-[100px] pt-2 flex flex-col justify-end">
                                                        {product.colors && product.colors.length > 0 && (
                                                            <div>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <p className="text-xs font-semibold text-slate-500">{t.colors}</p>
                                                                    {!selectedColors[product._id] && (
                                                                        <span className="text-[10px] font-bold text-red-500 animate-pulse flex items-center gap-1">
                                                                            <span className="material-symbols-outlined text-[12px]">info</span>
                                                                            {lang === "vi" ? "Bắt buộc" : "Required"}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    {product.colors.map((color) => (
                                                                        <button
                                                                            key={color.hex}
                                                                            onClick={() => setSelectedColors(prev => ({ ...prev, [product._id]: color.hex }))}
                                                                            className={`w-7 h-7 rounded-full border-2 transition-all ${selectedColors[product._id] === color.hex ? "border-primary scale-110 shadow-md" : "border-slate-200 dark:border-slate-700 hover:border-slate-400"}`}
                                                                            title={color.name}
                                                                            style={{ backgroundColor: color.hex }}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                <div className="h-32 w-32 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700">favorite</span>
                                </div>
                                <h2 className="text-2xl font-bold mb-2">{t.emptyTitle}</h2>
                                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">{t.emptyDesc}</p>
                                <button onClick={onNavigateHome} className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-primary/25">
                                    {t.continueShopping}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer lang={lang} setLang={setLang} />
        </div>
    );
}
