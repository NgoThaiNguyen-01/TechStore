import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Pagination from "../../components/common/Pagination";
import {
    getPostCategories,
    createPostCategory,
    updatePostCategory,
    deletePostCategory
} from "../../services/postCategoryApi";
import { hasAdminPermission } from "../../utils/adminAccess";
import { readStoredUserProfile } from "../../utils/userProfile";

function slugifyText(text) {
    return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

const translations = {
    vi: {
        title: "Chuyên mục Tin tức",
        subtitle: "Quản lý các chuyên mục bài viết.",
        addCategory: "Thêm chuyên mục",
        export: "Xuất file",
        searchPlaceholder: "Tìm kiếm chuyên mục...",
        allStatuses: "Tất cả trạng thái",
        sortLabel: "Sắp xếp",
        sortNewest: "Mới nhất",
        sortOldest: "Cũ nhất",
        sortAZ: "A-Z",
        sortZA: "Z-A",
        reset: "Xóa lọc",
        filterCreatedDate: "Ngày tạo",
        filterUpdatedDate: "Ngày cập nhật",
        colName: "Tên chuyên mục",
        colSlug: "Đường dẫn",
        colPosts: "Số bài",
        colStatus: "Trạng thái",
        colCreatedAt: "Ngày tạo",
        colUpdatedAt: "Ngày cập nhật",
        colActions: "Thao tác",
        statusActive: "Hoạt động",
        statusHidden: "Ẩn",
        statusDraft: "Nháp",
        statusArchived: "Đã lưu",
        cancel: "Hủy",
        close: "Đóng",
        save: "Lưu",
        addTitle: "Thêm chuyên mục mới",
        editTitle: "Chỉnh sửa chuyên mục",
        viewTitle: "Chi tiết chuyên mục",
        fieldName: "Tên chuyên mục",
        fieldSlug: "Đường dẫn (Tự động)",
        fieldSlugManual: "Đường dẫn (Tự nhập)",
        slugPlaceholder: "Tự động",
        slugPlaceholderManual: "Tự nhập",
        fieldDesc: "Mô tả",
        fieldStatus: "Trạng thái",
        fieldCreatedAt: "Ngày tạo",
        fieldUpdatedAt: "Ngày cập nhật",
        viewDetail: "Xem chi tiết",
        editAction: "Chỉnh sửa",
        deleteAction: "Xóa",
        confirmDelete: "Bạn có chắc muốn xóa chuyên mục này không?",
        deleteSuccess: "Xóa chuyên mục thành công!",
        saveSuccess: "Lưu chuyên mục thành công!",
        loadError: "Lỗi tải dữ liệu",
        requiredError: "Vui lòng điền vào trường này.",
        empty: "Không tìm thấy chuyên mục nào.",
        exportTitle: "Xuất file Excel",
        exportSelected: "Xuất theo tick chọn",
        exportAll: "Xuất tất cả theo bộ lọc",
        exportConfirm: "Xuất file",
        exportEmpty: "Chưa chọn chuyên mục nào",
        showing: "Hiển thị",
        to: "đến",
        of: "trong",
        results: "chuyên mục",
        prev: "Trước",
        next: "Sau",
    },
    en: {
        title: "News Categories",
        subtitle: "Manage post categories.",
        addCategory: "Add Category",
        export: "Export",
        searchPlaceholder: "Search categories...",
        allStatuses: "All statuses",
        sortLabel: "Sort",
        sortNewest: "Newest",
        sortOldest: "Oldest",
        sortAZ: "A-Z",
        sortZA: "Z-A",
        reset: "Clear filters",
        filterCreatedDate: "Created date",
        filterUpdatedDate: "Updated date",
        colName: "Category Name",
        colSlug: "Slug",
        colPosts: "Posts",
        colStatus: "Status",
        colCreatedAt: "Created at",
        colUpdatedAt: "Updated at",
        colActions: "Actions",
        statusActive: "Active",
        statusHidden: "Hidden",
        statusDraft: "Draft",
        statusArchived: "Archived",
        cancel: "Cancel",
        close: "Close",
        save: "Save",
        addTitle: "Add New Category",
        editTitle: "Edit Category",
        viewTitle: "Category Details",
        fieldName: "Category Name",
        fieldSlug: "Slug (Auto-generated)",
        fieldSlugManual: "Slug (Manual)",
        slugPlaceholder: "Auto-generated",
        slugPlaceholderManual: "Manual",
        fieldDesc: "Description",
        fieldStatus: "Status",
        fieldCreatedAt: "Created at",
        fieldUpdatedAt: "Updated at",
        viewDetail: "View details",
        editAction: "Edit",
        deleteAction: "Delete",
        confirmDelete: "Are you sure you want to delete this category?",
        deleteSuccess: "Category deleted successfully!",
        saveSuccess: "Category saved successfully!",
        loadError: "Failed to load data",
        requiredError: "Please fill out this field.",
        empty: "No categories found.",
        exportTitle: "Export Excel",
        exportSelected: "Export selected",
        exportAll: "Export all by filters",
        exportConfirm: "Export",
        exportEmpty: "No categories selected",
        showing: "Showing",
        to: "to",
        of: "of",
        results: "categories",
        prev: "Previous",
        next: "Next",
    }
};

const resolveCategoryErrorMessage = (error, lang, fallback) => {
    const raw = String(error?.message || error?.error || error?.response?.data?.message || error || "").trim();
    const isVi = lang === "vi";

    if (!raw) return fallback;
    if (raw.includes("Post category name or slug already exists") || raw.includes("Slug already exists")) {
        return isVi ? "Tên chuyên mục hoặc đường dẫn đã tồn tại" : "The category name or slug already exists";
    }
    if (raw.includes("Category has posts; cannot delete")) {
        return isVi ? "Không thể xóa chuyên mục vì vẫn còn bài viết" : "Cannot delete this category while posts still exist";
    }
    if (raw.includes("Category not found")) {
        return isVi ? "Không tìm thấy chuyên mục" : "Category not found";
    }
    if (raw.includes("Server error")) {
        return isVi ? "Lỗi máy chủ" : "Server error";
    }

    return raw;
};

export default function PostCategoriesPage({ lang }) {
    const t = translations[lang] || translations.vi;
    const currentUser = readStoredUserProfile();
    const canCreateCategory = hasAdminPermission(currentUser, "post-category:create");
    const canUpdateCategory = hasAdminPermission(currentUser, "post-category:update");
    const canDeleteCategory = hasAdminPermission(currentUser, "post-category:delete");
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sort, setSort] = useState("createdAt:desc");
    const [createdDate, setCreatedDate] = useState("");
    const [updatedDate, setUpdatedDate] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add"); // add | edit | view
    const [editingCategory, setEditingCategory] = useState(null);
    const [slugLocked, setSlugLocked] = useState(false);
    const [errors, setErrors] = useState({});
    const [selectedIds, setSelectedIds] = useState([]);
    const [exportModal, setExportModal] = useState(false);
    const [exportMode, setExportMode] = useState("selected");
    const [exportLoading, setExportLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        status: "active"
    });

    const isView = modalMode === "view";
    const accessDeniedMessage =
        lang === "vi"
            ? "Bạn không có quyền thực hiện thao tác này"
            : "You do not have permission to perform this action";

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            const params = { status: statusFilter, sort, page, limit };
            if (searchTerm) params.search = searchTerm;
            if (createdDate) params.createdDate = createdDate;
            if (updatedDate) params.updatedDate = updatedDate;
            const res = await getPostCategories(params);
            setCategories(res.data || []);
            setTotalItems(res.pagination?.total || 0);
            setTotalPages(res.pagination?.totalPages ?? 1);
        } catch (err) {
            toast.error(resolveCategoryErrorMessage(err, lang, t.loadError));
        } finally {
            setLoading(false);
        }
    }, [createdDate, lang, limit, page, searchTerm, sort, statusFilter, t.loadError, updatedDate]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        setPage(1);
        setSelectedIds([]);
    }, [createdDate, searchTerm, statusFilter, sort, updatedDate]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const isFiltered =
        !!searchTerm
        || statusFilter !== "all"
        || sort !== "createdAt:desc"
        || !!createdDate
        || !!updatedDate;

    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setSort("createdAt:desc");
        setCreatedDate("");
        setUpdatedDate("");
        setPage(1);
        setSelectedIds([]);
    };

    const escapeCsv = (value) => {
        const str = value === null || value === undefined ? "" : String(value);
        return `"${str.replace(/"/g, '""')}"`;
    };

    const formatDateTime = (value) => {
        if (!value) return "â€”";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "â€”";
        return date.toLocaleString(lang === "vi" ? "vi-VN" : "en-US");
    };

    const formatUpdatedAt = (createdAt, updatedAt) => {
        if (!updatedAt) return "â€”";
        const created = new Date(createdAt).getTime();
        const updated = new Date(updatedAt).getTime();
        if (Number.isNaN(created) || Number.isNaN(updated)) return "â€”";
        if (created === updated) return "â€”";
        return formatDateTime(updatedAt);
    };

    const buildExportParams = (pageIndex, pageSize) => ({
        page: pageIndex,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter,
        sort,
        createdDate,
        updatedDate,
    });

    const fetchAllCategories = async () => {
        const pageSize = 200;
        let pageIndex = 1;
        let totalPagesLocal = 1;
        const all = [];
        do {
            const res = await getPostCategories(buildExportParams(pageIndex, pageSize));
            const rows = res.data || [];
            all.push(...rows);
            totalPagesLocal = res.pagination?.totalPages || 1;
            pageIndex += 1;
        } while (pageIndex <= totalPagesLocal);
        return all;
    };

    const buildCsv = (rows) => {
        const statusLabels = lang === "vi"
            ? { active: "Hoạt động", hidden: "Ẩn", draft: "Nháp", archived: "Đã lưu" }
            : { active: "Active", hidden: "Hidden", draft: "Draft", archived: "Archived" };

        const headers = lang === "vi"
            ? ["ID", "Tên chuyên mục", "Đường dẫn", "Mô tả", "Trạng thái", "Ngày tạo", "Ngày cập nhật"]
            : ["ID", "Category", "Slug", "Description", "Status", "Created at", "Updated at"];

        const lines = [headers.map(escapeCsv).join(",")];
        rows.forEach((cat) => {
            const row = [
                cat._id || "",
                cat.name || "",
                cat.slug || "",
                cat.description || "",
                statusLabels[cat.status] || cat.status || "",
                formatDateTime(cat.createdAt),
                formatDateTime(cat.updatedAt),
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
        link.download = `post_categories_${stamp}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const openExport = () => {
        const defaultMode = selectedIds.length > 0 ? "selected" : "all";
        setExportMode(defaultMode);
        setExportModal(true);
    };

    const handleExport = async () => {
        if (exportMode === "selected" && selectedIds.length === 0) {
            toast.error(t.exportEmpty);
            return;
        }
        setExportLoading(true);
        try {
            let exportRows = [];
            if (exportMode === "selected") {
                const selectedSet = new Set(selectedIds);
                const currentMap = new Map(categories.map((c) => [c._id, c]));
                exportRows = selectedIds.map((id) => currentMap.get(id)).filter(Boolean);
                if (exportRows.length !== selectedIds.length) {
                    const all = await fetchAllCategories();
                    exportRows = all.filter((c) => selectedSet.has(c._id));
                }
            } else {
                exportRows = await fetchAllCategories();
            }
            const csv = buildCsv(exportRows);
            downloadCsv(csv);
            setExportModal(false);
        } catch (err) {
            toast.error(resolveCategoryErrorMessage(err, lang, t.loadError));
        } finally {
            setExportLoading(false);
        }
    };

    const openModal = (category = null, mode = null) => {
        const nextMode = mode || (category ? "edit" : "add");
        if (nextMode === "add" && !canCreateCategory) {
            toast.error(accessDeniedMessage);
            return;
        }
        if (nextMode === "edit" && !canUpdateCategory) {
            toast.error(accessDeniedMessage);
            return;
        }
        setModalMode(nextMode);
        if (category) {
            setEditingCategory(category);
            setSlugLocked(true);
            setFormData({
                name: category.name,
                slug: category.slug,
                description: category.description || "",
                status: category.status || "active"
            });
        } else {
            setEditingCategory(null);
            setSlugLocked(false);
            setFormData({
                name: "",
                slug: "",
                description: "",
                status: "active"
            });
        }
        setErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalMode("add");
        setEditingCategory(null);
        setErrors({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (isView) return;
        setFormData((prev) => {
            if (name === "slug" && !slugLocked) return prev;
            const next = { ...prev, [name]: value };
            if (name === "name" && !slugLocked) {
                next.slug = slugifyText(value);
            }
            return next;
        });
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        if (isView) return true;
        const next = {};
        if (!String(formData.name || "").trim()) next.name = t.requiredError;
        if (!String(formData.slug || "").trim()) next.slug = t.requiredError;
        if (!String(formData.description || "").trim()) next.description = t.requiredError;
        if (!String(formData.status || "").trim()) next.status = t.requiredError;
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (isView) return;
        if (editingCategory && !canUpdateCategory) {
            toast.error(accessDeniedMessage);
            return;
        }
        if (!editingCategory && !canCreateCategory) {
            toast.error(accessDeniedMessage);
            return;
        }

        if (!validate()) return;

        try {
            if (editingCategory) {
                await updatePostCategory(editingCategory._id, formData);
            } else {
                await createPostCategory(formData);
            }
            toast.success(t.saveSuccess);
            closeModal();
            fetchCategories();
        } catch (error) {
            toast.error(resolveCategoryErrorMessage(error, lang, lang === "vi" ? "Lỗi lưu chuyên mục" : "Failed to save category"));
        }
    };

    const handleDelete = async (id) => {
        if (!canDeleteCategory) {
            toast.error(accessDeniedMessage);
            return;
        }
        if (window.confirm(t.confirmDelete)) {
            try {
                await deletePostCategory(id);
                toast.success(t.deleteSuccess);
                fetchCategories();
            } catch (error) {
                toast.error(resolveCategoryErrorMessage(error, lang, lang === "vi" ? "Lỗi xóa chuyên mục" : "Failed to delete category"));
            }
        }
    };

    const statusMeta = (status) => {
        const mapping = {
            active: { label: t.statusActive, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
            hidden: { label: t.statusHidden, className: "bg-slate-50 text-slate-700 border-slate-200" },
            draft: { label: t.statusDraft, className: "bg-amber-50 text-amber-800 border-amber-200" },
            archived: { label: t.statusArchived, className: "bg-slate-100 text-slate-700 border-slate-200" },
        };
        return mapping[status] || { label: status || "â€”", className: "bg-slate-50 text-slate-700 border-slate-200" };
    };

    const visibleIds = useMemo(() => categories.map((c) => c._id), [categories]);
    const allSelected = useMemo(
        () => visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id)),
        [selectedIds, visibleIds]
    );
    const someSelected = useMemo(
        () => visibleIds.some((id) => selectedIds.includes(id)) && !allSelected,
        [selectedIds, visibleIds, allSelected]
    );
    const selectAllRef = useRef(null);

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = someSelected;
        }
    }, [someSelected]);

    const toggleSelect = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleAll = () => {
        setSelectedIds((prev) => (allSelected ? prev.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...prev, ...visibleIds]))));
    };

    return (
        <div className="p-5 lg:p-8 mx-auto max-w-[1600px]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">{t.title}</h1>
                    <p className="text-slate-500 mt-1">{t.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={openExport}
                        className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        type="button"
                    >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        {t.export}
                    </button>
                    {canCreateCategory ? (
                        <button
                            onClick={() => openModal()}
                            className="bg-primary hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-primary/20 flex items-center gap-2"
                            type="button"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            {t.addCategory}
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-wrap items-end gap-3">
                <div className="w-full sm:max-w-[320px] lg:max-w-[380px] flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500">{t.fieldName}</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500">{t.fieldStatus}</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-40 h-10 px-3 pr-9 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-700 cursor-pointer"
                    >
                        <option value="all">{t.allStatuses}</option>
                        <option value="active">{t.statusActive}</option>
                        <option value="hidden">{t.statusHidden}</option>
                        <option value="draft">{t.statusDraft}</option>
                        <option value="archived">{t.statusArchived}</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500">{t.sortLabel}</label>
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="w-40 h-10 px-3 pr-9 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-700 cursor-pointer"
                    >
                        <option value="createdAt:desc">{t.sortNewest || t.sortLabel}</option>
                        <option value="createdAt:asc">{t.sortOldest || t.sortLabel}</option>
                        <option value="name:asc">{t.sortAZ}</option>
                        <option value="name:desc">{t.sortZA}</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500">{t.filterCreatedDate}</label>
                    <input
                        type="date"
                        value={createdDate}
                        onChange={(e) => setCreatedDate(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-700"
                        aria-label={t.filterCreatedDate}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500">{t.filterUpdatedDate}</label>
                    <input
                        type="date"
                        value={updatedDate}
                        onChange={(e) => setUpdatedDate(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-700"
                        aria-label={t.filterUpdatedDate}
                    />
                </div>

                {isFiltered && (
                    <button
                        onClick={resetFilters}
                        className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-500 border border-slate-200 rounded-full bg-white hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors h-10"
                        type="button"
                    >
                        <span className="material-symbols-outlined text-[16px] leading-none">close</span>
                        <span>{t.reset}</span>
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50/50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <input
                                        ref={selectAllRef}
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                        aria-label="Select all"
                                    />
                                </th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">{t.colName}</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">{t.colSlug}</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">{t.colPosts}</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">{t.colStatus}</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">{t.colCreatedAt}</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">{t.colUpdatedAt}</th>
                                <th className="px-6 py-4 text-right w-48 uppercase tracking-wider text-xs font-bold whitespace-nowrap">{t.colActions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                                        <div className="flex justify-center mb-2">
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        {lang === "vi" ? "Đang tải..." : "Loading..."}
                                    </td>
                                </tr>
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                                        {t.empty}
                                    </td>
                                </tr>
                            ) : (
                                categories.map((cat) => (
                                    <tr key={cat._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(cat._id)}
                                                onChange={() => toggleSelect(cat._id)}
                                                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                aria-label="Select row"
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{cat.name}</td>
                                        <td className="px-6 py-4 text-slate-500">{cat.slug}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">{cat.postCount ?? 0}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const meta = statusMeta(cat.status);
                                                return (
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-medium border ${meta.className}`}>
                                                        {meta.label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{formatDateTime(cat.createdAt)}</td>
                                        <td className="px-6 py-4 text-slate-500">{formatUpdatedAt(cat.createdAt, cat.updatedAt)}</td>
                                        <td className="px-6 py-4 text-right w-48">
                                            <div className="flex items-center justify-end gap-2">
                                                    <button
                                                    onClick={() => openModal(cat, "view")}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                                    title={t.viewDetail}
                                                    type="button"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                </button>
                                                {canUpdateCategory ? (
                                                    <button
                                                        onClick={() => openModal(cat, "edit")}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                        title={t.editAction}
                                                        type="button"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                ) : null}
                                                {canDeleteCategory ? (
                                                    <button
                                                        onClick={() => (cat.postCount > 0 ? null : handleDelete(cat._id))}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${cat.postCount > 0 ? "text-slate-300 cursor-not-allowed" : "text-slate-400 hover:text-red-600 hover:bg-red-50"}`}
                                                        title={cat.postCount > 0 ? (lang === "vi" ? "Không thể xóa vì còn bài viết" : "Cannot delete because posts still exist") : t.deleteAction}
                                                    type="button"
                                                    disabled={cat.postCount > 0}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                page={page}
                limit={limit}
                total={totalItems}
                totalPages={totalPages}
                onPageChange={setPage}
                showingText={t.showing}
                toText={t.to}
                ofText={t.of}
                resultsText={t.results}
                prevText={t.prev}
                nextText={t.next}
            />

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeModal}></div>
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">
                                {isView ? t.viewTitle : (editingCategory ? t.editTitle : t.addTitle)}
                            </h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-100">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto w-full">
                            <form id="categoryForm" onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">
                                            {t.fieldName} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            readOnly={isView}
                                            className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm ${errors.name ? "border-red-300" : "border-slate-200"} ${isView ? "bg-slate-50 text-slate-700" : "bg-slate-50"}`}
                                        />
                                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">
                                            {slugLocked ? t.fieldSlugManual : t.fieldSlug} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                name="slug"
                                                value={formData.slug}
                                                onChange={handleChange}
                                                readOnly={isView || !slugLocked}
                                                placeholder={slugLocked ? t.slugPlaceholderManual : t.slugPlaceholder}
                                                className={`w-full pl-3 pr-10 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm ${errors.slug ? "border-red-300" : "border-slate-200"} ${slugLocked ? "bg-white text-slate-800" : "bg-slate-50 text-slate-500 cursor-not-allowed"}`}
                                            />
                                            <button
                                                type="button"
                                                disabled={isView}
                                                onClick={() => {
                                                    setSlugLocked((prev) => {
                                                        const next = !prev;
                                                        setFormData((current) => ({
                                                            ...current,
                                                            slug: next ? "" : slugifyText(current.name || "")
                                                        }));
                                                        return next;
                                                    });
                                                }}
                                                className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors p-1 ${isView ? "text-slate-300 cursor-not-allowed" : "text-slate-400 hover:text-primary"}`}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">{slugLocked ? "link_off" : "link"}</span>
                                            </button>
                                        </div>
                                        {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">
                                        {t.fieldDesc} <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                        readOnly={isView}
                                        className={`w-full px-3 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm ${errors.description ? "border-red-300" : "border-slate-200"} ${isView ? "text-slate-700" : ""}`}
                                    />
                                    {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">
                                        {t.fieldStatus} <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        disabled={isView}
                                        className={`w-full px-3 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm cursor-pointer appearance-none ${errors.status ? "border-red-300" : "border-slate-200"} ${isView ? "text-slate-700" : ""}`}
                                    >
                                        <option value="active">{t.statusActive}</option>
                                        <option value="hidden">{t.statusHidden}</option>
                                        <option value="draft">{t.statusDraft}</option>
                                        <option value="archived">{t.statusArchived}</option>
                                    </select>
                                    {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status}</p>}
                                </div>

                                {isView && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">{t.fieldCreatedAt}</label>
                                            <p className="text-sm text-slate-700">{formatDateTime(editingCategory?.createdAt)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">{t.fieldUpdatedAt}</label>
                                            <p className="text-sm text-slate-700">{formatUpdatedAt(editingCategory?.createdAt, editingCategory?.updatedAt)}</p>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl bg-slate-50/50">
                            <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-white border border-slate-200 rounded-xl transition-colors">
                                {isView ? t.close : t.cancel}
                            </button>
                            {!isView && (
                                <button type="submit" form="categoryForm" className="bg-primary hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-primary/20">
                                    {t.save}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {exportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">{t.exportTitle}</h2>
                            <button onClick={() => setExportModal(false)} className="text-slate-400 hover:text-slate-700" type="button">
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
                            <button onClick={() => setExportModal(false)} className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" type="button">
                                {t.cancel}
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={exportLoading}
                                className="px-4 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
                                type="button"
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
