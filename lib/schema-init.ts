import { sql } from "./db";

export async function ensureSchema(): Promise<void> {
  // Ensure extension for UUID generation exists
  await sql`create extension if not exists pgcrypto`;
  // users table
  await sql`
    create table if not exists users (
      id uuid primary key default gen_random_uuid(),
      email text unique not null,
      password_hash text not null,
      created_at timestamptz not null default now()
    );
  `;

  // products table
  await sql`
    create table if not exists products (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      price_cents integer not null check (price_cents >= 0),
      stock integer not null default 0 check (stock >= 0),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `;

  // orders table
  await sql`
    create table if not exists orders (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references users(id) on delete set null,
      total_cents integer not null check (total_cents >= 0),
      created_at timestamptz not null default now()
    );
  `;

  // order_items table
  await sql`
    create table if not exists order_items (
      id uuid primary key default gen_random_uuid(),
      order_id uuid not null references orders(id) on delete cascade,
      product_id uuid not null references products(id) on delete restrict,
      quantity integer not null check (quantity > 0),
      price_cents integer not null check (price_cents >= 0)
    );
  `;

  // indexes
  await sql`create index if not exists idx_users_email on users(email);`;
  await sql`create index if not exists idx_products_name on products(name);`;
  await sql`create index if not exists idx_order_items_order on order_items(order_id);`;
}


