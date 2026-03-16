import { useState, useEffect, useRef } from "react";
import "./legal.css";

const T = {
    vi: {
        back: "Quay lại",
        home: "Trang chủ",
        pageTitle: "Chính sách bảo mật",
        lastUpdated: "Cập nhật lần cuối: 01/03/2026",
        toc: "Mục lục",
        footer: "© 2024 TechStore Inc. — Bảo lưu mọi quyền.",
        contactTitle: "Nếu bạn có câu hỏi hoặc muốn thực hiện quyền đối với dữ liệu cá nhân, vui lòng liên hệ Bộ phận Bảo vệ Dữ liệu của chúng tôi:",
        contactEmail: "Email bảo mật",
        contactHotline: "Hotline",
        contactAddress: "Địa chỉ",
        contactHours: "Giờ làm việc",
        contactAddressVal: "123 Tech Avenue, TP. Hồ Chí Minh",
        contactHoursVal: "T2–T7: 8:00 – 18:00",
        sections: [
            { id: "p1", title: "Thông tin chúng tôi thu thập" },
            { id: "p2", title: "Cách chúng tôi sử dụng thông tin" },
            { id: "p3", title: "Cookies" },
            { id: "p4", title: "Bảo mật dữ liệu" },
            { id: "p5", title: "Chia sẻ thông tin" },
            { id: "p6", title: "Quyền của người dùng" },
            { id: "p7", title: "Lưu trữ dữ liệu" },
            { id: "p8", title: "Thay đổi chính sách" },
            { id: "p9", title: "Liên hệ" },
        ],
    },
    en: {
        back: "Back",
        home: "Home",
        pageTitle: "Privacy Policy",
        lastUpdated: "Last updated: 03/01/2026",
        toc: "Table of Contents",
        footer: "© 2024 TechStore Inc. — All rights reserved.",
        contactTitle: "If you have questions or wish to exercise your data rights, please contact our Data Protection Team:",
        contactEmail: "Privacy Email",
        contactHotline: "Hotline",
        contactAddress: "Address",
        contactHours: "Business Hours",
        contactAddressVal: "123 Tech Avenue, Ho Chi Minh City",
        contactHoursVal: "Mon–Sat: 8:00 AM – 6:00 PM",
        sections: [
            { id: "p1", title: "Information We Collect" },
            { id: "p2", title: "How We Use Information" },
            { id: "p3", title: "Cookies" },
            { id: "p4", title: "Data Security" },
            { id: "p5", title: "Information Sharing" },
            { id: "p6", title: "User Rights" },
            { id: "p7", title: "Data Retention" },
            { id: "p8", title: "Policy Changes" },
            { id: "p9", title: "Contact" },
        ],
    },
};

export default function Privacy({ onNavigateRegister, onNavigateHome, lang, setLang }) {
    const t = T[lang];
    const [activeId, setActiveId] = useState("p1");
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
                            <span className="material-symbols-outlined text-primary text-3xl">shield</span>
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
                                <Section id="p1" title={`1. ${t.sections[0].title}`}>
                                    <p>Khi bạn sử dụng dịch vụ của TechStore, chúng tôi có thể thu thập các loại thông tin sau:</p>
                                    <ul>
                                        <li><strong>Thông tin cá nhân:</strong> Họ và tên, địa chỉ email, số điện thoại.</li>
                                        <li><strong>Địa chỉ giao hàng:</strong> Địa chỉ nhà, địa chỉ văn phòng hoặc địa chỉ nhận hàng khác.</li>
                                        <li><strong>Dữ liệu thanh toán:</strong> Thông tin thẻ (được mã hóa), lịch sử giao dịch.</li>
                                        <li><strong>Dữ liệu kỹ thuật:</strong> Địa chỉ IP, loại trình duyệt, hệ điều hành, thời gian truy cập.</li>
                                        <li><strong>Hành vi người dùng:</strong> Sản phẩm đã xem, tìm kiếm, giỏ hàng, đánh giá sản phẩm.</li>
                                    </ul>
                                </Section>
                                <Section id="p2" title={`2. ${t.sections[1].title}`}>
                                    <p>Thông tin thu thập được sử dụng cho các mục đích sau:</p>
                                    <ul>
                                        <li><strong>Xử lý đơn hàng</strong> — Xác nhận, đóng gói và giao hàng đến bạn.</li>
                                        <li><strong>Gửi thông báo</strong> — Cập nhật trạng thái đơn hàng, khuyến mãi, thay đổi chính sách.</li>
                                        <li><strong>Cải thiện dịch vụ</strong> — Phân tích hành vi người dùng để nâng cao trải nghiệm.</li>
                                        <li><strong>Marketing có mục tiêu</strong> — Gợi ý sản phẩm phù hợp (chỉ khi bạn đồng ý nhận).</li>
                                        <li><strong>Hỗ trợ khách hàng</strong> — Giải quyết khiếu nại, hỗ trợ kỹ thuật.</li>
                                        <li><strong>Tuân thủ pháp luật</strong> — Thực hiện nghĩa vụ khai báo thuế và báo cáo theo quy định.</li>
                                    </ul>
                                </Section>
                                <Section id="p3" title={`3. ${t.sections[2].title}`}>
                                    <p>TechStore sử dụng cookies để nâng cao trải nghiệm duyệt web của bạn:</p>
                                    <ul>
                                        <li><strong>Cookie phiên (Session Cookies):</strong> Theo dõi trạng thái đăng nhập, giỏ hàng trong phiên làm việc.</li>
                                        <li><strong>Cookie phân tích:</strong> Đo lường lưu lượng truy cập, phân tích hành vi người dùng (Google Analytics).</li>
                                        <li><strong>Cookie cá nhân hóa:</strong> Ghi nhớ tùy chỉnh như ngôn ngữ, chủ đề giao diện.</li>
                                        <li><strong>Cookie quảng cáo:</strong> Hiển thị quảng cáo phù hợp trên các nền tảng bên ngoài.</li>
                                    </ul>
                                    <p>Bạn có thể vô hiệu hóa cookies trong cài đặt trình duyệt, tuy nhiên điều này có thể ảnh hưởng đến tính năng của website.</p>
                                </Section>
                                <Section id="p4" title={`4. ${t.sections[3].title}`}>
                                    <p>Chúng tôi áp dụng các biện pháp bảo mật tiêu chuẩn công nghiệp:</p>
                                    <ul>
                                        <li><strong>Mã hóa SSL/TLS</strong> — Toàn bộ dữ liệu truyền tải được mã hóa 256-bit.</li>
                                        <li><strong>Lưu trữ mật khẩu an toàn</strong> — Mật khẩu được hash bằng bcrypt, không lưu dạng plain text.</li>
                                        <li><strong>Token-based Authentication</strong> — Sử dụng JWT với thời hạn hết hạn ngắn.</li>
                                        <li><strong>Kiểm tra bảo mật định kỳ</strong> — Audit code và penetration testing hàng quý.</li>
                                        <li><strong>Quyền truy cập tối thiểu</strong> — Nhân viên chỉ được truy cập dữ liệu cần thiết để thực hiện công việc.</li>
                                    </ul>
                                </Section>
                                <Section id="p5" title={`5. ${t.sections[4].title}`}>
                                    <p>TechStore cam kết không bán dữ liệu cá nhân của bạn. Chúng tôi chỉ chia sẻ thông tin trong các trường hợp:</p>
                                    <ul>
                                        <li><strong>Đối tác vận chuyển</strong> — Giao thông tin giao hàng cho đơn vị vận chuyển (Giao Hàng Nhanh, GHTK, v.v.).</li>
                                        <li><strong>Cổng thanh toán</strong> — Truyền dữ liệu giao dịch đến các cổng thanh toán được chứng nhận PCI DSS.</li>
                                        <li><strong>Yêu cầu pháp lý</strong> — Cung cấp thông tin khi có yêu cầu hợp lệ từ cơ quan có thẩm quyền.</li>
                                        <li><strong>Đối tác dịch vụ</strong> — Các nhà cung cấp dịch vụ cloud, email marketing ký hợp đồng bảo mật với chúng tôi.</li>
                                    </ul>
                                </Section>
                                <Section id="p6" title={`6. ${t.sections[5].title}`}>
                                    <p>Bạn có các quyền sau đối với dữ liệu cá nhân của mình:</p>
                                    <ul>
                                        <li><strong>Quyền truy cập</strong> — Yêu cầu bản sao dữ liệu cá nhân chúng tôi đang lưu trữ.</li>
                                        <li><strong>Quyền chỉnh sửa</strong> — Yêu cầu cập nhật thông tin không chính xác.</li>
                                        <li><strong>Quyền xóa dữ liệu</strong> — Yêu cầu xóa tài khoản và toàn bộ dữ liệu liên quan.</li>
                                        <li><strong>Quyền phản đối</strong> — Từ chối việc xử lý dữ liệu cho mục đích marketing.</li>
                                        <li><strong>Rút lại sự đồng ý</strong> — Hủy đăng ký nhận email marketing bất kỳ lúc nào.</li>
                                    </ul>
                                    <p>Để thực hiện các quyền này, vui lòng gửi email đến <strong>privacy@techstore.com</strong>.</p>
                                </Section>
                                <Section id="p7" title={`7. ${t.sections[6].title}`}>
                                    <ul>
                                        <li>Dữ liệu tài khoản được lưu trữ trong <strong>suốt thời gian tài khoản còn hoạt động</strong>.</li>
                                        <li>Sau khi xóa tài khoản, dữ liệu được giữ tối đa <strong>30 ngày</strong> để xử lý khiếu nại tồn đọng, sau đó được xóa vĩnh viễn.</li>
                                        <li>Lịch sử giao dịch được lưu tối thiểu <strong>5 năm</strong> theo quy định kế toán Việt Nam.</li>
                                        <li>Dữ liệu log hệ thống được lưu tối đa <strong>12 tháng</strong> cho mục đích bảo mật.</li>
                                    </ul>
                                </Section>
                                <Section id="p8" title={`8. ${t.sections[7].title}`}>
                                    <p>Chúng tôi có thể cập nhật Chính sách Bảo mật này theo thời gian để phản ánh thay đổi trong thực tiễn vận hành hoặc yêu cầu pháp lý.</p>
                                    <ul>
                                        <li>Mọi thay đổi quan trọng sẽ được thông báo qua <strong>email đã đăng ký</strong> hoặc <strong>thông báo nổi bật</strong> trên website.</li>
                                        <li>Ngày cập nhật sẽ được hiển thị ở đầu trang này.</li>
                                        <li>Việc tiếp tục sử dụng dịch vụ sau khi thay đổi đồng nghĩa với việc bạn chấp nhận phiên bản mới của chính sách.</li>
                                    </ul>
                                </Section>
                                <Section id="p9" title={`9. ${t.sections[8].title}`}>
                                    <p>{t.contactTitle}</p>
                                    <div className="mt-4 grid sm:grid-cols-2 gap-4">
                                        <ContactCard icon="mail" label={t.contactEmail} value="privacy@techstore.com" />
                                        <ContactCard icon="support_agent" label={t.contactHotline} value="0123 456 789" />
                                        <ContactCard icon="location_on" label={t.contactAddress} value={t.contactAddressVal} />
                                        <ContactCard icon="schedule" label={t.contactHours} value={t.contactHoursVal} />
                                    </div>
                                </Section>
                            </>
                        ) : (
                            <>
                                <Section id="p1" title={`1. ${t.sections[0].title}`}>
                                    <p>When you use TechStore's services, we may collect the following types of information:</p>
                                    <ul>
                                        <li><strong>Personal information:</strong> Full name, email address, phone number.</li>
                                        <li><strong>Shipping address:</strong> Home address, office address, or other delivery addresses.</li>
                                        <li><strong>Payment data:</strong> Card information (encrypted), transaction history.</li>
                                        <li><strong>Technical data:</strong> IP address, browser type, operating system, access time.</li>
                                        <li><strong>User behavior:</strong> Products viewed, searches, cart contents, product reviews.</li>
                                    </ul>
                                </Section>
                                <Section id="p2" title={`2. ${t.sections[1].title}`}>
                                    <p>The information collected is used for the following purposes:</p>
                                    <ul>
                                        <li><strong>Order processing</strong> — Confirming, packaging, and delivering to you.</li>
                                        <li><strong>Sending notifications</strong> — Order status updates, promotions, policy changes.</li>
                                        <li><strong>Service improvement</strong> — Analyzing user behavior to enhance the experience.</li>
                                        <li><strong>Targeted marketing</strong> — Suggesting relevant products (only when you opt in).</li>
                                        <li><strong>Customer support</strong> — Resolving complaints, providing technical assistance.</li>
                                        <li><strong>Legal compliance</strong> — Fulfilling tax reporting and regulatory obligations.</li>
                                    </ul>
                                </Section>
                                <Section id="p3" title={`3. ${t.sections[2].title}`}>
                                    <p>TechStore uses cookies to enhance your browsing experience:</p>
                                    <ul>
                                        <li><strong>Session Cookies:</strong> Track login status and cart during a browsing session.</li>
                                        <li><strong>Analytics cookies:</strong> Measure traffic and analyze user behavior (Google Analytics).</li>
                                        <li><strong>Personalization cookies:</strong> Remember preferences such as language and interface theme.</li>
                                        <li><strong>Advertising cookies:</strong> Display relevant ads on external platforms.</li>
                                    </ul>
                                    <p>You can disable cookies in your browser settings, however this may affect the functionality of the website.</p>
                                </Section>
                                <Section id="p4" title={`4. ${t.sections[3].title}`}>
                                    <p>We apply industry-standard security measures:</p>
                                    <ul>
                                        <li><strong>SSL/TLS Encryption</strong> — All transmitted data is encrypted with 256-bit encryption.</li>
                                        <li><strong>Secure password storage</strong> — Passwords are hashed using bcrypt and never stored as plain text.</li>
                                        <li><strong>Token-based Authentication</strong> — JWT tokens with short expiration times are used.</li>
                                        <li><strong>Regular security audits</strong> — Code audits and penetration testing are conducted quarterly.</li>
                                        <li><strong>Least-privilege access</strong> — Staff can only access data necessary to perform their duties.</li>
                                    </ul>
                                </Section>
                                <Section id="p5" title={`5. ${t.sections[4].title}`}>
                                    <p>TechStore is committed to never selling your personal data. We only share information in the following cases:</p>
                                    <ul>
                                        <li><strong>Shipping partners</strong> — Delivery details are shared with shipping providers (GHN, GHTK, etc.).</li>
                                        <li><strong>Payment gateways</strong> — Transaction data is transmitted to PCI DSS-certified payment gateways.</li>
                                        <li><strong>Legal requirements</strong> — Information is provided upon valid requests from competent authorities.</li>
                                        <li><strong>Service partners</strong> — Cloud providers and email marketing services that have signed data security agreements with us.</li>
                                    </ul>
                                </Section>
                                <Section id="p6" title={`6. ${t.sections[5].title}`}>
                                    <p>You have the following rights regarding your personal data:</p>
                                    <ul>
                                        <li><strong>Right of access</strong> — Request a copy of the personal data we are storing.</li>
                                        <li><strong>Right of rectification</strong> — Request updates to inaccurate information.</li>
                                        <li><strong>Right to erasure</strong> — Request deletion of your account and all associated data.</li>
                                        <li><strong>Right to object</strong> — Refuse data processing for marketing purposes.</li>
                                        <li><strong>Withdraw consent</strong> — Unsubscribe from marketing emails at any time.</li>
                                    </ul>
                                    <p>To exercise these rights, please email <strong>privacy@techstore.com</strong>.</p>
                                </Section>
                                <Section id="p7" title={`7. ${t.sections[6].title}`}>
                                    <ul>
                                        <li>Account data is retained for the <strong>duration the account remains active</strong>.</li>
                                        <li>After account deletion, data is kept for a maximum of <strong>30 days</strong> to handle pending disputes, then permanently deleted.</li>
                                        <li>Transaction history is retained for at least <strong>5 years</strong> per Vietnamese accounting regulations.</li>
                                        <li>System log data is retained for a maximum of <strong>12 months</strong> for security purposes.</li>
                                    </ul>
                                </Section>
                                <Section id="p8" title={`8. ${t.sections[7].title}`}>
                                    <p>We may update this Privacy Policy from time to time to reflect changes in our operating practices or legal requirements.</p>
                                    <ul>
                                        <li>All significant changes will be communicated via <strong>registered email</strong> or <strong>prominent notices</strong> on the website.</li>
                                        <li>The updated date will be displayed at the top of this page.</li>
                                        <li>Continued use of the service after changes are made constitutes your acceptance of the new policy.</li>
                                    </ul>
                                </Section>
                                <Section id="p9" title={`9. ${t.sections[8].title}`}>
                                    <p>{t.contactTitle}</p>
                                    <div className="mt-4 grid sm:grid-cols-2 gap-4">
                                        <ContactCard icon="mail" label={t.contactEmail} value="privacy@techstore.com" />
                                        <ContactCard icon="support_agent" label={t.contactHotline} value="0123 456 789" />
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
