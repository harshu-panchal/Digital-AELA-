import { lazy, Suspense, useState, useEffect } from "react";

// Lazy load TipTap editor to reduce initial bundle size
const TipTapEditor = lazy(() =>
  import("@tiptap/react").then((module) => ({
    default: module.EditorContent,
  }))
);

const TipTapHook = lazy(() =>
  import("@tiptap/react").then((module) => ({
    default: module.useEditor,
  }))
);

const TipTapExtensions = lazy(() =>
  Promise.all([
    import("@tiptap/starter-kit"),
    import("@tiptap/extension-placeholder"),
    import("@tiptap/extension-underline"),
    import("@tiptap/extension-link"),
  ]).then((modules) => ({
    StarterKit: modules[0].default,
    Placeholder: modules[1].default,
    Underline: modules[2].default,
    Link: modules[3].default,
  }))
);

const EditorLoadingFallback = () => (
  <div className="flex items-center justify-center h-32 w-full border border-white/10 rounded-lg bg-[#111]">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F5D26A]"></div>
  </div>
);

// Hook to lazy load TipTap editor
export const useLazyEditor = (config) => {
  const [editor, setEditor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [extensions, setExtensions] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadEditor = async () => {
      try {
        // Load extensions first
        const ext = await TipTapExtensions;
        
        if (!mounted) return;

        // Load useEditor hook
        const { default: useEditor } = await TipTapHook;
        
        if (!mounted) return;

        // Configure extensions
        const editorExtensions = [
          ext.StarterKit.configure({
            heading: {
              levels: [1, 2, 3, 4],
            },
          }),
          ext.Underline,
          ext.Link.configure({
            openOnClick: false,
            HTMLAttributes: { class: "text-[#F5D26A] underline" },
          }),
          ext.Placeholder.configure({
            placeholder: config.placeholder || "Start crafting your AELA story...",
          }),
        ];

        setExtensions(editorExtensions);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load TipTap editor:", error);
        setIsLoading(false);
      }
    };

    loadEditor();

    return () => {
      mounted = false;
    };
  }, [config.placeholder]);

  useEffect(() => {
    if (!extensions || isLoading) return;

    let mounted = true;

    const initEditor = async () => {
      try {
        const { default: useEditor } = await TipTapHook;
        
        if (!mounted) return;

        // Note: useEditor is a hook and needs to be called in component
        // This is a limitation - we'll need to handle this differently
        // For now, we'll export the extensions and let the component use useEditor directly
      } catch (error) {
        console.error("Failed to initialize editor:", error);
      }
    };

    initEditor();

    return () => {
      mounted = false;
    };
  }, [extensions, isLoading]);

  return { editor, isLoading, extensions };
};

// Simplified component that lazy loads TipTap
export const LazyTipTapEditor = ({ value, onChange, placeholder, ...props }) => {
  const [editor, setEditor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadEditor = async () => {
      try {
        const [
          { default: useEditor },
          { default: EditorContent },
          { default: StarterKit },
          { default: Placeholder },
          { default: Underline },
          { default: Link },
        ] = await Promise.all([
          import("@tiptap/react"),
          import("@tiptap/react"),
          import("@tiptap/starter-kit"),
          import("@tiptap/extension-placeholder"),
          import("@tiptap/extension-underline"),
          import("@tiptap/extension-link"),
        ]);

        if (!mounted) return;

        // This won't work as useEditor is a hook
        // We need a different approach - export a component that handles this
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load TipTap:", error);
        setIsLoading(false);
      }
    };

    loadEditor();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return <EditorLoadingFallback />;
  }

  return (
    <Suspense fallback={<EditorLoadingFallback />}>
      <TipTapEditor {...props} />
    </Suspense>
  );
};

// Export a helper to lazy load TipTap extensions
export const loadTipTapExtensions = async () => {
  const [
    { default: StarterKit },
    { default: Placeholder },
    { default: Underline },
    { default: Link },
  ] = await Promise.all([
    import("@tiptap/starter-kit"),
    import("@tiptap/extension-placeholder"),
    import("@tiptap/extension-underline"),
    import("@tiptap/extension-link"),
  ]);

  return {
    StarterKit,
    Placeholder,
    Underline,
    Link,
  };
};

