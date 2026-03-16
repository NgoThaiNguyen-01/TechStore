import React, { useState, useEffect, useCallback } from "react";
import ProductFilters from "../../components/products/ProductFilters";
import ProductTable from "../../components/products/ProductTable";
import ProductModal from "../../components/products/ProductModal";
import Pagination from "../../components/common/Pagination";
import SkeletonTable from "../../components/common/SkeletonTable";
import { getCategories } from "../../services/categoryApi";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../../services/productApi";
import { toast } from "sonner";
import { hasAdminPermission } from "../../utils/adminAccess";
import { readStoredUserProfile } from "../../utils/userProfile";

const T = {
    vi: {
        title: "Sản phẩm",
        subtitle: "Quản lý danh sách sản phẩm trong hệ thống.",
        export: "Xuất file",
        addProduct: "Thêm sản phẩm",
        searchPlaceholder: "Tìm theo tên sản phẩm",
        allBrands: "Thương hiệu (Tất cả)",
        allCategories: "Danh mục (Tất cả)",
        filterCreatedDate: "Lọc theo ngày tạo",
        filterUpdatedDate: "Lọc theo ngày cập nhật",
        reset: "Xóa lọc",
        sortLabel: "Sắp xếp",
        sortAZ: "A-Z",
        sortZA: "Z-A",
        sortNewest: "Mới nhất",
        sortOldest: "Cũ nhất",
        sortPriceAsc: "Giá thấp đến cao",
        sortPriceDesc: "Giá cao đến thấp",
        colProduct: "Sản phẩm",
        colBrand: "Thương hiệu",
        colCategory: "Danh mục",
        colPrice: "Giá",
        colStock: "Tồn kho",
        colStatus: "Trạng thái",
        colDate: "Ngày tạo",
        colUpdatedAt: "Ngày cập nhật",
        colActions: "Thao tác",
        statusActive: "Hoạt động",
        statusHidden: "Ẩn",
        statusDraft: "Nháp",
        statusOutOfStock: "Hết hàng",
        statusArchived: "Đã lưu trữ",
        notFound: "Không tìm thấy sản phẩm nào",
        showing: "Hiển thị",
        to: "đến",
        of: "trong",
        results: "sản phẩm",
        prev: "Trước",
        next: "Sau",
        addTitle: "Thêm sản phẩm mới",
        editTitle: "Chỉnh sửa sản phẩm",
        viewTitle: "Chi tiết sản phẩm",
        secBasic: "Thông tin cơ bản",
        secDesc: "Mô tả sản phẩm",
        secSeo: "SEO",
        fieldName: "Tên sản phẩm",
        namePlaceholder: "Nhập tên sản phẩm",
        fieldBrand: "Thương hiệu",
        brandPlaceholder: "Chọn thương hiệu",
        fieldSlug: "Đường dẫn (Tự động)",
        slugPlaceholder: "Tự động",
        fieldSlugManual: "Đường dẫn (Tự nhập)",
        slugPlaceholderManual: "Tự nhập",
        fieldCategory: "Danh mục",
        fieldStock: "Số lượng tồn kho",
        fieldPrice: "Giá niêm yết (VNĐ)",
        fieldDiscount: "Giảm giá (%)",
        stockInvalid: "Số lượng tồn kho phải lớn hơn hoặc bằng 0",
        salePriceResult: "Giá KM",
        fieldStatus: "Trạng thái",
        fieldShortDesc: "Mô tả ngắn",
        fieldDesc: "Mô tả chi tiết",
        fieldSeoTitle: "Tiêu đề SEO",
        fieldSeoDesc: "Mô tả SEO",
        fieldCreatedAt: "Ngày tạo",
        fieldUpdatedAt: "Ngày cập nhật",
        imageGallery: "Thư viện ảnh",
        noImage: "Chưa có ảnh",
        noData: "Chưa có dữ liệu",
        noDiscount: "Chưa có giảm giá",
        noShortDesc: "Chưa có mô tả ngắn",
        noDesc: "Chưa có mô tả chi tiết",
        imageHint: "Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB/ảnh.",
        uploadFile: "Tải ảnh lên",
        addFromUrl: "Thêm từ URL",
        imageUrlPlaceholder: "Nhập URL ảnh...",
        addBtn: "Thêm",
        colors: "Bảng màu",
        addColor: "Thêm màu",
        colorName: "Tên màu",
        colorHex: "Mã màu",
        colorPreview: "Xem trước",
        colorPicker: "Chọn màu",
        colorRemove: "Xóa",
        colorNameRequired: "Tên màu bắt buộc",
        colorHexRequired: "Mã màu bắt buộc",
        colorHexInvalid: "Mã màu không hợp lệ",
        colorNameDuplicate: "Tên màu bị trùng",
        colorHexDuplicate: "Mã màu bị trùng",
        colorRemoveConfirm: "Xóa màu này?",
        noColors: "Chưa có màu.",
        techSpecs: "Thông số kỹ thuật",
        addSpec: "Thêm thông số",
        removeSpec: "Xóa",
        specName: "Thông số",
        specValue: "Mô tả",
        specNamePlaceholder: "Nhập thông số",
        specValuePlaceholder: "Nhập mô tả",
        noSpecs: "Chưa có thông số kỹ thuật",
        seoHint: "Tối ưu SEO giúp sản phẩm xuất hiện cao hơn trên công cụ tìm kiếm.",
        seoTitlePlaceholder: "Chưa có tiêu đề SEO",
        seoDescPlaceholder: "Chưa có mô tả SEO",
        shortDescPlaceholder: "Nhập mô tả ngắn gọn về sản phẩm...",
        descPlaceholder: "Nhập mô tả chi tiết về sản phẩm...",
        selectCategory: "Chọn danh mục",
        required: "Trường này là bắt buộc",
        requiredFields: (fields) => `Vui lòng nhập: ${fields.join(", ")}`,
        cancel: "Hủy",
        save: "Lưu & đóng",
        saving: "Đang lưu...",
        close: "Đóng",
        viewDetail: "Xem chi tiết",
        editAction: "Chỉnh sửa",
        deleteAction: "Xóa",
        deleteTitle: "Xóa sản phẩm?",
        deleteSoftDesc: "Sản phẩm sẽ được chuyển sang Đã lưu trữ. Dữ liệu vẫn được giữ lại.",
        deleteArchivedDesc: "Sản phẩm đang ở trạng thái Đã lưu trữ. Bạn có thể xóa vĩnh viễn.",
        deleteForceLabel: "Xóa vĩnh viễn",
        deleteForceHint: "Hành động này sẽ xóa vĩnh viễn và không thể khôi phục.",
        exportTitle: "Xuất file Excel",
        exportSelected: "Xuất theo tick chọn",
        exportAll: "Xuất tất cả theo bộ lọc",
        exportConfirm: "Xuất file",
        exportEmpty: "Chưa chọn sản phẩm nào",
        createSuccess: "Tạo sản phẩm thành công!",
        updateSuccess: "Cập nhật sản phẩm thành công!",
        deleteSuccess: "Xóa sản phẩm thành công!",
        deleteConfirm: "Bạn có chắc muốn xóa sản phẩm này không?",
        errorUnknown: "Đã xảy ra lỗi, vui lòng thử lại",
        bulkDelete: "Xóa đã chọn",
        bulkHide: "Ẩn đã chọn",
        bulkActive: "Kích hoạt đã chọn",
        selectedCount: (n) => `Đã chọn ${n} sản phẩm`,
    },
    en: {
        title: "Products",
        subtitle: "Manage your store product catalog.",
        export: "Export",
        addProduct: "Add Product",
        searchPlaceholder: "Search by name",
        allBrands: "Brand: All",
        allCategories: "Category: All",
        filterCreatedDate: "Filter by created date",
        filterUpdatedDate: "Filter by updated date",
        reset: "Reset",
        sortLabel: "Sort",
        sortAZ: "A-Z",
        sortZA: "Z-A",
        sortNewest: "Newest",
        sortOldest: "Oldest",
        sortPriceAsc: "Price: Low to High",
        sortPriceDesc: "Price: High to Low",
        colProduct: "Product",
        colBrand: "Brand",
        colCategory: "Category",
        colPrice: "Price",
        colStock: "Stock",
        colStatus: "Status",
        colDate: "Created",
        colUpdatedAt: "Updated",
        colActions: "Actions",
        statusActive: "Active",
        statusHidden: "Hidden",
        statusDraft: "Draft",
        statusOutOfStock: "Out of Stock",
        statusArchived: "Archived",
        notFound: "No products found",
        showing: "Showing",
        to: "to",
        of: "of",
        results: "products",
        prev: "Previous",
        next: "Next",
        addTitle: "Add New Product",
        editTitle: "Edit Product",
        viewTitle: "Product Details",
        secBasic: "Basic Info",
        secDesc: "Description",
        secSeo: "SEO",
        fieldName: "Product Name",
        namePlaceholder: "Enter product name",
        fieldBrand: "Brand",
        brandPlaceholder: "Select brand",
        fieldSlug: "Slug (Auto-generated)",
        slugPlaceholder: "auto-generated",
        fieldSlugManual: "Slug (Manual)",
        slugPlaceholderManual: "Leave blank or enter manually...",
        fieldCategory: "Category",
        fieldStock: "Stock Quantity",
        fieldPrice: "Price (VND)",
        fieldDiscount: "Discount (%)",
        stockInvalid: "Stock must be zero or greater",
        salePriceResult: "Sale price",
        fieldStatus: "Status",
        fieldShortDesc: "Short Description",
        fieldDesc: "Full Description",
        fieldSeoTitle: "SEO Title",
        fieldSeoDesc: "SEO Description",
        fieldCreatedAt: "Created at",
        fieldUpdatedAt: "Updated at",
        imageGallery: "Image Gallery",
        noImage: "No image",
        noData: "No data",
        noDiscount: "No discount",
        noShortDesc: "No short description",
        noDesc: "No description",
        imageHint: "Supports JPG, PNG, WEBP. Max 5MB each.",
        uploadFile: "Upload image",
        addFromUrl: "Add from URL",
        imageUrlPlaceholder: "Enter image URL...",
        addBtn: "Add",
        colors: "Color Palette",
        addColor: "Add color",
        colorName: "Color name",
        colorHex: "Color code",
        colorPreview: "Preview",
        colorPicker: "Pick",
        colorRemove: "Remove",
        colorNameRequired: "Color name is required",
        colorHexRequired: "Color code is required",
        colorHexInvalid: "Invalid color code",
        colorNameDuplicate: "Duplicate color name",
        colorHexDuplicate: "Duplicate color code",
        colorRemoveConfirm: "Delete this color?",
        noColors: "No colors yet.",
        techSpecs: "Technical Specifications",
        addSpec: "Add spec",
        removeSpec: "Remove",
        specName: "Specification",
        specValue: "Description",
        specNamePlaceholder: "Enter specification",
        specValuePlaceholder: "Enter description",
        noSpecs: "No specifications added yet",
        seoHint: "Optimize SEO to improve search engine visibility.",
        seoTitlePlaceholder: "No SEO title",
        seoDescPlaceholder: "No SEO description",
        shortDescPlaceholder: "Enter a short description...",
        descPlaceholder: "Enter detailed description...",
        selectCategory: "Select category",
        required: "This field is required",
        requiredFields: (fields) => `Please fill in: ${fields.join(", ")}`,
        cancel: "Cancel",
        save: "Save & Close",
        saving: "Saving...",
        close: "Close",
        viewDetail: "View details",
        editAction: "Edit",
        deleteAction: "Delete",
        deleteTitle: "Delete product?",
        deleteSoftDesc: "Product will be moved to Archived. Data is preserved.",
        deleteArchivedDesc: "Product is already archived. You can delete it permanently.",
        deleteForceLabel: "Delete permanently",
        deleteForceHint: "This action permanently deletes the product.",
        exportTitle: "Export Excel",
        exportSelected: "Export selected",
        exportAll: "Export all by filters",
        exportConfirm: "Export",
        exportEmpty: "No products selected",
        createSuccess: "Product created successfully!",
        updateSuccess: "Product updated successfully!",
        deleteSuccess: "Product deleted successfully!",
        deleteConfirm: "Are you sure you want to delete this product?",
        errorUnknown: "Something went wrong, please try again",
        bulkDelete: "Delete Selected",
        bulkHide: "Hide Selected",
        bulkActive: "Activate Selected",
        selectedCount: (n) => `${n} selected`,
    },
};

// Sample mock data for UI demonstration (replace with real API)
const MOCK_PRODUCTS = [];

export default function ProductsPage({ lang = "vi" }) {
    const t = T[lang] || T.vi;

    const [products, setProducts] = useState(MOCK_PRODUCTS);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [brandFilter, setBrandFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [stockFilter, setStockFilter] = useState("all");
    const [priceRange, setPriceRange] = useState("all");
    const [sort, setSort] = useState("createdAt:desc");
    const [createdDate, setCreatedDate] = useState("");
    const [updatedDate, setUpdatedDate] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const [selected, setSelected] = useState([]);
    const [selectedMap, setSelectedMap] = useState({});
    const [modal, setModal] = useState(null);
    const [deleteModal, setDeleteModal] = useState(null);
    const [deleteForce, setDeleteForce] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [exportModal, setExportModal] = useState(false);
    const [exportMode, setExportMode] = useState("selected");
    const [exportLoading, setExportLoading] = useState(false);

    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);

    const currentUser = readStoredUserProfile();
    const canCreateProduct = hasAdminPermission(currentUser, "product:create");
    const canUpdateProduct = hasAdminPermission(currentUser, "product:update");
    const canDeleteProduct = hasAdminPermission(currentUser, "product:delete");

    // Fetch categories and brands for filters and modal
    const fetchCategories = useCallback(async () => {
        try {
            const res = await getCategories({ limit: 200 });
            setCategories(res.data || []);
        } catch { /* fallback to empty */ }
    }, []);

    const fetchBrands = useCallback(async () => {
        try {
            const { getBrands } = await import("../../services/brandApi");
            const res = await getBrands({ limit: 200 });
            setBrands(res.data || []);
        } catch { /* fallback to empty */ }
    }, []);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit, sort };
            if (search) params.search = search;
            if (statusFilter !== "all") params.status = statusFilter;
            if (brandFilter !== "all") params.brand = brandFilter;
            if (categoryFilter !== "all") params.category = categoryFilter;

            if (stockFilter === "in") params.minStock = 1;
            if (stockFilter === "out") params.maxStock = 0;

            if (priceRange !== "all") {
                const [min, max] = priceRange.split("-");
                if (min) params.minPrice = min;
                if (max) params.maxPrice = max;
            }
            if (createdDate) params.createdDate = createdDate;
            if (updatedDate) params.updatedDate = updatedDate;

            const res = await getProducts(params);
            setProducts(res.data || []);
            const apiTotalPages = res.pagination?.totalPages ?? res.pagination?.pages;
            const apiTotalItems = res.pagination?.totalItems ?? res.pagination?.total;
            setTotalPages(typeof apiTotalPages === "number" ? apiTotalPages : 1);
            setTotalProducts(typeof apiTotalItems === "number" ? apiTotalItems : (res.data || []).length);
        } catch {
            toast.error(t.errorUnknown);
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, statusFilter, brandFilter, categoryFilter, stockFilter, priceRange, sort, createdDate, updatedDate, t]);

    useEffect(() => { fetchCategories(); fetchBrands(); }, [fetchCategories, fetchBrands]);
    useEffect(() => { fetchProducts(); }, [fetchProducts]);
    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, brandFilter, categoryFilter, stockFilter, priceRange, sort, createdDate, updatedDate]);

    useEffect(() => {
        setSelected([]);
        setSelectedMap({});
    }, [search, statusFilter, brandFilter, categoryFilter, stockFilter, priceRange, sort, createdDate, updatedDate]);

    // Only show subcategories (categories that have a parent)
    const subcategories = categories.filter((c) => c.parent);

    const resetFilters = () => {
        setSearch(""); setStatusFilter("all"); setBrandFilter("all"); setCategoryFilter("all");
        setStockFilter("all"); setPriceRange("all"); setSort("createdAt:desc"); setCreatedDate(""); setUpdatedDate(""); setPage(1); setSelected([]); setSelectedMap({});
    };

    const toggleSelect = (id) => {
        setSelected((prev) => {
            const exists = prev.includes(id);
            setSelectedMap((map) => {
                if (exists) {
                    const next = { ...map };
                    delete next[id];
                    return next;
                }
                const item = products.find((p) => p._id === id);
                if (!item) return map;
                return { ...map, [id]: item };
            });
            return exists ? prev.filter((x) => x !== id) : [...prev, id];
        });
    };

    const toggleAll = () => {
        const currentIds = products.map((p) => p._id);
        const allSelected = currentIds.length > 0 && currentIds.every((id) => selected.includes(id));
        if (allSelected) {
            setSelected((prev) => prev.filter((id) => !currentIds.includes(id)));
            setSelectedMap((map) => {
                const next = { ...map };
                currentIds.forEach((id) => { delete next[id]; });
                return next;
            });
        } else {
            setSelected((prev) => Array.from(new Set([...prev, ...currentIds])));
            setSelectedMap((map) => {
                const next = { ...map };
                products.forEach((p) => { next[p._id] = p; });
                return next;
            });
        }
    };

    const openAdd = () => {
        if (!canCreateProduct) return;
        setModal({ mode: "add", data: null });
    };
    const openEdit = (p) => {
        if (!canUpdateProduct) return;
        setModal({ mode: "edit", data: p });
    };
    const openView = (p) => setModal({ mode: "view", data: p });
    const closeModal = () => setModal(null);

    const handleSave = async (formData) => {
        if (modal?.mode === "add" && !canCreateProduct) return;
        if (modal?.mode === "edit" && !canUpdateProduct) return;
        try {
            if (modal.mode === "add") {
                await createProduct(formData);
                toast.success(t.createSuccess);
            } else {
                await updateProduct(modal.data._id, formData);
                toast.success(t.updateSuccess);
            }
            closeModal();
            fetchProducts();
        } catch (err) {
            toast.error(err.response?.data?.message || t.errorUnknown);
        }
    };

    const handleDelete = (product) => {
        if (!canDeleteProduct) return;
        setDeleteModal(product);
        setDeleteForce(false);
    };

    const handleConfirmDelete = async () => {
        if (!canDeleteProduct) return;
        if (!deleteModal) return;
        setDeleteLoading(true);
        try {
            const params = deleteForce ? { force: true } : undefined;
            const res = await deleteProduct(deleteModal._id, params);
            toast.success(res?.message || t.deleteSuccess);
            setDeleteModal(null);
            fetchProducts();
        } catch (err) {
            toast.error(err.response?.data?.message || t.errorUnknown);
        } finally {
            setDeleteLoading(false);
        }
    };

    const formatDateTime = (value) => {
        if (!value) return "â€”";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "â€”";
        return date.toLocaleString(lang === "vi" ? "vi-VN" : "en-US");
    };

    const formatUpdatedAt = (createdAt, updatedAt) => {
        if (!createdAt || !updatedAt) return "â€”";
        const created = new Date(createdAt).getTime();
        const updated = new Date(updatedAt).getTime();
        if (Number.isNaN(created) || Number.isNaN(updated)) return "â€”";
        if (created === updated) return "â€”";
        return formatDateTime(updatedAt);
    };

    const escapeCsv = (value) => {
        const str = value === null || value === undefined ? "" : String(value);
        return `"${str.replace(/"/g, '""')}"`;
    };

    const buildExportParams = (pageIndex, pageSize) => {
        const params = { page: pageIndex, limit: pageSize, sort };
        if (search) params.search = search;
        if (statusFilter !== "all") params.status = statusFilter;
        if (brandFilter !== "all") params.brand = brandFilter;
        if (categoryFilter !== "all") params.category = categoryFilter;
        if (stockFilter === "in") params.minStock = 1;
        if (stockFilter === "out") params.maxStock = 0;
        if (priceRange !== "all") {
            const [min, max] = priceRange.split("-");
            if (min) params.minPrice = min;
            if (max) params.maxPrice = max;
        }
        if (createdDate) params.createdDate = createdDate;
        if (updatedDate) params.updatedDate = updatedDate;
        return params;
    };

    const fetchAllProducts = async () => {
        const pageSize = 200;
        let pageIndex = 1;
        let totalPagesLocal = 1;
        const all = [];
        do {
            const res = await getProducts(buildExportParams(pageIndex, pageSize));
            const rows = res.data || [];
            all.push(...rows);
            totalPagesLocal = res.pagination?.totalPages || 1;
            pageIndex += 1;
        } while (pageIndex <= totalPagesLocal);
        return all;
    };

    const buildCsv = (rows) => {
        const statusLabels = lang === "vi"
            ? {
                active: "Hoạt động",
                hidden: "Ẩn",
                draft: "Nháp",
                archived: "Đã lưu trữ",
                out_of_stock: "Hết hàng"
            }
            : {
                active: "Active",
                hidden: "Hidden",
                draft: "Draft",
                archived: "Archived",
                out_of_stock: "Out of Stock"
            };
        const headers = lang === "vi"
            ? ["ID", "Tên sản phẩm", "Thương hiệu", "Danh mục", "Giá", "Giá KM", "Tồn kho", "Trạng thái", "Ngày tạo", "Ngày cập nhật"]
            : ["ID", "Product", "Brand", "Category", "Price", "Sale price", "Stock", "Status", "Created at", "Updated at"];
        const lines = [
            headers.map(escapeCsv).join(",")
        ];
        rows.forEach((p) => {
            const brandName = p.brand?.name || p.brand || "";
            const categoryName = p.category?.name || "";
            const row = [
                p._id || "",
                p.name || "",
                brandName,
                categoryName,
                p.price ?? "",
                p.salePrice ?? "",
                p.stock ?? "",
                statusLabels[p.status] || p.status || "",
                formatDateTime(p.createdAt),
                formatUpdatedAt(p.createdAt, p.updatedAt)
            ];
            lines.push(row.map(escapeCsv).join(","));
        });
        return `\uFEFF${lines.join("\n")}`;
    };

    const downloadCsv = (content) => {
        const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const stamp = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.download = `products_${stamp}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const handleExport = async () => {
        if (exportMode === "selected" && selected.length === 0) {
            toast.error(t.exportEmpty);
            return;
        }
        setExportLoading(true);
        try {
            let exportRows = [];
            if (exportMode === "selected") {
                const selectedSet = new Set(selected);
                exportRows = selected.map((id) => selectedMap[id]).filter(Boolean);
                if (exportRows.length !== selected.length) {
                    const all = await fetchAllProducts();
                    exportRows = all.filter((p) => selectedSet.has(p._id));
                }
            } else {
                exportRows = await fetchAllProducts();
            }
            const csv = buildCsv(exportRows);
            downloadCsv(csv);
            setExportModal(false);
        } catch {
            toast.error(t.errorUnknown);
        } finally {
            setExportLoading(false);
        }
    };

    const openExport = () => {
        const defaultMode = selected.length > 0 ? "selected" : "all";
        setExportMode(defaultMode);
        setExportModal(true);
    };

    return (
        <div className="p-6 lg:p-8 flex flex-col gap-6 min-h-full">
            {/* Page Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">{t.title}</h1>
                    <p className="text-sm text-slate-500 mt-1">{t.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={openExport} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        {t.export}
                    </button>
                    <button
                        onClick={openAdd}
                        disabled={!canCreateProduct}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        {t.addProduct}
                    </button>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <ProductFilters
                    lang={lang}
                    search={search}
                    setSearch={(v) => { setSearch(v); setPage(1); }}
                    statusFilter={statusFilter}
                    setStatusFilter={(v) => { setStatusFilter(v); setPage(1); }}
                    brandFilter={brandFilter}
                    setBrandFilter={(v) => { setBrandFilter(v); setPage(1); }}
                    categoryFilter={categoryFilter}
                    setCategoryFilter={(v) => { setCategoryFilter(v); setPage(1); }}
                    stockFilter={stockFilter}
                    setStockFilter={(v) => { setStockFilter(v); setPage(1); }}
                    priceRange={priceRange}
                    setPriceRange={(v) => { setPriceRange(v); setPage(1); }}
                    sort={sort}
                    setSort={(v) => { setSort(v); setPage(1); }}
                    createdDate={createdDate}
                    setCreatedDate={(v) => { setCreatedDate(v); setPage(1); }}
                    updatedDate={updatedDate}
                    setUpdatedDate={(v) => { setUpdatedDate(v); setPage(1); }}
                    brands={brands}
                    categories={subcategories}
                    onReset={resetFilters}
                    t={t}
                />

                {loading ? (
                    <div className="p-4"><SkeletonTable columns={10} rows={limit} /></div>
                ) : (
                    <>
                        <ProductTable
                            products={products}
                            selected={selected}
                            onToggleSelect={toggleSelect}
                            onToggleAll={toggleAll}
                            onView={openView}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            canEdit={canUpdateProduct}
                            canDelete={canDeleteProduct}
                            t={t}
                        />
                        <Pagination
                            page={page}
                            limit={limit}
                            total={totalProducts}
                            totalPages={totalPages}
                            onPageChange={(p) => setPage(p)}
                            showingText={t.showing}
                            toText={t.to}
                            ofText={t.of}
                            resultsText={t.results}
                            prevText={t.prev}
                            nextText={t.next}
                        />
                    </>
                )}
            </div>

            {/* Modal */}
            {modal && (
                <ProductModal
                    key={`${modal.mode}-${modal.data?._id || "new"}`}
                    mode={modal.mode}
                    initialData={modal.data}
                    categories={subcategories}
                    brands={brands}
                    onClose={closeModal}
                    onSave={handleSave}
                    t={t}
                />
            )}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">{t.deleteTitle}</h2>
                            <button onClick={() => setDeleteModal(null)} className="text-slate-400 hover:text-slate-700">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <p className="text-sm text-slate-600">
                                {deleteModal.status === "archived" ? t.deleteArchivedDesc : t.deleteSoftDesc}
                            </p>
                            <p className="text-sm font-semibold text-slate-800">{deleteModal.name}</p>
                            {canDeleteProduct && (
                                <label className="flex items-start gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={deleteForce}
                                        onChange={(e) => setDeleteForce(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                    />
                                    <span>
                                        {t.deleteForceLabel}
                                        {deleteForce && <span className="block text-xs text-red-500 mt-1">{t.deleteForceHint}</span>}
                                    </span>
                                </label>
                            )}
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                            <button onClick={() => setDeleteModal(null)} className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                {t.cancel}
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleteLoading}
                                className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-60"
                            >
                                {t.deleteAction}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {exportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">{t.exportTitle}</h2>
                            <button onClick={() => setExportModal(false)} className="text-slate-400 hover:text-slate-700">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="radio"
                                    name="export-mode"
                                    value="selected"
                                    checked={exportMode === "selected"}
                                    onChange={() => setExportMode("selected")}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span>{t.exportSelected}</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="radio"
                                    name="export-mode"
                                    value="all"
                                    checked={exportMode === "all"}
                                    onChange={() => setExportMode("all")}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span>{t.exportAll}</span>
                            </label>
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                            <button onClick={() => setExportModal(false)} className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                {t.cancel}
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={exportLoading}
                                className="px-4 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
                            >
                                {t.exportConfirm}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
