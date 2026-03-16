
import { Suspense, lazy, useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { Toaster } from "sonner";
import { ADMIN_PAGE_SEGMENTS, getAdminPageFromPathname, getAdminPagePath } from "./utils/adminRoutes";
import { getStoredAuthHeaderToken } from "./utils/authStorage";
import { canAccessAdminApp, canAccessAdminPage, getDefaultAdminPage } from "./utils/adminAccess";
import { readStoredUserProfile } from "./utils/userProfile";

const Home = lazy(() => import("./Home"));
const Login = lazy(() => import("./Login"));
const ForgotPassword = lazy(() => import("./ForgotPassword"));
const ResetPassword = lazy(() => import("./ResetPassword"));
const Register = lazy(() => import("./Register"));
const Terms = lazy(() => import("./Terms"));
const Privacy = lazy(() => import("./Privacy"));
const AdminDashboard = lazy(() => import("./AdminDashboard"));
const ProductDetail = lazy(() => import("./ProductDetail"));
const PostDetail = lazy(() => import("./PostDetail"));
const CategoryProducts = lazy(() => import("./CategoryProducts"));
const BrandProducts = lazy(() => import("./BrandProducts"));
const Cart = lazy(() => import("./Cart"));
const MyOrders = lazy(() => import("./MyOrders"));
const Wishlist = lazy(() => import("./Wishlist"));
const Voucher = lazy(() => import("./Voucher"));
const Settings = lazy(() => import("./Settings"));
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage"));
const ActivityLogPage = lazy(() => import("./pages/admin/ActivityLogPage"));
const CategoriesPage = lazy(() => import("./pages/admin/CategoriesPage"));
const ProductsPage = lazy(() => import("./pages/admin/ProductsPage"));
const ReviewsPage = lazy(() => import("./pages/admin/ReviewsPage"));
const BrandsPage = lazy(() => import("./pages/admin/BrandsPage"));
const OrdersPage = lazy(() => import("./pages/admin/OrdersPage"));
const OrderDetailPage = lazy(() => import("./pages/admin/OrderDetailPage"));
const AftersalesCasesPage = lazy(() => import("./pages/admin/AftersalesCasesPage"));
const OrderAftersalesDetailPage = lazy(() => import("./pages/admin/OrderAftersalesDetailPage"));
const PostsPage = lazy(() => import("./pages/admin/PostsPage"));
const PostCategoriesPage = lazy(() => import("./pages/admin/PostCategoriesPage"));
const RolesPage = lazy(() => import("./pages/admin/RolesPage"));
const UsersPage = lazy(() => import("./pages/admin/UsersPage"));
const AnalyticsPage = lazy(() => import("./pages/admin/AnalyticsPage"));
const CouponsPage = lazy(() => import("./pages/admin/CouponsPage"));
const FlashSaleSettings = lazy(() => import("./pages/admin/FlashSaleSettings"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));

function PageLoader({ lang }) {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex items-center justify-center font-display">
            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 shadow-sm">
                    <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                    <span className="text-sm font-semibold">{lang === "vi" ? "Đang tải..." : "Loading..."}</span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                    {lang === "vi" ? "Vui lòng chờ..." : "Please wait..."}
                </p>
            </div>
        </div>
    );
}

function ScrollToTop() {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
    }, [location.pathname]);

    return null;
}

function HomeRoute({ lang, setLang }) {
    const navigate = useNavigate();

    return (
        <Home
            lang={lang}
            setLang={setLang}
            onNavigateLogin={() => navigate("/login")}
            onNavigateAdmin={() => navigate("/admin")}
            onNavigateCart={() => navigate("/cart")}
            onNavigateOrders={() => navigate("/orders")}
            onNavigateWishlist={() => navigate("/wishlist")}
            onNavigateVoucher={() => navigate("/voucher")}
            onNavigateSettings={() => navigate("/settings")}
            onNavigateProduct={(id) => navigate(`/products/${id}`)}
            onNavigateCategory={(id) => navigate(`/categories/${id}`)}
            onNavigateBrand={(id) => navigate(`/brands/${id}`)}
            onNavigatePost={(id) => navigate(`/posts/${id}`)}
        />
    );
}

function LoginRoute({ lang, setLang }) {
    const navigate = useNavigate();
    const location = useLocation();
    const requestedAdminPath = typeof location.state?.from === "string" && location.state.from.startsWith("/admin")
        ? location.state.from
        : null;

    return (
        <Login
            lang={lang}
            setLang={setLang}
            onNavigateHome={() => navigate("/")}
            onNavigateRegister={() => navigate("/register")}
            onNavigateAdmin={() => navigate(requestedAdminPath || "/admin")}
            onNavigateForgot={() => navigate("/forgot-password")}
        />
    );
}

function ForgotPasswordRoute({ lang, setLang }) {
    const navigate = useNavigate();

    return (
        <ForgotPassword
            lang={lang}
            setLang={setLang}
            onNavigateLogin={() => navigate("/login")}
            onNavigateReset={() => navigate("/reset-password")}
        />
    );
}

function ResetPasswordRoute({ lang, setLang }) {
    const navigate = useNavigate();

    return (
        <ResetPassword
            lang={lang}
            setLang={setLang}
            onNavigateLogin={() => navigate("/login")}
        />
    );
}

function RegisterRoute({ lang, setLang }) {
    const navigate = useNavigate();

    return (
        <Register
            lang={lang}
            setLang={setLang}
            onNavigateLogin={() => navigate("/login")}
            onNavigateTerms={() => navigate("/terms")}
            onNavigatePrivacy={() => navigate("/privacy")}
        />
    );
}

function TermsRoute({ lang, setLang }) {
    const navigate = useNavigate();

    return (
        <Terms
            onNavigateHome={() => navigate("/")}
            onNavigateRegister={() => navigate("/register")}
            lang={lang}
            setLang={setLang}
        />
    );
}

function PrivacyRoute({ lang, setLang }) {
    const navigate = useNavigate();

    return (
        <Privacy
            onNavigateHome={() => navigate("/")}
            onNavigateRegister={() => navigate("/register")}
            lang={lang}
            setLang={setLang}
        />
    );
}

function ProductRoute({ lang, setLang }) {
    const navigate = useNavigate();
    const { productId } = useParams();

    return (
        <ProductDetail
            lang={lang}
            setLang={setLang}
            productId={productId}
            onNavigateHome={() => navigate("/")}
            onNavigateLogin={() => navigate("/login")}
            onNavigateCart={() => navigate("/cart")}
            onNavigateCategory={(id) => navigate(`/categories/${id}`)}
            onNavigateProduct={(id) => navigate(`/products/${id}`)}
        />
    );
}

function CategoryRoute({ lang, setLang }) {
    const navigate = useNavigate();
    const { categoryId } = useParams();

    return (
        <CategoryProducts
            lang={lang}
            setLang={setLang}
            categoryId={categoryId}
            onNavigateHome={() => navigate("/")}
            onNavigateProduct={(id) => navigate(`/products/${id}`)}
        />
    );
}

function BrandRoute({ lang, setLang }) {
    const navigate = useNavigate();
    const { brandId } = useParams();

    return (
        <BrandProducts
            lang={lang}
            setLang={setLang}
            brandId={brandId}
            onNavigateHome={() => navigate("/")}
            onNavigateProduct={(id) => navigate(`/products/${id}`)}
        />
    );
}

function CartRoute({ lang, setLang }) {
    const navigate = useNavigate();

    return (
        <Cart
            lang={lang}
            setLang={setLang}
            onNavigateHome={() => navigate("/")}
            onNavigateLogin={() => navigate("/login")}
            onNavigateOrders={() => navigate("/orders")}
        />
    );
}

function OrdersRoute({ lang, setLang }) {
    const navigate = useNavigate();

    return (
        <MyOrders
            lang={lang}
            setLang={setLang}
            onNavigateHome={() => navigate("/")}
            onNavigateLogin={() => navigate("/login")}
            onNavigateProduct={(id) => navigate(`/products/${id}`)}
        />
    );
}

function WishlistRoute({ lang, setLang }) {
    const navigate = useNavigate();

    return (
        <Wishlist
            lang={lang}
            setLang={setLang}
            onNavigateHome={() => navigate("/")}
            onNavigateProduct={(id) => navigate(`/products/${id}`)}
        />
    );
}

function VoucherRoute({ lang, setLang }) {
    const navigate = useNavigate();

    return (
        <Voucher
            lang={lang}
            setLang={setLang}
            onNavigateHome={() => navigate("/")}
            onNavigateLogin={() => navigate("/login")}
            onNavigateCart={() => navigate("/cart")}
        />
    );
}

function SettingsRoute({ lang, setLang }) {
    const navigate = useNavigate();

    return (
        <Settings
            lang={lang}
            setLang={setLang}
            onNavigateHome={() => navigate("/")}
            onNavigateLogin={() => navigate("/login")}
        />
    );
}

function PostRoute({ lang, setLang }) {
    const navigate = useNavigate();
    const { postId } = useParams();

    return (
        <PostDetail
            lang={lang}
            setLang={setLang}
            postId={postId}
            onNavigateHome={() => navigate("/")}
        />
    );
}

function AdminRouteGuard() {
    const location = useLocation();
    const [currentUser, setCurrentUser] = useState(() => readStoredUserProfile());
    const [authToken, setAuthToken] = useState(() => getStoredAuthHeaderToken());

    useEffect(() => {
        const syncAuthState = () => {
            setCurrentUser(readStoredUserProfile());
            setAuthToken(getStoredAuthHeaderToken());
        };

        window.addEventListener("user:updated", syncAuthState);
        window.addEventListener("storage", syncAuthState);

        return () => {
            window.removeEventListener("user:updated", syncAuthState);
            window.removeEventListener("storage", syncAuthState);
        };
    }, []);

    if (!authToken || !currentUser?.id) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    if (!canAccessAdminApp(currentUser)) {
        return <Navigate to="/" replace />;
    }

    const requestedAdminPage = getAdminPageFromPathname(location.pathname);
    const fallbackAdminPage = getDefaultAdminPage(currentUser);

    if (!fallbackAdminPage) {
        return <Navigate to="/" replace />;
    }

    if (requestedAdminPage && !canAccessAdminPage(currentUser, requestedAdminPage)) {
        return <Navigate to={getAdminPagePath(fallbackAdminPage)} replace />;
    }

    return <Outlet />;
}

function useAdminRouteHelpers() {
    const navigate = useNavigate();

    return {
        onNavigateHome: () => navigate("/"),
        onSelectPage: (page) => navigate(getAdminPagePath(page)),
    };
}

function AdminLayoutRoute({ lang, setLang }) {
    const { onNavigateHome } = useAdminRouteHelpers();

    return (
        <AdminDashboard
            lang={lang}
            setLang={setLang}
            onNavigateHome={onNavigateHome}
        >
            <Outlet />
        </AdminDashboard>
    );
}

function AdminPageRoute(props) {
    const { onNavigateHome, onSelectPage } = useAdminRouteHelpers();
    const ResolvedPage = props.component;

    return <ResolvedPage lang={props.lang} onNavigateHome={onNavigateHome} onSelectPage={onSelectPage} />;
}

export default function App() {
    const [lang, setLang] = useState(() => {
        try {
            return localStorage.getItem("lang") || "vi";
        } catch {
            return "vi";
        }
    });

    const handleSetLang = (newLang) => {
        setLang(newLang);
        try {
            localStorage.setItem("lang", newLang);
        } catch {
            // ignore
        }
    };

    return (
        <>
            <Toaster position="bottom-right" richColors />
            <Suspense fallback={<PageLoader lang={lang} />}>
                <ScrollToTop />
                <Routes>
                    <Route path="/" element={<HomeRoute lang={lang} setLang={handleSetLang} />} />
                    <Route path="/home" element={<Navigate to="/" replace />} />
                    <Route path="/login" element={<LoginRoute lang={lang} setLang={handleSetLang} />} />
                    <Route path="/forgot-password" element={<ForgotPasswordRoute lang={lang} setLang={handleSetLang} />} />
                    <Route path="/reset-password" element={<ResetPasswordRoute lang={lang} setLang={handleSetLang} />} />
                    <Route path="/register" element={<RegisterRoute lang={lang} setLang={handleSetLang} />} />
                    <Route path="/terms" element={<TermsRoute lang={lang} setLang={handleSetLang} />} />
                    <Route path="/privacy" element={<PrivacyRoute lang={lang} setLang={handleSetLang} />} />
                    
                    <Route element={<AdminRouteGuard />}>
                        <Route path="/admin" element={<AdminLayoutRoute lang={lang} setLang={handleSetLang} />}>
                            <Route index element={<AdminPageRoute component={DashboardPage} lang={lang} />} />
                            <Route path={ADMIN_PAGE_SEGMENTS.activityLog} element={<AdminPageRoute component={ActivityLogPage} lang={lang} />} />
                            <Route path={ADMIN_PAGE_SEGMENTS.categories} element={<AdminPageRoute component={CategoriesPage} lang={lang} />} />
                            <Route path={ADMIN_PAGE_SEGMENTS.products} element={<AdminPageRoute component={ProductsPage} lang={lang} />} />
                            <Route path={ADMIN_PAGE_SEGMENTS.reviews} element={<AdminPageRoute component={ReviewsPage} lang={lang} />} />
                            <Route path={ADMIN_PAGE_SEGMENTS.brands} element={<AdminPageRoute component={BrandsPage} lang={lang} />} />
                            <Route path={ADMIN_PAGE_SEGMENTS.orders} element={<AdminPageRoute component={OrdersPage} lang={lang} />} />
                            <Route path={ADMIN_PAGE_SEGMENTS.aftersales} element={<AdminPageRoute component={AftersalesCasesPage} lang={lang} />} />
                            <Route path={`${ADMIN_PAGE_SEGMENTS.aftersales}/:orderId`} element={<AdminPageRoute component={OrderAftersalesDetailPage} lang={lang} />} />
                            <Route path={`${ADMIN_PAGE_SEGMENTS.orders}/:orderId`} element={<AdminPageRoute component={OrderDetailPage} lang={lang} />} />
                            <Route path={`${ADMIN_PAGE_SEGMENTS.orders}/:orderId/aftersales`} element={<AdminPageRoute component={OrderAftersalesDetailPage} lang={lang} />} />
                            <Route path={ADMIN_PAGE_SEGMENTS.posts} element={<AdminPageRoute component={PostsPage} lang={lang} />} />
                            <Route path={ADMIN_PAGE_SEGMENTS.postCategories} element={<AdminPageRoute component={PostCategoriesPage} lang={lang} />} />
                            <Route path={ADMIN_PAGE_SEGMENTS.roles} element={<AdminPageRoute component={RolesPage} lang={lang} />} />
                            <Route path={ADMIN_PAGE_SEGMENTS.users} element={<AdminPageRoute component={UsersPage} lang={lang} />} />
                            <Route path={ADMIN_PAGE_SEGMENTS.analytics} element={<AdminPageRoute component={AnalyticsPage} lang={lang} />} />
                            <Route path={ADMIN_PAGE_SEGMENTS.coupons} element={<AdminPageRoute component={CouponsPage} lang={lang} />} />
                            <Route path={ADMIN_PAGE_SEGMENTS.flashSale} element={<AdminPageRoute component={FlashSaleSettings} lang={lang} />} />
                            <Route path={ADMIN_PAGE_SEGMENTS.settings} element={<AdminPageRoute component={SettingsPage} lang={lang} />} />
                            <Route path="*" element={<Navigate to="/admin" replace />} />
                        </Route>
                    </Route>

                    <Route path="/products/:productId" element={<ProductRoute lang={lang} setLang={handleSetLang} />} />
                    <Route path="/categories/:categoryId" element={<CategoryRoute lang={lang} setLang={handleSetLang} />} />
                    <Route path="/brands/:brandId" element={<BrandRoute lang={lang} setLang={handleSetLang} />} />
                    <Route path="/cart" element={<CartRoute lang={lang} setLang={handleSetLang} />} />
                    <Route path="/orders" element={<OrdersRoute lang={lang} setLang={handleSetLang} />} />
                    <Route path="/wishlist" element={<WishlistRoute lang={lang} setLang={handleSetLang} />} />
                    <Route path="/voucher" element={<VoucherRoute lang={lang} setLang={handleSetLang} />} />
                    <Route path="/settings" element={<SettingsRoute lang={lang} setLang={handleSetLang} />} />
                    <Route path="/posts/:postId" element={<PostRoute lang={lang} setLang={handleSetLang} />} />
                    
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </>
    );
}
