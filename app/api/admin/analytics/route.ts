import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();

    // Revenue by day (last 30 days)
    const dailyRevenueResult = await sql`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total_cents), 0)::bigint as revenue,
        COUNT(*)::int as orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
        AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    const dailyRevenue = Array.isArray(dailyRevenueResult)
      ? dailyRevenueResult
      : (dailyRevenueResult as any).rows || [];

    // Revenue by month (last 12 months)
    const monthlyRevenueResult = await sql`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COALESCE(SUM(total_cents), 0)::bigint as revenue,
        COUNT(*)::int as orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '12 months'
        AND status != 'cancelled'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `;
    const monthlyRevenue = Array.isArray(monthlyRevenueResult)
      ? monthlyRevenueResult
      : (monthlyRevenueResult as any).rows || [];

    // Revenue by status
    const revenueByStatusResult = await sql`
      SELECT 
        status,
        COALESCE(SUM(total_cents), 0)::bigint as revenue,
        COUNT(*)::int as count
      FROM orders
      GROUP BY status
      ORDER BY revenue DESC
    `;
    const revenueByStatus = Array.isArray(revenueByStatusResult)
      ? revenueByStatusResult
      : (revenueByStatusResult as any).rows || [];

    // Top products by revenue
    const topProductsResult = await sql`
      SELECT 
        p.id,
        p.name,
        p.image,
        COALESCE(SUM(oi.price_cents * oi.quantity), 0)::bigint as revenue,
        COALESCE(SUM(oi.quantity), 0)::int as quantity_sold,
        COUNT(DISTINCT o.id)::int as order_count
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
      GROUP BY p.id, p.name, p.image
      HAVING COALESCE(SUM(oi.price_cents * oi.quantity), 0) > 0
      ORDER BY revenue DESC
      LIMIT 10
    `;
    const topProducts = Array.isArray(topProductsResult)
      ? topProductsResult
      : (topProductsResult as any).rows || [];

    // Revenue by payment method
    const revenueByPaymentMethodResult = await sql`
      SELECT 
        COALESCE(payment_method, 'unknown') as payment_method,
        COALESCE(SUM(total_cents), 0)::bigint as revenue,
        COUNT(*)::int as count
      FROM orders
      WHERE status != 'cancelled'
      GROUP BY payment_method
      ORDER BY revenue DESC
    `;
    const revenueByPaymentMethod = Array.isArray(revenueByPaymentMethodResult)
      ? revenueByPaymentMethodResult
      : (revenueByPaymentMethodResult as any).rows || [];

    // Orders by day of week
    const ordersByDayOfWeekResult = await sql`
      SELECT 
        TO_CHAR(created_at, 'Day') as day_name,
        EXTRACT(DOW FROM created_at)::int as day_of_week,
        COALESCE(SUM(total_cents), 0)::bigint as revenue,
        COUNT(*)::int as orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '90 days'
        AND status != 'cancelled'
      GROUP BY TO_CHAR(created_at, 'Day'), EXTRACT(DOW FROM created_at)
      ORDER BY day_of_week
    `;
    const ordersByDayOfWeek = Array.isArray(ordersByDayOfWeekResult)
      ? ordersByDayOfWeekResult
      : (ordersByDayOfWeekResult as any).rows || [];

    // Average order value over time
    const avgOrderValueResult = await sql`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COALESCE(AVG(total_cents), 0)::bigint as avg_order_value,
        COALESCE(SUM(total_cents), 0)::bigint as total_revenue,
        COUNT(*)::int as order_count
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '12 months'
        AND status != 'cancelled'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `;
    const avgOrderValue = Array.isArray(avgOrderValueResult)
      ? avgOrderValueResult
      : (avgOrderValueResult as any).rows || [];

    // Customer acquisition over time
    const customerAcquisitionResult = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id)::int as new_customers
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
        AND user_id IS NOT NULL
        AND status != 'cancelled'
        AND NOT EXISTS (
          SELECT 1 FROM orders o2 
          WHERE o2.user_id = orders.user_id 
            AND o2.created_at < orders.created_at
        )
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    const customerAcquisition = Array.isArray(customerAcquisitionResult)
      ? customerAcquisitionResult
      : (customerAcquisitionResult as any).rows || [];

    // Total statistics
    const totalStatsResult = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_cents ELSE 0 END), 0)::bigint as total_revenue,
        COUNT(*)::int as total_orders,
        COUNT(DISTINCT user_id)::int as total_customers,
        COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total_cents ELSE NULL END), 0)::bigint as avg_order_value,
        COALESCE(SUM(CASE WHEN status != 'cancelled' AND created_at >= NOW() - INTERVAL '7 days' THEN total_cents ELSE 0 END), 0)::bigint as revenue_last_7_days,
        COALESCE(SUM(CASE WHEN status != 'cancelled' AND created_at >= NOW() - INTERVAL '30 days' THEN total_cents ELSE 0 END), 0)::bigint as revenue_last_30_days
      FROM orders
    `;
    const totalStats = Array.isArray(totalStatsResult)
      ? totalStatsResult[0] || {}
      : (totalStatsResult as any).rows?.[0] || {};

    return NextResponse.json({
      dailyRevenue,
      monthlyRevenue,
      revenueByStatus,
      topProducts,
      revenueByPaymentMethod,
      ordersByDayOfWeek,
      avgOrderValue,
      customerAcquisition,
      totalStats,
    });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

