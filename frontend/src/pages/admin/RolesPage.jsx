import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { bootstrapRoles, getPermissions, getRoles, updateRole } from "../../services/roleApi";

const T = {
    vi: {
        title: "Phân quyền",
        subtitle: "Quản lý vai trò và quyền truy cập theo nhóm chức năng.",
        roles: "Vai trò",
        permissions: "Quyền",
        searchPermissions: "Tìm quyền...",
        save: "Lưu",
        saving: "Đang lưu...",
        loading: "Đang tải phân quyền...",
        loadError: "Không thể tải dữ liệu phân quyền",
        updateSuccess: "Cập nhật vai trò thành công",
        updateError: "Cập nhật vai trò thất bại",
        emptyRoles: "Hệ thống chưa có vai trò nào",
        emptyPermissions: "Không tìm thấy quyền phù hợp",
        selectedRole: "Vai trò đang chọn",
        permissionCount: "số quyền",
        selectedCount: "đang bật",
        noChanges: "Không có thay đổi để lưu",
        bootstrapTitle: "Chưa có dữ liệu phân quyền mặc định",
        bootstrapDesc: "Khởi tạo nhanh danh sách quyền và vai trò mặc định để bắt đầu quản lý phân quyền.",
        bootstrapAction: "Khởi tạo RBAC mặc định",
        bootstrapping: "Đang khởi tạo...",
        bootstrapSuccess: "Đã khởi tạo dữ liệu phân quyền mặc định",
        selectAllGroup: "Bật toàn bộ nhóm",
        clearGroup: "Bỏ nhóm này",
        changed: "Đã chỉnh sửa",
        synced: "Đã đồng bộ",
        noRoleSelected: "Chọn một vai trò để bắt đầu",
        noPermissionSearch: "Thử thay đổi từ khóa tìm kiếm hoặc khởi tạo dữ liệu mặc định",
        superAdmin: "Toàn quyền hệ thống",
        admin: "Vận hành tổng hợp",
        productManager: "Quản lý danh mục và sản phẩm",
        orderManager: "Quản lý đơn hàng",
        inventory: "Quản lý tồn kho",
        customer: "Quyền cơ bản phía khách hàng",
        products: "Sản phẩm",
        brands: "Thương hiệu",
        categories: "Danh mục",
        posts: "Tin tức",
        postCategories: "Chuyên mục tin tức",
        orders: "Đơn hàng",
        users: "Người dùng",
        reports: "Thống kê",
        inventoryGroup: "Kho hàng",
        coupons: "Khuyến mãi",
        settings: "Cài đặt",
        rolesGroup: "Phân quyền",
        misc: "Khác",
        actionView: "Xem",
        actionCreate: "Tạo mới",
        actionUpdate: "Cập nhật",
        actionDelete: "Xóa",
        actionManage: "Quản lý",
        actionStatus: "Cập nhật trạng thái",
        fullAccess: "Toàn quyền",
        roleSummary: "Tổng quan vai trò",
        groupSummary: "Nhóm quyền",
    },
    en: {
        title: "Roles & Permissions",
        subtitle: "Manage access control by role and permission group.",
        roles: "Roles",
        permissions: "Permissions",
        searchPermissions: "Search permissions...",
        save: "Save",
        saving: "Saving...",
        loading: "Loading access control...",
        loadError: "Failed to load roles and permissions",
        updateSuccess: "Role updated successfully",
        updateError: "Failed to update role",
        emptyRoles: "No roles found",
        emptyPermissions: "No matching permissions",
        selectedRole: "Selected role",
        permissionCount: "permissions",
        selectedCount: "enabled",
        noChanges: "No changes to save",
        bootstrapTitle: "Default RBAC data has not been initialized",
        bootstrapDesc: "Create the default roles and permissions set to start managing access control.",
        bootstrapAction: "Initialize default RBAC",
        bootstrapping: "Initializing...",
        bootstrapSuccess: "Default RBAC data initialized",
        selectAllGroup: "Enable group",
        clearGroup: "Clear group",
        changed: "Modified",
        synced: "Synced",
        noRoleSelected: "Select a role to begin",
        noPermissionSearch: "Try another search term or initialize the default RBAC data",
        superAdmin: "Full system access",
        admin: "General operations",
        productManager: "Catalog and product management",
        orderManager: "Order management",
        inventory: "Inventory operations",
        customer: "Basic customer access",
        products: "Products",
        brands: "Brands",
        categories: "Categories",
        posts: "Posts",
        postCategories: "Post categories",
        orders: "Orders",
        users: "Users",
        reports: "Reports",
        inventoryGroup: "Inventory",
        coupons: "Promotions",
        settings: "Settings",
        rolesGroup: "Roles",
        misc: "Misc",
        actionView: "View",
        actionCreate: "Create",
        actionUpdate: "Update",
        actionDelete: "Delete",
        actionManage: "Manage",
        actionStatus: "Update status",
        fullAccess: "Full access",
        roleSummary: "Role summary",
        groupSummary: "Permission groups",
    },
};

const ROLE_ORDER = ["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER", "ORDER_MANAGER", "INVENTORY", "CUSTOMER"];

const ROLE_META = {
    SUPER_ADMIN: {
        icon: "shield_person",
        tone: "bg-violet-50 text-violet-700 border-violet-200",
    },
    ADMIN: {
        icon: "admin_panel_settings",
        tone: "bg-sky-50 text-sky-700 border-sky-200",
    },
    PRODUCT_MANAGER: {
        icon: "inventory_2",
        tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    ORDER_MANAGER: {
        icon: "shopping_cart",
        tone: "bg-amber-50 text-amber-700 border-amber-200",
    },
    INVENTORY: {
        icon: "warehouse",
        tone: "bg-orange-50 text-orange-700 border-orange-200",
    },
    CUSTOMER: {
        icon: "person",
        tone: "bg-slate-100 text-slate-700 border-slate-200",
    },
};

const GROUP_META = {
    product: { labelKey: "products", singular: { vi: "sản phẩm", en: "product" }, icon: "inventory_2" },
    brand: { labelKey: "brands", singular: { vi: "thương hiệu", en: "brand" }, icon: "verified" },
    category: { labelKey: "categories", singular: { vi: "danh mục", en: "category" }, icon: "category" },
    post: { labelKey: "posts", singular: { vi: "tin tức", en: "post" }, icon: "article" },
    "post-category": { labelKey: "postCategories", singular: { vi: "chuyên mục tin", en: "post category" }, icon: "topic" },
    order: { labelKey: "orders", singular: { vi: "đơn hàng", en: "order" }, icon: "shopping_cart" },
    user: { labelKey: "users", singular: { vi: "người dùng", en: "user" }, icon: "group" },
    report: { labelKey: "reports", singular: { vi: "báo cáo", en: "report" }, icon: "monitoring" },
    inventory: { labelKey: "inventoryGroup", singular: { vi: "kho hàng", en: "inventory" }, icon: "warehouse" },
    coupon: { labelKey: "coupons", singular: { vi: "voucher", en: "coupon" }, icon: "sell" },
    settings: { labelKey: "settings", singular: { vi: "cài đặt", en: "settings" }, icon: "settings" },
    role: { labelKey: "rolesGroup", singular: { vi: "phân quyền", en: "role" }, icon: "verified_user" },
    misc: { labelKey: "misc", singular: { vi: "mục khác", en: "misc" }, icon: "tune" },
};

const ACTION_LABELS = {
    view: { vi: "Xem", en: "View" },
    create: { vi: "Tạo mới", en: "Create" },
    update: { vi: "Cập nhật", en: "Update" },
    delete: { vi: "Xóa", en: "Delete" },
    manage: { vi: "Quản lý", en: "Manage" },
    update_status: { vi: "Cập nhật trạng thái", en: "Update status" },
};

const getErrorMessage = (error, fallback) =>
    error?.response?.data?.message || error?.message || fallback;

const sortRoles = (rows = []) =>
    [...rows].sort((a, b) => {
        const aIndex = ROLE_ORDER.indexOf(a.name);
        const bIndex = ROLE_ORDER.indexOf(b.name);
        const safeA = aIndex === -1 ? 999 : aIndex;
        const safeB = bIndex === -1 ? 999 : bIndex;
        if (safeA !== safeB) return safeA - safeB;
        return String(a.name || "").localeCompare(String(b.name || ""));
    });

const getRoleDescription = (roleName, t) => {
    if (roleName === "SUPER_ADMIN") return t.superAdmin;
    if (roleName === "ADMIN") return t.admin;
    if (roleName === "PRODUCT_MANAGER") return t.productManager;
    if (roleName === "ORDER_MANAGER") return t.orderManager;
    if (roleName === "INVENTORY") return t.inventory;
    if (roleName === "CUSTOMER") return t.customer;
    return roleName || "-";
};

const getPermissionGroupKey = (permissionName = "") => {
    const [resource] = String(permissionName).split(":");
    return GROUP_META[resource] ? resource : "misc";
};

const getPermissionTitle = (permissionName, lang, t) => {
    const [resource, action] = String(permissionName || "").split(":");
    const groupMeta = GROUP_META[resource] || GROUP_META.misc;
    const actionLabel = ACTION_LABELS[action]?.[lang] || ACTION_LABELS[action]?.en || t.fullAccess;
    const resourceLabel = groupMeta.singular?.[lang] || groupMeta.singular?.en || resource;
    return `${actionLabel} ${resourceLabel}`.trim();
};

const areSetsEqual = (left, right) => {
    if (left.size !== right.size) return false;
    for (const value of left) {
        if (!right.has(value)) return false;
    }
    return true;
};

export default function RolesPage({ lang }) {
    const t = T[lang] || T.vi;
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [bootstrapping, setBootstrapping] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState("");
    const [selectedPermissionNames, setSelectedPermissionNames] = useState(new Set());
    const [permSearch, setPermSearch] = useState("");

    const applyLoadedData = useCallback((roleRows, permissionRows) => {
        const nextRoles = sortRoles(roleRows || []);
        const nextPermissions = [...(permissionRows || [])].sort((a, b) =>
            String(a.name || "").localeCompare(String(b.name || ""))
        );

        setRoles(nextRoles);
        setPermissions(nextPermissions);
        setSelectedRoleId((prev) => {
            if (nextRoles.length === 0) return "";
            if (prev && nextRoles.some((role) => role._id === prev)) return prev;
            return nextRoles[0]._id;
        });
    }, []);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const [rolesRes, permsRes] = await Promise.all([getRoles(), getPermissions()]);
            applyLoadedData(rolesRes?.data || [], permsRes?.data || []);
        } catch (error) {
            toast.error(getErrorMessage(error, t.loadError));
        } finally {
            setLoading(false);
        }
    }, [applyLoadedData, t.loadError]);

    useEffect(() => {
        void load();
    }, [load]);

    const selectedRole = useMemo(
        () => roles.find((role) => role._id === selectedRoleId) || null,
        [roles, selectedRoleId]
    );

    const originalPermissionNames = useMemo(
        () => new Set((selectedRole?.permissions || []).map((permission) => permission.name)),
        [selectedRole]
    );

    useEffect(() => {
        if (!selectedRole) {
            setSelectedPermissionNames(new Set());
            return;
        }
        setSelectedPermissionNames(new Set((selectedRole.permissions || []).map((permission) => permission.name)));
    }, [selectedRole]);

    const hasChanges = useMemo(
        () => !areSetsEqual(selectedPermissionNames, originalPermissionNames),
        [originalPermissionNames, selectedPermissionNames]
    );

    const groupedPermissions = useMemo(() => {
        const query = permSearch.trim().toLowerCase();
        const grouped = new Map();

        permissions.forEach((permission) => {
            const groupKey = getPermissionGroupKey(permission.name);
            const label = getPermissionTitle(permission.name, lang, t).toLowerCase();
            const rawName = String(permission.name || "").toLowerCase();
            if (query && !rawName.includes(query) && !label.includes(query)) return;

            const current = grouped.get(groupKey) || [];
            current.push(permission);
            grouped.set(groupKey, current);
        });

        return Array.from(grouped.entries())
            .sort(([left], [right]) => {
                const leftLabel = t[GROUP_META[left]?.labelKey] || left;
                const rightLabel = t[GROUP_META[right]?.labelKey] || right;
                return String(leftLabel).localeCompare(String(rightLabel));
            })
            .map(([groupKey, items]) => ({
                key: groupKey,
                meta: GROUP_META[groupKey] || GROUP_META.misc,
                items: items.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
            }));
    }, [lang, permSearch, permissions, t]);

    const handleBootstrap = async () => {
        try {
            setBootstrapping(true);
            const response = await bootstrapRoles();
            applyLoadedData(response?.data?.roles || [], response?.data?.permissions || []);
            toast.success(t.bootstrapSuccess);
        } catch (error) {
            toast.error(getErrorMessage(error, t.loadError));
        } finally {
            setBootstrapping(false);
        }
    };

    const togglePermission = (name) => {
        if (!selectedRole) return;
        setSelectedPermissionNames((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const toggleGroup = (permissionNames = []) => {
        if (!selectedRole || permissionNames.length === 0) return;
        setSelectedPermissionNames((prev) => {
            const next = new Set(prev);
            const allSelected = permissionNames.every((name) => next.has(name));
            permissionNames.forEach((name) => {
                if (allSelected) next.delete(name);
                else next.add(name);
            });
            return next;
        });
    };

    const handleSave = async () => {
        if (!selectedRole) return;
        if (!hasChanges) {
            toast.message(t.noChanges);
            return;
        }

        setSaving(true);
        try {
            const response = await updateRole(selectedRole._id, {
                permissions: Array.from(selectedPermissionNames),
            });
            const updated = response?.data;
            setRoles((prev) => sortRoles(prev.map((role) => (role._id === updated?._id ? updated : role))));
            toast.success(t.updateSuccess);
        } catch (error) {
            toast.error(getErrorMessage(error, t.updateError));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-[1600px] p-5 lg:p-8">
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
                    {t.loading}
                </div>
            </div>
        );
    }

    if (roles.length === 0 || permissions.length === 0) {
        return (
            <div className="mx-auto max-w-[1600px] p-5 lg:p-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">{t.title}</h1>
                    <p className="text-slate-500">{t.subtitle}</p>
                </div>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mx-auto max-w-2xl text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-[30px]">verified_user</span>
                        </div>
                        <h2 className="mt-5 text-2xl font-black text-slate-900">{t.bootstrapTitle}</h2>
                        <p className="mt-3 text-slate-500">{t.bootstrapDesc}</p>
                        <button
                            type="button"
                            onClick={handleBootstrap}
                            disabled={bootstrapping}
                            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {bootstrapping ? "progress_activity" : "auto_fix_high"}
                            </span>
                            {bootstrapping ? t.bootstrapping : t.bootstrapAction}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1600px] p-5 lg:p-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">{t.title}</h1>
                <p className="text-slate-500">{t.subtitle}</p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
                <aside className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-5">
                        <div className="text-sm font-bold text-slate-900">{t.roles}</div>
                        <div className="mt-1 text-sm text-slate-500">{roles.length} {t.roles.toLowerCase()}</div>
                    </div>
                    <div className="space-y-3 p-4">
                        {roles.map((role) => {
                            const meta = ROLE_META[role.name] || ROLE_META.CUSTOMER;
                            const active = role._id === selectedRoleId;
                            return (
                                <button
                                    key={role._id}
                                    type="button"
                                    onClick={() => setSelectedRoleId(role._id)}
                                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${active
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "border-slate-200 bg-white hover:bg-slate-50"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${meta.tone}`}>
                                            <span className="material-symbols-outlined text-[20px]">{meta.icon}</span>
                                        </div>
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}>
                                            {(role.permissions || []).length}
                                        </span>
                                    </div>
                                    <div className="mt-4 text-base font-bold text-slate-900">{role.name}</div>
                                    <div className="mt-1 text-sm leading-6 text-slate-500">
                                        {getRoleDescription(role.name, t)}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <section className="min-w-0 rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="min-w-0">
                                <div className="text-sm font-bold text-slate-900">{t.roleSummary}</div>
                                {selectedRole ? (
                                    <>
                                        <div className="mt-2 flex flex-wrap items-center gap-3">
                                            <h2 className="text-2xl font-black text-slate-900">{selectedRole.name}</h2>
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${hasChanges ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                                {hasChanges ? t.changed : t.synced}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-sm text-slate-500">{getRoleDescription(selectedRole.name, t)}</div>
                                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                                                {selectedPermissionNames.size} {t.selectedCount}
                                            </span>
                                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                                                {permissions.length} {t.permissionCount}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="mt-3 text-sm text-slate-500">{t.noRoleSelected}</div>
                                )}
                            </div>

                            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                                <div className="relative w-full sm:min-w-[280px]">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
                                        search
                                    </span>
                                    <input
                                        value={permSearch}
                                        onChange={(event) => setPermSearch(event.target.value)}
                                        placeholder={t.searchPermissions}
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving || !selectedRole || !hasChanges}
                                    className="inline-flex h-12 min-w-[104px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        {saving ? "progress_activity" : "save"}
                                    </span>
                                    {saving ? t.saving : t.save}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="mb-4 text-sm font-bold text-slate-900">{t.groupSummary}</div>
                        {groupedPermissions.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
                                <div>{t.emptyPermissions}</div>
                                <div className="mt-2 text-sm">{t.noPermissionSearch}</div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {groupedPermissions.map((group) => {
                                    const groupLabel = t[group.meta.labelKey] || group.key;
                                    const groupPermissionNames = group.items.map((permission) => permission.name);
                                    const selectedCount = groupPermissionNames.filter((name) => selectedPermissionNames.has(name)).length;
                                    const allSelected = groupPermissionNames.length > 0 && selectedCount === groupPermissionNames.length;

                                    return (
                                        <section key={group.key} className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm">
                                                        <span className="material-symbols-outlined text-[20px]">{group.meta.icon}</span>
                                                    </div>
                                                    <div>
                                                        <div className="text-base font-bold text-slate-900">{groupLabel}</div>
                                                        <div className="mt-1 text-sm text-slate-500">
                                                            {selectedCount}/{group.items.length} {t.selectedCount}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => toggleGroup(groupPermissionNames)}
                                                    disabled={!selectedRole}
                                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {allSelected ? "remove_done" : "done_all"}
                                                    </span>
                                                    {allSelected ? t.clearGroup : t.selectAllGroup}
                                                </button>
                                            </div>

                                            <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                                                {group.items.map((permission) => {
                                                    const checked = selectedPermissionNames.has(permission.name);
                                                    return (
                                                        <button
                                                            key={permission._id}
                                                            type="button"
                                                            onClick={() => togglePermission(permission.name)}
                                                            disabled={!selectedRole}
                                                            className={`rounded-2xl border p-4 text-left transition-colors ${checked
                                                                ? "border-primary bg-primary/5"
                                                                : "border-slate-200 bg-white hover:bg-slate-50"
                                                                } disabled:cursor-not-allowed disabled:opacity-60`}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <div className={`text-sm font-bold ${checked ? "text-primary" : "text-slate-900"}`}>
                                                                        {getPermissionTitle(permission.name, lang, t)}
                                                                    </div>
                                                                    <div className="mt-1 truncate font-mono text-xs text-slate-500">
                                                                        {permission.name}
                                                                    </div>
                                                                </div>
                                                                <span className={`material-symbols-outlined text-[20px] ${checked ? "text-primary" : "text-slate-300"}`}>
                                                                    check_circle
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
