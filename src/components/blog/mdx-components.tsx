import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { BlogCTA } from "./blog-cta";

export const mdxComponents: MDXComponents = {
  BlogCTA,
  h2: (props) => (
    <h2
      className="text-2xl font-bold mt-10 mb-4 scroll-mt-20"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="text-xl font-semibold mt-8 mb-3 scroll-mt-20"
      {...props}
    />
  ),
  p: (props) => <p className="leading-7 mb-4" {...props} />,
  a: ({ href, ...props }) => {
    if (href?.startsWith("/")) {
      return (
        <Link href={href} className="text-primary hover:underline" {...props} />
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
        {...props}
      />
    );
  },
  ul: (props) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
  ol: (props) => (
    <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />
  ),
  li: (props) => <li className="leading-7" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="border-l-4 border-primary pl-4 italic text-muted my-4"
      {...props}
    />
  ),
  code: (props) => (
    <code
      className="bg-card rounded px-1.5 py-0.5 text-sm font-mono"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="bg-card border border-border rounded-lg p-4 overflow-x-auto my-4 text-sm"
      {...props}
    />
  ),
  hr: () => <hr className="border-border my-8" />,
  strong: (props) => <strong className="font-semibold" {...props} />,
};
