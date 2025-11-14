/**
 * FAQ Component
 * Searchable FAQ section with categorized questions and answers
 */

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  helpful?: boolean;
}

interface FAQComponentProps {
  faqs?: FAQItem[];
  className?: string;
  showSearch?: boolean;
  showCategories?: boolean;
}

const defaultFAQs: FAQItem[] = [
  {
    id: '1',
    question: 'How do I add a new client?',
    answer: 'To add a new client, navigate to the Clients page and click the "Add Client" button. You\'ll be guided through a step-by-step process to enter personal information, financial profile, and risk assessment.',
    category: 'Clients',
    tags: ['clients', 'add', 'onboarding'],
  },
  {
    id: '2',
    question: 'How do I place an order?',
    answer: 'Go to Order Management from the sidebar. You can use Quick Order for simple transactions or build a complex order with multiple products. Add products to your cart, review the details, and submit.',
    category: 'Orders',
    tags: ['orders', 'quick order', 'cart'],
  },
  {
    id: '3',
    question: 'What is risk profiling?',
    answer: 'Risk profiling helps determine a client\'s risk tolerance through a questionnaire. The system calculates a risk score and assigns a risk category (Conservative, Moderate, Aggressive, etc.) which guides portfolio recommendations.',
    category: 'Risk Profiling',
    tags: ['risk', 'profiling', 'questionnaire'],
  },
  {
    id: '4',
    question: 'How do I view a client\'s portfolio?',
    answer: 'Navigate to the Clients page, click on a client card, and then select the Portfolio tab. You\'ll see asset allocation, holdings, performance charts, and other portfolio details.',
    category: 'Portfolio',
    tags: ['portfolio', 'holdings', 'performance'],
  },
  {
    id: '5',
    question: 'Can I schedule appointments?',
    answer: 'Yes! Go to the Calendar page or navigate to a client\'s detail page and select the Appointments tab. You can create, edit, and manage appointments with your clients.',
    category: 'Calendar',
    tags: ['calendar', 'appointments', 'schedule'],
  },
  {
    id: '6',
    question: 'How do I track tasks?',
    answer: 'Tasks can be viewed from the Tasks page in the sidebar or from individual client pages. You can create tasks, set priorities, assign due dates, and mark them as complete.',
    category: 'Tasks',
    tags: ['tasks', 'todo', 'management'],
  },
  {
    id: '7',
    question: 'What is SIP (Systematic Investment Plan)?',
    answer: 'SIP allows clients to invest a fixed amount regularly in mutual funds. You can create SIP plans for clients, set up automatic investments, and track SIP performance over time.',
    category: 'Investments',
    tags: ['sip', 'mutual funds', 'investments'],
  },
  {
    id: '8',
    question: 'How do I generate reports?',
    answer: 'Reports can be generated from various pages. Look for the "Export" or "Download" buttons. You can export client data, portfolio reports, transaction history, and more in PDF or Excel format.',
    category: 'Reports',
    tags: ['reports', 'export', 'download'],
  },
  {
    id: '9',
    question: 'How do I update my profile?',
    answer: 'Click on your profile icon in the top right corner and select "Profile" or "Settings". You can update your personal information, preferences, and account settings from there.',
    category: 'Account',
    tags: ['profile', 'settings', 'account'],
  },
  {
    id: '10',
    question: 'What are talking points?',
    answer: 'Talking points provide insights and recommendations for client conversations. They help you prepare for meetings with relevant market information, product suggestions, and client-specific insights.',
    category: 'Insights',
    tags: ['talking points', 'insights', 'recommendations'],
  },
];

export function FAQComponent({
  faqs = defaultFAQs,
  className,
  showSearch = true,
  showCategories = true,
}: FAQComponentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(faqs.map(faq => faq.category)));
    return cats.sort();
  }, [faqs]);

  // Filter FAQs based on search and category
  const filteredFAQs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch =
        !searchQuery ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = !selectedCategory || faq.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [faqs, searchQuery, selectedCategory]);

  // Group FAQs by category
  const groupedFAQs = useMemo(() => {
    const groups: Record<string, FAQItem[]> = {};
    filteredFAQs.forEach(faq => {
      if (!groups[faq.category]) {
        groups[faq.category] = [];
      }
      groups[faq.category].push(faq);
    });
    return groups;
  }, [filteredFAQs]);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Frequently Asked Questions
        </CardTitle>
        <CardDescription>
          Find answers to common questions about using WealthRM
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Category Filters */}
        {showCategories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              All Categories
            </Badge>
            {categories.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}

        {/* FAQ List */}
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No FAQs found matching your search.</p>
            <p className="text-sm mt-2">Try adjusting your search terms or category filter.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(groupedFAQs).map(([category, categoryFAQs]) => (
              <div key={category} className="space-y-2">
                {showCategories && Object.keys(groupedFAQs).length > 1 && (
                  <h3 className="text-sm font-semibold text-muted-foreground mt-4 mb-2">
                    {category}
                  </h3>
                )}
                {categoryFAQs.map(faq => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {faq.answer}
                        </p>
                        {faq.tags && faq.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2">
                            {faq.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </div>
            ))}
          </Accordion>
        )}

        {/* Results count */}
        {searchQuery && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Found {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

