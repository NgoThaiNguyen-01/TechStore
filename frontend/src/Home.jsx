import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import "./home.css";
import { getCategories } from "./services/categoryApi";
import { getBrands } from "./services/brandApi";
import { getProducts } from "./services/productApi";
import { getPosts } from "./services/postApi";
import { getMyCoupons, getPublicCoupons } from "./services/couponApi";
import { clearFlashSale, createFlashSale, getPublicFlashSale } from "./services/flashSaleApi";
import { getOrders } from "./services/orderApi";
import { subscribeRealtime } from "./services/realtime";
import Footer from "./components/Footer";
import { clearStoredAuth } from "./utils/authStorage";
import { addToCart, buildCartItemFromProduct, getCartCount } from "./utils/cartStorage";
import { toggleWishlist, isInWishlist, getWishlistCount } from "./utils/wishlistStorage";
import { canAccessAdminApp } from "./utils/adminAccess";

/* ─── Translation dictionary ─── */
const TRANSLATIONS = {
    vi: {
        searchPlaceholder: "Tìm kiếm công nghệ mới nhất...",
        account: "Đăng nhập",
        navCategories: "Danh mục",
        navBrands: "Thương hiệu",
        navIphone: "Điện tử",
        navMacbook: "Âm thanh",
        navGaming: "Gaming",
        navAirpods: "Văn phòng & Làm việc",
        navHotDeals: "Khuyến mãi",
        navNew: "Hàng mới về",
        brandEmpty: "Chưa có thương hiệu",
        heroBadge: "Ra mắt mới",
        heroTitle1: "iPhone 15 Pro.",
        heroTitle2: "Titanium.",
        heroDesc: "iPhone đầu tiên có thiết kế titan cấp hàng không vũ trụ. Được trang bị chip A17 Pro đột phá.",
        shopNow: "Mua ngay",
        learnMore: "Tìm hiểu thêm",
        badges: [
            { title: "Miễn phí vận chuyển", desc: "Cho đơn hàng từ 2.000.000đ" },
            { title: "Hàng chính hãng", desc: "100% Công nghệ Xác thực" },
            { title: "Bảo hành chính hãng", desc: "Hỗ trợ Đại lý Ủy quyền" },
            { title: "Hỗ trợ 24/7", desc: "Trợ giúp Kỹ thuật Chuyên nghiệp" },
        ],
        flashSale: "Flash Sale",
        flashEndLabel: "Kết thúc",
        flashSave: "Lưu",
        flashClear: "Xóa",
        flashTimeSaved: "Đã lưu thời gian Flash Sale",
        flashTimeCleared: "Đã xóa thời gian Flash Sale",
        flashTimeInvalid: "Thời gian không hợp lệ",
        flashPublish: "Đăng tải",
        flashUnpublish: "Gỡ",
        flashPublishOn: "Đã đăng tải Flash Sale",
        flashPublishOff: "Đã gỡ Flash Sale",
        viewAll: "Xem tất cả",
        viewLess: "Thu gọn",
        shopByCategory: "Mua theo danh mục",
        shopByBrand: "Mua theo thương hiệu",
        categories: ["Điện thoại", "Laptop", "Gaming", "Âm thanh", "Thiết bị đeo", "Phụ kiện"],
        featuredGear: "Sản phẩm nổi bật",
        bestSellers: "Bán chạy nhất",
        newArrivals: "Hàng mới về",
        onSale: "Đang giảm giá",
        addToCart: "Thêm vào giỏ",
        viewDetail: "Xem chi tiết",
        colorLabel: "Màu sắc",
        selectedColor: "Màu đã chọn",
        colorRequired: "Vui lòng chọn màu",
        addToCartSuccess: "Đã thêm vào giỏ hàng",
        favoriteAdded: "Đã thêm vào yêu thích",
        favoriteRemoved: "Đã bỏ khỏi yêu thích",
        loginRequiredAction: "Cần đăng nhập để thực hiện",
        promoBanner: {
            title: "Tiết kiệm $200 với MacBook Pro",
            desc: "Ưu đãi có thời hạn cho sinh viên và chuyên gia sáng tạo. Đổi thiết bị cũ để tiết kiệm thêm.",
            cta: "Nhận ưu đãi ngay",
        },
        techInsights: "Tin tức Công nghệ",
        readBlog: "Đọc thêm tin tức công nghệ",
        readMore: "Đọc thêm",
        posts: [
            { tag: "Hướng dẫn mua", title: "Hướng dẫn tối ưu để lắp ráp PC năm 2024", desc: "Tất cả những gì bạn cần biết để chọn linh kiện phù hợp cho chiếc máy trong mơ." },
            { tag: "Đổi mới", title: "VR đã sẵn sàng cho thị trường đại chúng?", desc: "Chúng tôi thử nghiệm các tai nghe mới nhất để xem liệu thực tế hỗn hợp có là tương lai." },
            { tag: "Nhiếp ảnh", title: "Camera Smartphone vs DSLR: Khoảng cách thu hẹp", desc: "So sánh nhiếp ảnh tính toán của các flagship mới với thiết bị chuyên nghiệp." },
        ],
        footerTagline: "Điểm đến của những người đam mê công nghệ. Cung cấp các thiết bị mới nhất, tư vấn chuyên nghiệp và dịch vụ đẳng cấp từ năm 2012.",
        newsletter: "Bản tin",
        emailPlaceholder: "Địa chỉ email",
        footerShop: "Mua sắm",
        shopLinks: ["Điện thoại thông minh", "Laptop & PC", "Đồ chơi Gaming", "Âm thanh & Nhạc", "Nhà thông minh"],
        footerSupport: "Hỗ trợ",
        supportLinks: ["Theo dõi đơn hàng", "Bảo hành & Sửa chữa", "Trả hàng & Hoàn tiền", "Thông tin vận chuyển", "Liên hệ"],
        contactInfo: "Thông tin liên hệ",
        footerCopy: "© 2024 TechStore. Được xây dựng vì hiệu suất. Bảo lưu mọi quyền.",
        langLabel: "Ngôn ngữ",
        comboBadge: "Combo Tiết Kiệm",
    },
    en: {
        searchPlaceholder: "Search for the latest tech...",
        account: "Sign In",
        navCategories: "Categories",
        navBrands: "Brands",
        navIphone: "Electronics",
        navMacbook: "Audio",
        navGaming: "Gaming",
        navAirpods: "Office & Work",
        navHotDeals: "Hot Deals",
        navNew: "New Arrivals",
        brandEmpty: "No brands yet",
        heroBadge: "New Release",
        heroTitle1: "iPhone 15 Pro.",
        heroTitle2: "Titanium.",
        heroDesc: "The first iPhone to feature an aerospace-grade titanium design. Powered by the groundbreaking A17 Pro chip.",
        shopNow: "Shop Now",
        learnMore: "Learn More",
        badges: [
            { title: "Free Shipping", desc: "On orders from 2,000,000₫" },
            { title: "Genuine Product", desc: "100% Authentic Tech" },
            { title: "Official Warranty", desc: "Authorized Dealer Support" },
            { title: "24/7 Support", desc: "Expert Technical Help" },
        ],
        flashSale: "Flash Sale",
        flashEndLabel: "Ends",
        flashSave: "Save",
        flashClear: "Clear",
        flashTimeSaved: "Flash Sale time saved",
        flashTimeCleared: "Flash Sale time cleared",
        flashTimeInvalid: "Invalid time",
        flashPublish: "Publish",
        flashUnpublish: "Unpublish",
        flashPublishOn: "Flash Sale published",
        flashPublishOff: "Flash Sale unpublished",
        viewAll: "View All",
        viewLess: "Show Less",
        shopByCategory: "Shop by Category",
        shopByBrand: "Shop by Brand",
        categories: ["Phones", "Laptops", "Gaming", "Audio", "Wearables", "Accessories"],
        featuredGear: "Featured Gear",
        bestSellers: "Best Sellers",
        newArrivals: "New Arrivals",
        onSale: "On Sale",
        addToCart: "Add to Cart",
        viewDetail: "View details",
        colorLabel: "Colors",
        selectedColor: "Selected color",
        colorRequired: "Please choose a color",
        addToCartSuccess: "Added to cart",
        favoriteAdded: "Added to favorites",
        favoriteRemoved: "Removed from favorites",
        loginRequiredAction: "Please sign in to continue",
        promoBanner: {
            title: "Save $200 on MacBook Pro",
            desc: "Limited time offer for students and creative professionals. Trade in your old device for extra savings.",
            cta: "Claim Your Discount",
        },
        techInsights: "Tech Insights",
        readBlog: "Read more tech news",
        readMore: "Read More",
        posts: [
            { tag: "Buying Guide", title: "The Ultimate Guide to PC Building in 2024", desc: "Everything you need to know about picking the right components for your dream machine." },
            { tag: "Innovation", title: "Is VR Finally Ready for the Mainstream?", desc: "We test the latest headsets to see if mixed reality is the future of computing." },
            { tag: "Photography", title: "Smartphone Cameras vs DSLRs: The Gap Closes", desc: "Comparing the computational photography of new flagships against professional gear." },
        ],
        footerTagline: "The destination for tech enthusiasts. Providing the latest gadgets, professional advice, and world-class service since 2012.",
        newsletter: "Newsletter",
        emailPlaceholder: "Email address",
        footerShop: "Shop",
        shopLinks: ["Smartphones", "Laptops & PCs", "Gaming Gear", "Audio & Music", "Smart Home"],
        footerSupport: "Support",
        supportLinks: ["Order Tracking", "Warranty & Repairs", "Returns & Refunds", "Shipping Info", "Contact Us"],
        contactInfo: "Contact Info",
        footerCopy: "© 2024 TechStore. Built for performance. All rights reserved.",
        langLabel: "Language",
        comboBadge: "Savings Combo",
    },
};

const NOTIFICATION_SEEN_STORAGE_PREFIX = "techstoreNotificationSeen";
const FLASH_SALE_POLL_INTERVAL_MS = 60000;
const NOTIFICATION_POLL_INTERVAL_MS = 60000;

const NOTIFICATION_I18N = {
    vi: {
        title: "Thông báo",
        empty: "Chưa có thông báo mới.",
        loading: "Đang tải thông báo...",
        markAllRead: "Đã xem tất cả",
        flashLabel: "Flash Sale",
        voucherLabel: "Voucher mới",
        flashMessage: "Chương trình Flash Sale đang diễn ra.",
        voucherMessage: "Voucher mới đã sẵn sàng để nhận.",
        viewFlashSale: "Xem Flash Sale",
        viewVoucher: "Xem voucher",
        viewOrder: "Xem đơn hàng",
        endsAt: "Kết thúc",
        updatedAt: "Cập nhật",
        new: "Mới",
        orderPendingPayment: "đang chờ bạn hoàn tất thanh toán.",
        orderProcessingPayment: "đang được cổng thanh toán xử lý.",
        orderPaymentExpired: "đã hết hạn thanh toán.",
        orderPaymentCancelled: "đã hủy thanh toán.",
        orderPaymentFailed: "thanh toán thất bại.",
        orderPending: "đang chờ xác nhận.",
        orderConfirmed: "đã được xác nhận.",
        orderProcessing: "đang được xử lý.",
        orderPacking: "đang được đóng gói.",
        orderShipping: "đang được giao.",
        orderCompleted: "đã hoàn thành.",
        orderCancelled: "đã bị hủy.",
    },
    en: {
        title: "Notifications",
        empty: "No new notifications yet.",
        loading: "Loading notifications...",
        markAllRead: "Mark all as read",
        flashLabel: "Flash Sale",
        voucherLabel: "New voucher",
        flashMessage: "A Flash Sale campaign is now live.",
        voucherMessage: "A new voucher is ready to claim.",
        viewFlashSale: "View Flash Sale",
        viewVoucher: "View vouchers",
        viewOrder: "View order",
        endsAt: "Ends at",
        updatedAt: "Updated",
        new: "New",
        orderPendingPayment: "is waiting for your payment.",
        orderProcessingPayment: "is being processed by the payment gateway.",
        orderPaymentExpired: "payment has expired.",
        orderPaymentCancelled: "payment was cancelled.",
        orderPaymentFailed: "payment failed.",
        orderPending: "is pending confirmation.",
        orderConfirmed: "has been confirmed.",
        orderProcessing: "is being processed.",
        orderPacking: "is being packed.",
        orderShipping: "is being shipped.",
        orderCompleted: "has been completed.",
        orderCancelled: "has been cancelled.",
    },
};

const getRefundRequestStatus = (order) => String(order?.refundRequest?.status || "none").trim().toLowerCase();
const getAftersalesStatus = (order) => String(order?.aftersalesRequest?.status || "none").trim().toLowerCase();

const buildOrderNotificationMessage = (order, text, lang) => {
    const orderNumber = order?.orderNumber || "Order";
    const refundStatus = getRefundRequestStatus(order);
    const aftersalesStatus = getAftersalesStatus(order);

    if (["submitted", "under_review", "awaiting_return", "received", "refund_processing"].includes(aftersalesStatus)) {
        return lang === "vi"
            ? `${orderNumber} đang được xử lý yêu cầu hậu mãi.`
            : `${orderNumber} is being processed for aftersales support.`;
    }
    if (aftersalesStatus === "approved") {
        return lang === "vi"
            ? `${orderNumber} đã được duyệt yêu cầu hậu mãi.`
            : `${orderNumber} has an approved aftersales request.`;
    }
    if (aftersalesStatus === "rejected") {
        return lang === "vi"
            ? `${orderNumber} đã bị từ chối yêu cầu hậu mãi.`
            : `${orderNumber} had its aftersales request rejected.`;
    }
    if (aftersalesStatus === "completed") {
        return lang === "vi"
            ? `${orderNumber} đã hoàn tất xử lý hậu mãi.`
            : `${orderNumber} has completed aftersales handling.`;
    }

    if (refundStatus === "pending") {
        return lang === "vi"
            ? `${orderNumber} đang chờ duyệt yêu cầu hoàn tiền.`
            : `${orderNumber} has a refund request waiting for review.`;
    }
    if (refundStatus === "approved" || order?.paymentStatus === "refunded") {
        return lang === "vi"
            ? `${orderNumber} đã được duyệt hoàn tiền.`
            : `${orderNumber} has been approved for refund.`;
    }
    if (refundStatus === "rejected") {
        return lang === "vi"
            ? `${orderNumber} đã bị từ chối yêu cầu hoàn tiền.`
            : `${orderNumber} had its refund request rejected.`;
    }

    if (order?.paymentMethod === "bank_transfer" && order?.paymentStatus !== "paid") {
        if (order?.checkoutStatus === "processing_payment") return `${orderNumber} ${text.orderProcessingPayment}`;
        if (order?.checkoutStatus === "expired") return `${orderNumber} ${text.orderPaymentExpired}`;
        if (order?.checkoutStatus === "cancelled") return `${orderNumber} ${text.orderPaymentCancelled}`;
        if (order?.checkoutStatus === "failed") return `${orderNumber} ${text.orderPaymentFailed}`;
        return `${orderNumber} ${text.orderPendingPayment}`;
    }

    switch (order?.status) {
        case "confirmed":
            return `${orderNumber} ${text.orderConfirmed}`;
        case "processing":
            return `${orderNumber} ${text.orderProcessing}`;
        case "packing":
            return `${orderNumber} ${text.orderPacking}`;
        case "shipping":
            return `${orderNumber} ${text.orderShipping}`;
        case "completed":
            return lang === "vi"
                ? `${orderNumber} đã hoàn thành. Bạn có thể đánh giá sản phẩm hoặc yêu cầu hoàn tiền.`
                : `${orderNumber} has been completed. You can now review the product or request a refund.`;
        case "cancelled":
            return `${orderNumber} ${text.orderCancelled}`;
        case "pending":
        default:
            return `${orderNumber} ${text.orderPending}`;
    }
};

const getNotificationStorageKey = (user) =>
    `${NOTIFICATION_SEEN_STORAGE_PREFIX}:${user?._id || user?.email || "guest"}`;

const readSeenNotificationIds = (user) => {
    if (!user) return [];
    try {
        const raw = localStorage.getItem(getNotificationStorageKey(user));
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeSeenNotificationIds = (user, ids) => {
    if (!user) return;
    try {
        localStorage.setItem(getNotificationStorageKey(user), JSON.stringify(ids));
    } catch {
        void 0;
    }
};

const toFlashInputValue = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (v) => String(v).padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const parseFlashInputValue = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
};

const HERO_FALLBACK_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuBo1qr20GuD165Sk_S7155YnJntoeCdf1bDd315UrPHx2OXSIPPnGcQkYknByJx5I3UARkX4DinQwTy8v2py5XYf4wvfj-YYUDGYp6GmFrV831aOnoZHCg3YMW_1KmAqM03p1itbT5UH4GLLkWHyI26Z7p5cmBh8wtCGuvojbVJrJUSc7Ughd2XaJaKrxhgZhUC3xxuFUGiXp78gOI_0DVU2nPkdmbcsyTsUn1-CFxIbFMfzcQNSauUrK3JYy--OD-QBSe1FkKePk3X";

const CATEGORY_IMGS = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBS3FKymFqOeGBtYPef8TwYFHxa0zFWxdiGK_xK-FtttiMHSrufgATADJIL2uqCdTBw_XAevqsdYbZWipi4eLuxS6wC2uqa2iW_2kzW6k84vCDswy7m1Qv-x4ztgXjPQ2v5lUAnR-ByAUVfosqUR5LMI4ymszoLoC6kqKekKXNzomZREZoJYOE9Xw3lkRrggFJB_XQpR1Fu_wCuzSXlZZwCNqhbGprLYI3C2GMlworRMEGqPl02xLXv3HbIezZJpWRsQE4FH4q62Grp",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC5_pyOa88GmiqAt7ddnXws4nIpPUw04doKIorJI9ohq-i7IY6nTW-BO-8m_es_Y_CfF-dMkP6-566NuEnL643Wwr79gyCHyuv-XRpa0ZrUWwWCOqs6T-6sHY1YxjJoEwlX2XU3wx55x27X5x8jU6ro54qH9vdbxHSiU12vzstf-8JvrKzSWPtmShzvQ5rNkLgqZ2RJ-MMp2AHZRJ42Q6Oaq17jpRadt_lgU5Pnq5lcjmGQwWrrqHV27SBWLok-N2yyV4K6vWQt1VbF",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDYf_MVE6gHocSZzE_Nq_rlpiMZFqkalxRi1AbO_37_8RISAjs3oI6Myps9MlMdNc-iLEWVRyvRjCgz-Aekf6uwx29VxhWJPM6SH8eFfWGBa0bz2ZNULovHJB7kHnjazOoDMeKsywLAnreXRCWQbvFi3D9joyCw8WOcTkr_oFoN9ij78B455FyR_zV7q87Fv_6NczcEL6qiWWkDDf-aDRTX-VLIW6lh7vMNmBzfWxadylJhBT-MyHht-rYRvdkYmbZScduvb4LIz-K6",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAgFMK13udthZYBQtEpFjWGVp5L-3R7ktVagdXfpAzcv_YMunUsBJUa89vXSRbAMCiZ2PGO9tVQ-QjF6HzL1NaHGhuAjTbnrUBus-tL7I__nxT17KndmyFS5CVAJM0SlX4N_9Arba2nvRZfiKO4Ng1fkn8u60ruYeNFJSSaat_-64pd4y1jgj-Xu--p_B6eumif2EOhdQqnInEmibMJiE2UeUJYF2T-y0XyckLNQT8ng-smawzXwcdNTdO67eEt318I8K4ZyQgTLwQS",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBP2gA19_4Vbhs38FYv7zAruW7uI1089fxqrnuFqlGu2pj0hJOjGkQtU1h9wLSRFK1gT72n43uFnJhq-1Lnr_W-XAh06mXab7ZYEVstF1oWI_AqkxIbo3LjFxqSZ2OSFEVHuAJucrlj_axgliBkLKU4CdaXawXGbLAg-0NNzhOcbgRC9QkieL4iSdc89IumVE3VS7fVgTqHigvloFSV9e4cLWXdV0s0DM4JIOaOdUHkkmwH-0QhlGnFZAbMqYSK9O7OAM0hrEWuT3Wf",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAHWt85hbI4Gqn24pE52J0oIStJH_OfMDJlC0QccDRXDxoVTYamqN9x_5DM8s-KzpxlNiZgBuzCMj2Oe6aKgMkQ3TAA-RIS7RTohb0sKU6Sa9tLgXoccAy2_uNyrTxk3jF_-Ic1lqJIMqJa6kBNKFHVbuaXDnUw6EAi55TSyLHsOH4YQyXFr9vs2mPJKKYxMicEba4pBItfOyuJC_7hG3vzcpJACi1EdwFnxDh52d3qJ5LYY5T4sziPofE33wG9M7onRtWMRSd6N9Tc",
];

const FALLBACK_CATEGORY_TREE = [
    { id: "phones", name: "Điện thoại", children: ["iPhone", "Samsung"] },
    { id: "laptops", name: "Laptop", children: ["MacBook", "Laptop Gaming"] },
    { id: "gaming", name: "Gaming", children: ["Laptop Gaming", "Bàn phím"] },
    { id: "audio", name: "Âm thanh", children: ["Tai nghe", "Loa"] },
    { id: "accessories", name: "Phụ kiện", children: ["Sạc & Cáp", "Ốp lưng"] },
];

const PRODUCTS = [
    {
        id: "p-iphone-15-pro-max",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuARc0ubXxxc6GrcYAHqX4584IhwM64_irQ1RJVt_oiuY7ASLc5GP0ImhIVLYHFT2fPJ16iA3BS5qFoDcInW9O6pPvauj2pomcdkKuk8ijeBbG-8uC0kdxVbbP6l_5zdFOL21-2ct9HuUNDLnN7FQPO_htJZR_uJWtmWyOU7x-F2duRH1ajpKf2h3xEBYiYIQMmcFWUmLVdTFAm-20Bz3DN7JNmSa1b5gJfMDoo1iPucjMDXZSXU3bwLBqOxgdoOJy7W6GPppjGhrL-y",
        alt: "Silver smartphone with clean glass finish",
        category: { vi: "Điện thoại", en: "Phones" }, rating: "4.9",
        name: "iPhone 15 Pro Max - 256GB", price: "$1,199.00", original: null,
        colors: [
            { name: "Đen", hex: "#111827" },
            { name: "Trắng", hex: "#FFFFFF" },
            { name: "Vàng", hex: "#FACC15" },
        ],
    },
    {
        id: "p-dell-xps-15",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBYqkkhfWYROLrI6ogzF5ci1acNvCul_TL_Q0W4bJY7K8Ib_N1EkRk3E3fsqDHKpKuN3GA23zAVWlyBMr2IZNA6uRxlg7ri24lY4QLy6rHO7ANMXAC0b8bho5wkDXaBJ7jqkVGSLNW0IY8fIL-e6Fzj__ZnToJ4qnoTqHRrA0xS25DoO4S1yz8nUg57es2Gk0i9mIYDpkl-gWT1Qs9xygSp8knU5yWr8DXk8JgPX99jQ8Xyhxa_5-5VtNtxRSTRdo_2HMGcPwcQu_e9",
        alt: "High performance dark laptop",
        category: { vi: "Laptop", en: "Laptops" }, rating: "4.8",
        name: "Dell XPS 15 9530", price: "$1,899.00", original: null,
        colors: [
            { name: "Đen", hex: "#111827" },
            { name: "Xám bạc", hex: "#CBD5E1" },
        ],
    },
    {
        id: "p-dyson-purifier",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCMDJp341LgfIEbIakQM8Pg_jp0t0Q6fkevnIPQbKIkUPfIF0P75uq2ooVF_-xibpjzEJTAjaGG7n5mjjP4E3dAKKdeuthac729qNHCMe8i0_eKBvx0zl9DrhXMarRZnQ1FEkg_rbEyhFHpQfbENOKgk0u2J1EODW9AMSZsduwTsN6Uc084kkV8pCXbu3uIL5fl5JhWLEi0JrAh3PpRFWUnIaPVV_Lgj1igyo5TF3S4l6UhOUoCzKC_-7jYcrhaExfEU4wS-4q6c4EO",
        alt: "Compact white air purifier",
        category: { vi: "Nhà thông minh", en: "Home" }, rating: "4.7",
        name: "Dyson Purifier Cool", price: "$549.00", original: "$649.00",
        colors: [
            { name: "Trắng", hex: "#FFFFFF" },
            { name: "Đen", hex: "#111827" },
        ],
    },
    {
        id: "p-mh40",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuApcw23-ByyRIF2HiHGeoJ-D2Ky3NiotThfiuNroGlczMRcRjc_rmqNZVpxkRyL2oFXa_T7cpd8KvaznB-CxN9NF8Kg8tZLQR7Kn_hDTuIG7EOmO80saBk4z-hVLtq7UUwXO7P0YrVxvl64JThmrl217Y676w6rVhfaJYS5dyo91Q9-OwT4I89v0IsWBX0LjmEHHt_8nOWvvPQo4Iuz---eWHWCmtb-hrYWibwYeeJLRjjm4LgGRLv57G5a6fsAEqvcviYOyhhv3hig",
        alt: "Studio quality professional headphones",
        category: { vi: "Âm thanh", en: "Audio" }, rating: "5.0",
        name: "Master & Dynamic MH40", price: "$249.00", original: null,
        colors: [
            { name: "Đen", hex: "#111827" },
            { name: "Đỏ", hex: "#EF4444" },
        ],
    },
];

const POST_IMGS = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCwo3rbIYUqvWg1QmugfgtrcpfPAlHR8jhbGyDmvFoGR_1exy_mLcIu4iM2u_0G8vXWPgdFBvIeufEH3B-cGhrR4Kx48z9_L_lvJ9QngFRJFIie21T-R-eU_KP0Tt2JmLQxBay3UpKcRudOtc0ZihSnyjM57LPu6E4_3-oboiJJ7RBSRLDd1NlwD_DilHFfwHSrGgbmsHeHf5E9DARWiA1Yfdj8IpAm51H7DWOrywqBfLVSKKBmemdE8xt6MGpBxcbb83jxjjPa9blq",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCO6JOGXOaDjBzwTZ6GWfjzbuPkG8WjMqjCZUVnb0imPiE9ZI0zGkGp_fYrjb7dXTgV648X6T4hE0qF9Z_YHlk2Ub6PVo02jCMvnBe2TeNt6JPcb7Ritm6PdR_mHwVxdPFrVAsi-Sdm3cjlVeTc1B7o5NyyovIG1lJb6F1xDdOJts8KOuOyhfFY8sG0PiM-9KqcBDAaOARFz86FNdDc3F8Mc1Db5BUHbRVT7WOEhkk_A7wIisAQ-bhZeWGSZ8K8VmmS1wpGMHU2f6yr",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBaf9oClGWvCKrDVkYK7_NunxD_6ZIeQpOn5j1gNrkf9Rs0lsInjGmHj5PWvG8kVPF80q3x1T888mOP_6tZqxhidRPvRCiIz96Z_cB5paSOjC6K3gUPkOVU9UgFtc4fIuEE9bESWUzci8LNAUGzA-wB8fAu0i7egXIADYObNYf4W4YPcBBaCx_1QxzVj4igRssTt4cGGSbTYNRpc6US205EzkQBpLkgAO9KAKY2LHLqLbMDTgVEzA70g1OhrsupgqJZL0Bb_G1uRcOz",
];

export default function Home({ lang, setLang, onNavigateLogin, onNavigateAdmin, onNavigateProduct, onNavigateCategory, onNavigateBrand, onNavigatePost, onNavigateCart, onNavigateOrders, onNavigateWishlist, onNavigateVoucher, onNavigateSettings }) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;
    const notificationText = NOTIFICATION_I18N[lang] || NOTIFICATION_I18N.vi;
    const [selectedColors, setSelectedColors] = useState({});
    const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
    const [brandMenuOpen, setBrandMenuOpen] = useState(false);
    const [expandedParent, setExpandedParent] = useState(null);
    const [flyoutParentId, setFlyoutParentId] = useState(null);
    const [specialFlyout, setSpecialFlyout] = useState(null); // 'NEW' | 'SALE' | null
    const [cartCount, setCartCount] = useState(() => getCartCount());
    const [wishlistCount, setWishlistCount] = useState(() => getWishlistCount());
    const [voucherCount, setVoucherCount] = useState(0);
    const [orderNotifications, setOrderNotifications] = useState([]);
    const [categoryTree, setCategoryTree] = useState(FALLBACK_CATEGORY_TREE);
    const [catLoading, setCatLoading] = useState(false); // eslint-disable-line no-unused-vars
    const [brands, setBrands] = useState([]);
    const [flashProducts, setFlashProducts] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [categoriesAll, setCategoriesAll] = useState([]);
    const [heroProducts, setHeroProducts] = useState([]);
    const [heroIndex, setHeroIndex] = useState(0);
    const [showAllFlash, setShowAllFlash] = useState(false);
    const [featuredTab, setFeaturedTab] = useState("best");
    const [showAllFeaturedByTab, setShowAllFeaturedByTab] = useState({ best: false, new: false, sale: false });
    const [saleProducts, setSaleProducts] = useState([]);
    const [comboProducts, setComboProducts] = useState([]);
    const [comboIndex, setComboIndex] = useState(0);
    const [newsPosts, setNewsPosts] = useState([]);
    const [newsLoading, setNewsLoading] = useState(false);
    const [newsExpanded, setNewsExpanded] = useState(false);
    const newsRequestIdRef = useRef(0);
    const [featuredSearchTerm, setFeaturedSearchTerm] = useState("");

    const [flashSaleEndAt, setFlashSaleEndAt] = useState(null);
    const [flashSaleNotificationAt, setFlashSaleNotificationAt] = useState(null);
    const [flashSaleInput, setFlashSaleInput] = useState("");
    const [flashPublished, setFlashPublished] = useState(false);
    const [flashNow, setFlashNow] = useState(Date.now());
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const stored = localStorage.getItem("user");
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const adminUser = useMemo(() => (canAccessAdminApp(currentUser) ? currentUser : null), [currentUser]);
    const currentUserId = currentUser?._id || currentUser?.id || "";

    // ─── Search States ───
    const [publicCoupons, setPublicCoupons] = useState([]);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [seenNotificationIds, setSeenNotificationIds] = useState(() => {
        try {
            const stored = localStorage.getItem("user");
            const user = stored ? JSON.parse(stored) : null;
            return readSeenNotificationIds(user);
        } catch {
            return [];
        }
    });
    const notificationRef = useRef(null);
    const flashSaleSectionRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);

    // ─── Fetch Search Results ───
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                // Assuming backend supports 'search' param for filtering by name
                const res = await getProducts({ search: searchQuery, limit: 8, status: "active" });
                setSearchResults(res.data || []);
                setShowResults(true);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    useEffect(() => {
        const onUserUpdated = () => {
            try {
                const stored = localStorage.getItem("user");
                setCurrentUser(stored ? JSON.parse(stored) : null);
            } catch {
                setCurrentUser(null);
            }
        };
        window.addEventListener("user:updated", onUserUpdated);
        window.addEventListener("storage", onUserUpdated);
        return () => {
            window.removeEventListener("user:updated", onUserUpdated);
            window.removeEventListener("storage", onUserUpdated);
        };
    }, []);
    const handleLogout = () => {
        try {
            clearStoredAuth();
        } catch {
            // ignore
        }
        setCurrentUser(null);
        setNotificationOpen(false);
        setSeenNotificationIds([]);
        setPublicCoupons([]);
        setOrderNotifications([]);
        setVoucherCount(0);
        try {
            window.dispatchEvent(new Event("user:updated"));
            window.dispatchEvent(new Event("cart:updated"));
            window.dispatchEvent(new Event("wishlist:updated"));
        } catch {
            void 0;
        }
    };

    useEffect(() => {
        const seen = readSeenNotificationIds(currentUser);
        setSeenNotificationIds(seen);
        if (!currentUser) {
            setNotificationOpen(false);
            setPublicCoupons([]);
            setOrderNotifications([]);
            setVoucherCount(0);
        }
    }, [currentUser]);

    const loadMyCoupons = useCallback(async () => {
        if (!currentUserId) {
            setVoucherCount(0);
            return;
        }

        try {
            const response = await getMyCoupons();
            setVoucherCount(Array.isArray(response?.data) ? response.data.length : 0);
        } catch {
            setVoucherCount(0);
        }
    }, [currentUserId]);

    useEffect(() => {
        if (!currentUserId) return undefined;

        void loadMyCoupons();
        const handleFocus = () => {
            void loadMyCoupons();
        };

        window.addEventListener("focus", handleFocus);
        return () => {
            window.removeEventListener("focus", handleFocus);
        };
    }, [currentUserId, loadMyCoupons]);

    useEffect(() => {
        writeSeenNotificationIds(currentUser, seenNotificationIds);
    }, [currentUser, seenNotificationIds]);

    const fetchNotifications = useCallback(async () => {
        if (!currentUser) return;
        setNotificationLoading(true);
        try {
            const [couponResponse, orderResponse] = await Promise.all([
                getPublicCoupons().catch(() => ({ data: [] })),
                getOrders({ page: 1, limit: 8, mine: true }).catch(() => ({ data: [] })),
            ]);
            setPublicCoupons(couponResponse?.data || []);
            setOrderNotifications(Array.isArray(orderResponse?.data) ? orderResponse.data : []);
        } catch {
            setPublicCoupons([]);
            setOrderNotifications([]);
        } finally {
            setNotificationLoading(false);
        }
    }, [currentUser]);

    const applyFlashSaleState = useCallback((flashSale) => {
        const nextEndAt = flashSale?.endAt ? new Date(flashSale.endAt).getTime() : null;
        const isValidEndAt = Number.isFinite(nextEndAt);
        const nextNotificationAt = flashSale?.updatedAt || flashSale?.createdAt || null;
        setFlashSaleEndAt(isValidEndAt ? nextEndAt : null);
        setFlashSaleNotificationAt(nextNotificationAt ? new Date(nextNotificationAt).getTime() : null);
        setFlashSaleInput(isValidEndAt ? toFlashInputValue(nextEndAt) : "");
        setFlashPublished(Boolean(flashSale?.isPublished && isValidEndAt));
    }, []);

    const fetchFlashSaleState = useCallback(async () => {
        try {
            const response = await getPublicFlashSale();
            applyFlashSaleState(response?.data || null);
        } catch {
            applyFlashSaleState(null);
        }
    }, [applyFlashSaleState]);

    useEffect(() => {
        if (!currentUser) return undefined;

        void fetchNotifications();

        const intervalId = window.setInterval(() => {
            void fetchNotifications();
        }, NOTIFICATION_POLL_INTERVAL_MS);
        const handleFocus = () => {
            void fetchNotifications();
        };

        window.addEventListener("focus", handleFocus);
        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener("focus", handleFocus);
        };
    }, [currentUser, fetchNotifications]);

    useEffect(() => {
        if (!currentUser) return undefined;

        let timerId = null;
        const queueRefresh = () => {
            if (timerId) window.clearTimeout(timerId);
            timerId = window.setTimeout(() => {
                void fetchNotifications();
                void fetchFlashSaleState();
                void loadMyCoupons();
            }, 250);
        };

        const unsubscribe = subscribeRealtime((payload) => {
            const type = String(payload?.type || "");
            if (
                type.startsWith("order.")
                || type.startsWith("coupon.")
                || type.startsWith("flashsale.")
            ) {
                queueRefresh();
            }
        });

        return () => {
            if (timerId) window.clearTimeout(timerId);
            unsubscribe();
        };
    }, [currentUser, fetchFlashSaleState, fetchNotifications, loadMyCoupons]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setNotificationOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const onUpdate = () => {
            setCartCount(getCartCount());
            setWishlistCount(getWishlistCount());
        };
        window.addEventListener("cart:updated", onUpdate);
        window.addEventListener("wishlist:updated", onUpdate);
        window.addEventListener("storage", onUpdate);
        return () => {
            window.removeEventListener("cart:updated", onUpdate);
            window.removeEventListener("wishlist:updated", onUpdate);
            window.removeEventListener("storage", onUpdate);
        };
    }, []);

    const selectColor = (productId, color) => {
        setSelectedColors((prev) => ({ ...prev, [productId]: color }));
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

    const toggleCategoryMenu = () => {
        setBrandMenuOpen(false);
        setCategoryMenuOpen((prev) => {
            if (prev) setExpandedParent(null);
            return !prev;
        });
    };

    const toggleParentCategory = (id) => {
        setExpandedParent((prev) => (prev === id ? null : id));
    };

    const toggleFlyoutByLabel = (label) => {
        setBrandMenuOpen(false);
        const parent = (categoryTree || []).find((p) => (p.name || "").toLowerCase() === (label || "").toLowerCase());
        if (!parent) {
            setFlyoutParentId(null);
            return;
        }
        setFlyoutParentId((prev) => (prev === parent.id ? null : parent.id));
    };

    const toggleSpecial = (type) => {
        setBrandMenuOpen(false);
        setSpecialFlyout((prev) => (prev === type ? null : type));
        setFlyoutParentId(null);
    };

    const toggleBrandMenu = () => {
        setCategoryMenuOpen(false);
        setExpandedParent(null);
        setFlyoutParentId(null);
        setSpecialFlyout(null);
        setBrandMenuOpen((prev) => !prev);
    };

    const normalizeText = useCallback((value) =>
        (value || "")
            .toString()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim(),
        []);

    useEffect(() => {
        void fetchFlashSaleState();

        const intervalId = window.setInterval(() => {
            void fetchFlashSaleState();
        }, FLASH_SALE_POLL_INTERVAL_MS);
        const handleFocus = () => {
            void fetchFlashSaleState();
        };

        window.addEventListener("focus", handleFocus);
        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener("focus", handleFocus);
        };
    }, [fetchFlashSaleState]);

    const handleSaveFlashTime = async () => {
        if (!adminUser) return;
        const date = parseFlashInputValue(flashSaleInput);
        if (!date) {
            toast.error(t.flashTimeInvalid);
            return;
        }
        try {
            const response = await createFlashSale({ endAt: date.toISOString() });
            applyFlashSaleState(response?.data || null);
        } catch (error) {
            toast.error(error?.response?.data?.message || t.flashTimeInvalid);
            return;
        }
        toast.success(t.flashTimeSaved);
    };

    const handleClearFlashTime = async () => {
        if (!adminUser) return;
        try {
            await clearFlashSale();
            applyFlashSaleState(null);
        } catch (error) {
            toast.error(error?.response?.data?.message || t.flashTimeInvalid);
            return;
        }
        toast.success(t.flashTimeCleared);
    };

    const handlePublishFlashSale = async () => {
        await handleSaveFlashTime();
    };

    const handleUnpublishFlashSale = async () => {
        await handleClearFlashTime();
    };

    const navNewChildIdSet = useMemo(() => {
        const targetRoot = normalizeText(t.navNew || "Hàng mới về");
        const rootCategory = categoriesAll.find((c) => !c.parent && normalizeText(c.name) === targetRoot);
        if (!rootCategory?._id) return new Set();
        const childIds = categoriesAll
            .filter((c) => String(c.parent?._id) === String(rootCategory._id))
            .map((c) => String(c._id));
        return new Set(childIds);
    }, [categoriesAll, t.navNew, normalizeText]);

    const navNewChildNameSet = useMemo(() => {
        const targetRoot = normalizeText(t.navNew || "Hàng mới về");
        const rootCategory = categoriesAll.find((c) => !c.parent && normalizeText(c.name) === targetRoot);
        if (!rootCategory?._id) return new Set();
        const childNames = categoriesAll
            .filter((c) => String(c.parent?._id) === String(rootCategory._id))
            .map((c) => normalizeText(c.name));
        return new Set(childNames);
    }, [categoriesAll, t.navNew, normalizeText]);

    const flashSaleCategoryIdSet = useMemo(() => {
        const targetRoot = normalizeText("Giảm giá sốc");
        const rootCategory = categoriesAll.find((c) => normalizeText(c.name) === targetRoot);
        if (!rootCategory?._id) return new Set();
        const queue = [rootCategory._id];
        const seen = new Set();
        while (queue.length) {
            const current = queue.shift();
            const key = String(current);
            if (seen.has(key)) continue;
            seen.add(key);
            categoriesAll
                .filter((c) => String(c.parent?._id) === key)
                .forEach((c) => queue.push(c._id));
        }
        return seen;
    }, [categoriesAll, normalizeText]);

    const flashSaleCategoryNameSet = useMemo(() => {
        const targetRoot = normalizeText("Giảm giá sốc");
        const rootCategory = categoriesAll.find((c) => normalizeText(c.name) === targetRoot);
        if (!rootCategory?._id) return new Set();
        const names = categoriesAll
            .filter((c) => String(c.parent?._id) === String(rootCategory._id))
            .map((c) => normalizeText(c.name));
        names.push(normalizeText(rootCategory.name));
        return new Set(names);
    }, [categoriesAll, normalizeText]);

    const isFlashSaleProduct = useCallback((product) => {
        const categoryId = product?.category?._id || product?.category;
        const categoryName = normalizeText(
            product?.category?.name || (typeof product?.category === "string" ? product.category : "")
        );
        return (
            (categoryId && flashSaleCategoryIdSet.has(String(categoryId))) ||
            (categoryName && flashSaleCategoryNameSet.has(categoryName))
        );
    }, [flashSaleCategoryIdSet, flashSaleCategoryNameSet, normalizeText]);

    const isNewArrivalProduct = useCallback((product) => {
        const categoryId = product?.category?._id || product?.category;
        const categoryName = normalizeText(
            product?.category?.name || (typeof product?.category === "string" ? product.category : "")
        );
        return (
            (categoryId && navNewChildIdSet.has(String(categoryId))) ||
            (categoryName && navNewChildNameSet.has(categoryName))
        );
    }, [navNewChildIdSet, navNewChildNameSet, normalizeText]);

    const comboCategoryIdSet = useMemo(() => {
        const targetRoot = normalizeText("Combo tiết kiệm");
        const rootCategory = categoriesAll.find((c) => normalizeText(c.name) === targetRoot);
        if (!rootCategory?._id) return new Set();
        const queue = [rootCategory._id];
        const seen = new Set();
        while (queue.length) {
            const current = queue.shift();
            const key = String(current);
            if (seen.has(key)) continue;
            seen.add(key);
            categoriesAll
                .filter((c) => String(c.parent?._id) === key)
                .forEach((c) => queue.push(c._id));
        }
        return seen;
    }, [categoriesAll, normalizeText]);

    const comboCategoryNameSet = useMemo(() => {
        const targetRoot = normalizeText("Combo tiết kiệm");
        const rootCategory = categoriesAll.find((c) => normalizeText(c.name) === targetRoot);
        if (!rootCategory?._id) return new Set();
        const names = categoriesAll
            .filter((c) => String(c.parent?._id) === String(rootCategory._id))
            .map((c) => normalizeText(c.name));
        names.push(normalizeText(rootCategory.name));
        return new Set(names);
    }, [categoriesAll, normalizeText]);

    const isComboProduct = useCallback((product) => {
        const categoryId = product?.category?._id || product?.category;
        const categoryName = normalizeText(
            product?.category?.name || (typeof product?.category === "string" ? product.category : "")
        );
        return (
            (categoryId && comboCategoryIdSet.has(String(categoryId))) ||
            (categoryName && comboCategoryNameSet.has(categoryName))
        );
    }, [comboCategoryIdSet, comboCategoryNameSet, normalizeText]);

    // New Release & Best New (Đáng chú ý)
    const newBestRootNames = useMemo(
        () => [normalizeText("Sản phẩm mới ra mắt"), normalizeText("Best New (Đáng chú ý)")],
        [normalizeText]
    );
    const newBestCategoryIdSet = useMemo(() => {
        const rootIds = categoriesAll
            .filter((c) => newBestRootNames.includes(normalizeText(c.name)))
            .map((c) => c._id);
        if (rootIds.length === 0) return new Set();
        const queue = [...rootIds];
        const seen = new Set();
        while (queue.length) {
            const current = queue.shift();
            const key = String(current);
            if (seen.has(key)) continue;
            seen.add(key);
            categoriesAll
                .filter((c) => String(c.parent?._id) === key)
                .forEach((c) => queue.push(c._id));
        }
        return seen;
    }, [categoriesAll, newBestRootNames, normalizeText]);
    const newBestCategoryNameSet = useMemo(() => {
        const rootNames = categoriesAll
            .filter((c) => newBestRootNames.includes(normalizeText(c.name)))
            .map((c) => normalizeText(c.name));
        if (rootNames.length === 0) return new Set();
        const names = categoriesAll
            .filter((c) => c.parent && newBestRootNames.includes(normalizeText(c.parent.name)))
            .map((c) => normalizeText(c.name));
        rootNames.forEach((n) => names.push(n));
        return new Set(names);
    }, [categoriesAll, newBestRootNames, normalizeText]);
    const isNewReleaseOrBestNew = useCallback((product) => {
        const categoryId = product?.category?._id || product?.category;
        const categoryName = normalizeText(
            product?.category?.name || (typeof product?.category === "string" ? product.category : "")
        );
        return (
            (categoryId && newBestCategoryIdSet.has(String(categoryId))) ||
            (categoryName && newBestCategoryNameSet.has(categoryName))
        );
    }, [newBestCategoryIdSet, newBestCategoryNameSet, normalizeText]);

    const findCategoryIdByName = (name) => {
        const found = categoriesAll.find((c) => normalizeText(c.name) === normalizeText(name));
        return found?._id || null;
    };

    const navigateToCategory = (id) => {
        if (!id || !onNavigateCategory) return;
        setCategoryMenuOpen(false);
        setBrandMenuOpen(false);
        setExpandedParent(null);
        setFlyoutParentId(null);
        setSpecialFlyout(null);
        onNavigateCategory(id);
    };

    const navigateToBrand = (id) => {
        if (!id || !onNavigateBrand) return;
        setCategoryMenuOpen(false);
        setBrandMenuOpen(false);
        setExpandedParent(null);
        setFlyoutParentId(null);
        setSpecialFlyout(null);
        onNavigateBrand(id);
    };

    const getChildrenByLabel = (label) => {
        const parent = (categoryTree || []).find(
            (p) => (p.name || "").toLowerCase() === (label || "").toLowerCase()
        );
        return parent?.children || [];
    };

    useEffect(() => {
        const fetchCats = async () => {
            setCatLoading(true);
            try {
                // Lấy tất cả danh mục (đang hoạt động) để build cây
                const res = await getCategories({ limit: 1000, status: "active", parent: "all" });
                const items = (res?.data || []).filter((c) => String(c?.status || "active").toLowerCase() === "active");
                const roots = items.filter((c) => !c.parent);
                const childrenByParent = items.reduce((acc, c) => {
                    const pid = c.parent?._id;
                    if (!pid) return acc;
                    acc[pid] = acc[pid] || [];
                    acc[pid].push(c);
                    return acc;
                }, {});
                const tree = roots.map((r) => ({
                    id: r._id,
                    name: r.name,
                    children: (childrenByParent[r._id] || []).map((c) => c.name),
                }));
                if (tree.length > 0) setCategoryTree(tree);
                setCategoriesAll(items);

                // Danh mục con cho "Mua theo danh mục" (loại trừ Hàng mới về/Khuyến mãi)
                const normalize = (s) =>
                    (s || "")
                        .toString()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .toLowerCase()
                        .trim();
                const excludedParents = new Set(["hang moi ve", "khuyen mai"]);
                const children = items.filter((c) => c.parent);
                const filteredChildren = children.filter(
                    (c) => !excludedParents.has(normalize(c.parent?.name))
                );
                setSubcategories(filteredChildren);
            } catch {
                // giữ fallback
            } finally {
                setCatLoading(false);
            }
        };
        fetchCats();
    }, []);

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const res = await getBrands({ limit: 200, status: "active" });
                const list = (res?.data || []).filter((b) => String(b?.status || "active").toLowerCase() === "active");
                setBrands(list);
            } catch {
                setBrands([]);
            }
        };
        fetchBrands();
    }, []);

    useEffect(() => {
        const fetchHomepageProducts = async () => {
            try {
                const res = await getProducts({ page: 1, limit: 40, status: "active", sort: "bestSelling" });
                const items = (res?.data || []);
                const isActiveProduct = (p) => {
                    const status = String(p?.status || "active").toLowerCase();
                    const activeByFlag = p?.isActive !== false;
                    return activeByFlag && status === "active";
                };
                const pool = items.filter(isActiveProduct);

                const heroList = [...pool]
                    .filter((p) => isNewReleaseOrBestNew(p))
                    .sort((a, b) => {
                        const aTime = new Date(a?.createdAt || 0).getTime();
                        const bTime = new Date(b?.createdAt || 0).getTime();
                        return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
                    })
                    .slice(0, 4);
                setHeroProducts(heroList);
                setHeroIndex(0);
                const flashItems = pool.filter((p) => isFlashSaleProduct(p));
                setFlashProducts(flashItems);
                const sales = pool.filter((p) => typeof p.salePrice === "number" && p.salePrice < p.price);
                setSaleProducts(sales);
                setFeaturedProducts(pool);
                const comboList = pool.filter((p) => isComboProduct(p)).slice(0, 4);
                setComboProducts(comboList);
                setComboIndex(0);
            } catch {
                // Giữ mock nếu lỗi
            }
        };
        fetchHomepageProducts();
    }, [isComboProduct, isFlashSaleProduct, isNewReleaseOrBestNew]);

    const fetchNewsPreview = useCallback(async () => {
        const requestId = newsRequestIdRef.current + 1;
        newsRequestIdRef.current = requestId;
        setNewsLoading(true);
        try {
            const res = await getPosts({ page: 1, limit: 3, status: "published", sort: "createdAt:desc" });
            const items = (res?.data || []).filter((p) => {
                const s = String(p?.status || "").toLowerCase();
                return s === "published" || s === "đăng";
            });
            if (newsRequestIdRef.current === requestId) {
                setNewsPosts(items);
                setNewsExpanded(false);
            }
        } catch (err) {
            if (newsRequestIdRef.current === requestId) {
                toast.error(err?.message || (lang === "vi" ? "Lỗi tải tin tức" : "Failed to load posts"));
            }
        } finally {
            if (newsRequestIdRef.current === requestId) {
                setNewsLoading(false);
            }
        }
    }, [lang]);

    const collapseNews = useCallback(() => {
        setNewsExpanded(false);
        setNewsPosts((prev) => prev.slice(0, 3));
    }, []);

    const loadAllNews = useCallback(async () => {
        const requestId = newsRequestIdRef.current + 1;
        newsRequestIdRef.current = requestId;
        setNewsLoading(true);
        try {
            const pageSize = 30;
            const first = await getPosts({ page: 1, limit: pageSize, status: "published", sort: "createdAt:desc" });
            const totalPagesLocal = first?.totalPages || 0;
            const normalize = (arr) => (arr || []).filter((p) => {
                const s = String(p?.status || "").toLowerCase();
                return s === "published" || s === "đăng";
            });
            const all = [...normalize(first?.data)];
            for (let pageIndex = 2; pageIndex <= totalPagesLocal; pageIndex += 1) {
                const res = await getPosts({ page: pageIndex, limit: pageSize, status: "published", sort: "createdAt:desc" });
                all.push(...normalize(res?.data));
                if (all.length >= 500) break;
            }
            if (newsRequestIdRef.current === requestId) {
                setNewsPosts(all);
                setNewsExpanded(true);
            }
        } catch (err) {
            if (newsRequestIdRef.current === requestId) {
                toast.error(err?.message || (lang === "vi" ? "Lỗi tải tin tức" : "Failed to load posts"));
            }
        } finally {
            if (newsRequestIdRef.current === requestId) {
                setNewsLoading(false);
            }
        }
    }, [lang]);

    useEffect(() => {
        if (newsExpanded) return;
        fetchNewsPreview();
    }, [fetchNewsPreview, newsExpanded]);

    const getProductSoldCount = useCallback((product) => Number(product?.soldCount) || 0, []);

    const getProductCreatedTimestamp = useCallback((product) => {
        const timestamp = new Date(product?.createdAt || 0).getTime();
        return Number.isFinite(timestamp) ? timestamp : 0;
    }, []);

    const sortProductsByBestSelling = useCallback((list = []) => (
        [...list].sort((a, b) => {
            const soldDiff = getProductSoldCount(b) - getProductSoldCount(a);
            if (soldDiff !== 0) return soldDiff;
            return getProductCreatedTimestamp(b) - getProductCreatedTimestamp(a);
        })
    ), [getProductCreatedTimestamp, getProductSoldCount]);

    const sortProductsByNewest = useCallback((list = []) => (
        [...list].sort((a, b) => getProductCreatedTimestamp(b) - getProductCreatedTimestamp(a))
    ), [getProductCreatedTimestamp]);

    const baseFeaturedProducts = useMemo(() => {
        const list = featuredProducts.length > 0 ? featuredProducts : PRODUCTS;
        return sortProductsByBestSelling(list.filter((p) => {
            const status = String(p?.status || "active").toLowerCase();
            const activeByFlag = p?.isActive !== false;
            return activeByFlag && status === "active";
        }));
    }, [featuredProducts, sortProductsByBestSelling]);

    const featuredNewArrivalsProducts = useMemo(() => {
        if (heroProducts.length > 0) return heroProducts;
        if (!navNewChildIdSet.size && !navNewChildNameSet.size) return [];
        return sortProductsByNewest(baseFeaturedProducts.filter((p) => isNewArrivalProduct(p)));
    }, [heroProducts, navNewChildIdSet, navNewChildNameSet, baseFeaturedProducts, isNewArrivalProduct, sortProductsByNewest]);

    const featuredSaleProducts = useMemo(() => {
        if (saleProducts.length > 0) return saleProducts;
        return baseFeaturedProducts.filter((p) => typeof p.salePrice === "number" && p.salePrice < p.price);
    }, [saleProducts, baseFeaturedProducts]);

    const activeFeaturedProducts = useMemo(() => {
        let list = featuredTab === "new"
            ? featuredNewArrivalsProducts
            : featuredTab === "sale"
                ? featuredSaleProducts
                : baseFeaturedProducts;
        
        if (featuredSearchTerm.trim()) {
            const term = featuredSearchTerm.toLowerCase();
            list = list.filter(p => (p.name || "").toLowerCase().includes(term));
        }
        return list;
    }, [featuredTab, featuredNewArrivalsProducts, featuredSaleProducts, baseFeaturedProducts, featuredSearchTerm]);

    const showAllFeatured = !!showAllFeaturedByTab[featuredTab];

    const visibleFeaturedProducts = activeFeaturedProducts.slice(0, showAllFeatured ? undefined : 4);

    const toggleShowAllFeatured = () => {
        setShowAllFeaturedByTab((prev) => ({ ...prev, [featuredTab]: !prev[featuredTab] }));
    };

    useEffect(() => {
        const timer = setInterval(() => setFlashNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const isAdmin = !!adminUser;
    const flashActive = flashSaleEndAt ? flashNow < flashSaleEndAt : true;
    const flashCountdown = useMemo(() => {
        if (!flashSaleEndAt) return null;
        const diff = flashSaleEndAt - flashNow;
        if (diff <= 0) return "00:00:00";
        const s = Math.floor(diff / 1000);
        const h = String(Math.floor(s / 3600)).padStart(2, "0");
        const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
        const sec = String(s % 60).padStart(2, "0");
        return `${h}:${m}:${sec}`;
    }, [flashSaleEndAt, flashNow]);

    const flashVisibleForCustomer = flashActive && flashPublished;
    const flashDisplayList = useMemo(
        () => (isAdmin ? flashProducts : (flashVisibleForCustomer ? flashProducts : [])),
        [isAdmin, flashProducts, flashVisibleForCustomer]
    );
    const canShowFlashSection = isAdmin
        ? flashProducts.length > 0
        : flashVisibleForCustomer && flashProducts.length > 0;

    const formatNotificationDate = useCallback((value) => {
        if (!value) return "";
        try {
            return new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            }).format(new Date(value));
        } catch {
            return "";
        }
    }, [lang]);

    const notificationItems = useMemo(() => {
        const items = [];

        (orderNotifications || []).forEach((order) => {
            items.push({
                id: `order:${order._id || order.orderNumber}:${order.status}:${order.paymentStatus}:${order.checkoutStatus}:${getRefundRequestStatus(order)}:${getAftersalesStatus(order)}`,
                type: "order",
                title: order.orderNumber || notificationText.viewOrder,
                message: buildOrderNotificationMessage(order, notificationText, lang),
                meta: `${notificationText.updatedAt} ${formatNotificationDate(order.updatedAt || order.createdAt)}`,
                cta: notificationText.viewOrder,
                timestamp: new Date(order.updatedAt || order.createdAt || 0).getTime() || 0,
            });
        });

        if (flashVisibleForCustomer && flashProducts.length > 0) {
            items.push({
                id: `flash-sale:${flashSaleEndAt || "always-on"}:${flashSaleNotificationAt || 0}`,
                type: "flash_sale",
                title: notificationText.flashLabel,
                message: notificationText.flashMessage,
                meta: flashSaleEndAt
                    ? `${notificationText.endsAt} ${formatNotificationDate(flashSaleEndAt)}`
                    : "",
                cta: notificationText.viewFlashSale,
                timestamp: flashSaleNotificationAt || 0,
            });
        }

        (publicCoupons || []).forEach((coupon) => {
            items.push({
                id: `voucher:${coupon._id || coupon.code}`,
                type: "voucher",
                title: coupon.name || notificationText.voucherLabel,
                message: notificationText.voucherMessage,
                meta: coupon?.endAt
                    ? `${notificationText.endsAt} ${formatNotificationDate(coupon.endAt)}`
                    : coupon?.code || "",
                cta: notificationText.viewVoucher,
                timestamp: new Date(coupon?.createdAt || coupon?.startAt || coupon?.endAt || 0).getTime() || 0,
            });
        });

        return items
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }, [
        orderNotifications,
        notificationText,
        flashVisibleForCustomer,
        flashProducts.length,
        flashSaleEndAt,
        flashSaleNotificationAt,
        publicCoupons,
        formatNotificationDate,
        lang,
    ]);

    const unreadNotificationCount = useMemo(
        () => notificationItems.filter((item) => !seenNotificationIds.includes(item.id)).length,
        [notificationItems, seenNotificationIds]
    );

    const markNotificationsAsSeen = useCallback((ids) => {
        if (!ids || ids.length === 0 || !currentUser) return;
        setSeenNotificationIds((prev) => {
            const next = Array.from(new Set([...prev, ...ids]));
            writeSeenNotificationIds(currentUser, next);
            return next;
        });
    }, [currentUser]);

    const handleMarkAllNotificationsRead = useCallback(() => {
        markNotificationsAsSeen(notificationItems.map((item) => item.id));
    }, [markNotificationsAsSeen, notificationItems]);

    const handleNotificationClick = useCallback((item) => {
        if (!item) return;
        markNotificationsAsSeen([item.id]);
        setNotificationOpen(false);

        if (item.type === "flash_sale") {
            flashSaleSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }

        if (item.type === "order") {
            onNavigateOrders?.();
            return;
        }

        onNavigateVoucher?.();
    }, [markNotificationsAsSeen, onNavigateOrders, onNavigateVoucher]);

    useEffect(() => {
        if (heroProducts.length <= 1) return;
        const interval = setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % heroProducts.length);
        }, 10000);
        return () => clearInterval(interval);
    }, [heroProducts]);

    useEffect(() => {
        if (comboProducts.length <= 1) return;
        const interval = setInterval(() => {
            setComboIndex((prev) => (prev + 1) % comboProducts.length);
        }, 10000);
        return () => clearInterval(interval);
    }, [comboProducts]);

    const formatCurrency = (value) => {
        if (value === null || value === undefined || value === "") return "";
        try {
            return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
        } catch {
            return String(value);
        }
    };

    const activeHero = heroProducts[heroIndex] || null;
    const heroBadge = activeHero?.category?.name || t.heroBadge;
    const heroTitle = activeHero?.seoTitle || activeHero?.name || t.heroTitle1;
    const heroDesc = activeHero?.seoDesc || activeHero?.shortDesc || activeHero?.description || t.heroDesc;
    const heroImage = activeHero?.images?.[0] || activeHero?.img || HERO_FALLBACK_IMAGE;
    const heroCount = heroProducts.length;
    const getNextHeroIndex = (current, direction) => {
        if (!heroCount) return 0;
        return (current + direction + heroCount) % heroCount;
    };
    const handleHeroClick = () => {
        if (heroCount <= 1) return;
        setHeroIndex((prev) => getNextHeroIndex(prev, 1));
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased font-display">

            {/* ── 1. Sticky Header ── */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="max-w-[1440px] mx-auto px-4 lg:px-10 h-20 flex items-center justify-between gap-8">

                    {/* Logo */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="bg-primary p-1.5 rounded-lg text-white">
                            <span className="material-symbols-outlined text-2xl">bolt</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-primary">TechStore</h1>
                    </div>

                    {/* Search Bar */}
                    <div className="hidden md:flex flex-1 max-w-2xl relative" ref={searchRef}>
                        <div className="relative w-full group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                            <input
                                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 pl-12 pr-10 focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white placeholder:text-slate-500"
                                placeholder={t.searchPlaceholder}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.trim() && setShowResults(true)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSearchResults([]);
                                        setShowResults(false);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xl">close</span>
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {showResults && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[60] backdrop-blur-xl bg-white/95 dark:bg-slate-900/95">
                                {isSearching ? (
                                    <div className="p-8 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-2"></div>
                                        <p className="text-sm text-slate-500 font-medium">{lang === "vi" ? "Đang tìm kiếm..." : "Searching..."}</p>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="py-2">
                                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{lang === "vi" ? "Sản phẩm tìm thấy" : "Products found"}</p>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {searchResults.map((p) => (
                                                <button
                                                    key={p._id}
                                                    onClick={() => {
                                                        onNavigateProduct(p._id);
                                                        setShowResults(false);
                                                        setSearchQuery("");
                                                    }}
                                                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left border-b border-slate-50 dark:border-slate-800/30 last:border-0"
                                                >
                                                    <div className="h-14 w-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-1 shrink-0 overflow-hidden border border-slate-200/10">
                                                        <img src={p.images?.[0] || p.img} alt={p.name} className="max-h-full max-w-full object-contain" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate mb-0.5">{p.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-black text-primary">
                                                                {formatCurrency(p.salePrice ?? p.price)}
                                                            </span>
                                                            {p.salePrice && p.salePrice < p.price && (
                                                                <span className="text-[10px] text-slate-400 line-through">
                                                                    {formatCurrency(p.price)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="material-symbols-outlined text-slate-300 text-xl group-hover:text-primary transition-colors">chevron_right</span>
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => {
                                                // Could navigate to a dedicated search page if implemented
                                                setShowResults(false);
                                            }}
                                            className="w-full py-3 text-sm font-bold text-primary hover:bg-primary/5 transition-colors border-t border-slate-100 dark:border-slate-800"
                                        >
                                            {lang === "vi" ? "Xem tất cả kết quả" : "View all results"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-10 text-center">
                                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 mb-4">
                                            <span className="material-symbols-outlined text-3xl text-slate-300">search_off</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{lang === "vi" ? "Không tìm thấy sản phẩm" : "No products found"}</p>
                                        <p className="text-xs text-slate-500">{lang === "vi" ? "Thử tìm kiếm với từ khóa khác" : "Try searching with a different keyword"}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:gap-4 shrink-0">
                        <button 
                            onClick={() => {
                                if (!currentUser) { toast.error(t.loginRequiredAction); onNavigateLogin?.(); return; }
                                onNavigateWishlist?.();
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative"
                        >
                            <span className="material-symbols-outlined">favorite</span>
                            {wishlistCount > 0 && (
                                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold h-4 min-w-4 px-1 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                                    {wishlistCount}
                                </span>
                            )}
                        </button>
                        <button
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative"
                            type="button"
                            aria-label={lang === "vi" ? "Nhận voucher" : "Vouchers"}
                            onClick={() => {
                                if (!currentUser) { toast.error(t.loginRequiredAction); onNavigateLogin?.(); return; }
                                onNavigateVoucher?.();
                            }}
                        >
                            <span className="material-symbols-outlined">redeem</span>
                            {voucherCount > 0 && (
                                <span className="absolute top-1 right-1 bg-emerald-500 text-white text-[10px] font-bold h-4 min-w-4 px-1 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                                    {voucherCount > 99 ? "99+" : voucherCount}
                                </span>
                            )}
                        </button>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative" type="button" onClick={() => {
                            if (!currentUser) { toast.error(t.loginRequiredAction); onNavigateLogin?.(); return; }
                            onNavigateCart?.();
                        }}>
                            <span className="material-symbols-outlined">shopping_cart</span>
                            {cartCount > 0 && (
                                <span className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold h-4 min-w-4 px-1 flex items-center justify-center rounded-full">
                                    {cartCount > 99 ? "99+" : cartCount}
                                </span>
                            )}
                        </button>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative" type="button" aria-label={lang === "vi" ? "Đơn hàng" : "Orders"} onClick={() => {
                            if (!currentUser) { toast.error(t.loginRequiredAction); onNavigateLogin?.(); return; }
                            onNavigateOrders?.();
                        }}>
                            <span className="material-symbols-outlined">receipt_long</span>
                        </button>
                        <div className="relative" ref={notificationRef}>
                            <button
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative"
                                type="button"
                                aria-label={lang === "vi" ? "Thông báo" : "Notifications"}
                                onClick={() => {
                                    if (!currentUser) { toast.error(t.loginRequiredAction); onNavigateLogin?.(); return; }
                                    setNotificationOpen((prev) => !prev);
                                }}
                            >
                                <span className="material-symbols-outlined">notifications</span>
                                {unreadNotificationCount > 0 && (
                                    <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-bold h-4 min-w-4 px-1 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                                        {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                                    </span>
                                )}
                            </button>
                            {notificationOpen && currentUser && (
                                <div className="absolute right-0 mt-3 z-[70] w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4">
                                        <div>
                                            <p className="text-sm font-black text-slate-900">{notificationText.title}</p>
                                            <p className="text-xs text-slate-500">
                                                {notificationItems.length === 0
                                                    ? notificationText.empty
                                                    : unreadNotificationCount > 0
                                                        ? `${unreadNotificationCount} ${notificationText.new.toLowerCase()}`
                                                        : notificationText.markAllRead}
                                            </p>
                                        </div>
                                        {notificationItems.length > 0 && unreadNotificationCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleMarkAllNotificationsRead}
                                                className="text-xs font-bold text-primary hover:text-blue-700 transition-colors"
                                            >
                                                {notificationText.markAllRead}
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-[420px] overflow-y-auto">
                                        {notificationLoading ? (
                                            <div className="px-4 py-8 text-center text-sm text-slate-500">
                                                {notificationText.loading}
                                            </div>
                                        ) : notificationItems.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-sm text-slate-500">
                                                {notificationText.empty}
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100">
                                                {notificationItems.map((item) => {
                                                    const isUnread = !seenNotificationIds.includes(item.id);
                                                    const iconTone =
                                                        item.type === "flash_sale"
                                                            ? "bg-orange-100 text-orange-600"
                                                            : item.type === "order"
                                                                ? "bg-sky-100 text-sky-600"
                                                                : "bg-primary/10 text-primary";
                                                    const iconName =
                                                        item.type === "flash_sale"
                                                            ? "bolt"
                                                            : item.type === "order"
                                                                ? "receipt_long"
                                                                : "redeem";
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            onClick={() => handleNotificationClick(item)}
                                                            className="w-full px-4 py-4 text-left hover:bg-slate-50 transition-colors"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconTone}`}>
                                                                    <span className="material-symbols-outlined text-[20px]">{iconName}</span>
                                                                    </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="truncate text-sm font-bold text-slate-900">{item.title}</p>
                                                                        {isUnread && (
                                                                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
                                                                                {notificationText.new}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                                                                    {item.meta && (
                                                                        <p className="mt-1 text-xs font-medium text-slate-400">{item.meta}</p>
                                                                    )}
                                                                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">
                                                                        {item.cta}
                                                                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative"
                            type="button"
                            aria-label={lang === "vi" ? "Cài đặt" : "Settings"}
                            onClick={() => {
                                if (!currentUser) {
                                    toast.error(t.loginRequiredAction);
                                    onNavigateLogin?.();
                                    return;
                                }
                                onNavigateSettings?.();
                            }}
                        >
                            <span className="material-symbols-outlined">settings</span>
                        </button>

                        {adminUser && (
                            <button
                                onClick={onNavigateAdmin}
                                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-sm font-bold transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                                {lang === "vi" ? "Bảng điều hành" : "Dashboard"}
                            </button>
                        )}
                        <div className="h-10 w-[1px] bg-slate-200 dark:border-slate-800 mx-2"></div>
                        {currentUser ? (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 p-1.5 pr-3 border border-slate-200 rounded-full">
                                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden">
                                        {currentUser.avatar ? (
                                            <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <span className="material-symbols-outlined text-xl">person</span>
                                        )}
                                    </div>
                                    <span className="hidden lg:block text-sm font-semibold max-w-[180px] truncate">
                                        {currentUser.name || currentUser.email || "Người dùng"}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="px-3 py-2 rounded-lg text-sm font-semibold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                                    type="button"
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        ) : (
                            <button onClick={onNavigateLogin} className="flex items-center gap-2 p-1.5 pr-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-xl">person</span>
                                </div>
                                <span className="hidden lg:block text-sm font-semibold">{t.account}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Mega Menu Bar */}
                <nav className="hidden lg:block border-t border-slate-100 dark:border-slate-800/50 py-2">
                    <div className="max-w-[1440px] mx-auto px-10 flex gap-8">
                        <div className="relative">
                            <button
                                onClick={toggleCategoryMenu}
                                className="text-sm font-medium hover:text-primary flex items-center gap-1 transition-colors"
                            >
                                {t.navCategories}
                                <span className="material-symbols-outlined text-sm">
                                    {categoryMenuOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                                </span>
                            </button>
                            {categoryMenuOpen && (
                                <div className="absolute left-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50">
                                    <div className="p-2">
                                        {categoryTree.map((parent) => (
                                            <div key={parent.id} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                                                <button
                                                    onClick={() => {
                                                        if ((parent.children || []).length === 0) {
                                                            navigateToCategory(parent.id);
                                                            return;
                                                        }
                                                        toggleParentCategory(parent.id);
                                                    }}
                                                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                                                >
                                                    <span>{parent.name}</span>
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {expandedParent === parent.id ? "expand_less" : "expand_more"}
                                                    </span>
                                                </button>
                                                {expandedParent === parent.id && (
                                                    <div className="pl-4 pb-2">
                                                        {parent.children.map((child) => (
                                                            <button
                                                                type="button"
                                                                key={child}
                                                                onClick={() => navigateToCategory(findCategoryIdByName(child))}
                                                                className="block px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                                                            >
                                                                {child}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button onClick={toggleBrandMenu} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                                {t.navBrands}
                                <span className="material-symbols-outlined text-[16px]">
                                    {brandMenuOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                                </span>
                            </button>
                            {brandMenuOpen && (
                                <div className="absolute left-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50">
                                    <div className="p-2 max-h-80 overflow-auto">
                                        {brands.length > 0 ? (
                                            brands.map((brand) => (
                                                <button
                                                    type="button"
                                                    key={brand._id || brand.name}
                                                    onClick={() => navigateToBrand(brand._id)}
                                                    className="block px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-left w-full"
                                                >
                                                    {brand.name}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-slate-400">{t.brandEmpty}</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button onClick={() => toggleFlyoutByLabel(t.navIphone)} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                                {t.navIphone}
                                <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
                            </button>
                            {flyoutParentId && (categoryTree.find(p => p.id === flyoutParentId)?.name === t.navIphone) && (
                                <div className="absolute left-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50">
                                    <div className="p-2">
                                        {categoryTree.find(p => p.id === flyoutParentId)?.children.map((child) => (
                                            <button
                                                type="button"
                                                key={child}
                                                onClick={() => navigateToCategory(findCategoryIdByName(child))}
                                                className="block px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-left w-full"
                                            >
                                                {child}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button onClick={() => toggleFlyoutByLabel(t.navMacbook)} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                                {t.navMacbook}
                                <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
                            </button>
                            {flyoutParentId && (categoryTree.find(p => p.id === flyoutParentId)?.name === t.navMacbook) && (
                                <div className="absolute left-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50">
                                    <div className="p-2">
                                        {categoryTree.find(p => p.id === flyoutParentId)?.children.map((child) => (
                                            <button
                                                type="button"
                                                key={child}
                                                onClick={() => navigateToCategory(findCategoryIdByName(child))}
                                                className="block px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-left w-full"
                                            >
                                                {child}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button onClick={() => toggleFlyoutByLabel(t.navGaming)} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                                {t.navGaming}
                                <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
                            </button>
                            {flyoutParentId && (categoryTree.find(p => p.id === flyoutParentId)?.name === t.navGaming) && (
                                <div className="absolute left-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50">
                                    <div className="p-2">
                                        {categoryTree.find(p => p.id === flyoutParentId)?.children.map((child) => (
                                            <button
                                                type="button"
                                                key={child}
                                                onClick={() => navigateToCategory(findCategoryIdByName(child))}
                                                className="block px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-left w-full"
                                            >
                                                {child}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button onClick={() => toggleFlyoutByLabel(t.navAirpods)} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                                {t.navAirpods}
                                <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
                            </button>
                            {flyoutParentId && (categoryTree.find(p => p.id === flyoutParentId)?.name === t.navAirpods) && (
                                <div className="absolute left-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50">
                                    <div className="p-2">
                                        {categoryTree.find(p => p.id === flyoutParentId)?.children.map((child) => (
                                            <button
                                                type="button"
                                                key={child}
                                                onClick={() => navigateToCategory(findCategoryIdByName(child))}
                                                className="block px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-left w-full"
                                            >
                                                {child}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button onClick={() => toggleSpecial('NEW')} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                                {t.navNew}
                                <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
                            </button>
                            {specialFlyout === 'NEW' && (
                                <div className="absolute left-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50">
                                    <div className="p-2">
                                        {getChildrenByLabel(t.navNew).length > 0 ? (
                                            getChildrenByLabel(t.navNew).map((child) => (
                                                <button
                                                    type="button"
                                                    key={child}
                                                    onClick={() => navigateToCategory(findCategoryIdByName(child))}
                                                    className="block px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-left w-full"
                                                >
                                                    {child}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-slate-400">Chưa có danh mục con</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button onClick={() => toggleSpecial('SALE')} className="text-sm font-medium text-red-500 font-bold transition-colors flex items-center gap-1">
                                {t.navHotDeals}
                                <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
                            </button>
                            {specialFlyout === 'SALE' && (
                                <div className="absolute left-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-xl shadow-xl z-50">
                                    <div className="p-2">
                                        {getChildrenByLabel(t.navHotDeals).length > 0 ? (
                                            getChildrenByLabel(t.navHotDeals).map((child) => (
                                                <button
                                                    type="button"
                                                    key={child}
                                                    onClick={() => navigateToCategory(findCategoryIdByName(child))}
                                                    className="block px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-md text-left w-full"
                                                >
                                                    {child}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-slate-400">Chưa có danh mục con</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>
            </header>

            <main className="max-w-[1440px] mx-auto">

                {/* ── 2. Hero Section ── */}
                <section className="p-4 lg:p-10">
                    <div
                        className="relative overflow-hidden rounded-xl bg-slate-900 aspect-[21/9] flex items-center select-none cursor-pointer"
                        onClick={handleHeroClick}
                    >
                        <div className="absolute inset-0 opacity-70 bg-gradient-to-r from-background-dark via-background-dark/70 to-transparent z-10"></div>
                        <img
                            className="absolute right-0 bottom-0 h-full w-full sm:w-[70%] lg:w-[60%] object-contain opacity-90 pointer-events-none"
                            alt={heroTitle}
                            src={heroImage}
                        />
                        <div className="relative z-20 px-8 lg:px-20 max-w-2xl space-y-6">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-bold tracking-wider uppercase">{heroBadge}</span>
                            <h2 className="text-4xl lg:text-7xl font-black text-white leading-tight">
                                {heroTitle}
                            </h2>
                            <p className="text-slate-300 text-lg lg:text-xl max-w-md">{heroDesc}</p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!currentUser) { toast.error(t.loginRequiredAction); onNavigateLogin?.(); return; }
                                        onNavigateProduct(activeHero?._id || activeHero?.id);
                                    }}
                                    className="bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center gap-2"
                                >
                                    {t.shopNow} <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                                <button
                                    onClick={() => onNavigateProduct(activeHero?._id || activeHero?.id)}
                                    className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
                                >
                                    {t.learnMore}
                                </button>
                            </div>
                        </div>
                    </div>
                    {heroCount > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                            {heroProducts.map((item, index) => (
                                <button
                                    key={item._id || item.id || item.name || index}
                                    onClick={() => setHeroIndex(index)}
                                    className={`h-2.5 w-2.5 rounded-full transition-all ${index === heroIndex ? "bg-primary scale-110" : "bg-slate-500/50 hover:bg-slate-400"}`}
                                    aria-label={`Hero ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* ── 3. Trust Badges ── */}
                <section className="px-4 lg:px-10 py-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {["local_shipping", "verified", "gpp_good", "support_agent"].map((icon, i) => (
                            <div key={i} className="flex items-center gap-5 p-6 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <span className="material-symbols-outlined">{icon}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold">{t.badges[i].title}</h3>
                                    <p className="text-sm text-slate-500">{t.badges[i].desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {canShowFlashSection && (
                    <section ref={flashSaleSectionRef} className="px-4 lg:px-10 py-12">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <h2 className="text-3xl font-black text-orange-500">{t.flashSale}</h2>
                                {flashCountdown && (
                                    <div className="flex items-center gap-2 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold">
                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                        <span>{flashCountdown}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                {adminUser && (
                                    <div className="flex flex-wrap items-center gap-2 bg-white/5 border border-slate-200/20 rounded-xl px-3 py-2">
                                        <span className="text-xs font-semibold text-slate-400">{t.flashEndLabel}</span>
                                        <input
                                            type="datetime-local"
                                            value={flashSaleInput}
                                            onChange={(e) => setFlashSaleInput(e.target.value)}
                                            className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white/90 text-slate-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSaveFlashTime}
                                            className="px-2.5 py-1 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            {t.flashSave}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleClearFlashTime}
                                            className="px-2.5 py-1 text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                                        >
                                            {t.flashClear}
                                        </button>
                                        {flashPublished ? (
                                            <button
                                                type="button"
                                                onClick={handleUnpublishFlashSale}
                                                className="px-2.5 py-1 text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                                            >
                                                {t.flashUnpublish}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handlePublishFlashSale}
                                                className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors"
                                            >
                                                {t.flashPublish}
                                            </button>
                                        )}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowAllFlash((prev) => !prev)}
                                    className="text-primary font-semibold flex items-center gap-1 hover:underline"
                                >
                                    {showAllFlash ? t.viewLess : t.viewAll} <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {flashDisplayList.slice(0, showAllFlash ? undefined : 4).map((product) => {
                                const productKey = product._id || product.id || product.name;
                                const hasNumericPrice = typeof product.price === "number" || typeof product.salePrice === "number";
                                const displayPrice = hasNumericPrice
                                    ? formatCurrency(product.salePrice ?? product.price) || product.price
                                    : product.price;
                                const displayOriginal = hasNumericPrice
                                    ? formatCurrency(product.original || product.price) || product.original
                                    : product.original;
                                const showDiscount = typeof product.salePrice === "number" && typeof product.price === "number" && product.salePrice < product.price;
                                const discountLabel = showDiscount
                                    ? `-${Math.round((1 - (product.salePrice / product.price)) * 100)}%`
                                    : (product.discount || "");
                                return (
                                    <div key={productKey} className="group bg-white dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/50 hover:shadow-2xl transition-all hover:scale-[1.02] flex flex-col h-full">
                                        <div className="h-56 relative rounded-xl bg-slate-50 dark:bg-slate-800/80 mb-4 overflow-hidden flex items-center justify-center">
                                            {discountLabel && (
                                                <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold">
                                                    {discountLabel}
                                                </span>
                                            )}
                                            <div className="absolute top-3 right-3 flex flex-col gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleWishlist(product);
                                                        window.dispatchEvent(new Event("wishlist:updated"));
                                                        toast.success(isInWishlist(product._id) ? t.favoriteAdded : t.favoriteRemoved);
                                                    }}
                                                    className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white/40 transition-all shadow-sm"
                                                    aria-label={isInWishlist(product._id) ? "Bỏ yêu thích" : "Thêm yêu thích"}
                                                >
                                                    <span className={`material-symbols-outlined text-[18px] ${isInWishlist(product._id) ? "text-red-500 fill-red-500" : ""}`} style={{ fontVariationSettings: isInWishlist(product._id) ? "'FILL' 1" : "" }}>favorite</span>
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
                                            <img className="max-h-full max-w-full object-contain" alt={product.alt || product.name} src={product.images?.[0] || product.img || CATEGORY_IMGS[0]} />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-wrap gap-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                                                        {product.category?.name || product.category?.[lang] || ""}
                                                    </span>
                                                    {product.brand?.name && (
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">
                                                            {product.brand.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                    <span className="text-xs font-bold">{Number(product.ratingAverage ?? product.rating ?? 0).toFixed(1)}</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onNavigateProduct(product._id || product.id)}
                                                className="font-bold text-lg leading-tight text-left hover:text-primary transition-colors"
                                            >
                                                {product.name}
                                            </button>
                                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-2">
                                                <span className="text-lg sm:text-xl font-black whitespace-nowrap">
                                                    {displayPrice}
                                                </span>
                                                {(product.original || (showDiscount && product.price)) && (
                                                    <span className="text-xs sm:text-sm text-slate-400 line-through whitespace-nowrap">
                                                        {displayOriginal}
                                                    </span>
                                                )}
                                            </div>
                                            {product.colors && product.colors.length > 0 && (
                                                <div className="pt-2">
                                                    <p className="text-xs font-semibold text-slate-500 mb-2">{t.colorLabel}</p>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {product.colors.map((color) => {
                                                            const isActive = selectedColors[productKey]?.hex?.toLowerCase() === color.hex.toLowerCase();
                                                            return (
                                                                <button
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
                                                        <p className="text-xs text-slate-500 mt-2">
                                                            {t.selectedColor}: <span className="font-semibold text-slate-700">{selectedColors[productKey].name}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 gap-2 pt-2">
                                                <button
                                                    onClick={() => {
                                                        if (!currentUser) { toast.error(t.loginRequiredAction); onNavigateLogin?.(); return; }
                                                        const id = product._id || product.id;
                                                        if (id) {
                                                            onNavigateProduct(id);
                                                            return;
                                                        }
                                                        handleAddToCart(product);
                                                    }}
                                                    className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-xl">shopping_bag</span>
                                                    {t.shopNow}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── 5. Category Browser (subcategories from DB) ── */}
                <section className="px-4 lg:px-10 py-12">
                    <h2 className="text-3xl font-black mb-6">{t.shopByCategory}</h2>
                    <div className="grid grid-flow-col auto-cols-[70%] sm:auto-cols-[calc((100%-1.5rem)/2)] md:auto-cols-[calc((100%-3rem)/3)] lg:auto-cols-[calc((100%-7.5rem)/6)] gap-6 overflow-x-auto pb-2 snap-x">
                        {(subcategories.length > 0 ? subcategories : []).map((cat) => (
                            <button
                                type="button"
                                key={cat._id}
                                className="snap-start group flex flex-col items-center gap-4 text-left"
                                title={cat.name}
                                onClick={() => navigateToCategory(cat._id)}
                            >
                                <div className="w-full aspect-square rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-transparent group-hover:border-primary transition-all">
                                    <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors" style={{ fontSize: 72 }}>
                                        {cat.icon || "category"}
                                    </span>
                                </div>
                                <span className="font-bold group-hover:text-primary text-center transition-colors line-clamp-2">
                                    {cat.name}
                                </span>
                            </button>
                        ))}
                        {subcategories.length === 0 &&
                            t.categories.map((label) => (
                                <div key={label} className="snap-start group flex flex-col items-center gap-4">
                                    <div className="w-full aspect-square rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-transparent group-hover:border-primary transition-all">
                                        <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors" style={{ fontSize: 72 }}>
                                            {(() => {
                                                const s = (label || "").toLowerCase();
                                                if (s.includes("điện thoại") || s.includes("phone")) return "smartphone";
                                                if (s.includes("laptop")) return "laptop_mac";
                                                if (s.includes("gaming") || s.includes("game")) return "sports_esports";
                                                if (s.includes("âm thanh") || s.includes("audio")) return "headphones";
                                                if (s.includes("phụ kiện") || s.includes("accessor")) return "cable";
                                                if (s.includes("máy ảnh") || s.includes("camera")) return "photo_camera";
                                                if (s.includes("sạc") || s.includes("cáp") || s.includes("cable")) return "cable";
                                                if (s.includes("đeo") || s.includes("watch")) return "watch";
                                                return "category";
                                            })()}
                                        </span>
                                    </div>
                                    <span className="font-bold group-hover:text-primary transition-colors">{label}</span>
                                </div>
                            ))}
                    </div>
                </section>

                <section className="px-4 lg:px-10 py-12">
                    <h2 className="text-3xl font-black mb-6">{t.shopByBrand}</h2>
                    <div className="grid grid-flow-col auto-cols-[70%] sm:auto-cols-[calc((100%-1.5rem)/2)] md:auto-cols-[calc((100%-3rem)/3)] lg:auto-cols-[calc((100%-7.5rem)/6)] gap-6 overflow-x-auto pb-2 snap-x">
                        {brands.map((brand) => (
                            <button
                                type="button"
                                key={brand._id || brand.name}
                                className="snap-start group flex flex-col items-center gap-4 text-left"
                                title={brand.name}
                                onClick={() => navigateToBrand(brand._id)}
                            >
                                <div className="w-full aspect-square rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 flex items-center justify-center overflow-hidden border border-transparent group-hover:border-primary transition-all">
                                    {brand.logo || brand.image ? (
                                        <img src={brand.logo || brand.image} alt={brand.name} className="w-full h-full object-contain p-4" />
                                    ) : (
                                        <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors" style={{ fontSize: 72 }}>
                                            store
                                        </span>
                                    )}
                                </div>
                                <span className="font-bold group-hover:text-primary text-center transition-colors line-clamp-2">
                                    {brand.name}
                                </span>
                            </button>
                        ))}
                        {brands.length === 0 && (
                            <div className="snap-start group flex flex-col items-center gap-4">
                                <div className="w-full aspect-square rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-transparent">
                                    <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 72 }}>
                                        store
                                    </span>
                                </div>
                                <span className="font-bold text-slate-400">{t.brandEmpty}</span>
                            </div>
                        )}
                    </div>
                </section>

                <section className="px-4 lg:px-10 py-12">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-black">{t.featuredGear}</h2>
                        <button 
                            onClick={toggleShowAllFeatured}
                            className="text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all group"
                        >
                            {showAllFeatured ? t.viewLess : t.viewAll}
                            <span className="material-symbols-outlined text-sm font-bold group-hover:translate-x-1 transition-transform">
                                {showAllFeatured ? "expand_less" : "chevron_right"}
                            </span>
                        </button>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                            {/* Search bar for featured products */}
                            <div className="relative group w-full md:w-80">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[18px]">search</span>
                                <input
                                    type="text"
                                    value={featuredSearchTerm}
                                    onChange={(e) => setFeaturedSearchTerm(e.target.value)}
                                    placeholder={lang === "vi" ? "Tìm trong mục này..." : "Search this section..."}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/30 transition-all outline-none"
                                />
                            </div>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                                <button
                                    type="button"
                                    onClick={() => setFeaturedTab("best")}
                                    className={`px-6 py-2 rounded-lg ${featuredTab === "best" ? "bg-white dark:bg-slate-900 shadow-sm font-bold text-primary" : "font-semibold text-slate-500 hover:text-primary"}`}
                                >
                                    {t.bestSellers}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFeaturedTab("new")}
                                    className={`px-6 py-2 rounded-lg ${featuredTab === "new" ? "bg-white dark:bg-slate-900 shadow-sm font-bold text-primary" : "font-semibold text-slate-500 hover:text-primary"}`}
                                >
                                    {t.newArrivals}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFeaturedTab("sale")}
                                    className={`px-6 py-2 rounded-lg ${featuredTab === "sale" ? "bg-white dark:bg-slate-900 shadow-sm font-bold text-primary" : "font-semibold text-slate-500 hover:text-primary"}`}
                                >
                                    {t.onSale}
                                </button>
                            </div>
                        </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
                        {visibleFeaturedProducts.map((product) => {
                            const productKey = product._id || product.id || product.name;
                            return (
                                <div key={productKey} className="group bg-white dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/50 hover:shadow-2xl transition-all hover:scale-[1.02] h-full flex flex-col">
                                    <div className="h-56 relative rounded-xl bg-slate-50 dark:bg-slate-800/80 mb-4 overflow-hidden flex items-center justify-center">
                                        {typeof product.salePrice === "number" && product.salePrice < product.price && (
                                            <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold">
                                                -{Math.round((1 - (product.salePrice / product.price)) * 100)}%
                                            </span>
                                        )}
                                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleWishlist(product);
                                                    window.dispatchEvent(new Event("wishlist:updated"));
                                                    toast.success(isInWishlist(product._id) ? t.favoriteAdded : t.favoriteRemoved);
                                                }}
                                                className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white/40 transition-all shadow-sm"
                                            >
                                                <span className={`material-symbols-outlined text-[18px] ${isInWishlist(product._id) ? "text-red-500 fill-red-500" : ""}`} style={{ fontVariationSettings: isInWishlist(product._id) ? "'FILL' 1" : "" }}>favorite</span>
                                            </button>
                                            <button
                                                onClick={() => handleAddToCart(product)}
                                                className="h-8 w-8 rounded-full flex items-center justify-center transition-all bg-white/90 text-slate-500 hover:text-primary"
                                                aria-label={t.addToCart}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                                            </button>
                                        </div>
                                        <img className="max-h-full max-w-full object-contain" alt={product.alt || product.name} src={product.img || product.images?.[0] || CATEGORY_IMGS[0]} />
                                    </div>
                                    <div className="space-y-2 flex-1 flex flex-col">
                                            <div className="flex items-start justify-between min-h-[52px] gap-3">
                                                <div className="min-w-0 flex-1 space-y-1.5">
                                                    <span className="inline-flex max-w-full rounded-xl bg-primary/10 px-3 py-1.5 text-xs sm:text-sm font-bold leading-4 sm:leading-5 text-primary whitespace-normal line-clamp-2 break-words">
                                                        {product.category?.name || (product.category && product.category[lang]) || ""}
                                                    </span>
                                                    {product.brand?.name && (
                                                        <span className="inline-flex max-w-full rounded-lg bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-500 whitespace-nowrap truncate">
                                                            {product.brand.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                    <span className="text-xs font-bold">{Number(product.ratingAverage ?? product.rating ?? 0).toFixed(1)}</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onNavigateProduct(product._id || product.id)}
                                                className="font-bold text-lg leading-tight text-left hover:text-primary transition-colors line-clamp-2 min-h-[3rem]"
                                            >
                                                {product.name}
                                            </button>
                                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-2 min-h-[2.5rem]">
                                            <span className="text-lg sm:text-xl font-black whitespace-nowrap">
                                                {formatCurrency(product.salePrice ?? product.price) || product.price}
                                            </span>
                                            {(product.original || (product.salePrice && product.salePrice < product.price)) && (
                                                <span className="text-xs sm:text-sm text-slate-400 line-through whitespace-nowrap">
                                                    {formatCurrency(product.original || product.price) || product.original}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-h-[80px] pt-2 flex flex-col justify-end">
                                            {product.colors && product.colors.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 mb-2">{t.colorLabel}</p>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {product.colors.map((color) => {
                                                            const isActive = selectedColors[productKey]?.hex?.toLowerCase() === color.hex.toLowerCase();
                                                            return (
                                                                <button
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
                                                        <p className="text-xs text-slate-500 mt-2">
                                                            {t.selectedColor}: <span className="font-semibold text-slate-700">{selectedColors[productKey].name}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {visibleFeaturedProducts.length === 0 && (
                        <div className="text-sm text-slate-500">{lang === "vi" ? "Chưa có sản phẩm." : "No products."}</div>
                    )}
                </section>

                {/* ── 7. Promotion Banner (Combo tiết kiệm) ── */}
                {comboProducts && comboProducts.length > 0 ? (
                    <section className="px-4 lg:px-10 py-12">
                        <div className="relative overflow-hidden rounded-xl bg-primary flex flex-col md:flex-row items-center min-h-[400px]">
                            <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <div className="absolute -top-10 -right-10 w-96 h-96 rounded-full bg-white/20 blur-3xl"></div>
                                <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-background-dark/20 blur-2xl"></div>
                            </div>
                            <div className="p-8 md:p-16 flex-1 space-y-6 z-10 text-center md:text-left">
                                <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-bold tracking-wider uppercase backdrop-blur-sm">
                                    {t.comboBadge}
                                </span>
                                <h2 className="text-3xl lg:text-5xl font-black text-white leading-tight">
                                    {comboProducts[comboIndex].seoTitle || comboProducts[comboIndex].name}
                                </h2>
                                <p className="text-white/80 text-lg lg:text-xl line-clamp-2">
                                    {comboProducts[comboIndex].seoDesc || comboProducts[comboIndex].shortDesc || comboProducts[comboIndex].description}
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                                    <button
                                        onClick={() => {
                                            if (!currentUser) { toast.error(t.loginRequiredAction); onNavigateLogin?.(); return; }
                                            const product = comboProducts[comboIndex];
                                            handleAddToCart(product);
                                        }}
                                        className="bg-white text-primary flex items-center gap-2 px-8 py-4 rounded-xl font-black text-lg hover:shadow-xl hover:-translate-y-1 transition-all w-full sm:w-auto justify-center"
                                    >
                                        <span className="material-symbols-outlined font-bold">shopping_bag</span>
                                        {t.shopNow}
                                    </button>
                                    <button
                                        onClick={() => onNavigateProduct(comboProducts[comboIndex]._id || comboProducts[comboIndex].id)}
                                        className="bg-white/10 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 hover:-translate-y-1 transition-all w-full sm:w-auto justify-center"
                                    >
                                        {t.learnMore}
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 p-8 md:p-12 z-10 w-full h-full flex justify-center items-center">
                                <img
                                    className="max-h-[300px] md:max-h-[450px] lg:max-h-[500px] max-w-full rounded-3xl drop-shadow-2xl object-cover transition-transform duration-500 hover:scale-105"
                                    alt={comboProducts[comboIndex].alt || comboProducts[comboIndex].name}
                                    src={comboProducts[comboIndex].images?.[0] || comboProducts[comboIndex].img || "https://lh3.googleusercontent.com/aida-public/AB6AXuBcv7DFVGl-7J57hAHkUcR9nG_pigoFuKW2fTZRHjZYWM_haAqQbDQlQ3TzLsBNWPXlZ9sz8Qhkj4rfnz7HOHv7LslPy7cOvlUMF3EqdaHhFMDjClbHHRWox5KJewqabCdnCQ5HjBXi6gWf3R92-q4KfEwD0CbhTXgOt9oYlIXUtaZLm_DJGimI42Aa3PhRASZPoEN9ynxliVQFC2BntgoyPTzHVCf8_7wqxDKB3mG6OHl-7OoCz0cygFtRE1G7jTNACRqIp4NxaERL"}
                                />
                            </div>

                            {/* Navigation Dots if multiple combos exist */}
                            {comboProducts.length > 1 && (
                                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
                                    {comboProducts.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setComboIndex(i)}
                                            className={`h-2.5 rounded-full transition-all ${i === comboIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/60'}`}
                                            aria-label={`Combo banner ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                ) : (
                    <section className="px-4 lg:px-10 py-12">
                        <div className="relative overflow-hidden rounded-xl bg-primary flex flex-col md:flex-row items-center">
                            <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <div className="absolute -top-10 -right-10 w-96 h-96 rounded-full bg-white/20 blur-3xl"></div>
                                <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-background-dark/20 blur-2xl"></div>
                            </div>
                            <div className="p-8 md:p-16 flex-1 space-y-6 z-10 text-center md:text-left">
                                <h2 className="text-3xl lg:text-5xl font-black text-white">{t.promoBanner.title}</h2>
                                <p className="text-white/80 text-lg lg:text-xl">{t.promoBanner.desc}</p>
                                <button className="bg-white text-primary px-10 py-4 rounded-xl font-black text-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                                    {t.promoBanner.cta}
                                </button>
                            </div>
                            <div className="flex-1 p-8 md:p-0 z-10">
                                <img
                                    className="max-w-full h-auto drop-shadow-2xl"
                                    alt="MacBook Pro floating against a dark blue background"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcv7DFVGl-7J57hAHkUcR9nG_pigoFuKW2fTZRHjZYWM_haAqQbDQlQ3TzLsBNWPXlZ9sz8Qhkj4rfnz7HOHv7LslPy7cOvlUMF3EqdaHhFMDjClbHHRWox5KJewqabCdnCQ5HjBXi6gWf3R92-q4KfEwD0CbhTXgOt9oYlIXUtaZLm_DJGimI42Aa3PhRASZPoEN9ynxliVQFC2BntgoyPTzHVCf8_7wqxDKB3mG6OHl-7OoCz0cygFtRE1G7jTNACRqIp4NxaERL"
                                />
                            </div>
                        </div>
                    </section>
                )}

                {/* ── 8. Tech News / Blog ── */}
                <section className="px-4 lg:px-10 py-12">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-black">{t.techInsights}</h2>
                        <button
                            className="text-orange-500 font-semibold inline-flex items-center gap-1 border-b border-transparent hover:border-orange-500 disabled:opacity-60 disabled:border-transparent leading-none whitespace-nowrap"
                            type="button"
                            disabled={newsLoading}
                            onClick={newsExpanded ? collapseNews : loadAllNews}
                        >
                            {(newsExpanded ? t.viewLess : t.readBlog)} <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {newsPosts.map((post, i) => (
                            <div key={post._id || post.slug || i} className="group">
                                <div className="rounded-xl overflow-hidden aspect-[16/10] mb-4">
                                    <img
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        alt={post.title}
                                        src={post.thumbnail || POST_IMGS[i % POST_IMGS.length]}
                                    />
                                </div>
                                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">{post.tag || "—"}</span>
                                <button
                                    type="button"
                                    onClick={() => onNavigatePost && onNavigatePost(post.slug || post._id)}
                                    className="text-left text-xl font-bold mt-2 group-hover:text-primary transition-colors"
                                >
                                    {post.title}
                                </button>
                                <p className="text-slate-500 text-sm mt-3 line-clamp-2">{post.description || ""}</p>
                            </div>
                        ))}
                    </div>
                </section>

            </main>

            {/* ── 9. Footer ── */}
            <Footer lang={lang} setLang={setLang} />

        </div>
    );
}
