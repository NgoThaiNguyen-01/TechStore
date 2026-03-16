import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

function slugify(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

/* Format number with dot separators: 1000000 → 1.000.000 */
function formatPrice(value) {
    if (!value && value !== 0) return "";
    return Number(value).toLocaleString("vi-VN");
}

/* Parse formatted price back to number: 1.000.000 → 1000000 */
function parsePrice(str) {
    if (!str) return "";
    const cleaned = str.replace(/\./g, "").replace(/[^0-9]/g, "");
    return cleaned === "" ? "" : cleaned;
}

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("vi-VN");
}

const HEX_REGEX = /^#([0-9A-Fa-f]{6})$/;

const COLOR_SUGGESTIONS = {
    vang: "#FACC15",
    den: "#111827",
    trang: "#FFFFFF",
    do: "#EF4444",
    "xanh-duong": "#3B82F6",
    "xanh-la": "#22C55E",
};

const normalizeColorKey = (value) => slugify(value || "");

const getSuggestedHex = (name) => {
    const key = normalizeColorKey(name);
    return COLOR_SUGGESTIONS[key] || "";
};

const EMPTY_FORM = {
    name: "",
    brand: "",
    slug: "",
    category: "",
    price: "",
    discountPercent: "",
    stock: "",
    shortDesc: "",
    description: "",
    status: "draft",
    seoTitle: "",
    seoDesc: "",
    images: [],
    specs: [],
    colors: [],
    createdAt: null,
    updatedAt: null,
};

export default function ProductModal({
    mode = "add",
    initialData = null,
    categories = [],
    brands = [],
    onClose,
    onSave,
    t,
}) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [slugLocked, setSlugLocked] = useState(false);
    const [previewImages, setPreviewImages] = useState([]);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState("basic");
    const [imageUrlInput, setImageUrlInput] = useState("");
    const [showUrlInput, setShowUrlInput] = useState(false);
    const fileRef = useRef();

    const isView = mode === "view";

    useEffect(() => {
        if (initialData) {
            const dp = initialData.salePrice && initialData.price
                ? Math.round((1 - initialData.salePrice / initialData.price) * 100)
                : "";
            setForm({
                name: initialData.name || "",
                brand: initialData.brand?._id || initialData.brand || "",
                slug: initialData.slug || "",
                category: initialData.category?._id || initialData.category || "",
                price: initialData.price ?? "",
                discountPercent: dp,
                stock: initialData.stock ?? "",
                shortDesc: initialData.shortDesc || "",
                description: initialData.description || "",
                status: initialData.status || "draft",
                seoTitle: initialData.seoTitle || "",
                seoDesc: initialData.seoDesc || "",
                images: initialData.images || [],
                specs: initialData.specs || [],
                colors: initialData.colors || [],
                createdAt: initialData.createdAt || null,
                updatedAt: initialData.updatedAt || null,
            });
            setPreviewImages(initialData.images || []);
            setActiveImageIndex(0);
            setSlugLocked(true);
        }
    }, [initialData]);

    const handleChange = (field, value) => {
        setForm((prev) => {
            const next = { ...prev, [field]: value };
            if (field === "name" && !slugLocked) {
                next.slug = slugify(value);
            }
            if (field === "stock") {
                const numeric = value === "" ? "" : Number(value);
                if (numeric === 0) {
                    next.status = "out_of_stock";
                }
            }
            return next;
        });
        if (field === "stock") {
            const numeric = value === "" ? null : Number(value);
            if (numeric === null) {
                setErrors((e) => ({ ...e, stock: null }));
            } else if (Number.isNaN(numeric) || numeric < 0) {
                setErrors((e) => ({ ...e, stock: t.stockInvalid }));
            } else {
                setErrors((e) => ({ ...e, stock: null }));
            }
        } else if (errors[field]) {
            setErrors((e) => ({ ...e, [field]: null }));
        }
    };

    /* ── Image Handling ── */
    const handleImageAdd = (e) => {
        const files = Array.from(e.target.files);
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setPreviewImages((prev) => {
                    const next = [...prev, ev.target.result];
                    if (next.length === 1) setActiveImageIndex(0);
                    return next;
                });
                setForm((prev) => ({ ...prev, images: [...prev.images, ev.target.result] }));
                if (errors.images) setErrors((e) => ({ ...e, images: null }));
            };
            reader.readAsDataURL(file);
        });
    };

    const handleAddImageUrl = () => {
        const url = imageUrlInput.trim();
        if (!url) return;
        setPreviewImages((prev) => {
            const next = [...prev, url];
            if (next.length === 1) setActiveImageIndex(0);
            return next;
        });
        setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
        if (errors.images) setErrors((e) => ({ ...e, images: null }));
        setImageUrlInput("");
        setShowUrlInput(false);
    };

    const removeImage = (idx) => {
        setPreviewImages((prev) => {
            const next = prev.filter((_, i) => i !== idx);
            if (next.length === 0) {
                setActiveImageIndex(0);
            } else if (idx === activeImageIndex) {
                setActiveImageIndex(Math.max(0, idx - 1));
            } else if (idx < activeImageIndex) {
                setActiveImageIndex((current) => Math.max(0, current - 1));
            }
            return next;
        });
        setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
    };

    /* ── Specs Handling ── */
    const addSpec = () => {
        setForm((prev) => ({ ...prev, specs: [...prev.specs, { key: "", value: "" }] }));
    };
    const updateSpec = (idx, field, value) => {
        setForm((prev) => ({
            ...prev,
            specs: prev.specs.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
        }));
    };
    const removeSpec = (idx) => {
        setForm((prev) => ({ ...prev, specs: prev.specs.filter((_, i) => i !== idx) }));
    };

    /* ── Colors Handling ── */
    const addColor = () => {
        setForm((prev) => ({ ...prev, colors: [...prev.colors, { name: "", hex: "" }] }));
    };
    const updateColor = (idx, field, value) => {
        setForm((prev) => ({
            ...prev,
            colors: prev.colors.map((c, i) => {
                if (i !== idx) return c;
                const next = { ...c, [field]: value };
                if (field === "name") {
                    const suggested = getSuggestedHex(value);
                    if (!c.hex || !c.hex.trim()) {
                        if (suggested) next.hex = suggested;
                    }
                }
                return next;
            }),
        }));
    };
    const removeColor = (idx) => {
        if (!window.confirm(t.colorRemoveConfirm)) return;
        setForm((prev) => ({ ...prev, colors: prev.colors.filter((_, i) => i !== idx) }));
    };

    /* ── Calculated sale price ── */
    const calcSalePrice = () => {
        const price = Number(form.price);
        const disc = Number(form.discountPercent);
        if (!price || !disc || disc <= 0 || disc > 100) return null;
        return Math.round(price * (1 - disc / 100));
    };

    const getColorValidation = (colors) => {
        const errors = colors.map(() => ({ name: "", hex: "" }));

        colors.forEach((color, idx) => {
            const name = color.name.trim();
            const hex = color.hex.trim();

            if (!name) errors[idx].name = t.colorNameRequired;
            if (!hex) errors[idx].hex = t.colorHexRequired;
            else if (!HEX_REGEX.test(hex)) errors[idx].hex = t.colorHexInvalid;
        });

        const nameBuckets = new Map();
        colors.forEach((color, idx) => {
            const key = color.name.trim().toLowerCase();
            if (!key) return;
            if (!nameBuckets.has(key)) nameBuckets.set(key, []);
            nameBuckets.get(key).push(idx);
        });
        nameBuckets.forEach((indexes) => {
            if (indexes.length > 1) {
                indexes.forEach((idx) => {
                    errors[idx].name = t.colorNameDuplicate;
                });
            }
        });

        const hexBuckets = new Map();
        colors.forEach((color, idx) => {
            const hex = color.hex.trim();
            if (!hex || !HEX_REGEX.test(hex)) return;
            const key = hex.toLowerCase();
            if (!hexBuckets.has(key)) hexBuckets.set(key, []);
            hexBuckets.get(key).push(idx);
        });
        hexBuckets.forEach((indexes) => {
            if (indexes.length > 1) {
                indexes.forEach((idx) => {
                    errors[idx].hex = t.colorHexDuplicate;
                });
            }
        });

        return {
            errors,
            hasErrors: errors.some((e) => e.name || e.hex),
        };
    };

    const colorValidation = isView
        ? { errors: [], hasErrors: false }
        : getColorValidation(form.colors);

    const stockNumber = form.stock === "" ? null : Number(form.stock);
    const stockInvalid = stockNumber !== null && Number.isNaN(stockNumber)
        ? true
        : stockNumber !== null && stockNumber < 0;
    const hasRequiredMissing = !form.name.trim()
        || !form.brand.trim()
        || form.price === ""
        || !form.category
        || form.stock === ""
        || !form.shortDesc.trim()
        || !form.description.trim()
        || form.images.length === 0
        || stockInvalid;

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = t.required;
        if (!form.brand.trim()) errs.brand = t.required;
        if (!form.price && form.price !== 0) errs.price = t.required;
        if (!form.category) errs.category = t.required;
        if (form.stock === "") errs.stock = t.required;
        if (stockInvalid) errs.stock = t.stockInvalid;
        if (!form.shortDesc.trim()) errs.shortDesc = t.required;
        if (!form.description.trim()) errs.description = t.required;
        if (form.images.length === 0) errs.images = t.required;
        setErrors(errs);
        const missingFields = [];
        if (!form.name.trim()) missingFields.push(t.fieldName);
        if (!form.brand.trim()) missingFields.push(t.fieldBrand);
        if (!form.price && form.price !== 0) missingFields.push(t.fieldPrice);
        if (!form.category) missingFields.push(t.fieldCategory);
        if (form.stock === "") missingFields.push(t.fieldStock);
        if (!form.shortDesc.trim()) missingFields.push(t.fieldShortDesc);
        if (!form.description.trim()) missingFields.push(t.fieldDesc);
        if (form.images.length === 0) missingFields.push(t.imageGallery);
        if (stockInvalid) missingFields.push(t.stockInvalid);
        if (colorValidation.hasErrors) missingFields.push(t.colors);
        if (missingFields.length > 0) {
            toast.error(t.requiredFields(missingFields));
        }
        return Object.keys(errs).length === 0 && !colorValidation.hasErrors;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const salePrice = calcSalePrice();
            await onSave({
                ...form,
                price: Number(form.price),
                salePrice: salePrice || undefined,
                stock: form.stock !== "" ? Number(form.stock) : 0,
                specs: form.specs.filter((s) => s.key.trim() || s.value.trim()),
                colors: form.colors
                    .filter((c) => c.name.trim() || c.hex.trim())
                    .map((c) => ({ name: c.name.trim(), hex: c.hex.trim() })),
            });
        } finally {
            setSaving(false);
        }
    };

    const sectionClass = (s) =>
        `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeSection === s
            ? "bg-primary/10 text-primary"
            : "text-slate-500 hover:bg-slate-100"
        }`;

    const inputClass = (field) =>
        `w-full px-3.5 py-2.5 text-sm border rounded-lg transition-all outline-none ${errors[field]
            ? "border-red-400 focus:ring-2 focus:ring-red-300 bg-red-50"
            : "border-slate-200 focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
        }`;

    const brandLabel = (() => {
        if (!form.brand) return "—";
        const matched = brands.find((b) => b._id === form.brand || b.name === form.brand);
        return matched?.name || (typeof form.brand === "string" ? form.brand : "—");
    })();

    const salePrice = calcSalePrice();
    const statusMap = {
        active: { label: t.statusActive, cls: "bg-green-50 text-green-700 border border-green-200" },
        hidden: { label: t.statusHidden, cls: "bg-slate-100 text-slate-600 border border-slate-200" },
        draft: { label: t.statusDraft, cls: "bg-amber-50 text-amber-700 border border-amber-200" },
        archived: { label: t.statusArchived, cls: "bg-slate-200 text-slate-700 border border-slate-200" },
        out_of_stock: { label: t.statusOutOfStock, cls: "bg-red-50 text-red-600 border border-red-200" },
    };
    const statusInfo = statusMap[form.status] || statusMap.draft;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <span className="material-symbols-outlined text-primary text-xl">
                                {isView ? "inventory_2" : mode === "add" ? "add_box" : "edit"}
                            </span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">
                            {mode === "add" ? t.addTitle : mode === "edit" ? t.editTitle : t.viewTitle}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Section nav */}
                {!isView && (
                    <div className="px-6 py-2 border-b border-slate-100 flex gap-1 flex-shrink-0 bg-slate-50">
                        {[["basic", t.secBasic], ["desc", t.secDesc], ["seo", t.secSeo]].map(([s, label]) => (
                            <button key={s} onClick={() => setActiveSection(s)} className={sectionClass(s)}>{label}</button>
                        ))}
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 h-full">
                        {/* ═══ Left: Image Gallery ═══ */}
                        <div className="p-6 border-r border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-slate-400 text-[18px]">photo_library</span>
                                <p className="text-sm font-semibold text-slate-700">
                                    {t.imageGallery} <span className="text-red-500">*</span>
                                </p>
                            </div>

                            {/* Main image */}
                            <div className="w-full aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-white overflow-hidden flex items-center justify-center mb-3 relative group">
                                {previewImages[activeImageIndex] ? (
                                    <>
                                        <img src={previewImages[activeImageIndex]} alt="" className="w-full h-full object-cover" />
                                        {!isView && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button onClick={() => removeImage(activeImageIndex)} className="bg-white text-red-600 rounded-full p-1.5">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-4xl text-slate-300 block">image</span>
                                        <p className="text-xs text-slate-400 mt-1">{t.noImage}</p>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails */}
                            <div className="flex gap-2 flex-wrap">
                                {previewImages.map((img, idx) => (
                                    <div
                                        key={img + idx}
                                        className="relative w-14 h-14 group"
                                    >
                                        {!isView && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                                className="absolute -top-2 -right-2 w-5 h-5 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white z-10"
                                            >
                                                <span className="material-symbols-outlined text-[12px]">close</span>
                                            </button>
                                        )}
                                        <div className={`w-14 h-14 rounded-lg border overflow-hidden bg-white ${activeImageIndex === idx ? "border-primary ring-2 ring-primary/40" : "border-slate-200"}`}>
                                            <button onClick={() => setActiveImageIndex(idx)} className="w-full h-full">
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {!isView && (
                                    <>
                                        {/* Upload file button */}
                                        <button
                                            onClick={() => fileRef.current?.click()}
                                            className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors group"
                                            title={t.uploadFile}
                                        >
                                            <span className="material-symbols-outlined text-[16px] text-slate-300 group-hover:text-primary">upload</span>
                                        </button>
                                        {/* Add from URL button */}
                                        <button
                                            onClick={() => setShowUrlInput(!showUrlInput)}
                                            className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors group"
                                            title={t.addFromUrl}
                                        >
                                            <span className="material-symbols-outlined text-[16px] text-slate-300 group-hover:text-primary">link</span>
                                        </button>
                                        <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageAdd} />
                                    </>
                                )}
                            </div>

                            {/* URL Input */}
                            {!isView && showUrlInput && (
                                <div className="mt-3 flex gap-2">
                                    <input
                                        value={imageUrlInput}
                                        onChange={(e) => setImageUrlInput(e.target.value)}
                                        placeholder={t.imageUrlPlaceholder}
                                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                        onKeyDown={(e) => e.key === "Enter" && handleAddImageUrl()}
                                    />
                                    <button
                                        onClick={handleAddImageUrl}
                                        className="px-3 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        {t.addBtn}
                                    </button>
                                </div>
                            )}

                            {!isView && (
                                <p className="text-xs text-slate-400 mt-2">{t.imageHint}</p>
                            )}
                            {errors.images && <p className="text-xs text-red-500 mt-2">{errors.images}</p>}
                        </div>

                        {/* ═══ Right: Form ═══ */}
                        <div className="p-6 overflow-y-auto">
                            {/* ── BASIC INFO ── */}
                            {(activeSection === "basic" || isView) && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-primary text-[18px]">info</span>
                                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t.secBasic}</h3>
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                            {t.fieldName} <span className="text-red-500">*</span>
                                        </label>
                                        {isView
                                            ? <p className="text-sm font-semibold text-slate-900">{form.name}</p>
                                            : <input value={form.name} onChange={(e) => handleChange("name", e.target.value)} className={inputClass("name")} placeholder={t.namePlaceholder} />
                                        }
                                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                            {t.fieldBrand} <span className="text-red-500">*</span>
                                        </label>
                                        {isView
                                            ? <p className="text-sm text-slate-700">{brandLabel}</p>
                                            : (
                                                <select value={form.brand} onChange={(e) => handleChange("brand", e.target.value)} className={`${inputClass("brand")} pr-9`}>
                                                    <option value="">{t.brandPlaceholder}</option>
                                                    {brands
                                                        ?.filter((b) => b.status === "active" || b._id === form.brand || b.name === form.brand)
                                                        .map((b) => (
                                                            <option key={b._id} value={b._id}>{b.name}</option>
                                                        ))}
                                                </select>
                                            )
                                        }
                                        {errors.brand && <p className="text-xs text-red-500 mt-1">{errors.brand}</p>}
                                    </div>

                                    {/* Slug */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                            {slugLocked ? t.fieldSlugManual : t.fieldSlug}
                                        </label>
                                        {isView
                                            ? <p className="text-xs font-mono text-slate-500">{form.slug}</p>
                                            : (
                                                <div className="relative">
                                                    <input
                                                        value={form.slug}
                                                        onChange={(e) => {
                                                            if (!slugLocked) return;
                                                            handleChange("slug", e.target.value);
                                                        }}
                                                        readOnly={!slugLocked}
                                                        className={`w-full pl-3 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none ${slugLocked ? "text-slate-700 bg-white" : "text-slate-500 bg-slate-50 cursor-not-allowed"}`}
                                                        placeholder={slugLocked ? t.slugPlaceholderManual : t.slugPlaceholder}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            setSlugLocked((prev) => {
                                                                const next = !prev;
                                                                setForm((current) => ({
                                                                    ...current,
                                                                    slug: next ? "" : slugify(current.name || "")
                                                                }));
                                                                return next;
                                                            });
                                                        }}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
                                                        type="button"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">{slugLocked ? "link_off" : "link"}</span>
                                                    </button>
                                                </div>
                                            )
                                        }
                                    </div>

                                    {isView && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.fieldCreatedAt}</label>
                                                <p className="text-sm text-slate-700">{formatDateTime(form.createdAt)}</p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.fieldUpdatedAt}</label>
                                                <p className="text-sm text-slate-700">
                                                    {form.updatedAt && form.createdAt && new Date(form.updatedAt).getTime() !== new Date(form.createdAt).getTime()
                                                        ? formatDateTime(form.updatedAt)
                                                        : "—"}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Category + Stock */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                                {t.fieldCategory} <span className="text-red-500">*</span>
                                            </label>
                                            {isView
                                                ? <p className="text-sm text-slate-700">{categories.find(c => c._id === form.category)?.name || "—"}</p>
                                                : (
                                                    <select value={form.category} onChange={(e) => handleChange("category", e.target.value)} className={`${inputClass("category")} pr-9`}>
                                                        <option value="">{t.selectCategory}</option>
                                                        {categories
                                                            .filter((c) => c.status === "active" || c._id === form.category)
                                                            .map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                                                    </select>
                                                )
                                            }
                                            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                                {t.fieldStock} <span className="text-red-500">*</span>
                                            </label>
                                            {isView
                                                ? <p className="text-sm font-bold text-slate-800">{form.stock}</p>
                                                : <input type="number" min="0" value={form.stock} onChange={(e) => handleChange("stock", e.target.value)} className={inputClass("stock")} placeholder="0" />
                                            }
                                            {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
                                        </div>
                                    </div>

                                    {/* Price + Discount % */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                                {t.fieldPrice} <span className="text-red-500">*</span>
                                            </label>
                                            {isView
                                                ? <p className="text-lg font-black text-slate-900">{form.price ? new Intl.NumberFormat("vi-VN").format(form.price) + "đ" : "—"}</p>
                                                : <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={formatPrice(form.price)}
                                                    onChange={(e) => handleChange("price", parsePrice(e.target.value))}
                                                    className={inputClass("price")}
                                                    placeholder="0"
                                                />
                                            }
                                            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.fieldDiscount}</label>
                                            {isView
                                                ? <p className="text-sm text-red-500 font-semibold">{form.discountPercent ? `${form.discountPercent}%` : t.noDiscount}</p>
                                                : (
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={form.discountPercent}
                                                            onChange={(e) => {
                                                                let val = e.target.value;
                                                                if (val !== "" && Number(val) > 100) val = "100";
                                                                if (val !== "" && Number(val) < 0) val = "0";
                                                                handleChange("discountPercent", val);
                                                            }}
                                                            className={`${inputClass("discountPercent")} pr-10`}
                                                            placeholder="0"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
                                                    </div>
                                                )
                                            }
                                            {/* Show calculated sale price */}
                                            {salePrice !== null && (
                                                <p className="text-xs mt-1.5 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px] text-green-600">sell</span>
                                                    <span className="text-green-700 font-semibold">{t.salePriceResult}: {new Intl.NumberFormat("vi-VN").format(salePrice)}đ</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.fieldStatus}</label>
                                        {isView
                                            ? <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.cls}`}>{statusInfo.label}</span>
                                            : (
                                                <div className="flex gap-2 flex-wrap">
                                                    {[["active", t.statusActive, "text-green-700 bg-green-50 border-green-200"],
                                                    ["hidden", t.statusHidden, "text-slate-600 bg-slate-100 border-slate-200"],
                                                    ["draft", t.statusDraft, "text-amber-700 bg-amber-50 border-amber-200"],
                                                    ["archived", t.statusArchived, "text-slate-700 bg-slate-200 border-slate-200"]
                                                    ].map(([v, label, cls]) => (
                                                        <button
                                                            key={v}
                                                            onClick={() => handleChange("status", v)}
                                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${form.status === v ? cls + " ring-2 ring-offset-1 ring-primary/40" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )
                                        }
                                    </div>
                                </div>
                            )}

                            {/* ── DESCRIPTION + SPECS ── */}
                            {(isView || activeSection === "desc") && (
                                <div className="space-y-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-primary text-[18px]">description</span>
                                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t.secDesc}</h3>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                            {t.fieldShortDesc} <span className="text-red-500">*</span>
                                        </label>
                                        {isView ? (
                                            <p className="text-sm text-slate-700 whitespace-pre-line">{form.shortDesc || t.noShortDesc}</p>
                                        ) : (
                                            <textarea
                                                rows={3}
                                                value={form.shortDesc}
                                                onChange={(e) => handleChange("shortDesc", e.target.value)}
                                                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
                                                placeholder={t.shortDescPlaceholder}
                                                disabled={isView}
                                            />
                                        )}
                                        {errors.shortDesc && <p className="text-xs text-red-500 mt-1">{errors.shortDesc}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                            {t.fieldDesc} <span className="text-red-500">*</span>
                                        </label>
                                        {isView ? (
                                            <p className="text-sm text-slate-700 whitespace-pre-line">{form.description || t.noDesc}</p>
                                        ) : (
                                            <textarea
                                                rows={8}
                                                value={form.description}
                                                onChange={(e) => handleChange("description", e.target.value)}
                                                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
                                                placeholder={t.descPlaceholder}
                                                disabled={isView}
                                            />
                                        )}
                                        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                                    </div>

                                    {/* ── Colors Table ── */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-[18px]">palette</span>
                                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t.colors}</h3>
                                            </div>
                                            {!isView && (
                                                <button
                                                    onClick={addColor}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">add</span>
                                                    {t.addColor}
                                                </button>
                                            )}
                                        </div>

                                        {form.colors.length > 0 ? (
                                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                                {/* Header */}
                                                <div className={`grid ${isView ? "grid-cols-[1fr_140px_70px]" : "grid-cols-[1fr_140px_70px_70px_36px]"} bg-slate-50 border-b border-slate-200`}>
                                                    <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase">{t.colorName}</div>
                                                    <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase">{t.colorHex}</div>
                                                    <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase text-center">{t.colorPreview}</div>
                                                    {!isView && (
                                                        <>
                                                            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase text-center">{t.colorPicker}</div>
                                                            <div></div>
                                                        </>
                                                    )}
                                                </div>
                                                {/* Rows */}
                                                {form.colors.map((color, idx) => {
                                                    const rowErrors = colorValidation.errors[idx] || {};
                                                    const isHexValid = HEX_REGEX.test(color.hex.trim());
                                                    return (
                                                        <div key={idx} className={`grid ${isView ? "grid-cols-[1fr_140px_70px]" : "grid-cols-[1fr_140px_70px_70px_36px]"} border-b border-slate-100 last:border-b-0 group hover:bg-slate-50/50`}>
                                                            <div className="px-2 py-1">
                                                                {isView ? (
                                                                    <p className="px-2 py-1.5 text-sm text-slate-700">{color.name}</p>
                                                                ) : (
                                                                    <div>
                                                                        <input
                                                                            value={color.name}
                                                                            onChange={(e) => updateColor(idx, "name", e.target.value)}
                                                                            className="w-full px-2 py-1.5 text-sm border border-transparent rounded-md bg-transparent focus:ring-0 outline-none placeholder:text-slate-300"
                                                                            placeholder="VD: Đen nhám"
                                                                        />
                                                                        {rowErrors.name && (
                                                                            <p className="text-[11px] text-red-500 mt-1">{rowErrors.name}</p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="px-2 py-1 border-l border-slate-100">
                                                                {isView ? (
                                                                    <p className="px-2 py-1.5 text-sm text-slate-700">{color.hex}</p>
                                                                ) : (
                                                                    <div>
                                                                        <input
                                                                            value={color.hex}
                                                                            onChange={(e) => updateColor(idx, "hex", e.target.value)}
                                                                            className="w-full px-2 py-1.5 text-sm border border-transparent rounded-md bg-transparent focus:ring-0 outline-none placeholder:text-slate-300"
                                                                            placeholder="#FACC15"
                                                                        />
                                                                        {rowErrors.hex && (
                                                                            <p className="text-[11px] text-red-500 mt-1">{rowErrors.hex}</p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center justify-center border-l border-slate-100">
                                                                <div
                                                                    className="w-7 h-7 rounded border border-slate-200 shadow-sm"
                                                                    style={{ backgroundColor: isHexValid ? color.hex : "#FFFFFF" }}
                                                                    title={color.hex}
                                                                />
                                                            </div>
                                                            {!isView && (
                                                                <>
                                                                    <div className="flex items-center justify-center border-l border-slate-100">
                                                                        <div className="relative w-8 h-8">
                                                                            <button
                                                                                type="button"
                                                                                className="w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-500 hover:text-primary hover:border-primary/40 flex items-center justify-center"
                                                                            >
                                                                                <span className="material-symbols-outlined text-[16px]">palette</span>
                                                                            </button>
                                                                            <input
                                                                                type="color"
                                                                                value={isHexValid ? color.hex : "#000000"}
                                                                                onChange={(e) => updateColor(idx, "hex", e.target.value)}
                                                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center justify-center border-l border-slate-100">
                                                                        <button
                                                                            onClick={() => removeColor(idx)}
                                                                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                            title={t.colorRemove}
                                                                        >
                                                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
                                                <span className="material-symbols-outlined text-3xl text-slate-300 block mb-1">palette</span>
                                                <p className="text-xs text-slate-400">{t.noColors}</p>
                                                {!isView && (
                                                    <button onClick={addColor} className="mt-2 text-xs font-semibold text-primary hover:underline">
                                                        + {t.addColor}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Technical Specs Table ── */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-[18px]">settings</span>
                                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t.techSpecs}</h3>
                                            </div>
                                            {!isView && (
                                                <button
                                                    onClick={addSpec}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">add</span>
                                                    {t.addSpec}
                                                </button>
                                            )}
                                        </div>

                                        {form.specs.length > 0 ? (
                                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                                {/* Header */}
                                                <div className={`grid ${isView ? "grid-cols-[1fr_1fr]" : "grid-cols-[1fr_1fr_36px]"} bg-slate-50 border-b border-slate-200`}>
                                                    <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase">{t.specName}</div>
                                                    <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase">{t.specValue}</div>
                                                    {!isView && <div></div>}
                                                </div>
                                                {/* Rows */}
                                                {form.specs.map((spec, idx) => (
                                                    <div key={idx} className={`grid ${isView ? "grid-cols-[1fr_1fr]" : "grid-cols-[1fr_1fr_36px]"} border-b border-slate-100 last:border-b-0 group hover:bg-slate-50/50`}>
                                                        <div className="px-1 py-1">
                                                            {isView
                                                                ? <p className="px-2 py-1.5 text-sm text-slate-700">{spec.key}</p>
                                                                : <input
                                                                    value={spec.key}
                                                                    onChange={(e) => updateSpec(idx, "key", e.target.value)}
                                                                    className="w-full px-2 py-1.5 text-sm border-0 bg-transparent focus:ring-0 outline-none placeholder:text-slate-300"
                                                                    placeholder={t.specNamePlaceholder}
                                                                />
                                                            }
                                                        </div>
                                                        <div className="px-1 py-1 border-l border-slate-100">
                                                            {isView
                                                                ? <p className="px-2 py-1.5 text-sm text-slate-900 font-medium">{spec.value}</p>
                                                                : <input
                                                                    value={spec.value}
                                                                    onChange={(e) => updateSpec(idx, "value", e.target.value)}
                                                                    className="w-full px-2 py-1.5 text-sm border-0 bg-transparent focus:ring-0 outline-none placeholder:text-slate-300"
                                                                    placeholder={t.specValuePlaceholder}
                                                                />
                                                            }
                                                        </div>
                                                        {!isView && (
                                                            <div className="flex items-center justify-center">
                                                                <button
                                                                    onClick={() => removeSpec(idx)}
                                                                    className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                    title={t.removeSpec}
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
                                                <span className="material-symbols-outlined text-3xl text-slate-300 block mb-1">list_alt</span>
                                                <p className="text-xs text-slate-400">{t.noSpecs}</p>
                                                {!isView && (
                                                    <button onClick={addSpec} className="mt-2 text-xs font-semibold text-primary hover:underline">
                                                        + {t.addSpec}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {isView && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-primary text-[18px]">travel_explore</span>
                                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t.secSeo}</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 mb-1.5">{t.fieldSeoTitle}</p>
                                                    <p className="text-sm text-slate-700 whitespace-pre-line">{form.seoTitle || t.noData}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 mb-1.5">{t.fieldSeoDesc}</p>
                                                    <p className="text-sm text-slate-700 whitespace-pre-line">{form.seoDesc || t.noData}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── SEO ── */}
                            {activeSection === "seo" && !isView && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-primary text-[18px]">travel_explore</span>
                                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t.secSeo}</h3>
                                    </div>
                                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700 flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">info</span>
                                        <span>{t.seoHint}</span>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.fieldSeoTitle}</label>
                                        <input value={form.seoTitle} onChange={(e) => handleChange("seoTitle", e.target.value)} className={inputClass("seoTitle")} placeholder={form.name || t.seoTitlePlaceholder} />
                                        <p className="text-xs text-slate-400 mt-1">{form.seoTitle.length}/60</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.fieldSeoDesc}</label>
                                        <textarea
                                            rows={4}
                                            value={form.seoDesc}
                                            onChange={(e) => handleChange("seoDesc", e.target.value)}
                                            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
                                            placeholder={t.seoDescPlaceholder}
                                        />
                                        <p className="text-xs text-slate-400 mt-1">{form.seoDesc.length}/160</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                    {isView ? (
                        <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                            {t.close}
                        </button>
                    ) : (
                        <>
                            <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                {t.cancel}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving || hasRequiredMissing || colorValidation.hasErrors}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-blue-700 rounded-lg transition-colors shadow-sm shadow-primary/20 flex items-center gap-2 disabled:opacity-60"
                            >
                                <span className="material-symbols-outlined text-[18px]">{saving ? "hourglass_empty" : "save"}</span>
                                {saving ? t.saving : t.save}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
