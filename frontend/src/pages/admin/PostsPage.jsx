import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Pagination from "../../components/common/Pagination";
import {
    getPosts,
    createPost,
    updatePost,
    deletePost,
} from "../../services/postApi";
import { getPostCategories } from "../../services/postCategoryApi";
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

const T = {
    vi: {
        title: "Tin tức công nghệ",
        subtitle: "Quản lý bài viết và tin tức.",
        export: "Xuất file",
        addPost: "Thêm bài viết",
        searchPlaceholder: "Tìm bài viết...",
        authorPlaceholder: "Tìm tác giả...",
        allCategories: "Chuyên mục (Tất cả)",
        allStatuses: "Trạng thái (Tất cả)",
        filterCreatedDate: "Ngày đăng",
        filterUpdatedDate: "Ngày cập nhật",
        sortLabel: "Sắp xếp",
        sortNewest: "Mới nhất",
        sortOldest: "Cũ nhất",
        sortAZ: "A-Z",
        sortZA: "Z-A",
        reset: "Xóa lọc",
        colTitle: "Tiêu đề",
        colTag: "Chuyên mục",
        colAuthor: "Tác giả",
        colStatus: "Trạng thái",
        colDate: "Ngày đăng",
        colActions: "Thao tác",
        statusPublished: "Đăng",
        statusHidden: "Ẩn",
        statusDraft: "Nháp",
        statusArchived: "Đã lưu",
        cancel: "Hủy",
        close: "Đóng",
        save: "Lưu",
        addTitle: "Thêm bài viết mới",
        editTitle: "Chỉnh sửa bài viết",
        viewTitle: "Chi tiết bài viết",
        fieldTitle: "Tiêu đề",
        fieldSlug: "Đường dẫn (Tự động)",
        fieldSlugManual: "Đường dẫn (Tự nhập)",
        slugPlaceholder: "Tự động",
        slugPlaceholderManual: "Tự nhập",
        fieldDesc: "Mô tả ngắn",
        fieldContent: "Nội dung",
        fieldThumbnail: "Đường dẫn ảnh thumbnail",
        fieldTag: "Chuyên mục",
        fieldStatus: "Trạng thái",
        fieldAuthor: "Tác giả",
        fieldCreatedAt: "Ngày đăng",
        fieldUpdatedAt: "Ngày cập nhật",
        viewDetail: "Xem chi tiết",
        editAction: "Chỉnh sửa",
        deleteAction: "Xóa",
        confirmDelete: "Bạn có chắc muốn xóa bài viết này không?",
        deleteSuccess: "Xóa bài viết thành công!",
        saveSuccess: "Lưu bài viết thành công!",
        loadError: "Lỗi tải dữ liệu",
        requiredError: "Vui lòng điền vào trường này.",
        showing: "Hiển thị",
        to: "đến",
        of: "trong",
        results: "bài viết",
        prev: "Trước",
        next: "Sau",
        exportTitle: "Xuất file Excel",
        exportSelected: "Xuất theo tick chọn",
        exportAll: "Xuất tất cả theo bộ lọc",
        exportConfirm: "Xuất file",
        exportEmpty: "Chưa chọn bài viết nào",
    },
    en: {
        title: "Tech News",
        subtitle: "Manage blog posts and news.",
        export: "Export",
        addPost: "Add Post",
        searchPlaceholder: "Search posts...",
        authorPlaceholder: "Search author...",
        allCategories: "Category (All)",
        allStatuses: "Status (All)",
        filterCreatedDate: "Published date",
        filterUpdatedDate: "Updated date",
        sortLabel: "Sort",
        sortNewest: "Newest",
        sortOldest: "Oldest",
        sortAZ: "A-Z",
        sortZA: "Z-A",
        reset: "Clear filters",
        colTitle: "Title",
        colTag: "Category",
        colAuthor: "Author",
        colStatus: "Status",
        colDate: "Date",
        colActions: "Actions",
        statusPublished: "Published",
        statusHidden: "Hidden",
        statusDraft: "Draft",
        statusArchived: "Archived",
        cancel: "Cancel",
        close: "Close",
        save: "Save",
        addTitle: "Add New Post",
        editTitle: "Edit Post",
        viewTitle: "Post Details",
        fieldTitle: "Title",
        fieldSlug: "Slug (Auto-generated)",
        fieldSlugManual: "Slug (Manual)",
        slugPlaceholder: "Auto-generated",
        slugPlaceholderManual: "Manual",
        fieldDesc: "Short Description",
        fieldContent: "Content",
        fieldThumbnail: "Thumbnail URL",
        fieldTag: "Category Tag",
        fieldStatus: "Status",
        fieldAuthor: "Author",
        fieldCreatedAt: "Created at",
        fieldUpdatedAt: "Updated at",
        viewDetail: "View details",
        editAction: "Edit",
        deleteAction: "Delete",
        confirmDelete: "Are you sure you want to delete this post?",
        deleteSuccess: "Post deleted successfully!",
        saveSuccess: "Post saved successfully!",
        loadError: "Failed to load data",
        requiredError: "Please fill out this field.",
        showing: "Showing",
        to: "to",
        of: "of",
        results: "posts",
        prev: "Previous",
        next: "Next",
        exportTitle: "Export Excel",
        exportSelected: "Export selected",
        exportAll: "Export all by filters",
        exportConfirm: "Export",
        exportEmpty: "No posts selected",
    }
};

const resolvePostErrorMessage = (error, lang, fallback) => {
    const raw = String(error?.message || error?.error || error?.response?.data?.message || error || "").trim();
    const isVi = lang === "vi";

    if (!raw) return fallback;
    if (
        raw.includes("Post already exists") ||
        raw.includes("Post with this slug already exists") ||
        raw.includes("A post with this slug already exists")
    ) {
        return isVi ? "Bài viết đã tồn tại" : "Post already exists";
    }
    if (raw.includes("Post not found")) {
        return isVi ? "Không tìm thấy bài viết" : "Post not found";
    }
    if (raw.includes("Server Error")) {
        return isVi ? "Lỗi máy chủ" : "Server error";
    }

    return raw;
};

export default function PostsPage({ lang }) {
    const t = T[lang] || T.vi;
    const currentUser = readStoredUserProfile();
    const canCreatePost = hasAdminPermission(currentUser, "post:create");
    const canUpdatePost = hasAdminPermission(currentUser, "post:update");
    const canDeletePost = hasAdminPermission(currentUser, "post:delete");
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [authorTerm, setAuthorTerm] = useState("");
    const [tagFilter, setTagFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [createdDate, setCreatedDate] = useState("");
    const [updatedDate, setUpdatedDate] = useState("");
    const [sort, setSort] = useState("createdAt:desc");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPosts, setTotalPosts] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add"); // add | edit | view
    const [editingPost, setEditingPost] = useState(null);
    const [slugLocked, setSlugLocked] = useState(false);
    const [errors, setErrors] = useState({});
    const [thumbnailError, setThumbnailError] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedMap, setSelectedMap] = useState({});
    const [exportModal, setExportModal] = useState(false);
    const [exportMode, setExportMode] = useState("selected");
    const [exportLoading, setExportLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        description: "",
        content: "",
        thumbnail: "",
        tag: "Tin công nghệ",
        status: "published"
    });

    const isView = modalMode === "view";
    const accessDeniedMessage =
        lang === "vi"
            ? "Bạn không có quyền thực hiện thao tác này"
            : "You do not have permission to perform this action";

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit };
            if (searchTerm) params.search = searchTerm;
            if (authorTerm) params.author = authorTerm;
            if (tagFilter !== "all") params.tag = tagFilter;
            if (statusFilter !== "all") params.status = statusFilter;
            if (createdDate) params.createdDate = createdDate;
            if (updatedDate) params.updatedDate = updatedDate;
            if (sort) params.sort = sort;
            const data = await getPosts(params);
            setPosts(data.data || []);
            setTotalPosts(data.total || 0);
            setTotalPages(data.totalPages ?? 1);
        } catch (err) {
            toast.error(resolvePostErrorMessage(err, lang, t.loadError));
        } finally {
            setLoading(false);
        }
    }, [authorTerm, createdDate, lang, limit, page, searchTerm, sort, statusFilter, tagFilter, t.loadError, updatedDate]);

    const fetchCategories = useCallback(async () => {
        try {
            const data = await getPostCategories({ limit: 100, status: 'active' });
            setCategories(data.data || []);
        } catch (err) {
            toast.error(resolvePostErrorMessage(err, lang, t.loadError));
        }
    }, [lang, t.loadError]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        setPage(1);
        setSelectedIds([]);
        setSelectedMap({});
    }, [authorTerm, createdDate, searchTerm, sort, statusFilter, tagFilter, updatedDate]);

    useEffect(() => {
        const visible = new Set(posts.map((p) => p._id));
        setSelectedIds((prev) => prev.filter((id) => visible.has(id)));
    }, [posts]);

    const visibleIds = useMemo(() => posts.map((p) => p._id), [posts]);
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
        setSelectedIds((prev) => {
            const exists = prev.includes(id);
            setSelectedMap((map) => {
                if (exists) {
                    const next = { ...map };
                    delete next[id];
                    return next;
                }
                const item = posts.find((p) => p._id === id);
                if (!item) return map;
                return { ...map, [id]: item };
            });
            return exists ? prev.filter((x) => x !== id) : [...prev, id];
        });
    };

    const toggleAll = () => {
        setSelectedIds((prev) => {
            if (allSelected) {
                setSelectedMap((map) => {
                    const next = { ...map };
                    visibleIds.forEach((id) => { delete next[id]; });
                    return next;
                });
                return prev.filter((id) => !visibleIds.includes(id));
            }
            setSelectedMap((map) => {
                const next = { ...map };
                posts.forEach((p) => { next[p._id] = p; });
                return next;
            });
            return Array.from(new Set([...prev, ...visibleIds]));
        });
    };

    const openAddModal = () => {
        if (!canCreatePost) {
            toast.error(accessDeniedMessage);
            return;
        }
        setModalMode("add");
        setEditingPost(null);
        setSlugLocked(false);
        setErrors({});
        setThumbnailError(false);
        setFormData({
            title: "",
            slug: "",
            description: "",
            content: "",
            thumbnail: "",
            tag: categories.length > 0 ? categories[0].name : "Tin tá»©c",
            status: "published"
        });
        setIsModalOpen(true);
    };

    const openEditModal = (post) => {
        if (!canUpdatePost) {
            toast.error(accessDeniedMessage);
            return;
        }
        setModalMode("edit");
        setEditingPost(post);
        setSlugLocked(true);
        setErrors({});
        setThumbnailError(false);
        setFormData({
            title: post.title,
            slug: post.slug,
            description: post.description || "",
            content: post.content,
            thumbnail: post.thumbnail || "",
            tag: post.tag || (categories.length > 0 ? categories[0].name : "Tin tá»©c"),
            status: post.status
        });
        setIsModalOpen(true);
    };

    const openViewModal = (post) => {
        setModalMode("view");
        setEditingPost(post);
        setSlugLocked(false);
        setErrors({});
        setThumbnailError(false);
        setFormData({
            title: post.title,
            slug: post.slug,
            description: post.description || "",
            content: post.content,
            thumbnail: post.thumbnail || "",
            tag: post.tag || (categories.length > 0 ? categories[0].name : "Tin tá»©c"),
            status: post.status
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalMode("add");
        setEditingPost(null);
        setSlugLocked(false);
        setErrors({});
        setThumbnailError(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (isView) return;
        setFormData((prev) => {
            if (name === "slug" && !slugLocked) return prev;
            const next = { ...prev, [name]: value };
            if (name === "title" && !slugLocked) {
                next.slug = slugifyText(value);
            }
            return next;
        });
        if (name === "thumbnail") setThumbnailError(false);
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        if (isView) return true;
        const next = {};
        if (!String(formData.title || "").trim()) next.title = t.requiredError;
        if (!String(formData.slug || "").trim()) next.slug = t.requiredError;
        if (!String(formData.thumbnail || "").trim()) next.thumbnail = t.requiredError;
        if (!String(formData.description || "").trim()) next.description = t.requiredError;
        if (!String(formData.content || "").trim()) next.content = t.requiredError;
        if (!String(formData.tag || "").trim()) next.tag = t.requiredError;
        if (!String(formData.status || "").trim()) next.status = t.requiredError;
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (isView) return;
        if (editingPost && !canUpdatePost) {
            toast.error(accessDeniedMessage);
            return;
        }
        if (!editingPost && !canCreatePost) {
            toast.error(accessDeniedMessage);
            return;
        }

        if (!validate()) return;

        try {
            if (editingPost) {
                await updatePost(editingPost._id, formData);
            } else {
                await createPost(formData);
            }
            toast.success(t.saveSuccess);
            closeModal();
            fetchPosts();
        } catch (error) {
            toast.error(resolvePostErrorMessage(error, lang, lang === "vi" ? "Lỗi lưu bài viết" : "Failed to save post"));
        }
    };

    const handleDelete = async (id) => {
        if (!canDeletePost) {
            toast.error(accessDeniedMessage);
            return;
        }
        if (!window.confirm(t.confirmDelete)) return;
        try {
            await deletePost(id);
            toast.success(t.deleteSuccess);
            fetchPosts();
        } catch (error) {
            toast.error(resolvePostErrorMessage(error, lang, lang === "vi" ? "Lỗi xóa bài viết" : "Failed to delete post"));
        }
    };

    const StatusBadge = ({ status }) => {
        const config = {
            published: { bg: "bg-green-100", text: "text-green-800", label: t.statusPublished },
            hidden: { bg: "bg-slate-100", text: "text-slate-800", label: t.statusHidden },
            draft: { bg: "bg-yellow-100", text: "text-yellow-800", label: t.statusDraft },
            archived: { bg: "bg-slate-100", text: "text-slate-800", label: t.statusArchived }
        };
        const c = config[status] || config.draft;
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>
                {c.label}
            </span>
        );
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

    const isFiltered =
        !!searchTerm
        || !!authorTerm
        || tagFilter !== "all"
        || statusFilter !== "all"
        || !!createdDate
        || !!updatedDate
        || sort !== "createdAt:desc";

    const resetFilters = () => {
        setSearchTerm("");
        setAuthorTerm("");
        setTagFilter("all");
        setStatusFilter("all");
        setCreatedDate("");
        setUpdatedDate("");
        setSort("createdAt:desc");
        setPage(1);
        setSelectedIds([]);
        setSelectedMap({});
    };

    const escapeCsv = (value) => {
        const str = value === null || value === undefined ? "" : String(value);
        return `"${str.replace(/"/g, '""')}"`;
    };

    const buildExportParams = (pageIndex, pageSize) => {
        const params = { page: pageIndex, limit: pageSize };
        if (searchTerm) params.search = searchTerm;
        if (authorTerm) params.author = authorTerm;
        if (tagFilter !== "all") params.tag = tagFilter;
        if (statusFilter !== "all") params.status = statusFilter;
        if (createdDate) params.createdDate = createdDate;
        if (updatedDate) params.updatedDate = updatedDate;
        if (sort) params.sort = sort;
        return params;
    };

    const fetchAllPosts = async () => {
        const pageSize = 200;
        let pageIndex = 1;
        let totalPagesLocal = 1;
        const all = [];
        do {
            const res = await getPosts(buildExportParams(pageIndex, pageSize));
            const rows = res.data || [];
            all.push(...rows);
            totalPagesLocal = res.totalPages || 1;
            pageIndex += 1;
        } while (pageIndex <= totalPagesLocal);
        return all;
    };

    const buildCsv = (rows) => {
        const statusLabels = lang === "vi"
            ? { published: "Đăng", hidden: "Ẩn", draft: "Nháp", archived: "Đã lưu" }
            : { published: "Published", hidden: "Hidden", draft: "Draft", archived: "Archived" };

        const headers = lang === "vi"
            ? ["ID", "Tiêu đề", "Đường dẫn", "Chuyên mục", "Tác giả", "Trạng thái", "Ngày đăng", "Ngày cập nhật", "Thumbnail"]
            : ["ID", "Title", "Slug", "Category", "Author", "Status", "Created at", "Updated at", "Thumbnail"];

        const lines = [headers.map(escapeCsv).join(",")];
        rows.forEach((p) => {
            const row = [
                p._id || "",
                p.title || "",
                p.slug || "",
                p.tag || "",
                p.author?.name || "",
                statusLabels[p.status] || p.status || "",
                formatDateTime(p.createdAt),
                formatUpdatedAt(p.createdAt, p.updatedAt),
                p.thumbnail || "",
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
        link.download = `posts_${stamp}.csv`;
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
                exportRows = selectedIds.map((id) => selectedMap[id]).filter(Boolean);
                if (exportRows.length !== selectedIds.length) {
                    const all = await fetchAllPosts();
                    exportRows = all.filter((p) => selectedSet.has(p._id));
                }
            } else {
                exportRows = await fetchAllPosts();
            }
            const csv = buildCsv(exportRows);
            downloadCsv(csv);
            setExportModal(false);
        } catch (err) {
            toast.error(resolvePostErrorMessage(err, lang, t.loadError));
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <div className="p-5 lg:p-8 max-w-[1600px] mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">{t.title}</h2>
                    <p className="text-sm text-slate-500 mt-1">{t.subtitle}</p>
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
                    {canCreatePost ? (
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm"
                            type="button"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            {t.addPost}
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <div className="mb-6 flex flex-wrap items-end gap-3">
                    <div className="w-full sm:max-w-[320px] flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500">{t.fieldTitle}</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                type="text"
                                placeholder={t.searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="w-full sm:max-w-[260px] flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500">{t.fieldAuthor}</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">person</span>
                            <input
                                type="text"
                                placeholder={t.authorPlaceholder}
                                value={authorTerm}
                                onChange={(e) => setAuthorTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500">{t.fieldTag}</label>
                        <select
                            value={tagFilter}
                            onChange={(e) => setTagFilter(e.target.value)}
                            className="w-48 px-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-700 cursor-pointer"
                        >
                            <option value="all">{t.allCategories}</option>
                            {categories.map((c) => (
                                <option key={c._id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500">{t.fieldStatus}</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-52 px-3 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-700 cursor-pointer"
                        >
                            <option value="all">{t.allStatuses}</option>
                            <option value="published">{t.statusPublished}</option>
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
                            className="w-40 px-3 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-700 cursor-pointer"
                        >
                            <option value="createdAt:desc">{t.sortNewest || t.sortLabel}</option>
                            <option value="createdAt:asc">{t.sortOldest || t.sortLabel}</option>
                            <option value="title:asc">{t.sortAZ}</option>
                            <option value="title:desc">{t.sortZA}</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500">{t.filterCreatedDate}</label>
                        <input
                            type="date"
                            value={createdDate}
                            onChange={(e) => setCreatedDate(e.target.value)}
                            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-700 font-normal"
                            aria-label={t.filterCreatedDate}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500">{t.filterUpdatedDate}</label>
                        <input
                            type="date"
                            value={updatedDate}
                            onChange={(e) => setUpdatedDate(e.target.value)}
                            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-700 font-normal"
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

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                                <th className="px-5 py-4 w-12">
                                    <input
                                        ref={selectAllRef}
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                        aria-label="Select all"
                                    />
                                </th>
                                <th className="px-5 py-4">{t.colTitle}</th>
                                <th className="px-5 py-4">{t.colTag}</th>
                                <th className="px-5 py-4">{t.colAuthor}</th>
                                <th className="px-5 py-4">{t.colStatus}</th>
                                <th className="px-5 py-4">{t.colDate}</th>
                                <th className="px-5 py-4 text-right">{t.colActions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-400">{lang === "vi" ? "Đang tải..." : "Loading..."}</td>
                                </tr>
                            ) : posts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-400">{lang === "vi" ? "Không có bài viết nào" : "No posts found"}</td>
                                </tr>
                            ) : (
                                posts.map((post) => (
                                    <tr key={post._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(post._id)}
                                                onChange={() => toggleSelect(post._id)}
                                                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                aria-label="Select row"
                                            />
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {post.thumbnail && (
                                                    <img src={post.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                                )}
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm line-clamp-1">{post.title}</p>
                                                    <p className="text-xs text-slate-500">{post.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm font-medium text-slate-700">{post.tag}</td>
                                        <td className="px-5 py-4 text-sm text-slate-600">{post.author?.name || "Admin"}</td>
                                        <td className="px-5 py-4"><StatusBadge status={post.status} /></td>
                                        <td className="px-5 py-4 text-sm text-slate-500">
                                            {new Date(post.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                                        </td>
                                        <td className="px-5 py-4 text-right text-sm whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => openViewModal(post)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors hover:bg-slate-100 rounded-lg"
                                                    type="button"
                                                    title={t.viewDetail}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                </button>
                                                {canUpdatePost ? (
                                                    <button
                                                        onClick={() => openEditModal(post)}
                                                        className="p-1.5 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100 rounded-lg"
                                                        type="button"
                                                        title={t.editAction}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                ) : null}
                                                {canDeletePost ? (
                                                    <button
                                                        onClick={() => handleDelete(post._id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors hover:bg-slate-100 rounded-lg"
                                                        type="button"
                                                        title={t.deleteAction}
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

                <Pagination
                    page={page}
                    limit={limit}
                    total={totalPosts}
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">{isView ? t.viewTitle : (editingPost ? t.editTitle : t.addTitle)}</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1">
                            <form id="post-form" onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">
                                            {t.fieldTitle} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            readOnly={isView}
                                            className={`w-full px-3 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm ${errors.title ? "border-red-300" : "border-slate-200"}`}
                                        />
                                        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
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
                                                            slug: next ? "" : slugifyText(current.title || "")
                                                        }));
                                                        return next;
                                                    });
                                                    setErrors((prev) => ({ ...prev, slug: null }));
                                                }}
                                                className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors p-1 ${isView ? "text-slate-300 cursor-not-allowed" : "text-slate-400 hover:text-primary"}`}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">{slugLocked ? "link_off" : "link"}</span>
                                            </button>
                                        </div>
                                        {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">
                                            {t.fieldThumbnail} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            name="thumbnail"
                                            value={formData.thumbnail}
                                            onChange={handleChange}
                                            placeholder="https://..."
                                            readOnly={isView}
                                            className={`w-full px-3 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm ${errors.thumbnail ? "border-red-300" : "border-slate-200"}`}
                                        />
                                        {errors.thumbnail && <p className="mt-1 text-xs text-red-500">{errors.thumbnail}</p>}
                                        {formData.thumbnail?.trim() && (
                                            <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                                {!thumbnailError ? (
                                                    <img
                                                        src={formData.thumbnail.trim()}
                                                        alt=""
                                                        className="w-full h-48 object-cover"
                                                        onError={() => setThumbnailError(true)}
                                                    />
                                                ) : (
                                                    <div className="h-48 flex items-center justify-center text-sm text-slate-500">
                                                        {lang === "vi" ? "Thumbnail không hợp lệ" : "Invalid thumbnail"}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">
                                            {t.fieldDesc} <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={2}
                                            readOnly={isView}
                                            className={`w-full px-3 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none ${errors.description ? "border-red-300" : "border-slate-200"}`}
                                        />
                                        {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">
                                            {t.fieldContent} <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="content"
                                            value={formData.content}
                                            onChange={handleChange}
                                            rows={6}
                                            readOnly={isView}
                                            className={`w-full px-3 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm ${errors.content ? "border-red-300" : "border-slate-200"}`}
                                        />
                                        {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">
                                            {t.fieldTag} <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="tag"
                                            value={formData.tag}
                                            onChange={handleChange}
                                            disabled={isView}
                                            className={`w-full px-3 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm appearance-none ${errors.tag ? "border-red-300" : "border-slate-200"} ${isView ? "text-slate-700" : ""}`}
                                        >
                                            {categories.length === 0 && <option value="Tin tá»©c">Tin tá»©c</option>}
                                            {categories.map(cat => (
                                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                        {errors.tag && <p className="mt-1 text-xs text-red-500">{errors.tag}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">
                                            {t.fieldStatus} <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            disabled={isView}
                                            className={`w-full px-3 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm ${errors.status ? "border-red-300" : "border-slate-200"} ${isView ? "text-slate-700" : ""}`}
                                        >
                                            <option value="published">{t.statusPublished}</option>
                                            <option value="hidden">{t.statusHidden}</option>
                                            <option value="draft">{t.statusDraft}</option>
                                            <option value="archived">{t.statusArchived}</option>
                                        </select>
                                        {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status}</p>}
                                    </div>
                                </div>

                                {isView && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">{t.fieldAuthor}</label>
                                            <p className="text-sm text-slate-700">
                                                {editingPost?.author?.name || "â€”"}
                                                {editingPost?.author?.email ? ` (${editingPost.author.email})` : ""}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">{t.fieldCreatedAt}</label>
                                            <p className="text-sm text-slate-700">{formatDateTime(editingPost?.createdAt)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">{t.fieldUpdatedAt}</label>
                                            <p className="text-sm text-slate-700">
                                                {editingPost?.updatedAt && editingPost?.createdAt && new Date(editingPost.updatedAt).getTime() !== new Date(editingPost.createdAt).getTime()
                                                    ? formatDateTime(editingPost.updatedAt)
                                                    : "â€”"}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                            <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                                {isView ? t.close : t.cancel}
                            </button>
                            {!isView && (
                                <button form="post-form" type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-blue-700 transition-colors shadow-sm">
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
