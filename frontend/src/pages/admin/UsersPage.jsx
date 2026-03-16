import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Pagination from "../../components/common/Pagination";
import {
    createUser,
    deleteUser,
    getUsers,
    uploadAvatar,
    updateUser,
    updateUserRole,
    updateUserStatus,
} from "../../services/userApi";
import { hasAdminPermission } from "../../utils/adminAccess";

const T = {
    vi: {
        title: "Người dùng",
        subtitle: "Quản lý tài khoản và phân quyền người dùng.",
        searchPlaceholder: "Tìm theo tên hoặc email...",
        allRoles: "Tất cả vai trò",
        allStatuses: "Tất cả trạng thái",
        statusActive: "Hoạt động",
        statusInactive: "Đã khóa",
        sortLabel: "Sắp xếp",
        sortNewest: "Mới nhất",
        sortOldest: "Cũ nhất",
        sortNameAZ: "Tên A-Z",
        sortNameZA: "Tên Z-A",
        filterCreatedDate: "Ngày tạo",
        filterUpdatedDate: "Ngày cập nhật",
        colName: "Người dùng",
        colEmail: "Email",
        colRole: "Vai trò",
        colStatus: "Trạng thái",
        colCreatedAt: "Ngày tạo",
        colUpdatedAt: "Ngày cập nhật",
        colActions: "Thao tác",
        reset: "Xóa lọc",
        addUser: "Thêm người dùng",
        addTitle: "Tạo người dùng",
        editTitle: "Chỉnh sửa người dùng",
        viewTitle: "Chi tiết người dùng",
        fieldName: "Họ tên",
        fieldEmail: "Email",
        fieldPhone: "Số điện thoại",
        fieldPassword: "Mật khẩu",
        fieldConfirmPassword: "Xác nhận mật khẩu",
        fieldRole: "Vai trò",
        fieldAddress: "Địa chỉ",
        fieldStatus: "Trạng thái",
        fieldAvatar: "Avatar",
        fieldAvatarFile: "Chọn file",
        fieldAvatarUrlHelp: "Hoặc dán URL ảnh (https://...) để dùng avatar từ link.",
        placeholderName: "Nhập họ và tên",
        placeholderEmail: "Nhập email",
        placeholderPhone: "Nhập số điện thoại",
        placeholderPassword: "Nhập mật khẩu",
        placeholderConfirmPassword: "Nhập xác nhận mật khẩu",
        placeholderAddress: "Nhập địa chỉ",
        labelCreatedAt: "Ngày tạo",
        labelUpdatedAt: "Ngày cập nhật",
        cancel: "Đóng",
        save: "Lưu",
        viewDetail: "Xem chi tiết",
        editAction: "Chỉnh sửa",
        deleteAction: "Xóa",
        deleteConfirm: "Bạn có chắc muốn xóa người dùng này không?",
        required: "Bắt buộc nhập",
        invalidEmail: "Chưa đúng định dạng email.",
        emailDuplicate: "Không được trùng email",
        maxLengthExceeded: "Vượt quá giới hạn độ dài",
        passwordInvalid: "Mật khẩu không hợp lệ",
        passwordRuleMin: "Ít nhất 8 ký tự",
        passwordRuleUpper: "Phải có chữ hoa",
        passwordRuleLower: "Phải có chữ thường",
        passwordRuleNumber: "Phải có số",
        passwordRuleSpecial: "Phải có ký tự đặc biệt",
        passwordConfirmMismatch: "Xác nhận mật khẩu không khớp",
        phoneInvalid: "Số điện thoại không hợp lệ",
        phoneRuleLength: "10 chữ số",
        phoneRulePrefix: "Bắt đầu bằng 03, 05, 07, 08, 09",
        phoneRuleUnique: "1 số điện thoại = 1 tài khoản",
        empty: "Không tìm thấy người dùng nào.",
        loadError: "Lỗi tải dữ liệu",
        updateSuccess: "Cập nhật thành công",
        showing: "Hiển thị",
        to: "đến",
        of: "trong",
        results: "người dùng",
        prev: "Trước",
        next: "Sau",
    },
    en: {
        title: "Users",
        subtitle: "Manage user accounts and access.",
        searchPlaceholder: "Search by name or email...",
        allRoles: "All roles",
        allStatuses: "All statuses",
        statusActive: "Active",
        statusInactive: "Disabled",
        sortLabel: "Sort",
        sortNewest: "Newest",
        sortOldest: "Oldest",
        sortNameAZ: "Name A-Z",
        sortNameZA: "Name Z-A",
        filterCreatedDate: "Created date",
        filterUpdatedDate: "Updated date",
        colName: "User",
        colEmail: "Email",
        colRole: "Role",
        colStatus: "Status",
        colCreatedAt: "Created at",
        colUpdatedAt: "Updated at",
        colActions: "Actions",
        reset: "Clear filters",
        addUser: "Add user",
        addTitle: "Create user",
        editTitle: "Edit user",
        viewTitle: "User details",
        fieldName: "Name",
        fieldEmail: "Email",
        fieldPhone: "Phone",
        fieldPassword: "Password",
        fieldConfirmPassword: "Confirm password",
        fieldRole: "Role",
        fieldAddress: "Address",
        fieldStatus: "Status",
        fieldAvatar: "Avatar",
        fieldAvatarFile: "Choose file",
        fieldAvatarUrlHelp: "Or paste an image URL (https://...) to use an avatar from a link.",
        placeholderName: "Enter full name",
        placeholderEmail: "Enter email",
        placeholderPhone: "Enter phone number",
        placeholderPassword: "Enter password",
        placeholderConfirmPassword: "Confirm password",
        placeholderAddress: "Enter address",
        labelCreatedAt: "Created at",
        labelUpdatedAt: "Updated at",
        cancel: "Close",
        save: "Save",
        viewDetail: "View details",
        editAction: "Edit",
        deleteAction: "Delete",
        deleteConfirm: "Are you sure you want to delete this user?",
        required: "Required",
        invalidEmail: "Invalid email format.",
        emailDuplicate: "Email must be unique",
        maxLengthExceeded: "Max length exceeded",
        passwordInvalid: "Password is invalid",
        passwordRuleMin: "At least 8 characters",
        passwordRuleUpper: "Must include uppercase",
        passwordRuleLower: "Must include lowercase",
        passwordRuleNumber: "Must include number",
        passwordRuleSpecial: "Must include special character",
        passwordConfirmMismatch: "Confirm password does not match",
        phoneInvalid: "Phone is invalid",
        phoneRuleLength: "10 digits",
        phoneRulePrefix: "Starts with 03, 05, 07, 08, 09",
        phoneRuleUnique: "One phone number = one account",
        empty: "No users found.",
        loadError: "Failed to load data",
        updateSuccess: "Updated successfully",
        showing: "Showing",
        to: "to",
        of: "of",
        results: "users",
        prev: "Previous",
        next: "Next",
    }
};

const ROLE_LABELS = {
    vi: {
        SUPER_ADMIN: "Quản trị tối cao",
        ADMIN: "Quản trị viên",
        PRODUCT_MANAGER: "Quản lý sản phẩm",
        ORDER_MANAGER: "Quản lý đơn hàng",
        INVENTORY: "Kho vận",
        CUSTOMER: "Khách hàng",
    },
    en: {
        SUPER_ADMIN: "SUPER_ADMIN",
        ADMIN: "ADMIN",
        PRODUCT_MANAGER: "Product Manager",
        ORDER_MANAGER: "Order Manager",
        INVENTORY: "Inventory",
        CUSTOMER: "Customer",
    }
};

export default function UsersPage({ lang }) {
    const t = T[lang] || T.vi;
    const roleLabels = ROLE_LABELS[lang] || ROLE_LABELS.vi;
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sort, setSort] = useState("createdAt:desc");
    const [createdDate, setCreatedDate] = useState("");
    const [updatedDate, setUpdatedDate] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const currentUser = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
            return {};
        }
    }, []);
    const currentUserId = currentUser?.id || currentUser?._id;
    const currentUserRole = currentUser?.role;
    const currentUserSuperType = currentUser?.superAdminType || null;
    const isSuperAdmin = currentUserRole === "SUPER_ADMIN";
    const canManageUsers = hasAdminPermission(currentUser, "user:manage");

    const [modal, setModal] = useState(null);
    const closeModal = () => setModal(null);

    const getErrorMessage = (err) => {
        const data = err?.response?.data;
        const rawMessage = data?.message || err?.message || t.loadError;
        let message = rawMessage;
        if (String(rawMessage).includes("Email already exists")) message = t.emailDuplicate;
        if (String(rawMessage).includes("Phone already exists")) message = t.phoneRuleUnique;
        if (String(rawMessage).includes("Invalid email")) message = t.invalidEmail;
        if (String(rawMessage).includes("Invalid phone")) message = t.phoneInvalid;
        if (String(rawMessage).includes("Password invalid")) message = t.passwordInvalid;
        if (String(rawMessage).includes("Max length exceeded")) message = t.maxLengthExceeded;
        const details = Array.isArray(data?.details) ? data.details : null;
        if (details && details.length > 0) {
            return `${message}: ${details.join(" • ")}`;
        }
        return message;
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

    const canManageUser = (user) => {
        if (!user) return false;
        if (!canManageUsers) return false;
        if (currentUserId && user._id === currentUserId) return false;
        if (user.role !== "SUPER_ADMIN") return true;
        if (!isSuperAdmin) return false;
        const targetType = user.superAdminType || null;
        if (currentUserSuperType === "FOUNDING") return targetType !== "FOUNDING";
        if (currentUserSuperType === "REGULAR") return targetType !== "FOUNDING";
        return false;
    };

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const params = { page, limit, sort };
            if (search) params.search = search;
            if (roleFilter !== "all") params.role = roleFilter;
            if (statusFilter !== "all") params.status = statusFilter;
            if (createdDate) params.createdDate = createdDate;
            if (updatedDate) params.updatedDate = updatedDate;
            const res = await getUsers(params);
            setUsers(res.data || []);
            setTotalItems(res.pagination?.total || 0);
            setTotalPages(res.pagination?.totalPages ?? 1);
        } catch (err) {
            toast.error(err?.message || t.loadError);
        } finally {
            setLoading(false);
        }
    }, [createdDate, limit, page, roleFilter, search, sort, statusFilter, t.loadError, updatedDate]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        setPage(1);
    }, [search, roleFilter, statusFilter, sort, createdDate, updatedDate]);

    const isFiltered =
        !!search
        || roleFilter !== "all"
        || statusFilter !== "all"
        || sort !== "createdAt:desc"
        || !!createdDate
        || !!updatedDate;

    const resetFilters = () => {
        setSearch("");
        setRoleFilter("all");
        setStatusFilter("all");
        setSort("createdAt:desc");
        setCreatedDate("");
        setUpdatedDate("");
        setPage(1);
    };

    const handleRoleChange = async (userId, role) => {
        if (!canManageUsers) return;
        try {
            const res = await updateUserRole(userId, role);
            const updated = res?.data;
            setUsers((prev) => prev.map((u) => (u._id === updated?._id ? updated : u)));
            toast.success(t.updateSuccess);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const handleToggleStatus = async (user) => {
        if (!canManageUsers) return;
        try {
            const res = await updateUserStatus(user._id, !user.isActive);
            const updated = res?.data;
            setUsers((prev) => prev.map((u) => (u._id === updated?._id ? updated : u)));
            toast.success(t.updateSuccess);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const openAdd = () => {
        if (!canManageUsers || !isSuperAdmin) return;
        setModal({ mode: "add", data: null });
    };
    const openView = (user) => setModal({ mode: "view", data: user });
    const openEdit = (user) => {
        if (!canManageUsers) return;
        setModal({ mode: "edit", data: user });
    };

    const handleSaveUser = async (form) => {
        if (!canManageUsers) {
            throw new Error("Access denied");
        }
        try {
            if (modal?.mode === "add") {
                await createUser(form);
                toast.success(t.updateSuccess);
            } else if (modal?.mode === "edit" && modal?.data?._id) {
                await updateUser(modal.data._id, form);
                toast.success(t.updateSuccess);
            }
            closeModal();
            fetchUsers();
        } catch (err) {
            toast.error(getErrorMessage(err));
            throw err;
        }
    };

    const handleDeleteUser = async (user) => {
        if (!canManageUsers || !isSuperAdmin) return;
        if (!user?._id) return;
        if (window.confirm(t.deleteConfirm)) {
            try {
                await deleteUser(user._id);
                toast.success(t.updateSuccess);
                fetchUsers();
            } catch (err) {
                toast.error(err?.message || t.loadError);
            }
        }
    };

    return (
        <div className="p-5 lg:p-8 mx-auto max-w-[1600px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">{t.title}</h1>
                    <p className="text-slate-500 mt-1">{t.subtitle}</p>
                </div>
                {isSuperAdmin && canManageUsers && (
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-primary/20"
                        type="button"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        {t.addUser}
                    </button>
                )}
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-wrap items-end gap-3">
                <div className="relative flex-1 min-w-[220px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">search</span>
                    <input
                        type="text"
                        placeholder={t.searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                </div>

                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-700 cursor-pointer"
                >
                    <option value="all">{t.allRoles}</option>
                    {Object.keys(roleLabels).map((role) => (
                        <option key={role} value={role}>{roleLabels[role]}</option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-700 cursor-pointer"
                >
                    <option value="all">{t.allStatuses}</option>
                    <option value="active">{t.statusActive}</option>
                    <option value="inactive">{t.statusInactive}</option>
                </select>

                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="px-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-700 cursor-pointer"
                >
                    <option value="createdAt:desc">{t.sortNewest}</option>
                    <option value="createdAt:asc">{t.sortOldest}</option>
                    <option value="name:asc">{t.sortNameAZ}</option>
                    <option value="name:desc">{t.sortNameZA}</option>
                </select>

                <div className="w-full flex flex-wrap items-end gap-3 pt-2">
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
                            className="ml-auto flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-500 border border-slate-200 rounded-full bg-white hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors h-10"
                            type="button"
                        >
                            <span className="material-symbols-outlined text-[16px] leading-none">close</span>
                            <span>{t.reset}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50/50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">{t.colName}</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">{t.colEmail}</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">{t.colRole}</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">{t.colStatus}</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">{t.colCreatedAt}</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold">{t.colUpdatedAt}</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-xs font-bold text-right">{t.colActions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                                        <div className="flex justify-center mb-2">
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        Loading...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                                        {t.empty}
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const canManage = canManageUser(user);
                                    return (
                                        <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                                            <td className="px-6 py-4 text-slate-500">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                    disabled={!canManage}
                                                    className="px-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-700 cursor-pointer disabled:opacity-60"
                                                >
                                                    {Object.keys(roleLabels).map((role) => (
                                                        <option key={role} value={role}>{roleLabels[role]}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-medium border ${user.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                                                    {user.isActive ? t.statusActive : t.statusInactive}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{formatDateTime(user.createdAt)}</td>
                                            <td className="px-6 py-4 text-slate-500">{formatUpdatedAt(user.createdAt, user.updatedAt)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openView(user)}
                                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-60"
                                                        title={t.viewDetail}
                                                        type="button"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                    </button>
                                                    {canManageUsers ? (
                                                        <button
                                                            onClick={() => openEdit(user)}
                                                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-60"
                                                            title={t.editAction}
                                                            disabled={!canManage}
                                                            type="button"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                    ) : null}
                                                    {isSuperAdmin && canManageUsers && (
                                                        <button
                                                            onClick={() => handleDeleteUser(user)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-60"
                                                            title={t.deleteAction}
                                                            disabled={!canManage}
                                                            type="button"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    )}
                                                    {canManageUsers ? (
                                                        <button
                                                            onClick={() => handleToggleStatus(user)}
                                                            disabled={!canManage}
                                                            className="ml-2 px-3 py-1.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-60"
                                                            type="button"
                                                        >
                                                            {user.isActive ? t.statusInactive : t.statusActive}
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
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

            {modal && (
                <UserModal
                    mode={modal.mode}
                    initialData={modal.data}
                    roles={Object.keys(roleLabels)}
                    roleLabels={roleLabels}
                    onClose={closeModal}
                    onSave={handleSaveUser}
                    t={t}
                    isSuperAdmin={isSuperAdmin}
                />
            )}
        </div>
    );
}

function UserModal({ mode, initialData, onClose, onSave, roles, roleLabels, t, isSuperAdmin }) {
    const isView = mode === "view";
    const [form, setForm] = useState(() => ({
        name: mode !== "add" ? (initialData?.name || "") : "",
        email: mode !== "add" ? (initialData?.email || "") : "",
        phone: mode !== "add" ? (initialData?.phone || "") : "",
        password: "",
        confirmPassword: "",
        role: mode !== "add" ? (initialData?.role || "CUSTOMER") : "CUSTOMER",
        address: mode !== "add" ? (initialData?.address || "") : "",
        status: mode !== "add" ? (initialData?.isActive ? "active" : "inactive") : "active",
        avatar: mode !== "add" ? (initialData?.avatar || "") : "",
    }));
    const [errors, setErrors] = useState({});
    const [avatarPreview, setAvatarPreview] = useState("");
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [objectPreviewUrl, setObjectPreviewUrl] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const emailOk = (value) => /^\S+@\S+\.\S+$/.test(String(value || "").trim());
    const phoneOk = (value) => /^(03|05|07|08|09)\d{8}$/.test(String(value || "").trim());
    const passwordIssues = (value) => {
        const raw = String(value || "");
        const issues = [];
        if (raw.length < 8) issues.push(t.passwordRuleMin);
        if (!/[A-Z]/.test(raw)) issues.push(t.passwordRuleUpper);
        if (!/[a-z]/.test(raw)) issues.push(t.passwordRuleLower);
        if (!/\d/.test(raw)) issues.push(t.passwordRuleNumber);
        if (!/[^A-Za-z0-9]/.test(raw)) issues.push(t.passwordRuleSpecial);
        return issues;
    };

    const validate = () => {
        const next = {};
        const name = form.name.trim();
        const email = form.email.trim();
        const phone = form.phone.trim();
        const address = form.address.trim();
        const avatar = form.avatar.trim();
        const status = String(form.status || "");
        const role = String(form.role || "");

        if (!name) next.name = t.required;
        else if (name.length > 255) next.name = t.maxLengthExceeded;

        if (!email) next.email = t.required;
        else if (email.length > 255) next.email = t.maxLengthExceeded;
        else if (!emailOk(email)) next.email = t.invalidEmail;

        if (!phone) next.phone = t.required;
        else if (phone.length > 30) next.phone = t.maxLengthExceeded;
        else if (!phoneOk(phone)) next.phone = [t.phoneRuleLength, t.phoneRulePrefix];

        if (!address) next.address = t.required;
        else if (address.length > 500) next.address = t.maxLengthExceeded;

        if (!avatar) next.avatar = t.required;
        else if (avatar.length > 2048) next.avatar = t.maxLengthExceeded;

        if (!role) next.role = t.required;
        if (!status) next.status = t.required;

        if (mode === "add") {
            if (!form.password) next.password = t.required;
            else {
                const issues = passwordIssues(form.password);
                if (issues.length > 0) next.password = issues;
            }
            if (!form.confirmPassword) next.confirmPassword = t.required;
            else if (form.confirmPassword !== form.password) next.confirmPassword = t.passwordConfirmMismatch;
        } else if (mode === "edit" && form.password) {
            const issues = passwordIssues(form.password);
            if (issues.length > 0) next.password = issues;
            if (!form.confirmPassword) next.confirmPassword = t.required;
            else if (form.confirmPassword !== form.password) next.confirmPassword = t.passwordConfirmMismatch;
        }

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    useEffect(() => {
        setAvatarPreview(form.avatar || "");
    }, [form.avatar]);

    useEffect(() => {
        return () => {
            if (objectPreviewUrl) URL.revokeObjectURL(objectPreviewUrl);
        };
    }, [objectPreviewUrl]);

    const submit = async () => {
        if (!validate()) return;
        const payload = {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            avatar: form.avatar.trim(),
            status: form.status,
        };
        if (mode === "add") {
            payload.password = form.password;
            payload.role = form.role;
        } else if (mode === "edit") {
            if (form.password) payload.password = form.password;
        }
        try {
            await onSave(payload);
        } catch (err) {
            const msg = err?.response?.data?.message || "";
            if (String(msg).includes("Phone already exists")) {
                setErrors((prev) => ({ ...prev, phone: [t.phoneRuleUnique] }));
            }
            if (String(msg).includes("Email already exists")) {
                setErrors((prev) => ({ ...prev, email: t.emailDuplicate }));
            }
        }
    };

    const uploadAvatarFile = async (file) => {
        try {
            setUploadingAvatar(true);
            const res = await uploadAvatar(file);
            const url = res?.data?.url;
            if (url) {
                setForm((prev) => ({ ...prev, avatar: url }));
            }
        } finally {
            setUploadingAvatar(false);
        }
    };

    const onPickAvatar = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (objectPreviewUrl) URL.revokeObjectURL(objectPreviewUrl);
        const localUrl = URL.createObjectURL(file);
        setObjectPreviewUrl(localUrl);
        setAvatarPreview(localUrl);
        try {
            await uploadAvatarFile(file);
        } catch {
            setErrors((prev) => ({ ...prev, avatar: t.required }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">
                        {isView ? t.viewTitle : mode === "add" ? t.addTitle : t.editTitle}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700" type="button">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {isView ? (
                    <UserDetailView
                        user={initialData || {}}
                        t={t}
                        roleLabels={roleLabels}
                    />
                ) : (
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            {t.fieldName} <span className="text-red-500">*</span>
                        </label>
                        <input
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none ${errors.name ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            readOnly={isView}
                            placeholder={t.placeholderName}
                        />
                        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            {t.fieldEmail} <span className="text-red-500">*</span>
                        </label>
                        <input
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none ${errors.email ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                            value={form.email}
                            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                            readOnly={isView || mode === "edit"}
                            placeholder={t.placeholderEmail}
                        />
                        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            {t.fieldPhone} <span className="text-red-500">*</span>
                        </label>
                        <input
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none ${errors.phone ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                            value={form.phone}
                            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                            readOnly={isView}
                            placeholder={t.placeholderPhone}
                        />
                        {Array.isArray(errors.phone) ? (
                            <div className="text-xs text-red-600 mt-1 space-y-0.5">
                                <div>{t.phoneInvalid}:</div>
                                {errors.phone.map((line) => (
                                    <div key={line}>. {line}</div>
                                ))}
                            </div>
                        ) : (
                            errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                        )}
                    </div>
                    {!isView && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                {t.fieldPassword} {mode === "add" ? <span className="text-red-500">*</span> : null}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className={`w-full pr-11 px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none ${errors.password ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                                    value={form.password}
                                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                                    placeholder={t.placeholderPassword}
                                />
                                <button
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                                    type="button"
                                    title={showPassword ? "Ẩn" : "Hiện"}
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                            {Array.isArray(errors.password) ? (
                                <div className="text-xs text-red-600 mt-1 space-y-0.5">
                                    <div>{t.passwordInvalid}:</div>
                                    {errors.password.map((line) => (
                                        <div key={line}>• {line}</div>
                                    ))}
                                </div>
                            ) : (
                                errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>
                            )}
                        </div>
                    )}

                    {!isView && (mode === "add" || !!form.password) && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                {t.fieldConfirmPassword} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className={`w-full pr-11 px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none ${errors.confirmPassword ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                                    value={form.confirmPassword}
                                    onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                    placeholder={t.placeholderConfirmPassword}
                                />
                                <button
                                    onClick={() => setShowConfirmPassword((v) => !v)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                                    type="button"
                                    title={showConfirmPassword ? "Ẩn" : "Hiện"}
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showConfirmPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                {t.fieldRole} <span className="text-red-500">*</span>
                            </label>
                            <select
                                className={`pl-3 pr-7 py-2.5 w-full border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none cursor-pointer truncate ${errors.role ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                                value={form.role}
                                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                                disabled={!isSuperAdmin || isView || mode !== "add"}
                            >
                                {roles.map((r) => (
                                    <option key={r} value={r}>
                                        {roleLabels[r] || r}
                                    </option>
                                ))}
                            </select>
                            {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                {t.fieldStatus} <span className="text-red-500">*</span>
                            </label>
                            <select
                                className={`pl-3 pr-7 py-2.5 w-full border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none cursor-pointer truncate ${errors.status ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                                value={form.status}
                                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                                disabled={isView}
                            >
                                <option value="active">{t.statusActive}</option>
                                <option value="inactive">{t.statusInactive}</option>
                            </select>
                            {errors.status && <p className="text-xs text-red-600 mt-1">{errors.status}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            {t.fieldAddress} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none ${errors.address ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                            rows={2}
                            value={form.address}
                            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                            readOnly={isView}
                            placeholder={t.placeholderAddress}
                        />
                        {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            {t.fieldAvatar} <span className="text-red-500">*</span>
                        </label>
                        {!isView && (
                            <div className="flex flex-col gap-2">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {t.fieldAvatarFile}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={onPickAvatar}
                                    className={`block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:bg-white file:text-slate-700 hover:file:bg-slate-50 ${errors.avatar ? "file:border-red-300" : "file:border-slate-200"}`}
                                />
                                {uploadingAvatar && (
                                    <div className="text-xs text-slate-500">Đang tải ảnh...</div>
                                )}
                            </div>
                        )}
                        <input
                            className={`mt-2 w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none ${errors.avatar ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                            value={form.avatar}
                            onChange={(e) => setForm((prev) => ({ ...prev, avatar: e.target.value }))}
                            readOnly={isView}
                            placeholder="https://..."
                        />
                        <p className="text-xs text-slate-500 mt-1">{t.fieldAvatarUrlHelp}</p>
                        {errors.avatar && <p className="text-xs text-red-600 mt-1">{errors.avatar}</p>}
                        {avatarPreview && (
                            <div className="mt-2 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                </div>
                                <div className="text-xs text-slate-500 truncate">{form.avatar || avatarPreview}</div>
                            </div>
                        )}
                    </div>
                </div>
                )}

                <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        type="button"
                    >
                        {t.cancel}
                    </button>
                    {!isView && (
                        <button
                            onClick={submit}
                            disabled={uploadingAvatar}
                            className="flex-1 px-4 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                            type="button"
                        >
                            {t.save}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function UserDetailView({ user, t, roleLabels }) {
    const createdAt = user?.createdAt ? new Date(user.createdAt) : null;
    const updatedAt = user?.updatedAt ? new Date(user.updatedAt) : null;
    const createdText = createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toLocaleString() : "—";
    const updatedText = (() => {
        if (!createdAt || !updatedAt) return "—";
        if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) return "—";
        if (createdAt.getTime() === updatedAt.getTime()) return "—";
        return updatedAt.toLocaleString();
    })();
    const statusText = user?.isActive ? t.statusActive : t.statusInactive;
    const statusClass = user?.isActive
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-rose-50 text-rose-700 border-rose-200";
    const roleText = roleLabels?.[user?.role] || user?.role || "—";
    const avatarUrl = user?.avatar || "";
    const initials = String(user?.name || "?")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s.charAt(0).toUpperCase())
        .join("");

    return (
        <div className="overflow-y-auto">
            <div className="px-6 pt-6">
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="h-20 bg-gradient-to-r from-primary/20 to-blue-200/40" />
                    <div className="px-5 pb-5 -mt-10">
                        <div className="flex items-end gap-4">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center flex-shrink-0">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-xl font-bold text-slate-400">{initials}</div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1 pb-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-lg font-bold text-slate-900 truncate">{user?.name || "—"}</div>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClass}`}>
                                        {statusText}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-500 truncate">{user?.email || "—"}</div>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-white text-slate-700">
                                <span className="material-symbols-outlined text-[16px] text-slate-400">badge</span>
                                {roleText}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-white text-slate-700">
                                <span className="material-symbols-outlined text-[16px] text-slate-400">call</span>
                                {user?.phone || "—"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 pb-6 mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.labelCreatedAt}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{createdText}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.labelUpdatedAt}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{updatedText}</div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.fieldAddress}</div>
                    <div className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{user?.address || "—"}</div>
                </div>
            </div>
        </div>
    );
}
