import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { PostCard } from "@/components/blog/post-card";

export const metadata: Metadata = {
  title: "Blog — Selene",
  description:
    "Dicas, tutoriais e novidades sobre inteligencia artificial e produtividade.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="space-y-2 mb-10">
        <h1 className="text-3xl font-bold">Blog</h1>
        <p className="text-muted text-lg">
          Novidades, dicas e tutoriais sobre IA e produtividade.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted">Nenhum post publicado ainda.</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
