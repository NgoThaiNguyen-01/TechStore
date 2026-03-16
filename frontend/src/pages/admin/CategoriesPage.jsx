import React, { useState, useEffect, useCallback } from "react";
import CategoryFilters from "../../components/categories/CategoryFilters";
import CategoryTable from "../../components/categories/CategoryTable";
import CategoryModal from "../../components/categories/CategoryModal";
import Pagination from "../../components/common/Pagination";
import SkeletonTable from "../../components/common/SkeletonTable";
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from "../../services/categoryApi";
import { toast } from "sonner";
import { hasAdminPermission } from "../../utils/adminAccess";
import { readStoredUserProfile } from "../../utils/userProfile";

const T = {
    vi: {
        title: "Danh mục",
        subtitle: "Quản lý danh mục và danh mục con của sản phẩm.",
        export: "Xuất file",
        addCategory: "Thêm danh mục",
        searchPlaceholder: "Tìm danh mục...",
        allStatuses: "Tất cả trạng thái",
        allParents: "Danh mục gốc",
        colName: "Tên danh mục",
        colSlug: "Đường dẫn",
        colParent: "Danh mục gốc",
        colProducts: "Sản phẩm",
        colStatus: "Trạng thái",
        colActions: "Thao tác",
        statusActive: "Hoạt động",
        statusHidden: "Ẩn",
        statusDraft: "Nháp",
        statusArchived: "Đã lưu trữ",
        allParentsAll: "Danh mục (Tất cả)",
        rootCategoriesOnly: "Chỉ danh mục gốc",
        viewSubcategories: "Xem danh mục con",
        viewSiblings: "Xem cùng cấp",
        sortLabel: "Sắp xếp",
        sortAZ: "A-Z",
        sortZA: "Z-A",
        sortNewest: "Mới nhất",
        sortOldest: "Cũ nhất",
        filterCreatedDate: "Ngày tạo",
        filterUpdatedDate: "Ngày cập nhật",
        notFound: "Không tìm thấy danh mục nào",
        showing: "Hiển thị",
        to: "đến",
        of: "trong",
        results: "kết quả",
        prev: "Trước",
        next: "Tiếp",
        deleteConfirm: "Bạn có chắc muốn xóa danh mục GỐC này? Các danh mục con của nó sẽ bị đẩy ra ngoài thành danh mục gốc mới.",
        deleteConfirmSub: "Bạn có chắc muốn xóa danh mục này không?",
        blockReason_HAS_PRODUCTS: "Không thể xóa vì danh mục đang có sản phẩm.",
        blockReason_HAS_CHILDREN: "Không thể xóa vì còn danh mục con.",
        blockReason_IS_SYSTEM: "Không thể xóa vì đây là danh mục hệ thống.",
        blockReason_IS_ACTIVE: "Không thể xóa danh mục đang Hoạt động. Hãy chuyển sang Ẩn hoặc Đã lưu trữ trước.",
        addTitle: "Thêm danh mục mới",
        editTitle: "Chỉnh sửa danh mục",
        viewTitle: "Xem chi tiết danh mục",
        fieldName: "Tên danh mục",
        fieldSlug: "Đường dẫn ",
        fieldDesc: "Mô tả",
        fieldIcon: "Biểu tượng",
        fieldParent: "Danh mục gốc",
        fieldStatus: "Trạng thái",
        fieldCreatedAt: "Ngày tạo",
        fieldUpdatedAt: "Ngày cập nhật",
        noParent: "Làm danh mục gốc",
        cancel: "Đóng",
        save: "Lưu",
        nameSlugReq: "Tên danh mục và Đường dẫn (slug) là bắt buộc!",
        createSuccess: "Tạo danh mục thành công!",
        updateSuccess: "Cập nhật danh mục thành công!",
        deleteSuccess: "Xóa danh mục thành công!",
        saveError: "Lỗi khi lưu danh mục",
        deleteError: "Lỗi khi xóa danh mục",
        viewDetail: "Xem chi tiết",
        editAction: "Chỉnh sửa",
        deleteAction: "Xóa",
        errorDuplicate: "Tên hoặc đường dẫn danh mục đã tồn tại",
        errorParentNotFound: "Không tìm thấy danh mục gốc",
        errorUnauthorized: "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn",
        errorAccessDenied: "Bạn không có quyền thực hiện thao tác này",
        errorNotFound: "Không tìm thấy danh mục",
        errorUnknown: "Đã xảy ra lỗi, vui lòng thử lại",
        errorInactiveParent: "Chỉ được thêm danh mục con khi danh mục gốc ở trạng thái hoạt động.",
        reset: "Xóa lọc",
        exportTitle: "Xuất file Excel",
        exportSelected: "Xuất theo tick chọn",
        exportAll: "Xuất tất cả theo bộ lọc",
        exportConfirm: "Xuất file",
        exportEmpty: "Chưa chọn danh mục nào",
    },
    en: {
        title: "Categories",
        subtitle: "Manage your product categories and sub-categories.",
        export: "Export",
        addCategory: "Add Category",
        searchPlaceholder: "Search categories...",
        allStatuses: "All Statuses",
        allParents: "Parent Category",
        colName: "Category Name",
        colSlug: "Slug",
        colParent: "Parent Category",
        colProducts: "Products",
        colStatus: "Status",
        colActions: "Actions",
        statusActive: "Active",
        statusHidden: "Hidden",
        statusDraft: "Draft",
        statusArchived: "Archived",
        allParentsAll: "Parent Category (All)",
        rootCategoriesOnly: "Root Categories Only",
        viewSubcategories: "View subcategories",
        viewSiblings: "View siblings",
        sortLabel: "Sort",
        sortAZ: "A-Z",
        sortZA: "Z-A",
        sortNewest: "Newest",
        sortOldest: "Oldest",
        filterCreatedDate: "Created date",
        filterUpdatedDate: "Updated date",
        notFound: "No categories found",
        showing: "Showing",
        to: "to",
        of: "of",
        results: "results",
        prev: "Previous",
        next: "Next",
        deleteConfirm: "Are you sure you want to delete this ROOT category? Its sub-categories will be promoted to root level.",
        deleteConfirmSub: "Are you sure you want to delete this category?",
        blockReason_HAS_PRODUCTS: "Cannot delete because it contains products.",
        blockReason_HAS_CHILDREN: "Cannot delete because it contains subcategories.",
        blockReason_IS_SYSTEM: "Cannot delete because this is a system category.",
        blockReason_IS_ACTIVE: "Cannot delete an Active category. Please hide or archive it first.",
        addTitle: "Add New Category",
        editTitle: "Edit Category",
        viewTitle: "Category Details",
        fieldName: "Category Name",
        fieldSlug: "Slug",
        fieldDesc: "Description",
        fieldIcon: "Icon",
        fieldParent: "Parent Category",
        fieldStatus: "Status",
        fieldCreatedAt: "Created at",
        fieldUpdatedAt: "Updated at",
        noParent: "Select parent category",
        cancel: "Close",
        save: "Save",
        nameSlugReq: "Name and Slug are required!",
        createSuccess: "Category created successfully!",
        updateSuccess: "Category updated successfully!",
        deleteSuccess: "Category deleted successfully!",
        saveError: "Failed to save category",
        deleteError: "Failed to delete category",
        viewDetail: "View details",
        editAction: "Edit",
        deleteAction: "Delete",
        errorDuplicate: "Category name or slug already exists",
        errorParentNotFound: "Parent category not found",
        errorUnauthorized: "You are not authorized or your session expired",
        errorAccessDenied: "You do not have permission to perform this action",
        errorNotFound: "Category not found",
        errorUnknown: "Something went wrong, please try again",
        errorInactiveParent: "Subcategories can only be added to active parent categories.",
        reset: "Clear filters",
        exportTitle: "Export Excel",
        exportSelected: "Export selected",
        exportAll: "Export all by filters",
        exportConfirm: "Export",
        exportEmpty: "No categories selected",
    },
};

export default function CategoriesPage({ lang }) {
    const t = T[lang] || T.en;
    const currentUser = readStoredUserProfile();
    const canCreateCategory = hasAdminPermission(currentUser, "category:create");
    const canUpdateCategory = hasAdminPermission(currentUser, "category:update");
    const canDeleteCategory = hasAdminPermission(currentUser, "category:delete");

    const [categories, setCategories] = useState([]);
    const [allParents, setAllParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters and Pagination
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [parentFilter, setParentFilter] = useState("all");
    const [sort, setSort] = useState("createdAt:desc");
    const [createdDate, setCreatedDate] = useState("");
    const [updatedDate, setUpdatedDate] = useState("");
    const [productCountMin, setProductCountMin] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Selection & Modal
    const [selected, setSelected] = useState([]);
    const [selectedMap, setSelectedMap] = useState({});
    const [modal, setModal] = useState(null);
    const [exportModal, setExportModal] = useState(false);
    const [exportMode, setExportMode] = useState("selected");
    const [exportLoading, setExportLoading] = useState(false);

    const mapErrorMessage = useCallback((message) => {
        if (!message) return t.errorUnknown;
        if (message.includes("Category name or slug already exists")) return t.errorDuplicate;
        if (message.includes("Parent category not found")) return t.errorParentNotFound;
        if (message.includes("Not authorized") || message.includes("Unauthorized")) return t.errorUnauthorized;
        if (message.includes("Access denied")) return t.errorAccessDenied;
        if (message.includes("Category not found")) return t.errorNotFound;
        return message;
    }, [t]);

    const getErrorMessage = useCallback(
        (err) => mapErrorMessage(err.response?.data?.message || err.message || t.errorUnknown),
        [mapErrorMessage, t]
    );

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                page,
                limit,
                search,
                status: statusFilter,
                parent: parentFilter,
                sort,
            };
            if (createdDate) params.createdDate = createdDate;
            if (updatedDate) params.updatedDate = updatedDate;
            if (productCountMin) params.productCountMin = parseInt(productCountMin, 10);
            const res = await getCategories(params);
            setCategories(res.data);
            setTotalPages(res.pagination.totalPages);
            setTotalItems(res.pagination.total);
            setError(null);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, statusFilter, parentFilter, sort, createdDate, updatedDate, productCountMin, getErrorMessage]);

    // Fetch list of potential parent categories (just root ones or all for simplicity)
    const fetchParentsList = useCallback(async () => {
        try {
            const res = await getCategories({ limit: 1000, parent: "root" });
            setAllParents(res.data);
        } catch (error) {
            setError(getErrorMessage(error));
        }
    }, [getErrorMessage]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchCategories();
        }, 300);
        return () => clearTimeout(debounce);
    }, [fetchCategories]);

    useEffect(() => {
        setSelected([]);
        setSelectedMap({});
    }, [search, statusFilter, parentFilter, sort, createdDate, updatedDate, productCountMin]);

    useEffect(() => {
        fetchParentsList();
    }, [fetchParentsList]);

    // Handlers
    const toggleSelect = (id) => {
        setSelected((prev) => {
            const exists = prev.includes(id);
            setSelectedMap((map) => {
                if (exists) {
                    const next = { ...map };
                    delete next[id];
                    return next;
                }
                const item = categories.find((c) => c._id === id);
                if (!item) return map;
                return { ...map, [id]: item };
            });
            return exists ? prev.filter((x) => x !== id) : [...prev, id];
        });
    };

    const toggleAll = () => {
        const currentIds = categories.map((c) => c._id);
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
                categories.forEach((c) => { next[c._id] = c; });
                return next;
            });
        }
    };

    const openAdd = () => {
        if (!canCreateCategory) return;
        setModal({ mode: "add", data: null });
    };
    const openEdit = (cat) => {
        if (!canUpdateCategory) return;
        setModal({ mode: "edit", data: cat });
    };
    const openView = (cat) => setModal({ mode: "view", data: cat });
    const closeModal = () => setModal(null);

    const handleSaveForm = async (formData) => {
        if (modal?.mode === "add" && !canCreateCategory) {
            toast.error(t.errorAccessDenied);
            return;
        }
        if (modal?.mode === "edit" && !canUpdateCategory) {
            toast.error(t.errorAccessDenied);
            return;
        }
        try {
            if (modal.mode === "add") {
                await createCategory(formData);
                toast.success(t.createSuccess);
            } else {
                await updateCategory(modal.data._id, formData);
                toast.success(t.updateSuccess);
            }
            fetchCategories();
            fetchParentsList();
            closeModal();
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const handleDelete = async (categoryObj) => {
        if (!canDeleteCategory) {
            toast.error(t.errorAccessDenied);
            return;
        }
        const confirmMsg = categoryObj.parent ? t.deleteConfirmSub : t.deleteConfirm;
        if (window.confirm(confirmMsg)) {
            try {
                await deleteCategory(categoryObj._id);
                toast.success(t.deleteSuccess);
                fetchCategories();
                fetchParentsList();
            } catch (err) {
                toast.error(getErrorMessage(err));
            }
        }
    };

    const formatDateTime = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "—";
        return date.toLocaleString(lang === "vi" ? "vi-VN" : "en-US");
    };

    const formatUpdatedAt = (createdAt, updatedAt) => {
        if (!createdAt || !updatedAt) return "—";
        const created = new Date(createdAt).getTime();
        const updated = new Date(updatedAt).getTime();
        if (Number.isNaN(created) || Number.isNaN(updated)) return "—";
        if (created === updated) return "—";
        return formatDateTime(updatedAt);
    };

    const escapeCsv = (value) => {
        const str = value === null || value === undefined ? "" : String(value);
        return `"${str.replace(/"/g, '""')}"`;
    };

    const buildExportParams = (pageIndex, pageSize) => {
        const params = {
            page: pageIndex,
            limit: pageSize,
            search,
            status: statusFilter,
            parent: parentFilter,
            sort,
            createdDate,
            updatedDate,
        };
        return params;
    };

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setParentFilter("all");
        setSort("createdAt:desc");
        setCreatedDate("");
        setUpdatedDate("");
        setProductCountMin("");
        setPage(1);
        setSelected([]);
        setSelectedMap({});
    };

    const fetchAllCategories = async () => {
        const pageSize = 200;
        let pageIndex = 1;
        let totalPagesLocal = 1;
        const all = [];
        do {
            const res = await getCategories(buildExportParams(pageIndex, pageSize));
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
                archived: "Đã lưu trữ"
            }
            : {
                active: "Active",
                hidden: "Hidden",
                draft: "Draft",
                archived: "Archived"
            };
        const headers = lang === "vi"
            ? ["ID", "Tên danh mục", "Đường dẫn", "Danh mục gốc", "Sản phẩm", "Trạng thái", "Ngày tạo", "Ngày cập nhật"]
            : ["ID", "Category", "Slug", "Parent", "Products", "Status", "Created at", "Updated at"];
        const lines = [headers.map(escapeCsv).join(",")];
        rows.forEach((cat) => {
            const row = [
                cat._id || "",
                cat.name || "",
                cat.slug || "",
                cat.parent?.name || "",
                cat.productCount ?? 0,
                statusLabels[cat.status] || cat.status || "",
                formatDateTime(cat.createdAt),
                formatUpdatedAt(cat.createdAt, cat.updatedAt),
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
        link.download = `categories_${stamp}.csv`;
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
                    const all = await fetchAllCategories();
                    exportRows = all.filter((c) => selectedSet.has(c._id));
                }
            } else {
                exportRows = await fetchAllCategories();
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
                        disabled={!canCreateCategory}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        {t.addCategory}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-2 border border-red-100">
                    <span className="material-symbols-outlined">error</span>
                    <div className="text-sm">{error}</div>
                </div>
            )}

            {/* Table Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <CategoryFilters
                    search={search}
                    setSearch={(val) => {
                        setSearch(val);
                        setPage(1);
                    }}
                    productCountMin={productCountMin}
                    setProductCountMin={(val) => {
                        setProductCountMin(val);
                        setPage(1);
                    }}
                    statusFilter={statusFilter}
                    setStatusFilter={(val) => {
                        setStatusFilter(val);
                        setPage(1);
                    }}
                    parentFilter={parentFilter}
                    setParentFilter={(val) => {
                        setParentFilter(val);
                        setPage(1);
                    }}
                    sort={sort}
                    setSort={(val) => {
                        setSort(val);
                        setPage(1);
                    }}
                    createdDate={createdDate}
                    setCreatedDate={(val) => {
                        setCreatedDate(val);
                        setPage(1);
                    }}
                    updatedDate={updatedDate}
                    setUpdatedDate={(val) => {
                        setUpdatedDate(val);
                        setPage(1);
                    }}
                    parents={allParents}
                    onReset={resetFilters}
                    t={t}
                />

                {loading ? (
                    <div className="p-4">
                        <SkeletonTable columns={7} rows={limit} />
                    </div>
                ) : (
                    <>
                        <CategoryTable
                            categories={categories}
                            selected={selected}
                            onToggleSelect={toggleSelect}
                            onToggleAll={toggleAll}
                            onEdit={openEdit}
                            onView={openView}
                            onDelete={handleDelete}
                            onViewSubcategories={(parentId) => {
                                setParentFilter(parentId);
                                setPage(1);
                            }}
                            canEdit={canUpdateCategory}
                            canDelete={canDeleteCategory}
                            t={t}
                        />
                        <Pagination
                            page={page}
                            limit={limit}
                            total={totalItems}
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
                <CategoryModal
                    key={`${modal.mode}-${modal.data?._id || "new"}`}
                    mode={modal.mode}
                    initialData={modal.data}
                    parents={allParents.filter((p) => p._id !== modal.data?._id)} // prevent self-parent in dropdown
                    onClose={closeModal}
                    onSave={handleSaveForm}
                    t={t}
                />
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
