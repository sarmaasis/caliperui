"use client";
import { useMemo, useState } from "react";
import { Badge } from "./badge";
import { Avatar } from "./avatar";
import { cn } from "./lib/cn";
import "./shared/table-skeleton.css";
import "./shared/prompt-suggestion.css";
import "./blog-grid.css";

export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  href: string;
  /** ISO date. */
  date: string;
  readTime?: string;
  category?: string;
  author?: { name: string; avatar?: string };
  image?: { src: string; alt: string };
};

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function PostCard({ post, featured }: { post: BlogPost; featured?: boolean }) {
  return (
    <article data-slot="blog-card" data-featured={featured || undefined} className="group relative grid content-start gap-3">
      {post.image && (
        <div className={cn("overflow-hidden rounded-overlay bg-muted", featured ? "aspect-[16/9]" : "aspect-[3/2]")}>
          <img src={post.image.src} alt={post.image.alt} loading="lazy" draggable={false} data-slot="blog-image" className="size-full object-cover" />
        </div>
      )}
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {post.category && <Badge>{post.category}</Badge>}
          <time dateTime={post.date}>{dateFormat.format(new Date(post.date))}</time>
          {post.readTime && <span aria-hidden="true">·</span>}
          {post.readTime && <span>{post.readTime}</span>}
        </div>
        <h3 className={cn("font-semibold tracking-tight", featured ? "text-xl sm:text-2xl" : "text-base")}>
          <a href={post.href} data-slot="blog-link">
            {post.title}
          </a>
        </h3>
        <p className={cn("text-muted-foreground", featured ? "line-clamp-3 text-base" : "line-clamp-3 text-sm")}>{post.excerpt}</p>
        {post.author && (
          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Avatar name={post.author.name} src={post.author.avatar} className="size-6 text-[10px]" alt="" />
            {post.author.name}
          </p>
        )}
      </div>
    </article>
  );
}

/** Articles in a grid, the newest one larger, with an optional category filter. */
export function BlogGrid({
  posts,
  title = "From the blog",
  description,
  featured = true,
  loading,
  className,
}: {
  posts: readonly BlogPost[];
  title?: string;
  description?: string;
  /** Show the first post larger when there are at least three. */
  featured?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const categories = useMemo(() => [...new Set(posts.map((p) => p.category).filter((c): c is string => !!c))], [posts]);
  const shown = category ? posts.filter((p) => p.category === category) : posts;
  const lead = featured && shown.length >= 3 ? shown[0] : null;
  const rest = lead ? shown.slice(1) : shown;
  return (
    <section data-slot="blog-grid" aria-label={title} className={cn("@container mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {categories.length > 1 && (
          <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-1.5">
            {[null, ...categories].map((c) => (
              <button key={c ?? "all"} type="button" data-slot="prompt-suggestion" aria-pressed={category === c} onClick={() => setCategory(c)}>
                {c ?? "All"}
              </button>
            ))}
          </div>
        )}
      </div>
      {loading ? (
        <div aria-busy="true" className="grid gap-8 @xl:grid-cols-2 @4xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="grid gap-3" aria-hidden="true">
              <span data-slot="table-skeleton" style={{ height: "10rem" }} />
              <span data-slot="table-skeleton" style={{ width: "40%" }} />
              <span data-slot="table-skeleton" />
            </div>
          ))}
        </div>
      ) : shown.length ? (
        <div className="grid gap-x-6 gap-y-10 @xl:grid-cols-2 @4xl:grid-cols-3">
          {lead && (
            <div className="@xl:col-span-2">
              <PostCard post={lead} featured />
            </div>
          )}
          {rest.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="rounded-overlay border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No posts in this category yet.</p>
      )}
      <p className="sr-only" role="status">
        {category ? `${shown.length} ${shown.length === 1 ? "post" : "posts"} in ${category}` : ""}
      </p>
    </section>
  );
}
