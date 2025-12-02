import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();

    // Total sales (revenue)
    const revenueResult = await sql`
      select coalesce(sum(total_cents), 0)::bigint as total
      from orders
      where status != 'cancelled'
    `;
    const revenue = Array.isArray(revenueResult) 
      ? revenueResult[0]?.total || 0 
      : (revenueResult as any).rows?.[0]?.total || 0;

    // Total orders
    const ordersResult = await sql`
      select count(*)::int as count
      from orders
      where status != 'cancelled'
    `;
    const totalOrders = Array.isArray(ordersResult)
      ? ordersResult[0]?.count || 0
      : (ordersResult as any).rows?.[0]?.count || 0;

    // Total customers
    const customersResult = await sql`
      select count(distinct user_id)::int as count
      from orders
      where user_id is not null
    `;
    const totalCustomers = Array.isArray(customersResult)
      ? customersResult[0]?.count || 0
      : (customersResult as any).rows?.[0]?.count || 0;

    // Total products
    const productsResult = await sql`
      select count(*)::int as count from products
    `;
    const totalProducts = Array.isArray(productsResult)
      ? productsResult[0]?.count || 0
      : (productsResult as any).rows?.[0]?.count || 0;

    // Orders by status
    const statusResult = await sql`
      select status, count(*)::int as count
      from orders
      group by status
    `;
    const ordersByStatus = Array.isArray(statusResult)
      ? statusResult
      : (statusResult as any).rows || [];

    // Recent orders (last 7 days)
    const recentOrdersResult = await sql`
      select count(*)::int as count
      from orders
      where created_at >= now() - interval '7 days'
      and status != 'cancelled'
    `;
    const recentOrders = Array.isArray(recentOrdersResult)
      ? recentOrdersResult[0]?.count || 0
      : (recentOrdersResult as any).rows?.[0]?.count || 0;

    // Monthly revenue (last 6 months)
    const monthlyRevenueResult = await sql`
      select 
        to_char(created_at, 'YYYY-MM') as month,
        coalesce(sum(total_cents), 0)::bigint as revenue
      from orders
      where created_at >= now() - interval '6 months'
      and status != 'cancelled'
      group by to_char(created_at, 'YYYY-MM')
      order by month
    `;
    const monthlyRevenue = Array.isArray(monthlyRevenueResult)
      ? monthlyRevenueResult
      : (monthlyRevenueResult as any).rows || [];

    return NextResponse.json({
      revenue: Number(revenue),
      totalOrders,
      totalCustomers,
      totalProducts,
      recentOrders,
      ordersByStatus,
      monthlyRevenue,
    });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

