alter table public.blog_posts
  drop column if exists meta_title,
  drop column if exists meta_description;
