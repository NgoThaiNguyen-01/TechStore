import React from "react";

const FOOTER_T = {
    vi: {
        footerTagline: "Điểm đến của những người đam mê công nghệ. Cung cấp các thiết bị mới nhất, tư vấn chuyên nghiệp và dịch vụ đẳng cấp từ năm 2012.",
        newsletter: "Bản tin",
        emailPlaceholder: "Địa chỉ email",
        footerShop: "Mua sắm",
        shopLinks: ["Điện thoại thông minh", "Laptop & PC", "Đồ chơi Gaming", "Âm thanh & Nhạc", "Nhà thông minh"],
        footerSupport: "Hỗ trợ",
        supportLinks: ["Theo dõi đơn hàng", "Bảo hành & Sửa chữa", "Trả hàng & Hoàn tiền", "Thông tin vận chuyển", "Liên hệ"],
        contactInfo: "Thông tin liên hệ",
        footerCopy: "© 2024 TechStore. Được xây dựng vì hiệu suất. Bảo lưu mọi quyền.",
    },
    en: {
        footerTagline: "The destination for tech enthusiasts. Providing the latest gadgets, professional advice, and world-class service since 2012.",
        newsletter: "Newsletter",
        emailPlaceholder: "Email address",
        footerShop: "Shop",
        shopLinks: ["Smartphones", "Laptops & PCs", "Gaming Gear", "Audio & Music", "Smart Home"],
        footerSupport: "Support",
        supportLinks: ["Order Tracking", "Warranty & Repairs", "Returns & Refunds", "Shipping Info", "Contact Us"],
        contactInfo: "Contact Info",
        footerCopy: "© 2024 TechStore. Built for performance. All rights reserved.",
    },
};

export default function Footer({ lang, setLang }) {
    const t = FOOTER_T[lang] || FOOTER_T.vi;

    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-20 pb-10 font-display">
            <div className="max-w-[1440px] mx-auto px-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-16">

                    {/* Branding & Newsletter */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary p-1 rounded text-white">
                                <span className="material-symbols-outlined">bolt</span>
                            </div>
                            <h2 className="text-2xl font-black text-primary">TechStore</h2>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed">{t.footerTagline}</p>
                        <div className="space-y-4">
                            <p className="font-bold text-slate-900 dark:text-slate-100">{t.newsletter}</p>
                            <div className="flex gap-2">
                                <input className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm px-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none text-slate-900 dark:text-slate-100" placeholder={t.emailPlaceholder} type="email" />
                                <button className="bg-primary text-white p-2.5 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Shop Links */}
                    <div>
                        <h4 className="font-bold mb-6 text-slate-900 dark:text-slate-100">{t.footerShop}</h4>
                        <ul className="space-y-4 text-sm text-slate-500">
                            {t.shopLinks.map((link) => (
                                <li key={link}><a className="hover:text-primary transition-colors" href="#">{link}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h4 className="font-bold mb-6 text-slate-900 dark:text-slate-100">{t.footerSupport}</h4>
                        <ul className="space-y-4 text-sm text-slate-500">
                            {t.supportLinks.map((link) => (
                                <li key={link}><a className="hover:text-primary transition-colors" href="#">{link}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">{t.contactInfo}</h4>
                        <ul className="space-y-4 text-sm text-slate-500">
                            <li className="flex gap-3">
                                <span className="material-symbols-outlined text-primary">location_on</span>
                                <span>123 Tech Avenue, Silicon Valley, CA 94025</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="material-symbols-outlined text-primary">call</span>
                                <span>+1 (555) 000-TECH</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="material-symbols-outlined text-primary">mail</span>
                                <span>support@techstore.com</span>
                            </li>
                        </ul>
                        <div className="flex gap-4 pt-4">
                            <a className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white text-slate-500 transition-all" href="#" aria-label="Twitter">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                </svg>
                            </a>
                            <a className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white text-slate-500 transition-all" href="#" aria-label="Instagram">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs text-slate-500">{t.footerCopy}</p>

                    {/* ── Language Toggle ── */}
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-400 text-lg">language</span>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button
                                onClick={() => setLang("vi")}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${lang === "vi"
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    }`}
                            >
                                <img src="https://flagcdn.com/w20/vn.png" alt="VN" className="w-4 h-3 object-cover rounded-sm" />
                                VI
                            </button>
                            <button
                                onClick={() => setLang("en")}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${lang === "en"
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    }`}
                            >
                                <img src="https://flagcdn.com/w20/gb.png" alt="GB" className="w-4 h-3 object-cover rounded-sm" />
                                EN
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
