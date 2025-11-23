import { useEffect } from "react";
import { motion as Motion } from "framer-motion";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";

const toolbarButtonStyles =
  "rounded-lg border border-white/10 bg-[#111]/80 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:border-white/5 disabled:text-gray-500";

const BlogEditor = ({
  value,
  onChange,
  placeholder = "Start crafting your AELA story...",
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-[#F5D26A] underline" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: true,
    onUpdate: ({ editor: tiptap }) => {
      const html = tiptap.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, false);
    }
    if (!value && current !== "<p></p>") {
      editor.commands.clearContent(true);
    }
  }, [value, editor]);

  useEffect(
    () => () => {
      editor?.destroy();
    },
    [editor]
  );

  const isActive = (name, attrs) => {
    if (!editor) return false;
    return editor.isActive(name, attrs);
  };

  const toggle = (command, attrs) => {
    if (!editor) return;

    try {
      const chain = editor.chain().focus();

      if (attrs !== undefined && attrs !== null) {
        // Commands with attributes (like toggleHeading with level)
        if (typeof chain[command] === "function") {
          chain[command](attrs).run();
        }
      } else {
        // Commands without attributes
        if (typeof chain[command] === "function") {
          chain[command]().run();
        }
      }
    } catch (error) {
      console.warn(`TipTap command ${command} failed:`, error);
    }
  };

  const setLink = () => {
    if (!editor) return;
    if (typeof window === "undefined") return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <Motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-black/80 shadow-[0_24px_55px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <div className="border-b border-white/5 bg-[#0b0b0b]/80 px-6 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-[#D4AF37]">
          Blog Editor
        </h3>
        <p className="mt-1 text-xs text-gray-400">
          Format your ideas with headers, highlights, embeds and more. Autosave
          will use your draft state.
        </p>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-[#0b0b0b]/80 p-3">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((level) => (
              <button
                key={level}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggle("toggleHeading", { level });
                }}
                className={`${toolbarButtonStyles} ${
                  isActive("heading", { level })
                    ? "border-[#D4AF37]/60 text-[#F5D26A]"
                    : ""
                }`}>
                H{level}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => toggle("toggleBold")}
              className={`${toolbarButtonStyles} ${
                isActive("bold") ? "border-[#D4AF37]/60 text-[#F5D26A]" : ""
              }`}>
              Bold
            </button>
            <button
              type="button"
              onClick={() => toggle("toggleItalic")}
              className={`${toolbarButtonStyles} ${
                isActive("italic") ? "border-[#D4AF37]/60 text-[#F5D26A]" : ""
              }`}>
              Italic
            </button>
            <button
              type="button"
              onClick={() => toggle("toggleUnderline")}
              className={`${toolbarButtonStyles} ${
                isActive("underline")
                  ? "border-[#D4AF37]/60 text-[#F5D26A]"
                  : ""
              }`}>
              Underline
            </button>
            <button
              type="button"
              onClick={() => toggle("toggleStrike")}
              className={`${toolbarButtonStyles} ${
                isActive("strike") ? "border-[#D4AF37]/60 text-[#F5D26A]" : ""
              }`}>
              Strike
            </button>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle("toggleBulletList");
              }}
              className={`${toolbarButtonStyles} ${
                isActive("bulletList")
                  ? "border-[#D4AF37]/60 text-[#F5D26A]"
                  : ""
              }`}>
              Bullet List
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle("toggleOrderedList");
              }}
              className={`${toolbarButtonStyles} ${
                isActive("orderedList")
                  ? "border-[#D4AF37]/60 text-[#F5D26A]"
                  : ""
              }`}>
              Numbered List
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle("toggleBlockquote");
              }}
              className={`${toolbarButtonStyles} ${
                isActive("blockquote")
                  ? "border-[#D4AF37]/60 text-[#F5D26A]"
                  : ""
              }`}>
              Quote
            </button>
            <button
              type="button"
              onClick={() => toggle("toggleCodeBlock")}
              className={toolbarButtonStyles}>
              Code
            </button>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={setLink}
              className={`${toolbarButtonStyles} ${
                isActive("link") ? "border-[#D4AF37]/60 text-[#F5D26A]" : ""
              }`}>
              Link
            </button>
            <button
              type="button"
              onClick={() => toggle("unsetLink")}
              className={toolbarButtonStyles}>
              Clear Link
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().undo().run()}
              className={toolbarButtonStyles}>
              Undo
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().redo().run()}
              className={toolbarButtonStyles}>
              Redo
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#050505]/90 p-4 text-sm text-gray-100 md:p-6">
          <EditorContent
            editor={editor}
            className="prose prose-invert max-w-none [&_.ProseMirror]:outline-none [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-white [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-white [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-white [&_p]:text-gray-300 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-2 [&_li]:text-gray-300 [&_li]:my-1.5 [&_li]:ml-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[#D4AF37]/40 [&_blockquote]:pl-4 [&_blockquote]:pr-4 [&_blockquote]:my-4 [&_blockquote]:text-[#F5D26A] [&_blockquote]:italic [&_blockquote]:bg-[#0a0a0a]/50 [&_blockquote]:py-2 [&_blockquote]:rounded-r [&_blockquote_p]:my-0"
          />
        </div>
      </div>
    </Motion.div>
  );
};

export default BlogEditor;
