import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Pagination from "../../components/common/Pagination";
import { getBrands } from "../../services/brandApi";
import { getCategories } from "../../services/categoryApi";
import { getProducts } from "../../services/productApi";
import { hasAdminPermission } from "../../utils/adminAccess";
import {
    bulkDeleteAdminProductReviews,
    bulkUpdateAdminProductReviewStatus,
    deleteAdminProductReview,
    getAdminProductReviews,
    updateAdminProductReviewStatus,
} from "../../services/reviewApi";
import { readStoredUserProfile } from "../../utils/userProfile";

const T = {
    vi: {
        title: "Đánh giá sản phẩm",
        subtitle: "Duyệt, ẩn và theo dõi phản hồi của khách hàng theo sản phẩm, thương hiệu và danh mục.",
        searchLabel: "Tìm kiếm",
        searchPlaceholder: "Tìm theo sản phẩm, khách hàng, tiêu đề hoặc nội dung",
        productLabel: "Sản phẩm",
        productSearch: "Tìm nhanh sản phẩm...",
        allProducts: "Tất cả sản phẩm",
        chooseProduct: "Chọn sản phẩm",
        noProductMatch: "Không có sản phẩm phù hợp",
        brandLabel: "Thương hiệu",
        allBrands: "Tất cả thương hiệu",
        categoryLabel: "Danh mục",
        allCategories: "Tất cả danh mục",
        statusLabel: "Trạng thái",
        ratingLabel: "Số sao",
        all: "Tất cả",
        approved: "Đang hiển thị",
        hidden: "Đang ẩn",
        star1: "1 sao",
        star2: "2 sao",
        star3: "3 sao",
        star4: "4 sao",
        star5: "5 sao",
        selectedCount: "đánh giá đã chọn",
        clearSelection: "Bỏ chọn",
        showSelected: "Hiện hàng loạt",
        hideSelected: "Ẩn hàng loạt",
        deleteSelected: "Xóa hàng loạt",
        columnReview: "Đánh giá",
        columnProduct: "Sản phẩm",
        columnCustomer: "Khách hàng",
        columnStatus: "Trạng thái",
        columnUpdated: "Cập nhật",
        columnActions: "Thao tác",
        verifiedPurchase: "Đã mua hàng",
        edited: "Đã chỉnh sửa",
        moderatedBy: "Duyệt bởi",
        updatedAt: "Cập nhật",
        showAction: "Hiện",
        hideAction: "Ẩn",
        deleteAction: "Xóa",
        deleteConfirm: "Bạn có chắc muốn xóa đánh giá này không?",
        deleteSelectedConfirm: "Bạn có chắc muốn xóa các đánh giá đã chọn không?",
        empty: "Chưa có đánh giá nào phù hợp bộ lọc hiện tại.",
        loadError: "Không thể tải danh sách đánh giá",
        updateSuccess: "Đã cập nhật trạng thái đánh giá",
        deleteSuccess: "Đã xóa đánh giá",
        bulkUpdateSuccess: "Đã cập nhật trạng thái các đánh giá đã chọn",
        bulkDeleteSuccess: "Đã xóa các đánh giá đã chọn",
        selectAllPage: "Chọn trang này",
        deselectAllPage: "Bỏ chọn trang này",
        showing: "Hiển thị",
        to: "đến",
        of: "trong",
        results: "đánh giá",
        prev: "Trước",
        next: "Sau",
        loadingProducts: "Đang tải sản phẩm...",
    },
    en: {
        title: "Product Reviews",
        subtitle: "Moderate, hide, and monitor customer feedback by product, brand, and category.",
        searchLabel: "Search",
        searchPlaceholder: "Search by product, customer, title, or comment",
        productLabel: "Product",
        productSearch: "Quick search products...",
        allProducts: "All products",
        chooseProduct: "Choose product",
        noProductMatch: "No matching products",
        brandLabel: "Brand",
        allBrands: "All brands",
        categoryLabel: "Category",
        allCategories: "All categories",
        statusLabel: "Status",
        ratingLabel: "Rating",
        all: "All",
        approved: "Visible",
        hidden: "Hidden",
        star1: "1 star",
        star2: "2 stars",
        star3: "3 stars",
        star4: "4 stars",
        star5: "5 stars",
        selectedCount: "selected reviews",
        clearSelection: "Clear selection",
        showSelected: "Show selected",
        hideSelected: "Hide selected",
        deleteSelected: "Delete selected",
        columnReview: "Review",
        columnProduct: "Product",
        columnCustomer: "Customer",
        columnStatus: "Status",
        columnUpdated: "Updated",
        columnActions: "Actions",
        verifiedPurchase: "Verified purchase",
        edited: "Edited",
        moderatedBy: "Moderated by",
        updatedAt: "Updated",
        showAction: "Show",
        hideAction: "Hide",
        deleteAction: "Delete",
        deleteConfirm: "Are you sure you want to delete this review?",
        deleteSelectedConfirm: "Are you sure you want to delete the selected reviews?",
        empty: "No reviews match the current filters.",
        loadError: "Failed to load reviews",
        updateSuccess: "Review status updated",
        deleteSuccess: "Review deleted",
        bulkUpdateSuccess: "Selected reviews updated",
        bulkDeleteSuccess: "Selected reviews deleted",
        selectAllPage: "Select this page",
        deselectAllPage: "Deselect this page",
        showing: "Showing",
        to: "to",
        of: "of",
        results: "reviews",
        prev: "Previous",
        next: "Next",
        loadingProducts: "Loading products...",
    },
};

const STATUS_OPTIONS = ["all", "approved", "hidden"];
const PRODUCT_OPTION_LIMIT = 20;
const PAGE_LIMIT = 8;

const formatDateTime = (value, lang) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
};

const normalizeOptionId = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value._id || value.id || "";
};

const mapProductOption = (product) => ({
    _id: product?._id || "",
    name: product?.name || "",
    brandId: normalizeOptionId(product?.brand),
    categoryId: normalizeOptionId(product?.category),
    image: Array.isArray(product?.images) ? product.images[0] || "" : "",
});

const reviewStatusClass = {
    approved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    hidden: "bg-rose-100 text-rose-700 border border-rose-200",
};

function ReviewsPage({ lang = "vi" }) {
    const t = T[lang] || T.vi;
    const currentUser = readStoredUserProfile();
    const canModerateReviews = hasAdminPermission(currentUser, "product:update");

    const [reviews, setReviews] = useState([]);
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");
    const [productId, setProductId] = useState("all");
    const [brandId, setBrandId] = useState("all");
    const [categoryId, setCategoryId] = useState("all");
    const [status, setStatus] = useState("all");
    const [rating, setRating] = useState("all");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalItems: 0 });
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);

    const [productPickerOpen, setProductPickerOpen] = useState(false);
    const [productQuery, setProductQuery] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productOptions, setProductOptions] = useState([]);
    const [productLoading, setProductLoading] = useState(false);

    const productPickerRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const loadFilterOptions = async () => {
            try {
                const [brandResponse, categoryResponse] = await Promise.all([
                    getBrands({ page: 1, limit: 300, sort: "name:asc" }),
                    getCategories({ page: 1, limit: 300, sort: "name:asc" }),
                ]);

                if (cancelled) return;

                setBrands(Array.isArray(brandResponse?.data) ? brandResponse.data : []);
                setCategories(Array.isArray(categoryResponse?.data) ? categoryResponse.data : []);
            } catch {
                if (!cancelled) {
                    toast.error(t.loadError);
                }
            }
        };

        loadFilterOptions();
        return () => {
            cancelled = true;
        };
    }, [t.loadError]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!productPickerRef.current?.contains(event.target)) {
                setProductPickerOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    useEffect(() => {
        if (!productPickerOpen) return undefined;

        let cancelled = false;

        const loadProducts = async () => {
            try {
                setProductLoading(true);
                const response = await getProducts({
                    page: 1,
                    limit: PRODUCT_OPTION_LIMIT,
                    search: productQuery.trim() || undefined,
                    brand: brandId === "all" ? undefined : brandId,
                    category: categoryId === "all" ? undefined : categoryId,
                    sort: "name:asc",
                });

                if (cancelled) return;

                const items = Array.isArray(response?.data) ? response.data.map(mapProductOption) : [];
                setProductOptions(items);
            } catch {
                if (!cancelled) {
                    setProductOptions([]);
                    toast.error(t.loadError);
                }
            } finally {
                if (!cancelled) {
                    setProductLoading(false);
                }
            }
        };

        loadProducts();
        return () => {
            cancelled = true;
        };
    }, [brandId, categoryId, productPickerOpen, productQuery, t.loadError]);

    useEffect(() => {
        if (!selectedProduct) return;

        const matchesBrand = brandId === "all" || selectedProduct.brandId === brandId;
        const matchesCategory = categoryId === "all" || selectedProduct.categoryId === categoryId;

        if (!matchesBrand || !matchesCategory) {
            setProductId("all");
            setSelectedProduct(null);
            setProductQuery("");
        }
    }, [brandId, categoryId, selectedProduct]);

    useEffect(() => {
        let cancelled = false;

        const loadReviews = async () => {
            try {
                setLoading(true);
                const response = await getAdminProductReviews({
                    page,
                    limit: PAGE_LIMIT,
                    search: search.trim() || undefined,
                    productId: productId === "all" ? undefined : productId,
                    brandId: brandId === "all" ? undefined : brandId,
                    categoryId: categoryId === "all" ? undefined : categoryId,
                    status,
                    rating,
                });

                if (cancelled) return;

                setReviews(Array.isArray(response?.data) ? response.data : []);
                setPagination(response?.pagination || { page: 1, totalPages: 0, totalItems: 0 });
            } catch {
                if (!cancelled) {
                    toast.error(t.loadError);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadReviews();
        return () => {
            cancelled = true;
        };
    }, [brandId, categoryId, page, productId, rating, search, status, t.loadError]);

    useEffect(() => {
        setPage(1);
        setSelectedIds([]);
    }, [search, productId, brandId, categoryId, status, rating]);

    const currentPageIds = reviews.map((review) => review._id);
    const areAllCurrentPageSelected = currentPageIds.length > 0
        && currentPageIds.every((id) => selectedIds.includes(id));

    const handleChooseProduct = (product) => {
        if (!product || product === "all") {
            setProductId("all");
            setSelectedProduct(null);
            setProductQuery("");
            setProductPickerOpen(false);
            return;
        }

        setProductId(product._id);
        setSelectedProduct(product);
        setProductQuery(product.name || "");
        setProductPickerOpen(false);
    };

    const toggleSelected = (reviewId) => {
        if (!canModerateReviews) return;
        setSelectedIds((current) => (
            current.includes(reviewId)
                ? current.filter((id) => id !== reviewId)
                : [...current, reviewId]
        ));
    };

    const toggleSelectPage = () => {
        if (!canModerateReviews) return;
        if (areAllCurrentPageSelected) {
            setSelectedIds((current) => current.filter((id) => !currentPageIds.includes(id)));
            return;
        }

        setSelectedIds((current) => [...new Set([...current, ...currentPageIds])]);
    };

    const handleToggleStatus = async (reviewId, nextStatus) => {
        if (!canModerateReviews) return;
        try {
            setActionId(reviewId);
            await updateAdminProductReviewStatus(reviewId, nextStatus);
            setReviews((current) => current.map((review) => (
                review._id === reviewId
                    ? { ...review, status: nextStatus, moderatedAt: new Date().toISOString() }
                    : review
            )));
            toast.success(t.updateSuccess);
        } catch (error) {
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            setActionId("");
        }
    };

    const handleDelete = async (reviewId) => {
        if (!canModerateReviews) return;
        if (!window.confirm(t.deleteConfirm)) return;

        try {
            setActionId(reviewId);
            await deleteAdminProductReview(reviewId);
            setReviews((current) => current.filter((review) => review._id !== reviewId));
            setSelectedIds((current) => current.filter((id) => id !== reviewId));
            setPagination((current) => ({
                ...current,
                totalItems: Math.max(0, Number(current.totalItems || 0) - 1),
            }));
            toast.success(t.deleteSuccess);
        } catch (error) {
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            setActionId("");
        }
    };

    const handleBulkStatus = async (nextStatus) => {
        if (!canModerateReviews) return;
        if (selectedIds.length === 0) return;

        try {
            setActionId(`bulk-${nextStatus}`);
            await bulkUpdateAdminProductReviewStatus(selectedIds, nextStatus);
            setReviews((current) => current.map((review) => (
                selectedIds.includes(review._id)
                    ? { ...review, status: nextStatus, moderatedAt: new Date().toISOString() }
                    : review
            )));
            toast.success(t.bulkUpdateSuccess);
        } catch (error) {
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            setActionId("");
        }
    };

    const handleBulkDelete = async () => {
        if (!canModerateReviews) return;
        if (selectedIds.length === 0) return;
        if (!window.confirm(t.deleteSelectedConfirm)) return;

        try {
            setActionId("bulk-delete");
            await bulkDeleteAdminProductReviews(selectedIds);
            setReviews((current) => current.filter((review) => !selectedIds.includes(review._id)));
            setSelectedIds([]);
            toast.success(t.bulkDeleteSuccess);
        } catch (error) {
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            setActionId("");
        }
    };

    const renderStars = (value) => (
        <div className="flex items-center gap-1 text-amber-400">
            {Array.from({ length: 5 }, (_, index) => (
                <span key={index} className="text-base leading-none">
                    {index < Number(value || 0) ? "★" : "☆"}
                </span>
            ))}
        </div>
    );

    return (
        <div className="p-5 lg:p-8 mx-auto max-w-[1600px] space-y-6">
            <div>
                <h1 className="text-3xl font-black text-slate-900">{t.title}</h1>
                <p className="mt-2 text-slate-500">{t.subtitle}</p>
            </div>

            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.95fr)_220px_220px_200px_180px]">
                    <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                            {t.searchLabel}
                        </span>
                        <div className="relative">
                            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                search
                            </span>
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder={t.searchPlaceholder}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-700 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                            />
                        </div>
                    </label>

                    <div className="space-y-2" ref={productPickerRef}>
                        <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                            {t.productLabel}
                        </span>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setProductPickerOpen((current) => !current)}
                                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-white focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
                            >
                                <span className={`truncate ${selectedProduct ? "text-slate-900" : "text-slate-500"}`}>
                                    {selectedProduct?.name || t.allProducts}
                                </span>
                                <span className="material-symbols-outlined text-slate-400">expand_more</span>
                            </button>

                            {productPickerOpen ? (
                                <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/80">
                                    <div className="border-b border-slate-100 p-3">
                                        <div className="relative">
                                            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                search
                                            </span>
                                            <input
                                                autoFocus
                                                value={productQuery}
                                                onChange={(event) => setProductQuery(event.target.value)}
                                                placeholder={t.productSearch}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-700 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                                            />
                                        </div>
                                    </div>

                                    <div className="max-h-80 overflow-y-auto p-2">
                                        <button
                                            type="button"
                                            onClick={() => handleChooseProduct("all")}
                                            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${productId === "all"
                                                ? "bg-primary/10 text-primary"
                                                : "text-slate-700 hover:bg-slate-50"
                                                }`}
                                        >
                                            <span className="truncate">{t.allProducts}</span>
                                            {productId === "all" ? (
                                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                            ) : null}
                                        </button>

                                        {productLoading ? (
                                            <div className="px-4 py-5 text-sm text-slate-500">{t.loadingProducts}</div>
                                        ) : productOptions.length === 0 ? (
                                            <div className="px-4 py-5 text-sm text-slate-500">{t.noProductMatch}</div>
                                        ) : (
                                            productOptions.map((product) => (
                                                <button
                                                    key={product._id}
                                                    type="button"
                                                    onClick={() => handleChooseProduct(product)}
                                                    className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${productId === product._id
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-slate-700 hover:bg-slate-50"
                                                        }`}
                                                >
                                                    <span className="truncate">{product.name || t.chooseProduct}</span>
                                                    {productId === product._id ? (
                                                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                                    ) : null}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                            {t.brandLabel}
                        </span>
                        <select
                            value={brandId}
                            onChange={(event) => setBrandId(event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                        >
                            <option value="all">{t.allBrands}</option>
                            {brands.map((brand) => (
                                <option key={brand._id} value={brand._id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                            {t.categoryLabel}
                        </span>
                        <select
                            value={categoryId}
                            onChange={(event) => setCategoryId(event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                        >
                            <option value="all">{t.allCategories}</option>
                            {categories.map((category) => (
                                <option key={category._id} value={category._id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                            {t.statusLabel}
                        </span>
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option === "approved" ? t.approved : option === "hidden" ? t.hidden : t.all}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                            {t.ratingLabel}
                        </span>
                        <select
                            value={rating}
                            onChange={(event) => setRating(event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                        >
                            <option value="all">{t.all}</option>
                            <option value="5">{t.star5}</option>
                            <option value="4">{t.star4}</option>
                            <option value="3">{t.star3}</option>
                            <option value="2">{t.star2}</option>
                            <option value="1">{t.star1}</option>
                        </select>
                    </label>
                </div>
            </section>

            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4 lg:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            {canModerateReviews ? (
                                <button
                                    type="button"
                                    onClick={toggleSelectPage}
                                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    {areAllCurrentPageSelected ? t.deselectAllPage : t.selectAllPage}
                                </button>
                            ) : null}

                            {canModerateReviews && selectedIds.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                                        {selectedIds.length} {t.selectedCount}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedIds([])}
                                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        {t.clearSelection}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionId === "bulk-approved"}
                                        onClick={() => handleBulkStatus("approved")}
                                        className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                    >
                                        {t.showSelected}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionId === "bulk-hidden"}
                                        onClick={() => handleBulkStatus("hidden")}
                                        className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
                                    >
                                        {t.hideSelected}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionId === "bulk-delete"}
                                        onClick={handleBulkDelete}
                                        className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                                    >
                                        {t.deleteSelected}
                                    </button>
                                </div>
                            ) : null}
                        </div>

                        <span className="text-sm text-slate-500">
                            {pagination.totalItems || 0} {t.results}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-4 p-5 lg:p-6">
                        {Array.from({ length: 4 }, (_, index) => (
                            <div
                                key={index}
                                className="h-44 animate-pulse rounded-[28px] border border-slate-100 bg-slate-50"
                            />
                        ))}
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="px-6 py-16 text-center text-slate-500">{t.empty}</div>
                ) : (
                    <>
                        <div className="grid gap-4 p-5 lg:p-6">
                            {reviews.map((review) => {
                                const nextStatus = review.status === "approved" ? "hidden" : "approved";
                                return (
                                    <article
                                        key={review._id}
                                        className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 transition hover:border-primary/30 hover:bg-white"
                                    >
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                            <div className="flex items-start gap-4">
                                                {canModerateReviews ? (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(review._id)}
                                                        onChange={() => toggleSelected(review._id)}
                                                        className="mt-1 h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                                                    />
                                                ) : null}

                                                <div className="min-w-0 space-y-4">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${reviewStatusClass[review.status] || reviewStatusClass.approved}`}>
                                                            {review.status === "hidden" ? t.hidden : t.approved}
                                                        </span>
                                                        {review.isVerifiedPurchase ? (
                                                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                                                                {t.verifiedPurchase}
                                                            </span>
                                                        ) : null}
                                                        {review.isEdited ? (
                                                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                                                                {t.edited}
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,0.8fr)]">
                                                        <div className="space-y-3">
                                                            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                                                                {t.columnReview}
                                                            </p>
                                                            {renderStars(review.rating)}
                                                            <div className="space-y-2">
                                                                <h3 className="text-lg font-black text-slate-900">
                                                                    {review.title || "—"}
                                                                </h3>
                                                                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                                                    {review.comment || "—"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                                                                {t.columnProduct}
                                                            </p>
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-14 w-14 overflow-hidden rounded-2xl bg-slate-200">
                                                                    {review.product?.image ? (
                                                                        <img
                                                                            src={review.product.image}
                                                                            alt={review.product?.name || ""}
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                    ) : null}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-bold text-slate-900">
                                                                        {review.product?.name || "—"}
                                                                    </p>
                                                                    <p className="truncate text-xs text-slate-500">
                                                                        {review.product?.slug || "—"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                                                                {t.columnCustomer}
                                                            </p>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-slate-200 text-sm font-bold text-slate-600">
                                                                    {review.user?.avatar ? (
                                                                        <img
                                                                            src={review.user.avatar}
                                                                            alt={review.user?.name || ""}
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <span>{String(review.user?.name || "?").slice(0, 1).toUpperCase()}</span>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-bold text-slate-900">
                                                                        {review.user?.name || "—"}
                                                                    </p>
                                                                    <p className="truncate text-xs text-slate-500">
                                                                        {review.user?.email || "—"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2 xl:min-w-[340px] xl:max-w-[360px] xl:grid-cols-1">
                                                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                                    <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                                                        {t.columnUpdated}
                                                    </p>
                                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                                                        {formatDateTime(review.updatedAt || review.createdAt, lang)}
                                                    </p>
                                                    <p className="mt-2 text-xs text-slate-500">
                                                        {t.moderatedBy}: {review.moderatedBy?.name || "—"}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {t.updatedAt}: {formatDateTime(review.moderatedAt, lang)}
                                                    </p>
                                                </div>

                                                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                                    <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                                                        {t.columnActions}
                                                    </p>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {canModerateReviews ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    disabled={actionId === review._id}
                                                                    onClick={() => handleToggleStatus(review._id, nextStatus)}
                                                                    className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${review.status === "approved"
                                                                        ? "bg-amber-500 hover:bg-amber-600"
                                                                        : "bg-emerald-600 hover:bg-emerald-700"
                                                                        }`}
                                                                >
                                                                    {review.status === "approved" ? t.hideAction : t.showAction}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={actionId === review._id}
                                                                    onClick={() => handleDelete(review._id)}
                                                                    className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                                                                >
                                                                    {t.deleteAction}
                                                                </button>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        <Pagination
                            page={pagination.page || page}
                            limit={PAGE_LIMIT}
                            total={pagination.totalItems || 0}
                            totalPages={pagination.totalPages || 0}
                            onPageChange={setPage}
                            showingText={t.showing}
                            toText={t.to}
                            ofText={t.of}
                            resultsText={t.results}
                            prevText={t.prev}
                            nextText={t.next}
                        />
                    </>
                )}
            </section>
        </div>
    );
}

export default ReviewsPage;
