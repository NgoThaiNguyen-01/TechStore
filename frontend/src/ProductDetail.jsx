import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deleteMyProductReview, getProductById, getProductReviews, getProducts, saveMyProductReview } from "./services/productApi";
import { toast } from "sonner";
import Footer from "./components/Footer";
import { addToCart, buildCartItemFromProduct } from "./utils/cartStorage";
import { readStoredUserProfile } from "./utils/userProfile";

const T = {
    vi: {
        back: "Quay lại",
        inStock: "Còn hàng",
        outOfStock: "Hết hàng",
        quantity: "Số lượng",
        buyNow: "Mua ngay",
        addToCart: "Thêm vào giỏ",
        description: "Mô tả",
        specs: "Thông số kỹ thuật",
        reviews: "Đánh giá",
        related: "Sản phẩm liên quan",
        viewAll: "Xem tất cả",
        viewLess: "Thu gọn",
        noDesc: "Combo Creator Vlog Kit là bộ thiết bị quay phim chuyên nghiệp dành cho vlogger, travel blogger và nhà sáng tạo nội dung. Bộ combo này giúp bạn quay video chất lượng cao với khả năng chống rung mạnh mẽ và quay video độ phân giải cao.\n\nCombo bao gồm:\n- GoPro Hero 12 Black\n- Pin dự phòng GoPro\n- Gậy selfie + tripod\n- Thẻ nhớ tốc độ cao 128GB\n\nƯu điểm nổi bật:\n• Quay video độ phân giải 5.3K siêu nét\n• Công nghệ chống rung HyperSmooth cực kỳ ổn định\n• Chống nước đến 10m không cần housing\n• Thiết kế nhỏ gọn, phù hợp du lịch và thể thao\n\nCombo Creator Vlog Kit là lựa chọn hoàn hảo cho những ai muốn bắt đầu hành trình sáng tạo nội dung.",
        noShortDesc: "Bộ combo dành cho vlogger và nhà sáng tạo nội dung, giúp quay video chất lượng cao trong mọi điều kiện như du lịch, thể thao và vlog cá nhân.",
        noSpecs: "Chưa có thông số kỹ thuật.",
        noReviews: "Chưa có đánh giá nào cho sản phẩm này.",
        unknownError: "Đã xảy ra lỗi, vui lòng thử lại",
        colorLabel: "Màu sắc",
        selectedColor: "Màu đã chọn",
        fastDelivery: "Giao nhanh",
        authentic: "Chính hãng",
        support: "Hỗ trợ 24/7",
        reviewsCount: (count) => `${count} đánh giá`,
        averageRating: "Điểm trung bình",
        writeReview: "Đánh giá của bạn",
        reviewHint: "Mỗi tài khoản có thể gửi 1 đánh giá và cập nhật lại sau.",
        ratingLabel: "Số sao",
        reviewTitle: "Tiêu đề",
        reviewComment: "Nội dung đánh giá",
        reviewTitlePlaceholder: "Tóm tắt ngắn cảm nhận của bạn",
        reviewCommentPlaceholder: "Chia sẻ trải nghiệm sử dụng, điểm mạnh hoặc điểm cần cải thiện...",
        saveReview: "Lưu đánh giá",
        deleteReview: "Xóa đánh giá",
        reviewSaved: "Đã lưu đánh giá",
        reviewDeleted: "Đã xóa đánh giá",
        reviewLoadError: "Không thể tải đánh giá",
        reviewSaveError: "Không thể lưu đánh giá",
        reviewDeleteError: "Không thể xóa đánh giá",
        reviewsLoading: "Đang tải đánh giá...",
        savingReview: "Đang lưu...",
        deletingReview: "Đang xóa...",
        verifiedPurchase: "Đã mua hàng",
        hiddenReview: "Đang ẩn",
        purchaseRequiredTitle: "Chỉ khách đã mua mới được đánh giá",
        purchaseRequiredDesc: "Bạn cần có đơn hàng đã hoàn thành cho sản phẩm này để gửi đánh giá.",
        loginToReview: "Đăng nhập để đánh giá",
        loginToReviewDesc: "Bạn cần đăng nhập để chia sẻ trải nghiệm với sản phẩm này.",
        signIn: "Đăng nhập",
        chooseRating: "Vui lòng chọn số sao",
        edited: "Đã chỉnh sửa",
        you: "Bạn",
        confirmDeleteReview: "Bạn có chắc muốn xóa đánh giá này không?",
        noReviewTitle: "Không có tiêu đề",
    },
    en: {
        back: "Back",
        inStock: "In stock",
        outOfStock: "Out of stock",
        quantity: "Quantity",
        buyNow: "Buy now",
        addToCart: "Add to cart",
        description: "Description",
        specs: "Technical Specs",
        reviews: "Reviews",
        related: "Related products",
        viewAll: "View all",
        viewLess: "View less",
        noDesc: "No description.",
        noShortDesc: "No short description.",
        noSpecs: "No specifications yet.",
        noReviews: "No reviews for this product yet.",
        unknownError: "Something went wrong, please try again",
        colorLabel: "Color",
        selectedColor: "Selected color",
        fastDelivery: "Fast delivery",
        authentic: "Authentic",
        support: "24/7 support",
        reviewsCount: (count) => `${count} reviews`,
        averageRating: "Average rating",
        writeReview: "Your review",
        reviewHint: "Each account can submit one review and update it later.",
        ratingLabel: "Rating",
        reviewTitle: "Title",
        reviewComment: "Review",
        reviewTitlePlaceholder: "Summarize your experience",
        reviewCommentPlaceholder: "Share your experience, highlights, or what could be improved...",
        saveReview: "Save review",
        deleteReview: "Delete review",
        reviewSaved: "Review saved",
        reviewDeleted: "Review deleted",
        reviewLoadError: "Failed to load reviews",
        reviewSaveError: "Failed to save review",
        reviewDeleteError: "Failed to delete review",
        reviewsLoading: "Loading reviews...",
        savingReview: "Saving...",
        deletingReview: "Deleting...",
        verifiedPurchase: "Verified purchase",
        hiddenReview: "Hidden",
        purchaseRequiredTitle: "Only verified buyers can review",
        purchaseRequiredDesc: "You need a completed order for this product before you can submit a review.",
        loginToReview: "Sign in to review",
        loginToReviewDesc: "Please sign in to share your experience with this product.",
        signIn: "Sign in",
        chooseRating: "Please choose a rating",
        edited: "Edited",
        you: "You",
        confirmDeleteReview: "Are you sure you want to delete this review?",
        noReviewTitle: "No title",
    },
};

const readStoredUser = () => readStoredUserProfile();

const formatRatingValue = (value) => {
    const numeric = Number(value || 0);
    return numeric > 0 ? numeric.toFixed(1) : "0.0";
};

const formatReviewCount = (t, count) => {
    if (typeof t.reviewsCount === "function") {
        return t.reviewsCount(count);
    }
    return t.reviewsCount;
};

const formatReviewDate = (value, lang) => {
    if (!value) return "";
    try {
        return new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
            dateStyle: "medium",
        }).format(new Date(value));
    } catch {
        return String(value);
    }
};

export default function ProductDetail({
    lang = "vi",
    setLang,
    productId,
    onNavigateHome,
    onNavigateCategory,
    onNavigateCart,
    onNavigateLogin,
    onNavigateProduct,
}) {
    const t = T[lang] || T.vi;
    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [showAllRelated, setShowAllRelated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewSaving, setReviewSaving] = useState(false);
    const [reviewDeleting, setReviewDeleting] = useState(false);
    const [tab, setTab] = useState("desc");
    const [qty, setQty] = useState(1);
    const [selectedColor, setSelectedColor] = useState(null);
    const [activeImage, setActiveImage] = useState(null);
    const [currentUser, setCurrentUser] = useState(() => readStoredUser());
    const [reviewForm, setReviewForm] = useState({ rating: 0, title: "", comment: "" });
    const [reviewViewer, setReviewViewer] = useState({
        canReview: false,
        isAuthenticated: false,
        isVerifiedPurchase: false,
        orderNumber: "",
        reason: "",
    });
    const unknownErrorRef = useRef(t.unknownError);
    const currentUserId = currentUser?._id || currentUser?.id || "";

    const applyReviewSummary = useCallback((summary) => {
        setProduct((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                ratingAverage: Number(summary?.ratingAverage || 0),
                reviewCount: Number(summary?.reviewCount || 0),
            };
        });
    }, []);

    const loadReviews = useCallback(async (id) => {
        if (!id) {
            setReviews([]);
            return;
        }

        setReviewsLoading(true);
        try {
            const response = await getProductReviews(id);
            setReviews(response?.data || []);
            applyReviewSummary(response?.summary);
            setReviewViewer(response?.viewer || {
                canReview: false,
                isAuthenticated: false,
                isVerifiedPurchase: false,
                orderNumber: "",
                reason: "",
            });
        } catch (error) {
            setReviews([]);
            setReviewViewer({
                canReview: false,
                isAuthenticated: false,
                isVerifiedPurchase: false,
                orderNumber: "",
                reason: "",
            });
            toast.error(error?.response?.data?.message || t.reviewLoadError);
        } finally {
            setReviewsLoading(false);
        }
    }, [applyReviewSummary, t.reviewLoadError]);

    const myReview = useMemo(
        () => reviews.find((review) => String(review?.user?._id) === String(currentUserId)) || null,
        [currentUserId, reviews]
    );

    const images = useMemo(() => {
        if (!product) return [];
        if (Array.isArray(product.images) && product.images.length > 0) return product.images;
        if (product.img) return [product.img];
        return [];
    }, [product]);

    useEffect(() => {
        unknownErrorRef.current = t.unknownError;
    }, [t.unknownError]);

    useEffect(() => {
        const syncUser = () => setCurrentUser(readStoredUser());
        window.addEventListener("storage", syncUser);
        window.addEventListener("user:updated", syncUser);
        return () => {
            window.removeEventListener("storage", syncUser);
            window.removeEventListener("user:updated", syncUser);
        };
    }, []);

    useEffect(() => {
        if (!productId) return;
        const fetchDetail = async () => {
            setLoading(true);
            try {
                const res = await getProductById(productId);
                setProduct(res.data || null);
                setSelectedColor(null);
                setQty(res.data?.stock > 0 ? 1 : 0);
                setTab("desc");
            } catch (err) {
                toast.error(err.response?.data?.message || unknownErrorRef.current);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [productId]);

    useEffect(() => {
        void loadReviews(productId);
    }, [currentUserId, loadReviews, productId]);

    useEffect(() => {
        if (!product?.category?._id) {
            setRelated([]);
            return;
        }
        const fetchRelated = async () => {
            try {
                const res = await getProducts({ page: 1, limit: 13, status: "active", category: product.category._id });
                const items = (res.data || []).filter((p) => p._id !== product._id);
                setRelated(items);
            } catch {
                setRelated([]);
            }
        };
        fetchRelated();
    }, [product]);

    useEffect(() => {
        if (!images.length) {
            setActiveImage(null);
            return;
        }
        setActiveImage(images[0]);
    }, [images]);

    useEffect(() => {
        if (myReview) {
            setReviewForm({
                rating: Number(myReview.rating || 0),
                title: myReview.title || "",
                comment: myReview.comment || "",
            });
            return;
        }
        setReviewForm({ rating: 0, title: "", comment: "" });
    }, [myReview, productId]);

    const handleAddCurrentProductToCart = (shouldNavigate = false) => {
        if (!product) return;
        if (product.colors && product.colors.length > 0 && !selectedColor) {
            toast.error(lang === "vi" ? "Vui lòng chọn màu" : "Please choose a color");
            return;
        }
        addToCart(buildCartItemFromProduct({ product, qty, selectedColor }));
        toast.success(lang === "vi" ? "Đã thêm vào giỏ hàng" : "Added to cart");
        if (shouldNavigate) {
            onNavigateCart?.();
        }
    };

    const handleReviewFieldChange = (field, value) => {
        setReviewForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSaveReview = async () => {
        if (!currentUser) {
            toast.error(t.loginToReview);
            onNavigateLogin?.();
            return;
        }
        if (!product?._id) return;
        if (!reviewForm.rating) {
            toast.error(t.chooseRating);
            return;
        }

        setReviewSaving(true);
        try {
            const response = await saveMyProductReview(product._id, reviewForm);
            applyReviewSummary(response?.summary);
            toast.success(t.reviewSaved);
            await loadReviews(product._id);
        } catch (error) {
            toast.error(error?.response?.data?.message || t.reviewSaveError);
        } finally {
            setReviewSaving(false);
        }
    };

    const handleDeleteReview = async () => {
        if (!product?._id || !myReview) return;
        if (!window.confirm(t.confirmDeleteReview)) return;

        setReviewDeleting(true);
        try {
            const response = await deleteMyProductReview(product._id);
            applyReviewSummary(response?.summary);
            toast.success(t.reviewDeleted);
            await loadReviews(product._id);
        } catch (error) {
            toast.error(error?.response?.data?.message || t.reviewDeleteError);
        } finally {
            setReviewDeleting(false);
        }
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined || value === "") return "";
        try {
            return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
        } catch {
            return String(value);
        }
    };

    const salePercent = product?.salePrice && product?.price && product.salePrice < product.price
        ? Math.round((1 - (product.salePrice / product.price)) * 100)
        : null;

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
                <div className="max-w-6xl mx-auto px-4 lg:px-10 py-10">
                    <div className="h-10 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg mb-6" />
                    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8">
                        <div className="h-[380px] bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                        <div className="space-y-4">
                            <div className="h-6 w-56 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-5 w-72 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-10 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display flex items-center justify-center">
                <button onClick={onNavigateHome} className="px-6 py-3 rounded-xl bg-primary text-white font-bold">
                    {t.back}
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-4 lg:px-10 py-4 flex items-center justify-between">
                    <button onClick={onNavigateHome} className="flex items-center gap-2 text-base font-bold text-orange-500 hover:text-orange-600">
                        <span className="material-symbols-outlined text-2xl">arrow_back</span>
                        {t.back}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const id = product.category?._id;
                            if (id && onNavigateCategory) onNavigateCategory(id);
                        }}
                        className="text-sm uppercase tracking-widest font-bold text-orange-500 hover:text-orange-600 transition-colors"
                    >
                        {product.category?.name || ""}
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 lg:px-10 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8">
                    <div className="space-y-4">
                        <div className="relative rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 h-[380px] flex items-center justify-center overflow-hidden">
                            {activeImage && (
                                <img className="max-h-full max-w-full object-contain" src={activeImage} alt={product.name} />
                            )}
                            {salePercent !== null && (
                                <span className="absolute top-4 left-4 bg-red-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                                    -{salePercent}%
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            {images.slice(0, 5).map((img) => (
                                <button
                                    key={img}
                                    onClick={() => setActiveImage(img)}
                                    className={`w-20 h-20 rounded-xl border ${activeImage === img ? "border-primary" : "border-slate-200"} bg-white flex items-center justify-center overflow-hidden hover:border-primary transition-colors`}
                                >
                                    <img className="max-h-full max-w-full object-contain" src={img} alt={product.name} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            {product.brand?.name && (
                                <div className="mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">
                                        {product.brand.name}
                                    </span>
                                </div>
                            )}
                            <h1 className="text-2xl font-black">{product.name}</h1>
                            <div className="flex items-center gap-2 text-amber-500 mt-2">
                                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                <span className="text-sm font-semibold">{formatRatingValue(product.ratingAverage)}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-300">
                                    ({formatReviewCount(t, Number(product.reviewCount || 0))})
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-black text-red-500">
                                {formatCurrency(product.salePrice ?? product.price) || product.price}
                            </span>
                            {product.salePrice && product.salePrice < product.price && (
                                <span className="text-sm text-slate-400 line-through">{formatCurrency(product.price)}</span>
                            )}
                        </div>

                        {product.colors && product.colors.length > 0 && (
                            <div>
                                <p className="text-sm font-semibold text-slate-600 mb-2">{t.colorLabel}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {product.colors.map((color) => (
                                        <button
                                            key={color.hex}
                                            onClick={() => setSelectedColor(color)}
                                            className={`w-8 h-8 rounded-full border ${selectedColor?.hex?.toLowerCase() === color.hex.toLowerCase() ? "ring-2 ring-primary ring-offset-1 border-primary" : "border-slate-200"} transition`}
                                            title={color.name}
                                            style={{ backgroundColor: color.hex }}
                                        />
                                    ))}
                                </div>
                                {selectedColor && (
                                    <p className="text-xs text-slate-500 mt-2">
                                        {t.selectedColor}: <span className="font-semibold text-slate-700">{selectedColor.name}</span>
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold text-slate-600">{t.quantity}</span>
                            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setQty((q) => Math.max(product.stock > 0 ? 1 : 0, q - 1))}
                                    disabled={qty <= (product.stock > 0 ? 1 : 0)}
                                    className="px-3 py-2 text-slate-500 hover:text-primary hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-sm">remove</span>
                                </button>
                                <span className="px-4 py-2 text-sm font-semibold text-slate-700 w-12 text-center">{qty}</span>
                                <button
                                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                                    disabled={qty >= product.stock}
                                    className="px-3 py-2 text-slate-500 hover:text-primary hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                </button>
                            </div>
                            <span className={`text-sm font-bold ${product.stock > 0 ? "text-emerald-500" : "text-red-500"}`}>
                                {product.stock > 0 ? t.inStock : t.outOfStock}
                            </span>
                        </div>

                        <div className="flex gap-3">
                            <button
                                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                                type="button"
                                disabled={product.stock <= 0}
                                onClick={() => {
                                    if (product.colors && product.colors.length > 0 && !selectedColor) {
                                        toast.error(lang === "vi" ? "Vui lòng chọn màu" : "Please choose a color");
                                        return;
                                    }
                                    addToCart(buildCartItemFromProduct({ product, qty, selectedColor }));
                                    toast.success(lang === "vi" ? "Đã thêm vào giỏ hàng" : "Added to cart");
                                }}
                            >
                                <span className="material-symbols-outlined text-xl">shopping_bag</span>
                                {t.addToCart}
                            </button>
                            <button
                                className="flex-1 border border-primary text-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed"
                                type="button"
                                disabled={product.stock <= 0}
                                onClick={() => handleAddCurrentProductToCart(true)}
                            >
                                <span className="material-symbols-outlined text-xl">bolt</span>
                                {t.buyNow}
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-xs text-slate-500">
                            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
                                <span className="material-symbols-outlined text-sm">local_shipping</span>
                                {t.fastDelivery}
                            </div>
                            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
                                <span className="material-symbols-outlined text-sm">verified</span>
                                {t.authentic}
                            </div>
                            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
                                <span className="material-symbols-outlined text-sm">support_agent</span>
                                {t.support}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 border-t border-slate-200 pt-6">
                    <div className="flex gap-6 text-sm font-semibold">
                        <button onClick={() => setTab("desc")} className={tab === "desc" ? "text-primary" : "text-slate-400"}>{t.description}</button>
                        <button onClick={() => setTab("specs")} className={tab === "specs" ? "text-primary" : "text-slate-400"}>{t.specs}</button>
                        <button onClick={() => setTab("reviews")} className={tab === "reviews" ? "text-primary" : "text-slate-400"}>{t.reviews}</button>
                    </div>
                    {tab === "desc" && (
                        <div className="mt-5 space-y-8 text-sm md:text-base leading-relaxed text-slate-700 dark:text-slate-200">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                                    {lang === "vi" ? "Mô tả ngắn" : "Short description"}
                                </p>
                                <div className="pl-3">
                                    {product.shortDesc || t.noShortDesc}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                                    {lang === "vi" ? "Mô tả chi tiết" : "Detailed description"}
                                </p>
                                <div className="pl-3 whitespace-pre-line">
                                    {product.description || t.noDesc}
                                </div>
                            </div>
                        </div>
                    )}
                    {tab === "specs" && (
                        <div className="mt-3">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-primary">settings</span>
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase">{t.specs}</h3>
                            </div>
                            {product.specs && product.specs.length > 0 ? (
                                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                                    <div className="grid grid-cols-2 bg-slate-50 dark:bg-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        <div className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">{lang === "vi" ? "Thông số" : "Specification"}</div>
                                        <div className="px-4 py-3">{lang === "vi" ? "Mô tả" : "Description"}</div>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {product.specs.map((spec, idx) => (
                                            <div key={`${spec.key}-${idx}`} className="grid grid-cols-2 text-sm">
                                                <div className="px-4 py-3 border-r border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-200 bg-slate-50/60 dark:bg-slate-800/60">
                                                    {spec.key}
                                                </div>
                                                <div className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                    {spec.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-600 dark:text-slate-300">{t.noSpecs}</p>
                            )}
                        </div>
                    )}
                    {tab === "reviews" && (
                        <div className="mt-5 space-y-6">
                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                                <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                        {t.averageRating}
                                    </div>
                                    <div className="mt-3 flex items-end gap-3">
                                        <span className="text-4xl font-black text-slate-900 dark:text-white">
                                            {formatRatingValue(product.ratingAverage)}
                                        </span>
                                        <div className="pb-1 text-sm text-slate-500 dark:text-slate-300">
                                            {formatReviewCount(t, Number(product.reviewCount || 0))}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-1 text-amber-500">
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <span
                                                key={`summary-star-${index}`}
                                                className="material-symbols-outlined text-[18px]"
                                                style={{
                                                    fontVariationSettings: `'FILL' ${index < Math.round(Number(product.ratingAverage || 0)) ? 1 : 0}`,
                                                }}
                                            >
                                                star
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white">{t.writeReview}</h3>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{t.reviewHint}</p>
                                        </div>
                                        {myReview && (
                                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                                                {t.edited}
                                            </span>
                                        )}
                                    </div>

                                    {!currentUser ? (
                                        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                                            <div className="font-semibold">{t.loginToReview}</div>
                                            <div className="mt-1">{t.loginToReviewDesc}</div>
                                            <button
                                                type="button"
                                                onClick={() => onNavigateLogin?.()}
                                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">login</span>
                                                {t.signIn}
                                            </button>
                                        </div>
                                    ) : !reviewViewer.canReview ? (
                                        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                                            <div className="font-semibold">{t.purchaseRequiredTitle}</div>
                                            <div className="mt-1">{t.purchaseRequiredDesc}</div>
                                        </div>
                                    ) : (
                                        <div className="mt-5 space-y-4">
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                    {t.ratingLabel}
                                                </label>
                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    {Array.from({ length: 5 }).map((_, index) => {
                                                        const starValue = index + 1;
                                                        const active = starValue <= Number(reviewForm.rating || 0);
                                                        return (
                                                            <button
                                                                key={`review-star-${starValue}`}
                                                                type="button"
                                                                onClick={() => handleReviewFieldChange("rating", starValue)}
                                                                className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors ${active
                                                                    ? "border-amber-300 bg-amber-50 text-amber-500"
                                                                    : "border-slate-200 bg-white text-slate-300 hover:border-amber-200 hover:text-amber-400"
                                                                    } dark:border-slate-700 dark:bg-slate-900`}
                                                            >
                                                                <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${active ? 1 : 0}` }}>
                                                                    star
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                        {t.reviewTitle}
                                                    </label>
                                                    <input
                                                        value={reviewForm.title}
                                                        onChange={(event) => handleReviewFieldChange("title", event.target.value)}
                                                        placeholder={t.reviewTitlePlaceholder}
                                                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                        {t.reviewComment}
                                                    </label>
                                                    <textarea
                                                        rows={4}
                                                        value={reviewForm.comment}
                                                        onChange={(event) => handleReviewFieldChange("comment", event.target.value)}
                                                        placeholder={t.reviewCommentPlaceholder}
                                                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={handleSaveReview}
                                                    disabled={reviewSaving}
                                                    className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {reviewSaving ? "progress_activity" : "save"}
                                                    </span>
                                        {reviewSaving ? t.savingReview : t.saveReview}
                                                </button>
                                                {myReview && (
                                                    <button
                                                        type="button"
                                                        onClick={handleDeleteReview}
                                                        disabled={reviewDeleting}
                                                        className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">
                                                            {reviewDeleting ? "progress_activity" : "delete"}
                                                        </span>
                                                        {reviewDeleting ? t.deletingReview : t.deleteReview}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {reviewsLoading ? (
                                    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                                        {t.reviewsLoading}
                                    </div>
                                ) : reviews.length > 0 ? (
                                    reviews.map((review) => (
                                        <article
                                            key={review._id}
                                            className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                                        >
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="flex items-start gap-3">
                                                    {review.user?.avatar ? (
                                                        <img
                                                            src={review.user.avatar}
                                                            alt={review.user?.name || t.you}
                                                            className="h-11 w-11 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                                                            {String(review.user?.name || t.you).slice(0, 1).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-bold text-slate-900 dark:text-white">
                                                                {String(review.user?._id) === String(currentUserId) ? t.you : review.user?.name || t.you}
                                                            </span>
                                                            {review.isVerifiedPurchase && (
                                                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                                                    {t.verifiedPurchase}
                                                                </span>
                                                            )}
                                                            {review.status === "hidden" && (
                                                                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                                                                    {t.hiddenReview}
                                                                </span>
                                                            )}
                                                            {review.isEdited && (
                                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                    {t.edited}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            {formatReviewDate(review.updatedAt || review.createdAt, lang)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 text-amber-500">
                                                    {Array.from({ length: 5 }).map((_, index) => (
                                                        <span
                                                            key={`${review._id}-star-${index}`}
                                                            className="material-symbols-outlined text-[18px]"
                                                            style={{ fontVariationSettings: `'FILL' ${index < Number(review.rating || 0) ? 1 : 0}` }}
                                                        >
                                                            star
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {(review.title || review.comment) && (
                                                <div className="mt-4 space-y-2">
                                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                                        {review.title || t.noReviewTitle}
                                                    </h4>
                                                    {review.comment && (
                                                        <p className="whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
                                                            {review.comment}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </article>
                                    ))
                                ) : (
                                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                                        {t.noReviews}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-black text-2xl text-yellow-500">{t.related}</h3>
                        <button
                            onClick={() => setShowAllRelated(!showAllRelated)}
                            className="text-sm text-yellow-500 font-bold hover:underline underline-offset-4 transition-all"
                        >
                            {showAllRelated ? t.viewLess : t.viewAll}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {(showAllRelated ? related : related.slice(0, 4)).map((item) => (
                            <div key={item._id} className="group bg-white dark:bg-slate-800/30 rounded-3xl p-4 border border-slate-200 dark:border-slate-800/50 hover:shadow-2xl transition-all hover:scale-[1.02] flex flex-col h-full">
                                <div className="h-48 md:h-56 relative rounded-2xl bg-slate-50 dark:bg-slate-800/80 mb-4 overflow-hidden flex items-center justify-center shrink-0">
                                    {typeof item.salePrice === "number" && item.salePrice < item.price && (
                                        <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold z-10">
                                            -{Math.round((1 - (item.salePrice / item.price)) * 100)}%
                                        </span>
                                    )}
                                    <img className="max-h-[85%] max-w-[85%] object-contain transition-transform duration-500 group-hover:scale-110" alt={item.name} src={item.images?.[0] || item.img || ""} />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex flex-wrap gap-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded truncate">
                                                {item.category?.name || ""}
                                            </span>
                                            {item.brand?.name && (
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded truncate">
                                                    {item.brand.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <span className="material-symbols-outlined text-yellow-500 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                            <span className="text-xs font-bold">{formatRatingValue(item.ratingAverage ?? item.rating)}</span>
                                        </div>
                                    </div>
                                    <h3
                                        onClick={() => {
                                            if (onNavigateProduct) {
                                                onNavigateProduct(item._id || item.id);
                                                return;
                                            }
                                            setProduct(item);
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                        className="font-bold text-base md:text-lg leading-tight mb-3 line-clamp-2 h-10 md:h-12 flex-1 cursor-pointer hover:text-primary transition-colors"
                                    >
                                        {item.name}
                                    </h3>
                                    <div className="flex flex-wrap items-baseline gap-2 mb-4">
                                        <span className="text-lg md:text-xl font-black text-red-500">
                                            {formatCurrency(item.salePrice ?? item.price) || item.price}
                                        </span>
                                        {(item.original || (item.salePrice && item.salePrice < item.price)) && (
                                            <span className="text-xs md:text-sm text-slate-400 line-through">
                                                {formatCurrency(item.original || item.price) || item.original}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 mt-auto">
                                        <button
                                            onClick={() => {
                                                if (onNavigateProduct) {
                                                    onNavigateProduct(item._id || item.id);
                                                    return;
                                                }
                                                setProduct(item);
                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                            }}
                                            className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-primary/20 transition-all text-sm"
                                        >
                                            <span className="material-symbols-outlined text-lg">bolt</span>
                                            {t.buyNow}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {related.length === 0 && (
                            <div className="text-sm text-slate-500 py-10 text-center col-span-full">{lang === "vi" ? "Chưa có sản phẩm liên quan." : "No related products."}</div>
                        )}
                    </div>
                </div>
            </main>
            <Footer lang={lang} setLang={setLang} />
        </div>
    );
}
