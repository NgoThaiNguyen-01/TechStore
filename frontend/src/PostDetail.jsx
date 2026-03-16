import { useEffect, useState } from "react";
import { toast } from "sonner";
import Footer from "./components/Footer";
import { getPostById } from "./services/postApi";

const T = {
    vi: {
        back: "Quay lại",
        title: "Tin tức",
        author: "Tác giả",
        category: "Chuyên mục",
        status: "Trạng thái",
        publishedAt: "Ngày đăng",
        updatedAt: "Ngày cập nhật",
        shortDesc: "Mô tả ngắn",
        content: "Nội dung",
        noContent: "Chưa có nội dung.",
        unknownError: "Đã xảy ra lỗi, vui lòng thử lại",
    },
    en: {
        back: "Back",
        title: "News",
        author: "Author",
        category: "Category",
        status: "Status",
        publishedAt: "Published at",
        updatedAt: "Updated at",
        shortDesc: "Short description",
        content: "Content",
        noContent: "No content.",
        unknownError: "Something went wrong, please try again",
    }
};

export default function PostDetail({ lang, setLang, postId, onNavigateHome }) {
    const t = T[lang] || T.vi;
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            if (!postId) {
                setPost(null);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const res = await getPostById(postId);
                const data = res?.data || res;
                if (mounted) setPost(data);
            } catch (err) {
                toast.error(err?.message || t.unknownError);
                if (mounted) setPost(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        run();
        return () => {
            mounted = false;
        };
    }, [postId, t.unknownError]);

    const formatDateTime = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "—";
        return date.toLocaleString(lang === "vi" ? "vi-VN" : "en-US");
    };

    const displayUpdatedAt = (() => {
        if (!post?.updatedAt) return "—";
        const created = new Date(post?.createdAt).getTime();
        const updated = new Date(post?.updatedAt).getTime();
        if (Number.isNaN(created) || Number.isNaN(updated)) return "—";
        if (created === updated) return "—";
        return formatDateTime(post.updatedAt);
    })();

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="max-w-[1440px] mx-auto px-4 lg:px-10 py-4 flex items-center justify-between">
                    <button
                        onClick={onNavigateHome}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-extrabold shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors"
                        type="button"
                    >
                        <span className="material-symbols-outlined text-[28px]">arrow_back</span>
                        <span className="text-lg">{t.back}</span>
                    </button>
                </div>
            </header>

            <main className="max-w-[960px] mx-auto px-4 lg:px-10 py-10">
                {loading ? (
                    <div className="text-slate-500">{lang === "vi" ? "Đang tải..." : "Loading..."}</div>
                ) : !post ? (
                    <div className="text-slate-500">{lang === "vi" ? "Không tìm thấy bài viết." : "Post not found."}</div>
                ) : (
                    <article className="space-y-6">
                        {post.thumbnail && (
                            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                <img src={post.thumbnail} alt="" className="w-full max-h-[420px] object-cover" />
                            </div>
                        )}

                        <div className="space-y-2">
                            <h1 className="text-3xl lg:text-4xl font-black leading-tight">{post.title || t.title}</h1>
                            <div className="space-y-1 text-sm text-slate-500">
                                <div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{t.author}:</span>{" "}
                                    {post.author?.name || "—"}
                                    {post.author?.email ? ` (${post.author.email})` : ""}
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{t.category}:</span>{" "}
                                    {post.tag || "—"}
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{t.publishedAt}:</span>{" "}
                                    {formatDateTime(post.createdAt)}
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{t.updatedAt}:</span>{" "}
                                    {displayUpdatedAt}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{t.shortDesc}</h2>
                                <p className="text-base text-slate-700 dark:text-slate-200">{post.description || "—"}</p>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{t.content}</h2>
                                <div className="prose prose-slate max-w-none dark:prose-invert">
                                    <div className="whitespace-pre-wrap">
                                        {post.content?.trim() ? post.content : t.noContent}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>
                )}
            </main>

            <Footer lang={lang} setLang={setLang} />
        </div>
    );
}
