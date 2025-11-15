import {
  ActionRecommendation,
  AnalyticsNarrative,
  BenchmarkInsight,
  BenchmarkValueFormat,
  ClientInsights,
  OrderAnalytics,
  PerformanceMetrics,
} from '../types/analytics.types';

type OrderAnalyticsCore = Omit<OrderAnalytics, 'narrative' | 'benchmarks'>;
type PerformanceMetricsCore = Omit<PerformanceMetrics, 'narrative' | 'benchmarks'>;
type ClientInsightsCore = Omit<ClientInsights, 'narrative' | 'benchmarks'>;

const numberFormatter = new Intl.NumberFormat('en-IN');
function createBenchmark(
  metric: string,
  currentValue: number,
  benchmarkValue: number,
  format: BenchmarkValueFormat,
  narrative?: string,
): BenchmarkInsight {
  const variance = benchmarkValue === 0 ? 0 : ((currentValue - benchmarkValue) / benchmarkValue) * 100;
  let direction: BenchmarkInsight['direction'] = 'on_track';
  if (variance > 2) {
    direction = 'above';
  } else if (variance < -2) {
    direction = 'below';
  }

  return {
    metric,
    currentValue,
    benchmarkValue,
    variance,
    direction,
    format,
    narrative,
  };
}

function generateOrderNarrative(data: OrderAnalyticsCore): AnalyticsNarrative {
  const first = data.ordersOverTime[0];
  const last = data.ordersOverTime[data.ordersOverTime.length - 1];
  const velocity = first && first.count > 0 ? ((last.count - first.count) / first.count) * 100 : 0;
  const topClient = data.topClients?.[0];

  return {
    headline: `Order volume at ${numberFormatter.format(data.totalOrders)} orders`,
    summary: `Order velocity ${velocity >= 0 ? 'improved' : 'softened'} ${Math.abs(velocity).toFixed(1)}% versus the start of the period, with average ticket sizes at ₹${numberFormatter.format(
      Math.round(data.averageOrderValue),
    )}.`,
    supportingPoints: [
      `Total consideration processed reached ₹${numberFormatter.format(Math.round(data.totalValue))}.`,
      topClient
        ? `${topClient.clientName} led contribution with ₹${numberFormatter.format(Math.round(topClient.totalValue))} across ${topClient.orderCount} orders.`
        : 'Order flow is diversified with no single client dominating volume.',
      `Top products account for ${numberFormatter.format(data.topProducts.slice(0, 3).reduce((sum, product) => sum + product.totalValue, 0))} in value across the period.`,
    ],
  };
}

function generatePerformanceNarrative(data: PerformanceMetricsCore): AnalyticsNarrative {
  return {
    headline: `AUM now at ₹${numberFormatter.format(Math.round(data.totalAUM))}`,
    summary: `Revenue tracked at ₹${numberFormatter.format(Math.round(data.totalRevenue))} with growth of ${data.growthMetrics.revenueGrowth.toFixed(
      1,
    )}% period over period while client retention stands at ${data.clientRetentionRate.toFixed(1)}%.`,
    supportingPoints: [
      `Order success rate remains ${data.orderSuccessRate.toFixed(1)}%, supporting average order values of ₹${numberFormatter.format(
        Math.round(data.averageOrderValue),
      )}.`,
      `Client base expanded to ${numberFormatter.format(data.totalClients)} with growth of ${data.growthMetrics.clientGrowth.toFixed(1)}%.`,
      `AUM growth registered ${data.growthMetrics.aumGrowth.toFixed(1)}% with consistent revenue uplift across the observed periods.`,
    ],
  };
}

function generateClientNarrative(data: ClientInsightsCore): AnalyticsNarrative {
  const activeRatio = data.totalClients > 0 ? (data.activeClients / data.totalClients) * 100 : 0;
  const topClient = data.topClients?.[0];
  return {
    headline: `${numberFormatter.format(data.totalClients)} clients with ${activeRatio.toFixed(1)}% active engagement`,
    summary: `Retention is holding at ${data.clientRetentionRate.toFixed(1)}% with ${numberFormatter.format(data.newClients)} new additions this period.`,
    supportingPoints: [
      topClient
        ? `${topClient.clientName} leads with ₹${numberFormatter.format(Math.round(topClient.aum))} in AUM and ${topClient.orderCount} orders.`
        : 'Client concentration remains balanced without a dominant account.',
      `Tier distribution highlights ${data.clientsByTier[0]?.tier ?? 'diverse'} segments requiring tailored playbooks.`,
      `Risk mix spans ${data.clientsByRiskProfile.length} profiles, supporting cross-sell targeting.`,
    ],
  };
}

function generateOrderBenchmarks(data: OrderAnalyticsCore): BenchmarkInsight[] {
  const targetVolume = data.totalOrders * 0.92;
  const targetValue = data.totalValue * 0.9;
  const topClientShare = data.totalValue > 0 && data.topClients.length
    ? (data.topClients[0].totalValue / data.totalValue) * 100
    : 0;

  const volumeBenchmark = createBenchmark('Order volume vs. target', data.totalOrders, targetVolume, 'number');
  volumeBenchmark.narrative = `Order volume is ${data.totalOrders >= targetVolume ? 'ahead of' : 'trailing'} target by ${Math.abs(
    volumeBenchmark.variance,
  ).toFixed(1)}%.`;

  const valueBenchmark = createBenchmark('Order value vs. target', data.totalValue, targetValue, 'currency');
  valueBenchmark.narrative = `Total consideration is ${data.totalValue >= targetValue ? 'above' : 'below'} the goalpost by ${Math.abs(
    valueBenchmark.variance,
  ).toFixed(1)}%.`;

  const concentrationBenchmark = createBenchmark(
    'Top client concentration',
    Number.isFinite(topClientShare) ? topClientShare : 0,
    30,
    'percent',
  );
  concentrationBenchmark.narrative =
    topClientShare > 30
      ? 'Top client concentration is elevated; diversify acquisition to de-risk revenue.'
      : 'Client contribution is balanced against diversification guardrails.';

  return [volumeBenchmark, valueBenchmark, concentrationBenchmark];
}

function generatePerformanceBenchmarks(data: PerformanceMetricsCore): BenchmarkInsight[] {
  const successTarget = 95;
  const retentionTarget = 90;
  const revenueGrowthTarget = 15;

  return [
    createBenchmark(
      'Order success rate',
      data.orderSuccessRate,
      successTarget,
      'percent',
      `Order success is ${data.orderSuccessRate >= successTarget ? 'beating' : 'lagging'} the service goal of ${successTarget}%.`,
    ),
    createBenchmark(
      'Client retention rate',
      data.clientRetentionRate,
      retentionTarget,
      'percent',
      `Retention is ${data.clientRetentionRate >= retentionTarget ? 'ahead of' : 'below'} benchmark expectations.`,
    ),
    createBenchmark(
      'Revenue growth momentum',
      data.growthMetrics.revenueGrowth,
      revenueGrowthTarget,
      'percent',
      `Revenue growth is ${data.growthMetrics.revenueGrowth >= revenueGrowthTarget ? 'outperforming' : 'underperforming'} the ${revenueGrowthTarget}% ambition.`,
    ),
  ];
}

function generateClientBenchmarks(data: ClientInsightsCore): BenchmarkInsight[] {
  const activeRatio = data.totalClients > 0 ? (data.activeClients / data.totalClients) * 100 : 0;
  const acquisitionPace = data.clientAcquisitionTrend.slice(-3).reduce((sum, item) => sum + item.count, 0);
  const acquisitionTarget = (data.clientAcquisitionTrend.slice(-3).length || 1) * 2;

  return [
    createBenchmark(
      'Active client ratio',
      activeRatio,
      75,
      'percent',
      `Active engagement is ${activeRatio >= 75 ? 'healthy' : 'below'} the 75% activity target.`,
    ),
    createBenchmark(
      'Monthly acquisition pace',
      acquisitionPace,
      acquisitionTarget,
      'number',
      `Acquisition is ${acquisitionPace >= acquisitionTarget ? 'exceeding' : 'trailing'} the playbook baseline of ${acquisitionTarget} new clients.`,
    ),
    createBenchmark(
      'Average client value',
      data.averageClientValue,
      data.averageClientValue * 1.05,
      'currency',
      'Track upsell motions to grow average wallet sizes by 5%.',
    ),
  ];
}

export function enrichOrderAnalytics(payload: OrderAnalytics): OrderAnalytics {
  const { narrative, benchmarks, ...rest } = payload;
  const core = rest as OrderAnalyticsCore;
  return {
    ...payload,
    narrative: narrative ?? generateOrderNarrative(core),
    benchmarks: benchmarks ?? generateOrderBenchmarks(core),
  };
}

export function enrichPerformanceMetrics(payload: PerformanceMetrics): PerformanceMetrics {
  const { narrative, benchmarks, ...rest } = payload;
  const core = rest as PerformanceMetricsCore;
  return {
    ...payload,
    narrative: narrative ?? generatePerformanceNarrative(core),
    benchmarks: benchmarks ?? generatePerformanceBenchmarks(core),
  };
}

export function enrichClientInsights(payload: ClientInsights): ClientInsights {
  const { narrative, benchmarks, ...rest } = payload;
  const core = rest as ClientInsightsCore;
  return {
    ...payload,
    narrative: narrative ?? generateClientNarrative(core),
    benchmarks: benchmarks ?? generateClientBenchmarks(core),
  };
}

const logistic = (value: number) => 1 / (1 + Math.exp(-value));

interface RecommendationInput {
  orderAnalytics?: OrderAnalytics;
  performanceMetrics?: PerformanceMetrics;
  clientInsights?: ClientInsights;
}

export function deriveKpiRecommendations({
  orderAnalytics,
  performanceMetrics,
  clientInsights,
}: RecommendationInput): ActionRecommendation[] {
  if (!orderAnalytics || !performanceMetrics || !clientInsights) {
    return [
      {
        id: 'syncing-insights',
        title: 'Insights are syncing',
        description: 'We are compiling the latest metrics for this view. Updated guidance will appear momentarily.',
        confidence: 55,
        category: 'efficiency',
        evidence: ['Analytics signals are still loading'],
      },
    ];
  }

  const recommendations: ActionRecommendation[] = [];

  const topClientShare = orderAnalytics.totalValue > 0 && orderAnalytics.topClients.length
    ? (orderAnalytics.topClients[0].totalValue / orderAnalytics.totalValue) * 100
    : 0;
  const activeRatio = clientInsights.totalClients > 0 ? (clientInsights.activeClients / clientInsights.totalClients) * 100 : 0;

  const retentionGap = (90 - performanceMetrics.clientRetentionRate) / 10;
  const successGap = (95 - performanceMetrics.orderSuccessRate) / 10;
  const concentrationGap = (topClientShare - 35) / 10;
  const activityGap = (75 - activeRatio) / 10;

  const severityScore = logistic(0.8 * retentionGap + 0.6 * successGap + 0.4 * concentrationGap + 0.5 * activityGap);

  if (performanceMetrics.clientRetentionRate < 90) {
    recommendations.push({
      id: 'retention-playbook',
      title: 'Reinforce retention campaign',
      description:
        'Retention dipped below the 90% goal. Trigger outreach cadences for at-risk cohorts and expand loyalty benefits.',
      confidence: Math.min(95, Math.max(60, Math.round(severityScore * 100))),
      category: 'retention',
      evidence: [
        `Retention ${performanceMetrics.clientRetentionRate.toFixed(1)}% vs 90% benchmark`,
        `Active engagement at ${activeRatio.toFixed(1)}%`,
      ],
    });
  }

  if (performanceMetrics.orderSuccessRate < 95 || orderAnalytics.benchmarks?.some((b) => b.direction === 'below')) {
    recommendations.push({
      id: 'order-ops',
      title: 'Tighten order execution quality',
      description:
        'Success rates can improve. Review queue fallouts, automate manual checks, and coach teams on exception playbooks.',
      confidence: Math.min(90, Math.max(55, Math.round(logistic(0.7 * successGap) * 100))),
      category: 'efficiency',
      evidence: [
        `Order success ${performanceMetrics.orderSuccessRate.toFixed(1)}%`,
        orderAnalytics.benchmarks?.find((b) => b.metric === 'Order volume vs. target')
          ? `Volume variance ${(orderAnalytics.benchmarks?.find((b) => b.metric === 'Order volume vs. target')?.variance ?? 0).toFixed(1)}%`
          : 'Execution benchmark variance tracked',
      ],
    });
  }

  if (topClientShare > 40) {
    recommendations.push({
      id: 'diversify-top-clients',
      title: 'Diversify top client exposure',
      description:
        'Revenue is concentrated in a few accounts. Launch cross-sell into mid-tier clients and refresh referral programs.',
      confidence: Math.round(logistic(0.5 * concentrationGap) * 100),
      category: 'revenue',
      evidence: [`Top client concentration at ${topClientShare.toFixed(1)}%`, 'Diversification guardrail is 30%'],
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'momentum-affirmation',
      title: 'Momentum holding strong',
      description: 'KPIs are outperforming guardrails. Maintain cadence and experiment with targeted upsell campaigns.',
      confidence: Math.round((1 - severityScore) * 100),
      category: 'revenue',
      evidence: ['All monitored KPIs at or above benchmarks'],
    });
  }

  return recommendations;
}
