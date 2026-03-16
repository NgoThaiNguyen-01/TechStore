import React, { useState } from "react";
import { slugify } from "../../utils/slugify";
import { toast } from "sonner";

const ICONS = [
    "category", "inventory_2", "devices", "smartphone", "laptop_mac", "tablet_mac", "desktop_windows", "headphones",
    "watch", "camera_alt", "videogame_asset", "headset_mic", "speaker", "router", "memory", "storage", "usb",
    "keyboard", "mouse", "print", "scan", "power", "battery_full", "bolt", "shopping_bag", "shopping_cart",
    "local_shipping", "verified", "support_agent", "settings", "widgets", "view_in_ar", "lightbulb", "tv",
    "home_iot_device", "security", "lock", "smart_toy", "auto_awesome", "palette", "diamond", "sports_esports",
    "language", "public", "school", "science", "cloud", "gps_fixed", "map", "storefront"
];

export default function CategoryModal({ mode, initialData, onClose, onSave, parents, t }) {
    const isView = mode === "view";
    const [form, setForm] = useState(() => ({
        name: mode !== "add" ? (initialData?.name || "") : "",
        slug: mode !== "add" ? (initialData?.slug || "") : "",
        desc: mode !== "add" ? (initialData?.description || "") : "",
        parent: mode !== "add" ? (initialData?.parent?._id || "") : "",
        status: mode !== "add" ? (initialData?.status || "active") : "active",
        icon: mode !== "add" ? (initialData?.icon || ICONS[0]) : ICONS[0],
        createdAt: mode !== "add" ? (initialData?.createdAt || null) : null,
        updatedAt: mode !== "add" ? (initialData?.updatedAt || null) : null,
    }));
    const [manualSlug, setManualSlug] = useState(false); // mặc định Tự động
    const [errors, setErrors] = useState({});

    const formatDateTime = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "—";
        return date.toLocaleString("vi-VN");
    };

    const formatUpdatedAt = (createdAt, updatedAt) => {
        if (!createdAt || !updatedAt) return "—";
        const created = new Date(createdAt).getTime();
        const updated = new Date(updatedAt).getTime();
        if (Number.isNaN(created) || Number.isNaN(updated)) return "—";
        if (created === updated) return "—";
        return formatDateTime(updatedAt);
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        setForm({
            ...form,
            name,
            slug: !manualSlug && mode !== "view" ? slugify(name) : form.slug,
        });
    };

    const handleSubmit = () => {
        const nextErrors = {};
        if (!form.name?.trim()) nextErrors.name = true;
        if (!form.slug?.trim()) nextErrors.slug = true;
        if (!form.desc?.trim()) nextErrors.desc = true;
        if (!form.icon?.trim()) nextErrors.icon = true;
        if (!form.status?.trim()) nextErrors.status = true;
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            toast.error(t.nameSlugReq || "Name and Slug are required!");
            return;
        }

        const resolvedParent = form.parent === "" ? "root" : form.parent;

        let isParentActive = true;
        if (resolvedParent !== "root") {
            const selectedParentDoc = parents.find(p => p._id === resolvedParent);
            if (selectedParentDoc && selectedParentDoc.status !== "active") {
                isParentActive = false;
            }
        }

        if (!isParentActive) {
            toast.error(t.errorInactiveParent || "Parent category must be active to add subcategories.");
            return;
        }

        onSave({
            name: form.name.trim(),
            slug: form.slug.trim(),
            description: form.desc.trim(),
            parent: resolvedParent,
            status: form.status,
            icon: form.icon,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">
                        {isView ? t.viewTitle : mode === "add" ? t.addTitle : t.editTitle}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {isView ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    {t.fieldName} <span className="text-red-500">*</span>
                                </div>
                                <div className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700">
                                    {form.name || "—"}
                                </div>
                            </div>
                            <div>
                                <div className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    {t.fieldSlug} (Tự nhập) <span className="text-red-500">*</span>
                                </div>
                                <div className="relative">
                                    <div className="px-3 py-2.5 pr-10 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 font-mono truncate">
                                        {form.slug || "—"}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigator.clipboard?.writeText(form.slug || "")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-primary hover:bg-primary/10"
                                        title="Sao chép slug"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                    </button>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <div className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    {t.fieldDesc} <span className="text-red-500">*</span>
                                </div>
                                <div className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 min-h-[74px] whitespace-pre-wrap">
                                    {form.desc || "—"}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    {t.fieldName} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none ${errors.name ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                                    value={form.name}
                                    onChange={handleNameChange}
                                    required
                                    readOnly={isView}
                                    placeholder="Nhập tên danh mục"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    {t.fieldSlug} {manualSlug ? "(Tự nhập)" : "(Tự động)"} <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        className={`w-full pr-10 px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none font-mono ${errors.slug ? "border-red-300 bg-red-50/30" : "border-slate-200"} ${!manualSlug ? "bg-slate-50 text-slate-500" : ""}`}
                                        value={form.slug}
                                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                        required
                                        readOnly={isView || !manualSlug}
                                        placeholder={manualSlug ? "Tự nhập" : "Tự động"}
                                    />
                                    {!isView && (
                                        <button
                                            type="button"
                                            onClick={() => setManualSlug((v) => !v)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-primary hover:bg-primary/10"
                                            title={manualSlug ? "Chuyển sang Tự động" : "Chuyển sang Tự nhập"}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                                {manualSlug ? "link_off" : "link"}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    {t.fieldDesc} <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none ${errors.desc ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                                    rows="2"
                                    value={form.desc}
                                    onChange={(e) => setForm({ ...form, desc: e.target.value })}
                                    readOnly={isView}
                                    placeholder="Nhập mô tả"
                                />
                            </div>
                        </>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            {t.fieldIcon} <span className="text-red-500">*</span>
                        </label>
                        {isView ? (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600">
                                    <span className="material-symbols-outlined text-[20px]">{form.icon}</span>
                                </div>
                            </div>
                        ) : (
                            <div className={`grid grid-cols-10 gap-2 max-h-40 overflow-auto border rounded-lg p-2 ${errors.icon ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}>
                                {ICONS.map((icon) => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setForm({ ...form, icon })}
                                        className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${form.icon === icon
                                            ? "bg-primary/10 text-primary"
                                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">{icon}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                {t.fieldParent}
                            </label>
                            <select
                                className="pl-3 pr-7 py-2.5 w-full border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none cursor-pointer truncate"
                                value={form.parent}
                                onChange={(e) => setForm({ ...form, parent: e.target.value })}
                                disabled={isView}
                            >
                                <option value="">{t.noParent}</option>
                                {parents.map((p) => (
                                    <option key={p._id} value={p._id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                {t.fieldStatus} <span className="text-red-500">*</span>
                            </label>
                            {isView ? (
                                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700"
                                    style={{
                                        backgroundColor:
                                            form.status === "active" ? "rgb(236 253 245)" :
                                            form.status === "hidden" ? "rgb(248 250 252)" :
                                            form.status === "draft" ? "rgb(254 249 195)" :
                                            "rgb(241 245 249)",
                                        color:
                                            form.status === "active" ? "rgb(4 120 87)" :
                                            form.status === "hidden" ? "rgb(100 116 139)" :
                                            form.status === "draft" ? "rgb(133 77 14)" :
                                            "rgb(71 85 105)"
                                    }}
                                >
                                    {form.status === "active" ? t.statusActive :
                                     form.status === "hidden" ? t.statusHidden :
                                     form.status === "draft" ? t.statusDraft :
                                     (t.statusArchived || "Đã lưu trữ")}
                                </div>
                            ) : (
                                <select
                                    className={`pl-3 pr-7 py-2.5 w-full border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none cursor-pointer truncate ${errors.status ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    disabled={isView}
                                >
                                    <option value="active">{t.statusActive}</option>
                                    <option value="hidden">{t.statusHidden}</option>
                                    <option value="draft">{t.statusDraft}</option>
                                    <option value="archived">{t.statusArchived || "Đã lưu trữ"}</option>
                                </select>
                            )}
                        </div>
                    </div>
                    {isView && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    {t.fieldCreatedAt}
                                </label>
                                <p className="text-sm text-slate-700">{formatDateTime(form.createdAt)}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    {t.fieldUpdatedAt}
                                </label>
                                <p className="text-sm text-slate-700">{formatUpdatedAt(form.createdAt, form.updatedAt)}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className={`px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors ${isView ? "flex-1" : "flex-1"}`}
                    >
                        {t.cancel}
                    </button>
                    {!isView && (
                        <button
                            onClick={handleSubmit}
                            className="flex-1 px-4 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                            {t.save}
                        </button>
                    )}
                </div>
            </div>
        </div >
    );
}
