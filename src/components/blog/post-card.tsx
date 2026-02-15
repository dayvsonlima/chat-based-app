import Link from "next/link";
import type { BlogPost } from "@/lib/blog";

export function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm text-muted">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("pt-BR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>

        <h2 className="text-xl font-semibold leading-tight">{post.title}</h2>

        <p className="text-muted leading-relaxed">{post.description}</p>

        <div className="flex flex-wrap gap-2 pt-1">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
