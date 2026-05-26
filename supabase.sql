create table if not exists line_memories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source_type text not null,
  source_id text,
  user_id text,
  raw_text text not null,
  summary text not null
);

create index if not exists line_memories_created_at_idx
  on line_memories (created_at desc);

create index if not exists line_memories_source_id_idx
  on line_memories (source_id);

create table if not exists price_rows (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source_id text,
  file_name text,
  sheet_name text not null,
  category text,
  product_name text not null,
  origin text,
  size text,
  unit text,
  kg numeric,
  jp_price_low numeric,
  jp_price_high numeric,
  malaysia_low numeric,
  malaysia_high numeric,
  thailand_low numeric,
  thailand_high numeric,
  singapore_low numeric,
  singapore_high numeric,
  cambodia_case numeric,
  cambodia_kg numeric,
  raw_row jsonb
);

create index if not exists price_rows_created_at_idx
  on price_rows (created_at desc);

create index if not exists price_rows_product_name_idx
  on price_rows (product_name);

create index if not exists price_rows_source_id_idx
  on price_rows (source_id);
