/**
 * Analytics Service
 * Handles analytics data aggregation and calculations
 */

import { db } from '../db';
import { eq, and, gte, lte, sql, desc, count, sum, avg } from 'drizzle-orm';
import { transactions, clients, products, performanceMetrics, aumTrends, salesPipeline } from '@shared/schema';

// ============================================================================
// Types
// ============================================================================

export interface OrderAnalytics {
  totalOrders: number;
  totalValue: number;
  averageOrderValue: number;
  ordersByStatus: Array<{ status: string; count: number; value: number }>;
  ordersByType: Array<{ type: string; count: number; value: number }>;
  ordersByClient: Array<{ clientId: number; clientName: string; count: number; value: number }>;
  ordersByProduct: Array<{ productId: number; productName: string; count: number; value: number }>;
  ordersOverTime: Array<{ date: string; count: number; value: number }>;
  topClients: Array<{ clientId: number; clientName: string; orderCount: number; totalValue: number }>;
  topProducts: Array<{ productId: number; productName: string; orderCount: number; totalValue: number }>;
}

export interface PerformanceMetrics {
  totalAUM: number;
  totalClients: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  clientRetentionRate: number;
  orderSuccessRate: number;
  averageClientValue: number;
  growthMetrics: {
    aumGrowth: number;
    clientGrowth: number;
    orderGrowth: number;
    revenueGrowth: number;
  };
  trends: Array<{
    period: string;
    aum: number;
    clients: number;
    orders: number;
    revenue: number;
  }>;
}

export interface ClientInsights {
  totalClients: number;
  activeClients: number;
  newClients: number;
  clientsByTier: Array<{ tier: string; count: number; aum: number }>;
  clientsByRiskProfile: Array<{ riskProfile: string; count: number }>;
  clientAcquisitionTrend: Array<{ period: string; count: number }>;
  clientRetentionRate: number;
  averageClientValue: number;
  topClients: Array<{
    clientId: number;
    clientName: string;
    aum: number;
    orderCount: number;
    lastOrderDate: string;
  }>;
  clientSegmentation: {
    byAUM: Array<{ range: string; count: number }>;
    byActivity: Array<{ activity: string; count: number }>;
  };
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  clientId?: number;
  productId?: number;
  status?: string;
  transactionType?: string;
}

export interface AnalyticsSnapshotMetric {
  key: string;
  label: string;
  value: number;
  change: number;
  direction: 'up' | 'down' | 'flat';
}

export interface AnalyticsSnapshotResponse {
  generatedAt: string;
  metrics: AnalyticsSnapshotMetric[];
  clientSummary: {
    totalClients: number;
    newClients: number;
    retentionRate: number;
  };
  revenueSummary: {
    totalRevenue: number;
    averageOrderValue: number;
    orderSuccessRate: number;
  };
  topClients: Array<{ clientId: number; clientName: string; totalValue: number; orderCount: number }>;
}

// ============================================================================
// Order Analytics
// ============================================================================

/**
 * Get order analytics
 */
export async function getOrderAnalytics(
  userId: number,
  filters?: AnalyticsFilters
): Promise<OrderAnalytics> {
  try {
    // Build date filter
    const dateFilter = filters?.startDate || filters?.endDate
      ? and(
          filters.startDate ? gte(transactions.transactionDate, new Date(filters.startDate)) : undefined,
          filters.endDate ? lte(transactions.transactionDate, new Date(filters.endDate)) : undefined
        )
      : undefined;

    // Get all transactions (orders) for the user's clients
    const clientFilter = filters?.clientId
      ? eq(transactions.clientId, filters.clientId)
      : sql`1=1`;

    // Total orders and value
    const totalStats = await db
      .select({
        totalOrders: count(),
        totalValue: sum(transactions.totalAmount),
      })
      .from(transactions)
      .where(and(clientFilter, dateFilter));

    const totalOrders = Number(totalStats[0]?.totalOrders || 0);
    const totalValue = Number(totalStats[0]?.totalValue || 0);
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

    // Orders by status
    const ordersByStatus = await db
      .select({
        status: transactions.status,
        count: count(),
        value: sum(transactions.totalAmount),
      })
      .from(transactions)
      .where(and(clientFilter, dateFilter))
      .groupBy(transactions.status);

    // Orders by transaction type
    const ordersByType = await db
      .select({
        type: transactions.transactionType,
        count: count(),
        value: sum(transactions.totalAmount),
      })
      .from(transactions)
      .where(and(clientFilter, dateFilter))
      .groupBy(transactions.transactionType);

    // Orders by client
    const ordersByClient = await db
      .select({
        clientId: transactions.clientId,
        clientName: clients.fullName,
        count: count(),
        value: sum(transactions.totalAmount),
      })
      .from(transactions)
      .leftJoin(clients, eq(transactions.clientId, clients.id))
      .where(and(clientFilter, dateFilter))
      .groupBy(transactions.clientId, clients.fullName)
      .limit(10);

    // Orders by product
    const ordersByProduct = await db
      .select({
        productId: sql<number>`CAST(${transactions.productName} AS INTEGER)`,
        productName: transactions.productName,
        count: count(),
        value: sum(transactions.totalAmount),
      })
      .from(transactions)
      .where(and(clientFilter, dateFilter))
      .groupBy(transactions.productName)
      .limit(10);

    // Orders over time (daily)
    const ordersOverTime = await db
      .select({
        date: sql<string>`DATE(${transactions.transactionDate})::text`,
        count: count(),
        value: sum(transactions.totalAmount),
      })
      .from(transactions)
      .where(and(clientFilter, dateFilter))
      .groupBy(sql`DATE(${transactions.transactionDate})`)
      .orderBy(sql`DATE(${transactions.transactionDate})`);

    // Top clients
    const topClients = await db
      .select({
        clientId: transactions.clientId,
        clientName: clients.fullName,
        orderCount: count(),
        totalValue: sum(transactions.totalAmount),
      })
      .from(transactions)
      .leftJoin(clients, eq(transactions.clientId, clients.id))
      .where(and(clientFilter, dateFilter))
      .groupBy(transactions.clientId, clients.fullName)
      .orderBy(desc(sum(transactions.totalAmount)))
      .limit(10);

    // Top products
    const topProducts = await db
      .select({
        productId: sql<number>`1`, // Placeholder
        productName: transactions.productName,
        orderCount: count(),
        totalValue: sum(transactions.totalAmount),
      })
      .from(transactions)
      .where(and(clientFilter, dateFilter))
      .groupBy(transactions.productName)
      .orderBy(desc(sum(transactions.totalAmount)))
      .limit(10);

    return {
      totalOrders,
      totalValue,
      averageOrderValue,
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.status || 'Unknown',
        count: Number(s.count),
        value: Number(s.value || 0),
      })),
      ordersByType: ordersByType.map((t) => ({
        type: t.type || 'Unknown',
        count: Number(t.count),
        value: Number(t.value || 0),
      })),
      ordersByClient: ordersByClient.map((c) => ({
        clientId: c.clientId || 0,
        clientName: c.clientName || 'Unknown',
        count: Number(c.count),
        value: Number(c.value || 0),
      })),
      ordersByProduct: ordersByProduct.map((p) => ({
        productId: Number(p.productId || 0),
        productName: p.productName || 'Unknown',
        count: Number(p.count),
        value: Number(p.value || 0),
      })),
      ordersOverTime: ordersOverTime.map((o) => ({
        date: o.date || '',
        count: Number(o.count),
        value: Number(o.value || 0),
      })),
      topClients: topClients.map((c) => ({
        clientId: c.clientId || 0,
        clientName: c.clientName || 'Unknown',
        orderCount: Number(c.orderCount),
        totalValue: Number(c.totalValue || 0),
      })),
      topProducts: topProducts.map((p) => ({
        productId: Number(p.productId || 0),
        productName: p.productName || 'Unknown',
        orderCount: Number(p.orderCount),
        totalValue: Number(p.totalValue || 0),
      })),
    };
  } catch (error: any) {
    console.error('Get order analytics error:', error);
    throw new Error(`Failed to get order analytics: ${error.message}`);
  }
}

// ============================================================================
// Performance Metrics
// ============================================================================

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics(
  userId: number,
  filters?: AnalyticsFilters
): Promise<PerformanceMetrics> {
  try {
    const dateFilter = filters?.startDate || filters?.endDate
      ? and(
          filters.startDate ? gte(transactions.transactionDate, new Date(filters.startDate)) : undefined,
          filters.endDate ? lte(transactions.transactionDate, new Date(filters.endDate)) : undefined
        )
      : undefined;

    // Get total AUM from clients
    const aumStats = await db
      .select({
        totalAUM: sum(sql`CAST(${clients.aumValue} AS NUMERIC)`),
        totalClients: count(),
      })
      .from(clients)
      .where(eq(clients.assignedTo, userId));

    const totalAUM = Number(aumStats[0]?.totalAUM || 0);
    const totalClients = Number(aumStats[0]?.totalClients || 0);

    // Get total orders and revenue
    const orderStats = await db
      .select({
        totalOrders: count(),
        totalRevenue: sum(transactions.totalAmount),
        averageOrderValue: avg(transactions.totalAmount),
      })
      .from(transactions)
      .innerJoin(clients, eq(transactions.clientId, clients.id))
      .where(and(eq(clients.assignedTo, userId), dateFilter));

    const totalOrders = Number(orderStats[0]?.totalOrders || 0);
    const totalRevenue = Number(orderStats[0]?.totalRevenue || 0);
    const averageOrderValue = Number(orderStats[0]?.averageOrderValue || 0);

    // Calculate success rate (completed transactions)
    const successStats = await db
      .select({
        successCount: count(),
      })
      .from(transactions)
      .innerJoin(clients, eq(transactions.clientId, clients.id))
      .where(
        and(
          eq(clients.assignedTo, userId),
          eq(transactions.status, 'completed'),
          dateFilter
        )
      );

    const successCount = Number(successStats[0]?.successCount || 0);
    const orderSuccessRate = totalOrders > 0 ? (successCount / totalOrders) * 100 : 0;

    // Client retention (clients with transactions in last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const activeClients = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${clients.id})`,
      })
      .from(clients)
      .innerJoin(transactions, eq(clients.id, transactions.clientId))
      .where(
        and(
          eq(clients.assignedTo, userId),
          gte(transactions.transactionDate, ninetyDaysAgo)
        )
      );

    const activeClientCount = Number(activeClients[0]?.count || 0);
    const clientRetentionRate = totalClients > 0 ? (activeClientCount / totalClients) * 100 : 0;

    const averageClientValue = totalClients > 0 ? totalAUM / totalClients : 0;

    // Get previous period for growth calculation
    const previousPeriodStart = filters?.startDate
      ? new Date(new Date(filters.startDate).getTime() - (new Date(filters.endDate || new Date()).getTime() - new Date(filters.startDate).getTime()))
      : new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
    const previousPeriodEnd = filters?.startDate ? new Date(filters.startDate) : new Date();

    const previousAumStats = await db
      .select({
        totalAUM: sum(sql`CAST(${clients.aumValue} AS NUMERIC)`),
        totalClients: count(),
      })
      .from(clients)
      .where(eq(clients.assignedTo, userId));

    const previousAUM = Number(previousAumStats[0]?.totalAUM || 0);
    const aumGrowth = previousAUM > 0 ? ((totalAUM - previousAUM) / previousAUM) * 100 : 0;

    const previousOrderStats = await db
      .select({
        totalOrders: count(),
        totalRevenue: sum(transactions.totalAmount),
      })
      .from(transactions)
      .innerJoin(clients, eq(transactions.clientId, clients.id))
      .where(
        and(
          eq(clients.assignedTo, userId),
          gte(transactions.transactionDate, previousPeriodStart),
          lte(transactions.transactionDate, previousPeriodEnd)
        )
      );

    const previousOrders = Number(previousOrderStats[0]?.totalOrders || 0);
    const previousRevenue = Number(previousOrderStats[0]?.totalRevenue || 0);

    const orderGrowth = previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders) * 100 : 0;
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const clientGrowth = 0; // Would need historical data

    // Trends (monthly)
    const trends = await db
      .select({
        period: sql<string>`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`,
        aum: sql<number>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
        orders: count(),
        revenue: sum(transactions.totalAmount),
      })
      .from(transactions)
      .innerJoin(clients, eq(transactions.clientId, clients.id))
      .where(and(eq(clients.assignedTo, userId), dateFilter))
      .groupBy(sql`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`)
      .limit(12);

    return {
      totalAUM,
      totalClients,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      clientRetentionRate,
      orderSuccessRate,
      averageClientValue,
      growthMetrics: {
        aumGrowth,
        clientGrowth,
        orderGrowth,
        revenueGrowth,
      },
      trends: trends.map((t) => ({
        period: t.period || '',
        aum: Number(t.aum || 0),
        clients: 0, // Would need separate query
        orders: Number(t.orders),
        revenue: Number(t.revenue || 0),
      })),
    };
  } catch (error: any) {
    console.error('Get performance metrics error:', error);
    throw new Error(`Failed to get performance metrics: ${error.message}`);
  }
}

// ============================================================================
// Client Insights
// ============================================================================

/**
 * Get client insights
 */
export async function getClientInsights(
  userId: number,
  filters?: AnalyticsFilters
): Promise<ClientInsights> {
  try {
    // Total clients
    const totalClientsResult = await db
      .select({
        totalClients: count(),
      })
      .from(clients)
      .where(eq(clients.assignedTo, userId));

    const totalClients = Number(totalClientsResult[0]?.totalClients || 0);

    // Active clients (with transactions in last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const activeClientsResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${clients.id})`,
      })
      .from(clients)
      .leftJoin(transactions, eq(clients.id, transactions.clientId))
      .where(
        and(
          eq(clients.assignedTo, userId),
          gte(transactions.transactionDate, ninetyDaysAgo)
        )
      );

    const activeClients = Number(activeClientsResult[0]?.count || 0);

    // New clients (created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newClientsResult = await db
      .select({
        count: count(),
      })
      .from(clients)
      .where(
        and(
          eq(clients.assignedTo, userId),
          gte(clients.createdAt, thirtyDaysAgo)
        )
      );

    const newClients = Number(newClientsResult[0]?.count || 0);

    // Clients by tier
    const clientsByTier = await db
      .select({
        tier: clients.tier,
        count: count(),
        aum: sum(sql`CAST(${clients.aumValue} AS NUMERIC)`),
      })
      .from(clients)
      .where(eq(clients.assignedTo, userId))
      .groupBy(clients.tier);

    // Clients by risk profile
    const clientsByRiskProfile = await db
      .select({
        riskProfile: clients.riskProfile,
        count: count(),
      })
      .from(clients)
      .where(eq(clients.assignedTo, userId))
      .groupBy(clients.riskProfile);

    // Client acquisition trend (monthly)
    const acquisitionTrend = await db
      .select({
        period: sql<string>`TO_CHAR(${clients.createdAt}, 'YYYY-MM')`,
        count: count(),
      })
      .from(clients)
      .where(eq(clients.assignedTo, userId))
      .groupBy(sql`TO_CHAR(${clients.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${clients.createdAt}, 'YYYY-MM') DESC`)
      .limit(12);

    // Client retention rate
    const clientRetentionRate = totalClients > 0 ? (activeClients / totalClients) * 100 : 0;

    // Average client value
    const avgClientValueResult = await db
      .select({
        avgValue: avg(sql`CAST(${clients.aumValue} AS NUMERIC)`),
      })
      .from(clients)
      .where(eq(clients.assignedTo, userId));

    const averageClientValue = Number(avgClientValueResult[0]?.avgValue || 0);

    // Top clients
    const topClients = await db
      .select({
        clientId: clients.id,
        clientName: clients.fullName,
        aum: sql`CAST(${clients.aumValue} AS NUMERIC)`,
        orderCount: sql<number>`(
          SELECT COUNT(*) FROM ${transactions} 
          WHERE ${transactions.clientId} = ${clients.id}
        )`,
        lastOrderDate: sql<string>`(
          SELECT MAX(${transactions.transactionDate})::text 
          FROM ${transactions} 
          WHERE ${transactions.clientId} = ${clients.id}
        )`,
      })
      .from(clients)
      .where(eq(clients.assignedTo, userId))
      .orderBy(desc(sql`CAST(${clients.aumValue} AS NUMERIC)`))
      .limit(10);

    // Client segmentation by AUM
    const segmentationByAUM = await db
      .select({
        range: sql<string>`CASE
          WHEN CAST(${clients.aumValue} AS NUMERIC) < 100000 THEN '< ₹1L'
          WHEN CAST(${clients.aumValue} AS NUMERIC) < 500000 THEN '₹1L - ₹5L'
          WHEN CAST(${clients.aumValue} AS NUMERIC) < 1000000 THEN '₹5L - ₹10L'
          WHEN CAST(${clients.aumValue} AS NUMERIC) < 5000000 THEN '₹10L - ₹50L'
          ELSE '> ₹50L'
        END`,
        count: count(),
      })
      .from(clients)
      .where(eq(clients.assignedTo, userId))
      .groupBy(sql`CASE
        WHEN CAST(${clients.aumValue} AS NUMERIC) < 100000 THEN '< ₹1L'
        WHEN CAST(${clients.aumValue} AS NUMERIC) < 500000 THEN '₹1L - ₹5L'
        WHEN CAST(${clients.aumValue} AS NUMERIC) < 1000000 THEN '₹5L - ₹10L'
        WHEN CAST(${clients.aumValue} AS NUMERIC) < 5000000 THEN '₹10L - ₹50L'
        ELSE '> ₹50L'
      END`);

    // Client segmentation by activity
    const segmentationByActivity = await db
      .select({
        activity: sql<string>`CASE
          WHEN EXISTS (
            SELECT 1 FROM ${transactions} 
            WHERE ${transactions.clientId} = ${clients.id} 
            AND ${transactions.transactionDate} >= NOW() - INTERVAL '30 days'
          ) THEN 'Active'
          WHEN EXISTS (
            SELECT 1 FROM ${transactions} 
            WHERE ${transactions.clientId} = ${clients.id} 
            AND ${transactions.transactionDate} >= NOW() - INTERVAL '90 days'
          ) THEN 'Moderate'
          ELSE 'Inactive'
        END`,
        count: count(),
      })
      .from(clients)
      .where(eq(clients.assignedTo, userId))
      .groupBy(sql`CASE
        WHEN EXISTS (
          SELECT 1 FROM ${transactions} 
          WHERE ${transactions.clientId} = ${clients.id} 
          AND ${transactions.transactionDate} >= NOW() - INTERVAL '30 days'
        ) THEN 'Active'
        WHEN EXISTS (
          SELECT 1 FROM ${transactions} 
          WHERE ${transactions.clientId} = ${clients.id} 
          AND ${transactions.transactionDate} >= NOW() - INTERVAL '90 days'
        ) THEN 'Moderate'
        ELSE 'Inactive'
      END`);

    return {
      totalClients,
      activeClients,
      newClients,
      clientsByTier: clientsByTier.map((t) => ({
        tier: t.tier || 'Unknown',
        count: Number(t.count),
        aum: Number(t.aum || 0),
      })),
      clientsByRiskProfile: clientsByRiskProfile.map((r) => ({
        riskProfile: r.riskProfile || 'Unknown',
        count: Number(r.count),
      })),
      clientAcquisitionTrend: acquisitionTrend.map((a) => ({
        period: a.period || '',
        count: Number(a.count),
      })),
      clientRetentionRate,
      averageClientValue,
      topClients: topClients.map((c) => ({
        clientId: c.clientId || 0,
        clientName: c.clientName || 'Unknown',
        aum: Number(c.aum || 0),
        orderCount: Number(c.orderCount || 0),
        lastOrderDate: c.lastOrderDate || '',
      })),
      clientSegmentation: {
        byAUM: segmentationByAUM.map((s) => ({
          range: s.range || 'Unknown',
          count: Number(s.count),
        })),
        byActivity: segmentationByActivity.map((s) => ({
          activity: s.activity || 'Unknown',
          count: Number(s.count),
        })),
      },
    };
  } catch (error: any) {
    console.error('Get client insights error:', error);
    throw new Error(`Failed to get client insights: ${error.message}`);
  }
}

/**
 * Get compact analytics snapshots for generative briefings
 */
export async function getAnalyticsSnapshots(userId: number): Promise<AnalyticsSnapshotResponse> {
  const directionFor = (value: number): 'up' | 'down' | 'flat' => {
    if (value > 0) return 'up';
    if (value < 0) return 'down';
    return 'flat';
  };

  const [performance, orders, clients] = await Promise.all([
    getPerformanceMetrics(userId, {}),
    getOrderAnalytics(userId, {}),
    getClientInsights(userId, {}),
  ]);

  const metrics: AnalyticsSnapshotMetric[] = [
    {
      key: 'aum',
      label: 'Total AUM',
      value: performance.totalAUM,
      change: performance.growthMetrics.aumGrowth,
      direction: directionFor(performance.growthMetrics.aumGrowth),
    },
    {
      key: 'revenue',
      label: 'Revenue',
      value: performance.totalRevenue,
      change: performance.growthMetrics.revenueGrowth,
      direction: directionFor(performance.growthMetrics.revenueGrowth),
    },
    {
      key: 'orders',
      label: 'Orders',
      value: performance.totalOrders,
      change: performance.growthMetrics.orderGrowth,
      direction: directionFor(performance.growthMetrics.orderGrowth),
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    metrics,
    clientSummary: {
      totalClients: clients.totalClients,
      newClients: clients.newClients,
      retentionRate: clients.clientRetentionRate,
    },
    revenueSummary: {
      totalRevenue: performance.totalRevenue,
      averageOrderValue: performance.averageOrderValue,
      orderSuccessRate: performance.orderSuccessRate,
    },
    topClients: orders.topClients.slice(0, 3).map((client) => ({
      clientId: client.clientId,
      clientName: client.clientName,
      totalValue: client.totalValue,
      orderCount: client.orderCount,
    })),
  };
}

