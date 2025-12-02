import { sql } from "./db";

export async function ensureSchema(): Promise<void> {
  // Ensure extension for UUID generation exists
  await sql`create extension if not exists pgcrypto`;
  // users table
  await sql`
    create table if not exists users (
      id uuid primary key default gen_random_uuid(),
      email text unique not null,
      name text,
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

  // addresses table (alamat)
  await sql`
    create table if not exists addresses (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references users(id) on delete set null,
      label text,
      recipient_name text,
      phone text,
      address text not null,
      city text,
      postal_code text,
      is_default boolean not null default false,
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
      status text not null default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
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
  await sql`create index if not exists idx_orders_user on orders(user_id);`;

  // Ensure orders table has required columns when upgrading existing schema
  // Add 'status' column if missing (with default pending) and 'updated_at'
  await sql`alter table orders add column if not exists status text not null default 'pending'`;
  await sql`alter table orders add column if not exists updated_at timestamptz not null default now()`;
  // Add shipping_cost_cents column for shipping cost calculation
  await sql`alter table orders add column if not exists shipping_cost_cents integer not null default 0 check (shipping_cost_cents >= 0)`;

  // Add check constraint for status values if it doesn't already exist
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_status'
      ) THEN
        ALTER TABLE orders ADD CONSTRAINT chk_orders_status CHECK (
          status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')
        );
      END IF;
    END
    $$;
  `;

  // Ensure users table has a 'name' column when upgrading existing schema
  await sql`alter table users add column if not exists name text`;
  
  // Add role column to users table (default 'user', can be 'admin')
  await sql`alter table users add column if not exists role text not null default 'user'`;
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_role'
      ) THEN
        ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (
          role in ('user', 'admin')
        );
      END IF;
    END
    $$;
  `;

  // categories table
  await sql`
    create table if not exists categories (
      id uuid primary key default gen_random_uuid(),
      name text not null unique,
      description text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `;

  // Add category_id and image to products table
  await sql`alter table products add column if not exists category_id uuid references categories(id) on delete set null`;
  await sql`alter table products add column if not exists image text`;
  await sql`alter table products add column if not exists description text`;

  // settings table (for store settings)
  await sql`
    create table if not exists settings (
      id uuid primary key default gen_random_uuid(),
      key text not null unique,
      value text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `;

  // Create indexes
  await sql`create index if not exists idx_products_category on products(category_id)`;
  await sql`create index if not exists idx_users_role on users(role)`;
}


