const SHIPPING_ZONE_META = {
    local_hcm: {
        vi: "Nội thành TP.HCM",
        en: "Ho Chi Minh City",
    },
    south: {
        vi: "Miền Nam",
        en: "Southern region",
    },
    central: {
        vi: "Miền Trung",
        en: "Central region",
    },
    north: {
        vi: "Miền Bắc",
        en: "Northern region",
    },
    remote: {
        vi: "Vùng xa",
        en: "Remote area",
    },
};

const formatCurrency = (value) => {
    if (!Number.isFinite(Number(value))) return String(value || "");
    try {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(Number(value));
    } catch {
        return String(value || "");
    }
};

export const getShippingZoneLabel = (zone, lang = "vi") =>
    SHIPPING_ZONE_META[zone]?.[lang] || zone || "-";

export const formatShippingEta = (minDays, maxDays, lang = "vi") => {
    const min = Number(minDays);
    const max = Number(maxDays);
    if (!Number.isFinite(min) && !Number.isFinite(max)) return "";

    const safeMin = Number.isFinite(min) ? min : max;
    const safeMax = Number.isFinite(max) ? max : min;

    if (safeMin === 0 && safeMax <= 1) {
        return lang === "vi" ? "Trong ngày hoặc ngày mai" : "Same day or next day";
    }

    if (safeMin === safeMax) {
        return lang === "vi"
            ? `${safeMin} ngày`
            : `${safeMin} day${safeMin > 1 ? "s" : ""}`;
    }

    return lang === "vi"
        ? `${safeMin}-${safeMax} ngày`
        : `${safeMin}-${safeMax} days`;
};

const TIMELINE_LABEL_MAP = {
    carrier: { vi: "Đơn vị vận chuyển", en: "Carrier" },
    service: { vi: "Dịch vụ", en: "Service" },
    tracking: { vi: "Mã vận đơn", en: "Tracking" },
    link: { vi: "Liên kết", en: "Link" },
    zone: { vi: "Khu vực", en: "Zone" },
    eta: { vi: "Dự kiến giao", en: "Estimated delivery" },
    fee: { vi: "Phí vận chuyển", en: "Shipping fee" },
    points: { vi: "Điểm thưởng", en: "Points" },
    tier: { vi: "Hạng thành viên", en: "Tier" },
};

export const formatOrderTimelineNote = (note, lang = "vi") => {
    if (!note) return "";

    return String(note)
        .split("|")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            const [rawKey, ...rest] = part.split(":");
            const key = String(rawKey || "").trim().toLowerCase();
            const value = rest.join(":").trim();
            if (!key || !value) return part;

            const label = TIMELINE_LABEL_MAP[key]?.[lang];
            if (!label) return part;

            if (key === "zone") {
                return `${label}: ${getShippingZoneLabel(value, lang)}`;
            }

            if (key === "eta") {
                const [minDays, maxDays] = value.split("-").map((entry) => Number(entry));
                return `${label}: ${formatShippingEta(minDays, maxDays, lang)}`;
            }

            if (key === "fee") {
                return `${label}: ${formatCurrency(Number(value))}`;
            }

            return `${label}: ${value}`;
        })
        .join(" | ");
};
