import { CartItem, Nominee, Product, TransactionModeData } from '../types/order.types';
import type { PortfolioData } from '../context/order-integration-context';
import type { ValidationResult } from './order-validations';

export interface ComplianceContext {
  cartItems: CartItem[];
  products: Product[];
  nominees: Nominee[];
  optOutOfNomination: boolean;
  transactionMode?: TransactionModeData | null;
  portfolioData?: PortfolioData | null;
  marketValues?: Map<number, number>;
}

export interface ComplianceEnhancedResult extends ValidationResult {
  advisorNotes: string[];
}

interface PolicyRule {
  id: string;
  description: string;
  evaluate: (context: ComplianceContext) => PolicyOutcome | null;
}

type PolicyOutcomeType = 'error' | 'warning' | 'note';

interface PolicyOutcome {
  type: PolicyOutcomeType;
  message: string;
  note?: string;
}

const RISK_THRESHOLD_AMOUNT = 500_000;
const CATEGORY_OVERWEIGHT_THRESHOLD = 65;
const TELEPHONIC_MODE_REQUIRES_EUIN = new Set<TransactionModeData['mode']>(['Telephone']);

const policyRules: PolicyRule[] = [
  {
    id: 'whitelist-enforcement',
    description: 'Non-whitelisted schemes must be reviewed manually per AMC policy',
    evaluate: ({ cartItems, products }) => {
      const flaggedItems = cartItems
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return product && !product.isWhitelisted ? product.schemeName : null;
        })
        .filter((schemeName): schemeName is string => Boolean(schemeName));

      if (flaggedItems.length === 0) {
        return null;
      }

      const schemes = flaggedItems.join(', ');
      return {
        type: 'error',
        message: `Policy: ${schemes} require compliance approval because they are not on the approved list.`,
        note: 'The AI compliance advisor detected non-whitelisted schemes and halted straight-through processing.',
      } satisfies PolicyOutcome;
    },
  },
  {
    id: 'high-risk-acknowledgement',
    description: 'High risk transactions above ₹500,000 require an explicit acknowledgement',
    evaluate: ({ cartItems, products }) => {
      const breaches = cartItems
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) return null;
          if (product.riskLevel.toLowerCase() !== 'high') return null;
          if (item.amount <= RISK_THRESHOLD_AMOUNT) return null;
          return `${product.schemeName} (₹${item.amount.toLocaleString('en-IN')})`;
        })
        .filter((item): item is string => Boolean(item));

      if (breaches.length === 0) {
        return null;
      }

      return {
        type: 'warning',
        message: `Policy: Capture a risk acknowledgement for ${breaches.join(', ')} before execution.`,
        note: 'Large high-risk allocations were identified; document client consent before proceeding.',
      } satisfies PolicyOutcome;
    },
  },
  {
    id: 'category-balance',
    description: 'Prevent category allocation drift beyond 65% of the portfolio',
    evaluate: ({ cartItems, products, portfolioData }) => {
      if (!portfolioData) return null;

      const overweightCategories = new Set<string>();
      cartItems.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return;
        const currentShare = portfolioData.currentAllocation[product.category] ?? 0;
        if (currentShare >= CATEGORY_OVERWEIGHT_THRESHOLD) {
          overweightCategories.add(product.category);
        }
      });

      if (overweightCategories.size === 0) {
        return null;
      }

      const formatted = Array.from(overweightCategories).join(', ');
      return {
        type: 'warning',
        message: `Policy: ${formatted} allocation already exceeds ${CATEGORY_OVERWEIGHT_THRESHOLD}% of the portfolio.`,
        note: 'Consider rebalancing or selecting alternate categories to stay within mandate.',
      } satisfies PolicyOutcome;
    },
  },
  {
    id: 'telephonic-euin',
    description: 'Telephone orders require EUIN capture',
    evaluate: ({ transactionMode }) => {
      if (!transactionMode?.mode) return null;
      if (!TELEPHONIC_MODE_REQUIRES_EUIN.has(transactionMode.mode)) {
        return null;
      }

      if (transactionMode.euin) {
        return {
          type: 'note',
          message: 'EUIN captured for the telephonic instruction.',
          note: 'Telephone instruction meets EUIN policy.',
        } satisfies PolicyOutcome;
      }

      return {
        type: 'error',
        message: 'Policy: EUIN is mandatory for telephone instructions. Please capture the EUIN before submission.',
        note: 'AI compliance blocked the order until EUIN is recorded for the call-in request.',
      } satisfies PolicyOutcome;
    },
  },
  {
    id: 'nominee-coverage',
    description: 'Minor nominees must include guardian information',
    evaluate: ({ nominees, optOutOfNomination }) => {
      if (optOutOfNomination || nominees.length === 0) return null;
      const missingGuardian = nominees.filter((nominee) => {
        if (!nominee.dateOfBirth) return false;
        const birthDate = new Date(nominee.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const isMinor = age < 18 || (age === 18 && monthDiff < 0);
        if (!isMinor) return false;
        return !nominee.guardianName || !nominee.guardianPan || !nominee.guardianRelationship;
      });

      if (missingGuardian.length === 0) {
        return null;
      }

      return {
        type: 'error',
        message: 'Policy: Guardian details are mandatory for minor nominees. Please complete guardian information.',
        note: 'Guardian coverage gaps detected for minor nominees.',
      } satisfies PolicyOutcome;
    },
  },
];

export function runComplianceAdvisors(
  baseResult: ValidationResult,
  context: ComplianceContext
): ComplianceEnhancedResult {
  const errors = [...baseResult.errors];
  const warnings = [...baseResult.warnings];
  const advisorNotes: string[] = [];

  policyRules.forEach((rule) => {
    const outcome = rule.evaluate(context);
    if (!outcome) {
      return;
    }

    if (outcome.type === 'error') {
      errors.push(outcome.message);
    } else if (outcome.type === 'warning') {
      warnings.push(outcome.message);
    }

    if (outcome.note) {
      advisorNotes.push(`${rule.description}: ${outcome.note}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    advisorNotes,
  };
}

export function generateComplianceSummary(advisorNotes: string[]): string {
  if (advisorNotes.length === 0) {
    return 'AI compliance advisors found no additional considerations.';
  }

  if (advisorNotes.length === 1) {
    return advisorNotes[0];
  }

  return advisorNotes
    .map((note, index) => `${index + 1}. ${note}`)
    .join('\n');
}
