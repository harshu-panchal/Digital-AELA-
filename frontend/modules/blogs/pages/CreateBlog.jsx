import { useCallback, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HiOutlineSparkles, HiOutlineDevicePhoneMobile } from "react-icons/hi2";
import { toast } from "react-toastify";
import BlogEditor from "../components/BlogEditor";
import SEO from "../../../src/components/SEO";
import { useBlogs } from "../../../src/contexts/BlogContext";

const CreateBlog = () => {
  const navigate = useNavigate();
  const { publishBlog } = useBlogs();
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [category, setCategory] = useState("Communication");
  const [content, setContent] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  const tags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsInput]
  );

  const handleThumbnailUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnail(e.target.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const resetForm = () => {
    setTitle("");
    setThumbnail("");
    setTagsInput("");
    setCategory("Communication");
    setContent("");
    setPreviewMode(false);
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Add a title and content before publishing");
      return;
    }

    try {
      const blog = await publishBlog({
        title,
        thumbnail,
        tags,
        category,
        content,
      });

      const { default: confetti } = await import("canvas-confetti");

      confetti({
        particleCount: 160,
        spread: 65,
        origin: { y: 0.6 },
      });

      resetForm();
      navigate(`/blogs/${blog.id}`);
    } catch (error) {
      // Error handling is done in publishBlog
      console.error("Failed to publish blog:", error);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-black via-[#050505] to-black pt-[124px] text-white">
      <SEO
        title="Create Blog | AELA Learn & Earn"
        description="Publish your Digital AELA story, add tags, preview rich content and share your insights with the community."
        keywords="create blog, AELA blog editor, publish story, share insights"
        type="article"
      />
      <div className="layout-container flex w-full max-w-[1200px] flex-col gap-10 pb-20">
        <header className="flex flex-col gap-4 pt-4">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#F5D26A]">
            Create Blog
          </span>
          <h1 className="text-3xl font-semibold sm:text-4xl lg:text-5xl">
            Share your expertise with the Digital AELA network.
          </h1>
          <p className="text-sm text-gray-300 sm:text-base">
            Craft engaging posts, add rich media, and publish when you are
            ready. Share your expertise with the Digital AELA community.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#080808]/80 p-6 shadow-[0_28px_75px_rgba(0,0,0,0.55)]">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
                    Blog title
                  </span>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Give your blog a powerful headline"
                    className="w-full rounded-2xl border border-white/10 bg-[#101010]/70 px-4 py-3 text-sm text-white placeholder:text-gray-400 focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
                    Category
                  </span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#101010]/70 px-4 py-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none">
                    <option value="Communication">Communication</option>
                    <option value="Mentorship">Mentorship</option>
                    <option value="Technology">Technology</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Community">Community</option>
                  </select>
                </label>
              </div>

              <label className="mt-4 block space-y-2">
                <span className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
                  Tags (comma separated)
                </span>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  placeholder="Leadership, Storytelling, Debate"
                  className="w-full rounded-2xl border border-white/10 bg-[#101010]/70 px-4 py-3 text-sm text-white placeholder:text-gray-400 focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </label>

              <label className="mt-4 block">
                <span className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
                  Thumbnail image
                </span>
                <div className="mt-2 flex flex-col gap-4 rounded-2xl border border-dashed border-[#D4AF37]/40 bg-[#0a0a0a]/80 p-6 text-center text-gray-300">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt="Blog thumbnail"
                      className="mx-auto h-48 w-full max-w-md rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-sm">
                      <HiOutlineDevicePhoneMobile className="h-10 w-10 text-[#D4AF37]" />
                      <p>
                        Drag & drop, or choose a thumbnail that reflects your
                        story.
                      </p>
                      <p className="text-xs text-gray-500">
                        Recommended: 1600 × 900 px
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-linear-to-r from-[#D4AF37] to-[#F5D26A] px-5 py-2 text-sm font-semibold text-black shadow-lg shadow-[#D4AF37]/30 transition hover:brightness-110">
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="hidden"
                      />
                    </label>
                    {thumbnail && (
                      <button
                        type="button"
                        onClick={() => setThumbnail("")}
                        className="ml-3 text-xs font-semibold text-gray-400 hover:text-[#D4AF37]">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </label>
            </div>

            <BlogEditor value={content} onChange={setContent} />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <Motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handlePublish}
                className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-[#D4AF37] to-[#F5D26A] px-8 py-3 text-sm font-semibold text-black shadow-xl shadow-[#D4AF37]/30 transition hover:brightness-110">
                <HiOutlineSparkles className="h-5 w-5" />
                Publish
              </Motion.button>

              <label className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                <input
                  type="checkbox"
                  checked={previewMode}
                  onChange={(event) => setPreviewMode(event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-[#111] text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                Live Preview
              </label>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/70 p-6 shadow-[0_28px_75px_rgba(0,0,0,0.55)]">
              <h3 className="text-lg font-semibold text-white">
                Publishing Checklist
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-300">
                <li>✔ Strong headline with transformation</li>
                <li>✔ Minimum 600 words of value</li>
                <li>✔ Add 3+ tags for discovery</li>
                <li>✔ Upload a high-impact thumbnail</li>
                <li>✔ Highlight clear takeaways</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-6 text-sm text-[#F5D26A] shadow-[0_28px_75px_rgba(212,175,55,0.25)]">
              <h3 className="text-lg font-semibold text-white">
                Publishing Benefits
              </h3>
              <p className="mt-3 text-sm">
                Publishing your blog helps you share knowledge, build your
                reputation, and connect with the community. High engagement can
                unlock weekly spotlight features.
              </p>
            </div>
          </aside>
        </section>

        {previewMode && (
          <section className="rounded-3xl border border-white/10 bg-[#080808]/80 p-8 shadow-[0_28px_75px_rgba(0,0,0,0.55)]">
            <h2 className="mb-6 text-xl font-semibold text-white">
              Live Preview
            </h2>
            <article className="prose prose-invert max-w-none [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-white [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-white [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-white [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:text-white [&_p]:text-gray-300 [&_p]:my-4 [&_strong]:text-[#F5D26A] [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-2 [&_li]:text-gray-300 [&_li]:my-1.5 [&_li]:ml-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[#D4AF37]/40 [&_blockquote]:pl-4 [&_blockquote]:pr-4 [&_blockquote]:my-4 [&_blockquote]:text-[#F5D26A] [&_blockquote]:italic [&_blockquote]:text-base [&_blockquote]:bg-[#0a0a0a]/50 [&_blockquote]:py-2 [&_blockquote]:rounded-r [&_blockquote_p]:my-0">
              <h1>{title || "Your inspiring title"}</h1>
              <p className="text-sm text-gray-400">
                Tags:{" "}
                {tags.length
                  ? tags.join(", ")
                  : "Add tags to improve discovery"}
              </p>
              <div
                dangerouslySetInnerHTML={{
                  __html: content || "<p>Start writing to see the preview.</p>",
                }}
              />
            </article>
          </section>
        )}
      </div>
    </div>
  );
};

export default CreateBlog;
