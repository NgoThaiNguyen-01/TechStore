import { useState, useEffect, useRef } from "react";
import "./legal.css";

const T = {
    vi: {
        back: "Quay lại",
        home: "Trang chủ",
        pageTitle: "Điều khoản dịch vụ",
        lastUpdated: "Cập nhật lần cuối: 01/03/2026",
        toc: "Mục lục",
        footer: "© 2024 TechStore Inc. — Bảo lưu mọi quyền.",
        contactTitle: "Nếu bạn có câu hỏi hoặc thắc mắc về Điều khoản Dịch vụ, vui lòng liên hệ với chúng tôi:",
        contactEmail: "Email hỗ trợ",
        contactHotline: "Hotline",
        contactAddress: "Địa chỉ",
        contactHours: "Giờ làm việc",
        contactAddressVal: "123 Tech Avenue, TP. Hồ Chí Minh",
        contactHoursVal: "T2–T7: 8:00 – 18:00",
        sections: [
            { id: "s1", title: "Giới thiệu" },
            { id: "s2", title: "Điều kiện sử dụng" },
            { id: "s3", title: "Tài khoản người dùng" },
            { id: "s4", title: "Thanh toán & Đơn hàng" },
            { id: "s5", title: "Hoàn tiền & Trả hàng" },
            { id: "s6", title: "Quyền sở hữu trí tuệ" },
            { id: "s7", title: "Giới hạn trách nhiệm" },
            { id: "s8", title: "Thay đổi điều khoản" },
            { id: "s9", title: "Liên hệ" },
        ],
    },
    en: {
        back: "Back",
        home: "Home",
        pageTitle: "Terms of Service",
        lastUpdated: "Last updated: 03/01/2026",
        toc: "Table of Contents",
        footer: "© 2024 TechStore Inc. — All rights reserved.",
        contactTitle: "If you have any questions or concerns about these Terms of Service, please contact us:",
        contactEmail: "Support Email",
        contactHotline: "Hotline",
        contactAddress: "Address",
        contactHours: "Business Hours",
        contactAddressVal: "123 Tech Avenue, Ho Chi Minh City",
        contactHoursVal: "Mon–Sat: 8:00 AM – 6:00 PM",
        sections: [
            { id: "s1", title: "Introduction" },
            { id: "s2", title: "Conditions of Use" },
            { id: "s3", title: "User Accounts" },
            { id: "s4", title: "Payment & Orders" },
            { id: "s5", title: "Refunds & Returns" },
            { id: "s6", title: "Intellectual Property" },
            { id: "s7", title: "Limitation of Liability" },
            { id: "s8", title: "Changes to Terms" },
            { id: "s9", title: "Contact" },
        ],
    },
};

export default function Terms({ onNavigateRegister, onNavigateHome, lang, setLang }) {
    const t = T[lang];
    const [activeId, setActiveId] = useState("s1");
    const observerRef = useRef(null);

    useEffect(() => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActiveId(entry.target.id);
                });
            },
            { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
        );
        t.sections.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observerRef.current.observe(el);
        });
        return () => observerRef.current?.disconnect();
    }, [lang, t.sections]);

    const scrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen font-display text-slate-900 dark:text-slate-100">

            {/* ── Top Bar ── */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-6xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onNavigateRegister} className="flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                            <span className="material-symbols-outlined text-xl">arrow_back</span>
                            {t.back}
                        </button>
                        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <button onClick={onNavigateHome} className="flex items-center gap-2 group">
                            <div className="bg-primary p-1.5 rounded-lg text-white group-hover:bg-blue-700 transition-colors">
                                <span className="material-symbols-outlined text-xl">bolt</span>
                            </div>
                            <span className="text-lg font-black text-primary">TechStore</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-lg">language</span>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
                            <button
                                onClick={() => setLang("vi")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === "vi" ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                            >
                                <img src="https://flagcdn.com/w20/vn.png" alt="VN" className="w-4 h-3 object-cover rounded-sm" />
                                VI
                            </button>
                            <button
                                onClick={() => setLang("en")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === "en" ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                            >
                                <img src="https://flagcdn.com/w20/gb.png" alt="GB" className="w-4 h-3 object-cover rounded-sm" />
                                EN
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Hero ── */}
            <div className="bg-primary/5 dark:bg-primary/10 border-b border-slate-200 dark:border-slate-800 py-14 px-4">
                <div className="max-w-6xl mx-auto">
                    <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                        <button onClick={onNavigateHome} className="hover:text-primary transition-colors">{t.home}</button>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span className="text-slate-900 dark:text-white font-semibold">{t.pageTitle}</span>
                    </nav>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <span className="material-symbols-outlined text-primary text-3xl">gavel</span>
                        </div>
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-black mb-2">{t.pageTitle}</h1>
                            <p className="text-slate-500 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">calendar_today</span>
                                {t.lastUpdated}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="max-w-6xl mx-auto px-4 lg:px-8 py-12">
                <div className="flex gap-12">

                    {/* Sticky TOC */}
                    <aside className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-24 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 px-3">{t.toc}</p>
                            <nav className="space-y-1">
                                {t.sections.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => scrollTo(s.id)}
                                        className={`toc-item w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeId === s.id ? "active text-primary bg-primary/5" : "text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                            }`}
                                    >
                                        {s.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 max-w-3xl legal-prose space-y-12">

                        {lang === "vi" ? (
                            <>
                                <Section id="s1" title={`1. ${t.sections[0].title}`}>
                                    <p>Chào mừng bạn đến với <strong>TechStore</strong> — nền tảng mua bán sản phẩm công nghệ hàng đầu Việt Nam. Bằng việc truy cập hoặc sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện được nêu dưới đây.</p>
                                    <p>Các điều khoản này áp dụng cho tất cả người dùng, bao gồm khách truy cập, người dùng đã đăng ký, và người mua hàng trên toàn bộ hệ thống của TechStore.</p>
                                </Section>
                                <Section id="s2" title={`2. ${t.sections[1].title}`}>
                                    <p>Để sử dụng dịch vụ của TechStore, bạn phải đáp ứng các điều kiện sau:</p>
                                    <ul>
                                        <li>Người dùng phải từ <strong>18 tuổi</strong> trở lên hoặc có sự đồng ý của người giám hộ hợp pháp.</li>
                                        <li>Cung cấp thông tin cá nhân <strong>chính xác, đầy đủ</strong> và cập nhật khi đăng ký.</li>
                                        <li>Không sử dụng dịch vụ cho bất kỳ mục đích <strong>gian lận, vi phạm pháp luật</strong> hoặc gây hại cho người khác.</li>
                                        <li>Không cố tình phát tán virus, mã độc hoặc thực hiện các hành động gây gián đoạn hệ thống.</li>
                                        <li>Không giả mạo danh tính bất kỳ cá nhân hoặc tổ chức nào.</li>
                                    </ul>
                                </Section>
                                <Section id="s3" title={`3. ${t.sections[2].title}`}>
                                    <p>Khi bạn tạo tài khoản trên TechStore, bạn có trách nhiệm:</p>
                                    <ul>
                                        <li><strong>Bảo mật tài khoản</strong> — Giữ bí mật mật khẩu và không chia sẻ thông tin đăng nhập với bất kỳ ai.</li>
                                        <li>Thông báo ngay cho chúng tôi nếu phát hiện bất kỳ hoạt động trái phép nào trong tài khoản.</li>
                                        <li>Chịu trách nhiệm cho mọi hoạt động được thực hiện qua tài khoản của bạn.</li>
                                    </ul>
                                    <p>TechStore có quyền <strong>tạm khóa hoặc chấm dứt tài khoản</strong> của bất kỳ người dùng nào vi phạm điều khoản này mà không cần thông báo trước.</p>
                                </Section>
                                <Section id="s4" title={`4. ${t.sections[3].title}`}>
                                    <ul>
                                        <li><strong>Giá sản phẩm</strong> được hiển thị trên website và có thể thay đổi mà không cần thông báo trước.</li>
                                        <li>Đơn hàng chỉ được xác nhận sau khi chúng tôi gửi email xác nhận đến địa chỉ đã đăng ký.</li>
                                        <li>TechStore chấp nhận thanh toán qua thẻ ngân hàng, ví điện tử, và chuyển khoản.</li>
                                        <li>Chúng tôi có quyền <strong>hủy đơn hàng</strong> trong trường hợp: sản phẩm hết hàng, thông tin thanh toán không hợp lệ, hoặc nghi ngờ gian lận.</li>
                                        <li>Mọi khoản phí, thuế áp dụng theo quy định hiện hành của pháp luật Việt Nam.</li>
                                    </ul>
                                </Section>
                                <Section id="s5" title={`5. ${t.sections[4].title}`}>
                                    <p>TechStore áp dụng chính sách đổi trả linh hoạt nhằm bảo vệ quyền lợi khách hàng:</p>
                                    <ul>
                                        <li><strong>7 ngày đổi trả</strong> kể từ ngày nhận hàng đối với sản phẩm lỗi do nhà sản xuất.</li>
                                        <li>Sản phẩm phải còn nguyên hộp, phụ kiện đầy đủ, không có dấu hiệu đã qua sử dụng.</li>
                                        <li><strong>Hoàn tiền</strong> được thực hiện trong vòng 5–7 ngày làm việc sau khi hàng trả được kiểm tra.</li>
                                        <li>Không áp dụng đổi trả với sản phẩm đã kích hoạt, phần mềm, hoặc hàng giảm giá đặc biệt.</li>
                                    </ul>
                                </Section>
                                <Section id="s6" title={`6. ${t.sections[5].title}`}>
                                    <p>Toàn bộ nội dung trên nền tảng TechStore — bao gồm văn bản, hình ảnh, logo, thiết kế, và phần mềm — là tài sản thuộc sở hữu trí tuệ của <strong>TechStore Inc.</strong> hoặc đối tác được cấp phép.</p>
                                    <ul>
                                        <li>Nghiêm cấm sao chép, phân phối, hoặc sử dụng bất kỳ nội dung nào mà không có sự đồng ý bằng văn bản từ TechStore.</li>
                                        <li>Người dùng có thể sử dụng nội dung cho mục đích cá nhân, phi thương mại.</li>
                                    </ul>
                                </Section>
                                <Section id="s7" title={`7. ${t.sections[6].title}`}>
                                    <p>Trong phạm vi tối đa được pháp luật cho phép, TechStore không chịu trách nhiệm cho:</p>
                                    <ul>
                                        <li>Thiệt hại gián tiếp, ngẫu nhiên phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.</li>
                                        <li>Mất mát dữ liệu hoặc gián đoạn kinh doanh.</li>
                                        <li>Lỗi hoặc thiếu sót do <strong>bên thứ ba</strong> (đối tác vận chuyển, cổng thanh toán) gây ra.</li>
                                        <li>Sự cố kỹ thuật ngoài tầm kiểm soát hợp lý của chúng tôi.</li>
                                    </ul>
                                </Section>
                                <Section id="s8" title={`8. ${t.sections[7].title}`}>
                                    <p>TechStore có quyền cập nhật, sửa đổi các Điều khoản Dịch vụ này bất cứ lúc nào. Những thay đổi sẽ có hiệu lực ngay khi được đăng tải trên website.</p>
                                    <ul>
                                        <li>Chúng tôi sẽ thông báo về những thay đổi quan trọng qua email đã đăng ký.</li>
                                        <li>Việc bạn tiếp tục sử dụng dịch vụ sau khi điều khoản được cập nhật đồng nghĩa với việc <strong>chấp nhận các thay đổi đó</strong>.</li>
                                    </ul>
                                </Section>
                                <Section id="s9" title={`9. ${t.sections[8].title}`}>
                                    <p>{t.contactTitle}</p>
                                    <div className="mt-4 grid sm:grid-cols-2 gap-4">
                                        <ContactCard icon="mail" label={t.contactEmail} value="support@techstore.com" />
                                        <ContactCard icon="call" label={t.contactHotline} value="0123 456 789" />
                                        <ContactCard icon="location_on" label={t.contactAddress} value={t.contactAddressVal} />
                                        <ContactCard icon="schedule" label={t.contactHours} value={t.contactHoursVal} />
                                    </div>
                                </Section>
                            </>
                        ) : (
                            <>
                                <Section id="s1" title={`1. ${t.sections[0].title}`}>
                                    <p>Welcome to <strong>TechStore</strong> — Vietnam's leading platform for buying and selling technology products. By accessing or using our services, you agree to be bound by the terms and conditions set out below.</p>
                                    <p>These terms apply to all users, including visitors, registered users, and buyers across the entire TechStore platform.</p>
                                </Section>
                                <Section id="s2" title={`2. ${t.sections[1].title}`}>
                                    <p>To use TechStore services, you must meet the following conditions:</p>
                                    <ul>
                                        <li>Users must be <strong>18 years of age</strong> or older, or have the consent of a legal guardian.</li>
                                        <li>Provide <strong>accurate, complete</strong> personal information and keep it updated upon registration.</li>
                                        <li>Not use the service for any <strong>fraudulent, illegal</strong> purposes or to harm others.</li>
                                        <li>Not intentionally spread viruses, malicious code, or perform actions that disrupt the system.</li>
                                        <li>Not impersonate any individual or organization.</li>
                                    </ul>
                                </Section>
                                <Section id="s3" title={`3. ${t.sections[2].title}`}>
                                    <p>When you create an account on TechStore, you are responsible for:</p>
                                    <ul>
                                        <li><strong>Account security</strong> — Keep your password confidential and do not share login credentials with anyone.</li>
                                        <li>Immediately notifying us if you detect any unauthorized activity in your account.</li>
                                        <li>Taking responsibility for all activities carried out through your account.</li>
                                    </ul>
                                    <p>TechStore reserves the right to <strong>suspend or terminate accounts</strong> of any user who violates these terms without prior notice.</p>
                                </Section>
                                <Section id="s4" title={`4. ${t.sections[3].title}`}>
                                    <ul>
                                        <li><strong>Product prices</strong> are displayed on the website and may change without prior notice.</li>
                                        <li>Orders are only confirmed after we send a confirmation email to the registered address.</li>
                                        <li>TechStore accepts payment via bank card, e-wallet, and bank transfer.</li>
                                        <li>We reserve the right to <strong>cancel orders</strong> in cases of: out-of-stock products, invalid payment information, or suspected fraud.</li>
                                        <li>All fees and taxes apply per current Vietnamese law regulations.</li>
                                    </ul>
                                </Section>
                                <Section id="s5" title={`5. ${t.sections[4].title}`}>
                                    <p>TechStore applies a flexible return policy to protect customer rights:</p>
                                    <ul>
                                        <li><strong>7-day returns</strong> from the date of receipt for manufacturer-defective products.</li>
                                        <li>Products must be in original packaging, with all accessories included, and show no signs of use.</li>
                                        <li><strong>Refunds</strong> are processed within 5–7 business days after the returned item is inspected.</li>
                                        <li>Returns do not apply to activated products, software, or items on special sale.</li>
                                    </ul>
                                </Section>
                                <Section id="s6" title={`6. ${t.sections[5].title}`}>
                                    <p>All content on the TechStore platform — including text, images, logos, designs, and software — is intellectual property owned by <strong>TechStore Inc.</strong> or licensed partners.</p>
                                    <ul>
                                        <li>Copying, distributing, or using any content without written consent from TechStore is strictly prohibited.</li>
                                        <li>Users may use content for personal, non-commercial purposes.</li>
                                    </ul>
                                </Section>
                                <Section id="s7" title={`7. ${t.sections[6].title}`}>
                                    <p>To the maximum extent permitted by law, TechStore is not liable for:</p>
                                    <ul>
                                        <li>Indirect or incidental damages arising from the use or inability to use the service.</li>
                                        <li>Data loss or business interruption.</li>
                                        <li>Errors or omissions caused by <strong>third parties</strong> (shipping partners, payment gateways).</li>
                                        <li>Technical incidents beyond our reasonable control.</li>
                                    </ul>
                                </Section>
                                <Section id="s8" title={`8. ${t.sections[7].title}`}>
                                    <p>TechStore reserves the right to update or modify these Terms of Service at any time. Changes take effect immediately upon being posted on the website.</p>
                                    <ul>
                                        <li>We will notify users of significant changes via the registered email address.</li>
                                        <li>Continued use of the service after terms are updated constitutes <strong>acceptance of those changes</strong>.</li>
                                    </ul>
                                </Section>
                                <Section id="s9" title={`9. ${t.sections[8].title}`}>
                                    <p>{t.contactTitle}</p>
                                    <div className="mt-4 grid sm:grid-cols-2 gap-4">
                                        <ContactCard icon="mail" label={t.contactEmail} value="support@techstore.com" />
                                        <ContactCard icon="call" label={t.contactHotline} value="0123 456 789" />
                                        <ContactCard icon="location_on" label={t.contactAddress} value={t.contactAddressVal} />
                                        <ContactCard icon="schedule" label={t.contactHours} value={t.contactHoursVal} />
                                    </div>
                                </Section>
                            </>
                        )}
                    </main>
                </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-sm text-slate-500">
                {t.footer}
            </div>
        </div>
    );
}

function Section({ id, title, children }) {
    return (
        <section id={id} className="scroll-mt-28 section-animate">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-1 bg-primary rounded-full"></div>
                <h2 className="text-2xl font-black">{title}</h2>
            </div>
            <div className="text-slate-600 dark:text-slate-400 space-y-3">{children}</div>
        </section>
    );
}

function ContactCard({ icon, label, value }) {
    return (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="material-symbols-outlined text-primary mt-0.5">{icon}</span>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="font-semibold text-slate-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
}
