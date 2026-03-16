import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Badge from "../../components/common/Badge";
import Pagination from "../../components/common/Pagination";
import { toast } from "sonner";
import { createBrand, deleteBrand, getBrands, updateBrand } from "../../services/brandApi";
import { hasAdminPermission } from "../../utils/adminAccess";
import { readStoredUserProfile } from "../../utils/userProfile";

const T = {
    vi: {
        title: "Thương hiệu",
        subtitle: "Quản lý danh sách thương hiệu trong hệ thống.",
        addBrand: "Thêm thương hiệu",
        searchPlaceholder: "Tìm theo tên thương hiệu",
        colBrand: "Thương hiệu",
        colDesc: "Mô tả",
        colProducts: "Sản phẩm",
        colStatus: "Trạng thái",
        colCreatedAt: "Ngày tạo",
        colUpdatedAt: "Ngày cập nhật",
        colActions: "Thao tác",
        notFound: "Không có thương hiệu nào",
        showing: "Hiển thị",
        to: "đến",
        of: "trong",
        results: "thương hiệu",
        prev: "Trước",
        next: "Sau",
        addTitle: "Thêm thương hiệu mới",
        editTitle: "Chỉnh sửa thương hiệu",
        viewTitle: "Chi tiết thương hiệu",
        fieldLogo: "Logo",
        fieldName: "Tên thương hiệu",
        fieldDesc: "Mô tả",
        fieldStatus: "Trạng thái",
        fieldCreatedAt: "Ngày tạo",
        fieldUpdatedAt: "Ngày cập nhật",
        filterStatus: "Trạng thái",
        filterCreatedDate: "Ngày tạo",
        filterUpdatedDate: "Ngày cập nhật",
        sortLabel: "Sắp xếp",
        sortAZ: "A-Z",
        sortZA: "Z-A",
        sortNewest: "Mới nhất",
        sortOldest: "Cũ nhất",
        reset: "Xóa lọc",
        export: "Xuất file",
        exportTitle: "Xuất file Excel",
        exportSelected: "Xuất theo tick chọn",
        exportAll: "Xuất tất cả theo bộ lọc",
        exportConfirm: "Xuất file",
        exportEmpty: "Chưa chọn thương hiệu nào",
        uploadLogo: "Tải logo",
        removeLogo: "Xóa logo",
        uploadByLink: "Hoặc nhập link ảnh...",
        nameRequired: "Vui lòng nhập tên thương hiệu",
        logoRequired: "Vui lòng tải logo",
        logoTooLarge: "Logo quá lớn, vui lòng chọn ảnh nhỏ hơn 1MB",
        descRequired: "Vui lòng nhập mô tả",
        statusActive: "Hoạt động",
        statusHidden: "Ẩn",
        statusDraft: "Nháp",
        statusArchived: "Đã lưu trữ",
        cancel: "Hủy",
        save: "Lưu & Đóng",
        saving: "Đang lưu...",
        close: "Đóng",
        viewDetail: "Xem chi tiết",
        editAction: "Chỉnh sửa",
        deleteAction: "Xóa",
        deleteConfirm: "Bạn có chắc muốn xóa thương hiệu này không?",
        createSuccess: "Tạo thương hiệu thành công!",
        updateSuccess: "Cập nhật thương hiệu thành công!",
        deleteSuccess: "Xóa thương hiệu thành công!",
        errorUnknown: "Đã xảy ra lỗi, vui lòng thử lại",
        errorDuplicate: "Tên thương hiệu đã tồn tại",
        errorUnauthorized: "Bạn chưa đăng nhập hoặc phiên đã hết hạn",
        errorAccessDenied: "Bạn không có quyền thực hiện thao tác này",
        errorNotFound: "Không tìm thấy thương hiệu",
        errorPayloadTooLarge: "Dữ liệu gửi lên quá lớn, vui lòng chọn ảnh nhỏ hơn",
    },
    en: {
        title: "Brands",
        subtitle: "Manage your store brands.",
        addBrand: "Add Brand",
        searchPlaceholder: "Search by brand name",
        colBrand: "Brand",
        colDesc: "Description",
        colProducts: "Products",
        colStatus: "Status",
        colCreatedAt: "Created",
        colUpdatedAt: "Updated",
        colActions: "Actions",
        notFound: "No brands found",
        showing: "Showing",
        to: "to",
        of: "of",
        results: "brands",
        prev: "Previous",
        next: "Next",
        addTitle: "Add New Brand",
        editTitle: "Edit Brand",
        viewTitle: "Brand Details",
        fieldLogo: "Logo",
        fieldName: "Brand name",
        fieldDesc: "Description",
        fieldStatus: "Status",
        fieldCreatedAt: "Created at",
        fieldUpdatedAt: "Updated at",
        filterStatus: "Status",
        filterCreatedDate: "Created date",
        filterUpdatedDate: "Updated date",
        sortLabel: "Sort",
        sortAZ: "A-Z",
        sortZA: "Z-A",
        sortNewest: "Newest",
        sortOldest: "Oldest",
        reset: "Clear filters",
        export: "Export",
        exportTitle: "Export Excel",
        exportSelected: "Export selected",
        exportAll: "Export all by filters",
        exportConfirm: "Export",
        exportEmpty: "No brands selected",
        uploadLogo: "Upload logo",
        removeLogo: "Remove logo",
        uploadByLink: "Or enter image URL...",
        nameRequired: "Brand name is required",
        logoRequired: "Logo is required",
        logoTooLarge: "Logo is too large, please select an image under 1MB",
        descRequired: "Description is required",
        statusActive: "Active",
        statusHidden: "Hidden",
        statusDraft: "Draft",
        statusArchived: "Archived",
        cancel: "Cancel",
        save: "Save & Close",
        saving: "Saving...",
        close: "Close",
        viewDetail: "View details",
        editAction: "Edit",
        deleteAction: "Delete",
        deleteConfirm: "Are you sure you want to delete this brand?",
        createSuccess: "Brand created successfully!",
        updateSuccess: "Brand updated successfully!",
        deleteSuccess: "Brand deleted successfully!",
        errorUnknown: "Something went wrong. Please try again.",
        errorDuplicate: "Brand name already exists",
        errorUnauthorized: "You are not logged in or session expired",
        errorAccessDenied: "You do not have permission to perform this action",
        errorNotFound: "Brand not found",
        errorPayloadTooLarge: "Request entity too large, please choose a smaller image",
    },
};

const EMPTY_FORM = {
    name: "",
    logo: "",
    description: "",
    status: "active",
};
const MAX_LOGO_SIZE_MB = 1;
const MAX_LOGO_SIZE_BYTES = MAX_LOGO_SIZE_MB * 1024 * 1024;

const formatDate = (iso) => {
    if (!iso) return "";
    try {
        return new Date(iso).toLocaleDateString();
    } catch {
        return "";
    }
};

const formatDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
};

const formatUpdatedDate = (createdAt, updatedAt) => {
    if (!updatedAt) return "—";
    if (!createdAt) return formatDate(updatedAt);
    const created = new Date(createdAt).getTime();
    const updated = new Date(updatedAt).getTime();
    if (Number.isNaN(created) || Number.isNaN(updated)) return "—";
    if (created === updated) return "—";
    return formatDate(updatedAt);
};

const formatUpdatedDateTime = (createdAt, updatedAt) => {
    if (!updatedAt) return "—";
    if (!createdAt) return formatDateTime(updatedAt);
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

function clampText(text, max = 120) {
    const s = String(text || "").trim();
    if (!s) return "";
    if (s.length <= max) return s;
    return `${s.slice(0, max)}…`;
}

function BrandModal({ mode, initialData, onClose, onSave, t }) {
    const isView = mode === "view";
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const fileRef = useRef();

    useEffect(() => {
        if (!initialData) {
            setForm(EMPTY_FORM);
            setErrors({});
            return;
        }
        setForm({
            name: initialData.name || "",
            logo: initialData.logo || initialData.image || "",
            description: initialData.description || initialData.descriptionVi || initialData.descriptionEn || "",
            status: initialData.status || "active",
        });
        setErrors({});
    }, [initialData]);

    const validate = () => {
        const next = {};
        if (!form.name.trim()) next.name = t.nameRequired;
        if (!form.logo) next.logo = t.logoRequired;
        if (!String(form.description || "").trim()) next.description = t.descRequired;
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleLogoFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_LOGO_SIZE_BYTES) {
            toast.error(t.logoTooLarge);
            setErrors((prev) => ({ ...prev, logo: t.logoTooLarge }));
            e.target.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            setForm((prev) => ({ ...prev, logo: ev.target.result }));
            setErrors((prev) => ({ ...prev, logo: null }));
        };
        reader.readAsDataURL(file);
    };

    const canSubmit = Boolean(form.logo) && Boolean(form.name.trim()) && Boolean(String(form.description || "").trim());

    const submit = async () => {
        if (isView) return onClose?.();
        if (!validate()) return;
        setSaving(true);
        try {
            await onSave({
                name: form.name.trim(),
                logo: form.logo || "",
                description: form.description || "",
                status: form.status || "active",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
            <div className="relative z-10 w-[95vw] max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">verified</span>
                        <p className="text-sm font-bold text-slate-900">
                            {mode === "add" ? t.addTitle : mode === "edit" ? t.editTitle : t.viewTitle}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-semibold text-slate-700 mb-2">
                                {t.fieldLogo} <span className="text-red-500">*</span>
                            </p>
                            <div className="flex items-start gap-4">
                                <div className="size-20 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                                    {form.logo ? (
                                        <img src={form.logo} alt="" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="material-symbols-outlined text-slate-300">image</span>
                                    )}
                                </div>
                                {!isView && (
                                    <div className="flex-1 flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => fileRef.current?.click()}
                                                className="px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50"
                                                type="button"
                                            >
                                                {t.uploadLogo}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setForm((p) => ({ ...p, logo: "" }));
                                                    setErrors((p) => ({ ...p, logo: t.logoRequired }));
                                                }}
                                                className="px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                                                type="button"
                                            >
                                                {t.removeLogo}
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={t.uploadByLink}
                                            value={form.logo?.startsWith("data:") ? "" : form.logo}
                                            onChange={(e) => {
                                                setForm((p) => ({ ...p, logo: e.target.value }));
                                                if (errors.logo) setErrors((p) => ({ ...p, logo: null }));
                                            }}
                                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-slate-400"
                                        />
                                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
                                    </div>
                                )}
                            </div>
                            {errors.logo && <p className="text-xs text-red-500 mt-2">{errors.logo}</p>}
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-slate-700 mb-2">
                                {t.fieldName} <span className="text-red-500">*</span>
                            </p>
                            <input
                                value={form.name}
                                disabled={isView}
                                onChange={(e) => {
                                    setForm((p) => ({ ...p, name: e.target.value }));
                                    if (errors.name) setErrors((p) => ({ ...p, name: null }));
                                }}
                                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-primary/30 ${errors.name ? "border-red-300" : "border-slate-200 focus:border-primary"}`}
                                placeholder={t.fieldName}
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-2">{errors.name}</p>}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-semibold text-slate-700 mb-2">
                                {t.fieldDesc} <span className="text-red-500">*</span>
                            </p>
                            <textarea
                                value={form.description}
                                disabled={isView}
                                onChange={(e) => {
                                    setForm((p) => ({ ...p, description: e.target.value }));
                                    if (errors.description) setErrors((p) => ({ ...p, description: null }));
                                }}
                                rows={6}
                                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none ${errors.description ? "border-red-300" : "border-slate-200"}`}
                                placeholder={t.fieldDesc}
                            />
                            {errors.description && <p className="text-xs text-red-500 mt-2">{errors.description}</p>}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-700 mb-2">{t.fieldStatus}</p>
                            <select
                                value={form.status}
                                disabled={isView}
                                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                            >
                                <option value="active">{t.statusActive}</option>
                                <option value="hidden">{t.statusHidden}</option>
                                <option value="draft">{t.statusDraft}</option>
                                <option value="archived">{t.statusArchived}</option>
                            </select>
                        </div>
                        {isView && (
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-1">{t.fieldCreatedAt}</p>
                                    <p className="text-sm text-slate-600">{formatDateTime(initialData?.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-1">{t.fieldUpdatedAt}</p>
                                    <p className="text-sm text-slate-600">
                                        {formatUpdatedDateTime(initialData?.createdAt, initialData?.updatedAt)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50"
                        type="button"
                    >
                        {isView ? t.close : t.cancel}
                    </button>
                    {!isView && (
                        <button
                            onClick={submit}
                            disabled={saving || !canSubmit}
                            className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                            type="button"
                        >
                            {saving ? t.saving : t.save}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function BrandsPage({ lang }) {
    const t = T[lang];
    const currentUser = readStoredUserProfile();
    const canCreateBrand = hasAdminPermission(currentUser, "brand:create");
    const canUpdateBrand = hasAdminPermission(currentUser, "brand:update");
    const canDeleteBrand = hasAdminPermission(currentUser, "brand:delete");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [createdDate, setCreatedDate] = useState("");
    const [updatedDate, setUpdatedDate] = useState("");
    const [minCount, setMinCount] = useState("");
    const [sort, setSort] = useState("createdAt:desc");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [modal, setModal] = useState(null);
    const [selected, setSelected] = useState([]);
    const [selectedMap, setSelectedMap] = useState({});
    const [exportModal, setExportModal] = useState(false);
    const [exportMode, setExportMode] = useState("selected");
    const [exportLoading, setExportLoading] = useState(false);

    const mapErrorMessage = useCallback((message) => {
        if (!message) return t.errorUnknown;
        if (message.includes("Thương hiệu đã tồn tại") || message.includes("Duplicate")) return t.errorDuplicate;
        if (message.toLowerCase().includes("request entity too large")) return t.errorPayloadTooLarge;
        if (message.includes("Not authorized") || message.includes("Unauthorized")) return t.errorUnauthorized;
        if (message.includes("Access denied")) return t.errorAccessDenied;
        if (message.includes("Brand not found")) return t.errorNotFound;
        return message;
    }, [t]);

    const getErrorMessage = useCallback(
        (err) => {
            if (err?.response?.status === 413) return t.errorPayloadTooLarge;
            return mapErrorMessage(err.response?.data?.message || err.message || t.errorUnknown);
        },
        [mapErrorMessage, t]
    );

    const fetchBrands = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit, search: search.trim(), sort };
            if (statusFilter !== "all") params.status = statusFilter;
            if (createdDate) params.createdDate = createdDate;
            if (updatedDate) params.updatedDate = updatedDate;
            if (minCount) params.productCountMin = Number.parseInt(minCount, 10);
            const res = await getBrands(params);
            setItems(res.data || []);
            setTotal(res.pagination?.total || 0);
            setTotalPages(res.pagination?.totalPages || 0);
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, sort, statusFilter, createdDate, updatedDate, minCount, getErrorMessage]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchBrands();
        }, 250);
        return () => clearTimeout(debounce);
    }, [fetchBrands]);

    useEffect(() => {
        setPage(1);
    }, [search, sort, statusFilter, createdDate, updatedDate, minCount]);
    useEffect(() => {
        setSelected([]);
        setSelectedMap({});
    }, [search, sort, statusFilter, createdDate, updatedDate, minCount]);

    const buildExportParams = (pageIndex, pageSize) => {
        const params = { page: pageIndex, limit: pageSize, search: search.trim(), sort };
        if (statusFilter !== "all") params.status = statusFilter;
        if (createdDate) params.createdDate = createdDate;
        if (updatedDate) params.updatedDate = updatedDate;
        if (minCount) params.productCountMin = Number.parseInt(minCount, 10);
        return params;
    };

    const fetchAllBrands = async () => {
        const pageSize = 200;
        let pageIndex = 1;
        let totalPagesLocal = 1;
        const all = [];
        do {
            const res = await getBrands(buildExportParams(pageIndex, pageSize));
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
                active: t.statusActive,
                hidden: t.statusHidden,
                draft: t.statusDraft,
                archived: t.statusArchived
            }
            : {
                active: t.statusActive,
                hidden: t.statusHidden,
                draft: t.statusDraft,
                archived: t.statusArchived
            };
        const headers = lang === "vi"
            ? ["ID", "Thương hiệu", "Mô tả", "Trạng thái", "Ngày tạo", "Ngày cập nhật"]
            : ["ID", "Brand", "Description", "Status", "Created at", "Updated at"];
        const lines = [headers.map(escapeCsv).join(",")];
        rows.forEach((b) => {
            const row = [
                b._id || "",
                b.name || "",
                b.description || b.descriptionVi || b.descriptionEn || "",
                statusLabels[b.status] || b.status || "",
                formatDateTime(b.createdAt),
                formatUpdatedDateTime(b.createdAt, b.updatedAt)
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
        link.download = `brands_${stamp}.csv`;
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
                    const all = await fetchAllBrands();
                    exportRows = all.filter((b) => selectedSet.has(b._id));
                }
            } else {
                exportRows = await fetchAllBrands();
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

    const openExport = useCallback(() => {
        const defaultMode = selected.length > 0 ? "selected" : "all";
        setExportMode(defaultMode);
        setExportModal(true);
    }, [selected]);

    const headerRight = useMemo(() => (
        <div className="flex items-center gap-3">
            <button onClick={openExport} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                <span className="material-symbols-outlined text-[16px]">download</span>
                {t.export}
            </button>
            {canCreateBrand ? (
                <button
                    onClick={() => setModal({ mode: "add", data: null })}
                    className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-primary/20"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    {t.addBrand}
                </button>
            ) : null}
        </div>
    ), [canCreateBrand, openExport, t]);

    const onSave = async (payload) => {
        if (modal?.mode === "add" && !canCreateBrand) {
            toast.error(t.errorAccessDenied);
            throw new Error("Access denied");
        }
        if (modal?.mode === "edit" && !canUpdateBrand) {
            toast.error(t.errorAccessDenied);
            throw new Error("Access denied");
        }
        try {
            if (modal?.mode === "add") {
                await createBrand(payload);
                toast.success(t.createSuccess);
            } else if (modal?.mode === "edit") {
                await updateBrand(modal.data._id, payload);
                toast.success(t.updateSuccess);
            }
            setModal(null);
            fetchBrands();
        } catch (err) {
            toast.error(getErrorMessage(err));
            throw err;
        }
    };

    const onDelete = async (brand) => {
        if (!canDeleteBrand) {
            toast.error(t.errorAccessDenied);
            return;
        }
        if (!window.confirm(t.deleteConfirm)) return;
        try {
            await deleteBrand(brand._id);
            toast.success(t.deleteSuccess);
            fetchBrands();
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const selectedSet = new Set(selected);
    const allSelected = items.length > 0 && items.every((b) => selectedSet.has(b._id));
    const someSelected = items.some((b) => selectedSet.has(b._id)) && !allSelected;
    const toggleSelect = (id) => {
        setSelected((prev) => {
            const exists = prev.includes(id);
            setSelectedMap((map) => {
                if (exists) {
                    const next = { ...map };
                    delete next[id];
                    return next;
                }
                const item = items.find((b) => b._id === id);
                if (!item) return map;
                return { ...map, [id]: item };
            });
            return exists ? prev.filter((x) => x !== id) : [...prev, id];
        });
    };
    const toggleAll = () => {
        const currentIds = items.map((b) => b._id);
        const allChecked = currentIds.length > 0 && currentIds.every((id) => selected.includes(id));
        if (allChecked) {
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
                items.forEach((b) => { next[b._id] = b; });
                return next;
            });
        }
    };
    const isFiltered = Boolean(search.trim()) || statusFilter !== "all" || createdDate || updatedDate || sort !== "createdAt:desc" || Boolean(minCount);
    const resetFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setCreatedDate("");
        setUpdatedDate("");
        setMinCount("");
        setSort("createdAt:desc");
        setPage(1);
        setSelected([]);
        setSelectedMap({});
    };

    return (
        <div className="p-5 lg:p-8 mx-auto max-w-[1600px]">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">{t.title}</h1>
                    <p className="text-slate-500 mt-1">{t.subtitle}</p>
                </div>
                {headerRight}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[220px] max-w-xs flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500">Tên thương hiệu</label>
                        <div className="relative group">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors material-symbols-outlined text-[20px]">search</span>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 h-10 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder:text-slate-400 text-slate-900"
                                placeholder={t.searchPlaceholder}
                                type="text"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500">Trạng thái</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-40 h-10 px-3 pr-9 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none cursor-pointer transition-colors hover:border-slate-300"
                        >
                            <option value="all">{t.filterStatus}</option>
                            <option value="active">{t.statusActive}</option>
                            <option value="hidden">{t.statusHidden}</option>
                            <option value="draft">{t.statusDraft}</option>
                            <option value="archived">{t.statusArchived}</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500">Sắp xếp</label>
                        <select
                            className="w-40 h-10 px-3 pr-9 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none cursor-pointer transition-colors hover:border-slate-300"
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                        >
                            <option value="createdAt:desc">{t.sortNewest || t.sortLabel}</option>
                            <option value="createdAt:asc">{t.sortOldest || t.sortLabel}</option>
                            <option value="name:asc">{t.sortAZ}</option>
                            <option value="name:desc">{t.sortZA}</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500">Ngày tạo</label>
                        <input
                            type="date"
                            value={createdDate}
                            onChange={(e) => setCreatedDate(e.target.value)}
                            className="w-40 h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                            aria-label={t.filterCreatedDate}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500">Ngày cập nhật</label>
                        <input
                            type="date"
                            value={updatedDate}
                            onChange={(e) => setUpdatedDate(e.target.value)}
                            className="w-40 h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                            aria-label={t.filterUpdatedDate}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500">Số sản phẩm</label>
                        <input
                            type="number"
                            min="0"
                            value={minCount}
                            onChange={(e) => setMinCount(e.target.value)}
                            placeholder="Nhập số sản phẩm cần tìm"
                            className="min-w-[220px] w-64 h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                            aria-label="Min product count"
                        />
                    </div>
                    {isFiltered && (
                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-full bg-white hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors h-10 shadow-[0_0_0_1px_rgba(15,23,42,0.02)]"
                        >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                            {t.reset}
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-left text-slate-500">
                                <th className="px-5 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                        onChange={toggleAll}
                                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                                    />
                                </th>
                                <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">{t.colBrand}</th>
                                <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">{t.colDesc}</th>
                                <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">{t.colProducts}</th>
                                <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">{t.colStatus}</th>
                                <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">{t.colCreatedAt}</th>
                                <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">{t.colUpdatedAt}</th>
                                <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs text-right">{t.colActions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400">Loading...</td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400">{t.notFound}</td>
                                </tr>
                            ) : (
                                items.map((b) => {
                                    const isSelected = selected.includes(b._id);
                                    const status = b.status || "active";
                                    const statusLabel =
                                        status === "active"
                                            ? t.statusActive
                                            : status === "hidden"
                                                ? t.statusHidden
                                                : status === "archived"
                                                    ? t.statusArchived
                                                    : t.statusDraft;
                                    return (
                                        <tr
                                            key={b._id}
                                            className={`border-b border-slate-100 cursor-pointer ${isSelected ? "bg-primary/5" : "hover:bg-slate-50/50"}`}
                                            onClick={() => setModal({ mode: "view", data: b })}
                                        >
                                            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(b._id)}
                                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                                                />
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center flex-shrink-0">
                                                        {(b.logo || b.image) ? (
                                                            <img src={b.logo || b.image} alt="" className="w-full h-full object-contain" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-slate-300 text-[20px]">image</span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-900 truncate">{b.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-slate-700">{clampText(b.description || b.descriptionVi || b.descriptionEn)}</td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                    {typeof b.productCount === "number" ? b.productCount : "0"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <Badge status={status} label={statusLabel} />
                                            </td>
                                            <td className="px-5 py-4 text-slate-500">{formatDate(b.createdAt)}</td>
                                            <td className="px-5 py-4 text-slate-500">{formatUpdatedDate(b.createdAt, b.updatedAt)}</td>
                                            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => setModal({ mode: "view", data: b })}
                                                        title={t.viewDetail}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                    </button>
                                                    {canUpdateBrand ? (
                                                        <button
                                                            onClick={() => setModal({ mode: "edit", data: b })}
                                                            title={t.editAction}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                    ) : null}
                                                    {canDeleteBrand ? <button
                                                        onClick={() => (b.productCount > 0 ? null : onDelete(b))}
                                                        title={b.productCount > 0 ? "Không thể xóa vì còn sản phẩm" : t.deleteAction}
                                                        disabled={b.productCount > 0}
                                                        className={`p-1.5 rounded-lg transition-colors ${b.productCount > 0
                                                            ? "text-slate-300 cursor-not-allowed"
                                                            : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                        }`}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button> : null}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    page={page}
                    limit={limit}
                    total={total}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    showingText={t.showing}
                    toText={t.to}
                    ofText={t.of}
                    resultsText={t.results}
                    prevText={t.prev}
                    nextText={t.next}
                />
            </div>

            {modal && (
                <BrandModal
                    mode={modal.mode}
                    initialData={modal.data}
                    onClose={() => setModal(null)}
                    onSave={onSave}
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
