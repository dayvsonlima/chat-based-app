import { BlogHeader } from "@/components/blog/blog-header";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <BlogHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
