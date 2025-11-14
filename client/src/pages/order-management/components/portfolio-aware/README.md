# Portfolio-Aware Ordering Components

## Module B: Portfolio-Aware Ordering

This module provides portfolio-aware features for the order management system, allowing users to see how their orders affect their portfolio allocation and get intelligent suggestions for rebalancing.

## Components

### 1. Portfolio Impact Preview (`portfolio-impact-preview.tsx`)
Shows how an order will affect portfolio allocation before placing it.

**Features:**
- Visual comparison of before/after allocation
- Bar chart showing allocation changes
- Detailed breakdown of changes by category
- Total portfolio value change

**Usage:**
```tsx
<PortfolioImpactPreview clientId={clientId} order={cartItems} />
```

### 2. Allocation Gap Analysis (`allocation-gap-analysis.tsx`)
Identifies gaps between current and target portfolio allocation.

**Features:**
- Visual progress bars for each category
- Priority-based gap identification (High/Medium/Low)
- Recommendations for each gap
- Summary of well-balanced vs. imbalanced categories

**Usage:**
```tsx
<AllocationGapAnalysis 
  clientId={clientId} 
  targetAllocation={targetAllocation} 
/>
```

### 3. Rebalancing Suggestions (`rebalancing-suggestions.tsx`)
Provides actionable suggestions to rebalance the portfolio.

**Features:**
- Buy/Sell/Switch recommendations
- Priority-based suggestions
- Expected impact of each suggestion
- One-click apply functionality

**Usage:**
```tsx
<RebalancingSuggestions 
  clientId={clientId} 
  targetAllocation={targetAllocation}
  onApplySuggestion={(suggestion) => {
    // Handle suggestion application
  }}
/>
```

### 4. Holdings Integration (`holdings-integration.tsx`)
Displays existing holdings with filtering and selection capabilities.

**Features:**
- Tabbed view by category (Equity, Debt, Hybrid, Others)
- Detailed holdings table with gain/loss
- Allocation percentage per holding
- Select holding for order placement

**Usage:**
```tsx
<HoldingsIntegration 
  clientId={clientId}
  selectedSchemeId={schemeId}
  onSelectHolding={(holding) => {
    // Handle holding selection
  }}
/>
```

### 5. Portfolio Sidebar (`portfolio-sidebar.tsx`)
Main integration component that combines all portfolio-aware features.

**Features:**
- Portfolio overview with summary stats
- Allocation pie chart
- Tabbed interface for different views
- Integrated access to all portfolio features

**Usage:**
```tsx
<PortfolioSidebar 
  clientId={clientId}
  cartItems={cartItems}
  targetAllocation={targetAllocation}
/>
```

## Hooks

### `use-portfolio-analysis.ts`
Custom React hooks for fetching portfolio data:

- `usePortfolio(clientId, includeHoldings)` - Get portfolio data
- `useImpactPreview(clientId, order)` - Calculate impact preview
- `useAllocationGaps(clientId, targetAllocation)` - Get allocation gaps
- `useRebalancingSuggestions(clientId, targetAllocation)` - Get rebalancing suggestions
- `useHoldings(clientId, schemeId)` - Get client holdings
- `useRefreshPortfolio()` - Refresh portfolio data

## API Endpoints

All endpoints are prefixed with `/api/portfolio/`:

- `GET /api/portfolio/current-allocation?clientId={id}&includeHoldings={bool}` - Get portfolio data
- `POST /api/portfolio/impact-preview` - Calculate impact preview
- `GET /api/portfolio/allocation-gaps?clientId={id}&targetAllocation={json}` - Get allocation gaps
- `GET /api/portfolio/rebalancing-suggestions?clientId={id}&targetAllocation={json}` - Get rebalancing suggestions
- `GET /api/portfolio/holdings?clientId={id}&schemeId={id}` - Get holdings

## Integration

To integrate portfolio-aware features into the order management page:

```tsx
import PortfolioSidebar from './components/portfolio-sidebar';

function OrderManagementPage() {
  const [clientId, setClientId] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        {/* Order placement UI */}
      </div>
      <div className="col-span-1">
        <PortfolioSidebar 
          clientId={clientId}
          cartItems={cartItems}
        />
      </div>
    </div>
  );
}
```

## Performance

- All calculations are performed server-side for accuracy
- Client-side caching with React Query (2-minute stale time)
- Optimized queries that only fetch needed data
- Impact preview calculations are debounced/throttled

## Future Enhancements

- Real-time portfolio updates via WebSocket
- Historical allocation tracking
- Tax optimization suggestions
- Risk-adjusted return calculations
- Comparison with benchmark portfolios

