import React, { Suspense, lazy } from "react";

const BlogEditor = lazy(() => import("./BlogEditor"));

export default function LazyBlogEditor(props) {
  return (
    <Suspense
      fallback={
        <div className="h-32 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F5D26A]"></div>
        </div>
      }>
      <BlogEditor {...props} />
    </Suspense>
  );
}
