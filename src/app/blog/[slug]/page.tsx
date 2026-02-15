import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllSlugs, getPostBySlug } from "@/lib/blog";
import { mdxComponents } from "@/components/blog/mdx-components";
import { BlogCTA } from "@/components/blog/blog-cta";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) return {};

  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://selene.app"}/blog/${slug}`;

  return {
    title: `${post.title} — Selene`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      url,
      ...(post.image && { images: [post.image] }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      ...(post.image && { images: [post.image] }),
    },
    alternates: { canonical: url },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post || !post.published) notFound();

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://selene.app";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: post.author,
    },
    url: `${appUrl}/blog/${slug}`,
    ...(post.image && { image: post.image }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-10 space-y-4">
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
            <span>·</span>
            <span>{post.author}</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight">{post.title}</h1>

          <p className="text-lg text-muted">{post.description}</p>

          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className="prose-custom">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>

        <footer className="mt-12 pt-8 border-t border-border">
          <BlogCTA />
        </footer>
      </article>
    </>
  );
}
