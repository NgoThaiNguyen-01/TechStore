const HEX_3_REGEX = /^[0-9a-f]{3}$/i;
const HEX_6_REGEX = /^[0-9a-f]{6}$/i;

const normalizeColorName = (value) => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();

const clampChannel = (value) => Math.max(0, Math.min(255, value));

const bucketChannel = (value, step = 32) => clampChannel(Math.floor(value / step) * step);

const parseHexColor = (hex) => {
    const normalized = String(hex || "").trim().toLowerCase();
    if (!normalized.startsWith("#") || normalized.length !== 7) return null;
    return {
        r: Number.parseInt(normalized.slice(1, 3), 16),
        g: Number.parseInt(normalized.slice(3, 5), 16),
        b: Number.parseInt(normalized.slice(5, 7), 16),
    };
};

export const normalizeHexColor = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return "";
    const color = raw.startsWith("#") ? raw.slice(1) : raw;
    if (HEX_3_REGEX.test(color)) {
        return `#${color
            .split("")
            .map((char) => `${char}${char}`)
            .join("")}`;
    }
    if (HEX_6_REGEX.test(color)) {
        return `#${color}`;
    }
    return "";
};

export const getColorFilterGroupKey = (color) => {
    const hex = normalizeHexColor(typeof color === "string" ? color : color?.hex);
    if (!hex) return "";

    const rgb = parseHexColor(hex);
    if (!rgb) {
        const name = normalizeColorName(typeof color === "object" ? color?.name : "");
        return name ? `name:${name}` : `hex:${hex}`;
    }

    const spread = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
    if (spread <= 24) {
        const tone = bucketChannel(Math.round((rgb.r + rgb.g + rgb.b) / 3));
        return `neutral:${tone}`;
    }

    return `rgb:${bucketChannel(rgb.r)}-${bucketChannel(rgb.g)}-${bucketChannel(rgb.b)}`;
};

export const collectColorFilterOptions = (products) => {
    const groups = new Map();

    (products || []).forEach((product) => {
        (product?.colors || []).forEach((color) => {
            const hex = normalizeHexColor(color?.hex);
            if (!hex) return;

            const key = getColorFilterGroupKey(color);
            if (!key) return;

            const name = String(color?.name || "").trim();
            const existing = groups.get(key);

            if (existing) {
                existing.hexes.add(hex);
                if (!existing.name && name) existing.name = name;
                return;
            }

            groups.set(key, {
                key,
                hex,
                name,
                hexes: new Set([hex]),
            });
        });
    });

    return Array.from(groups.values())
        .map((group) => ({
            key: group.key,
            hex: group.hex,
            name: group.name,
            hexes: Array.from(group.hexes),
        }))
        .sort((a, b) => (a.name || a.hex).localeCompare(b.name || b.hex));
};

export const productMatchesColorFilter = (product, selectedColorKeys) => {
    if (!Array.isArray(selectedColorKeys) || selectedColorKeys.length === 0) return true;
    const selected = new Set(selectedColorKeys.map(String));
    return (product?.colors || []).some((color) => {
        const key = getColorFilterGroupKey(color);
        return key && selected.has(key);
    });
};
