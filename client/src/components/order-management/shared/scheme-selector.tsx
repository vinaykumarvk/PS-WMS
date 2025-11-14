/**
 * Foundation Layer - F4: Scheme Selector Component
 * Reusable scheme/product selector with search and filters
 */

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { Product } from '@shared/types/order-management.types';

interface SchemeSelectorProps {
  schemes: Product[];
  value?: number;
  onValueChange: (schemeId: number) => void;
  placeholder?: string;
  searchable?: boolean;
  filterByCategory?: boolean;
  filterByRTA?: boolean;
  className?: string;
  disabled?: boolean;
}

export function SchemeSelector({
  schemes,
  value,
  onValueChange,
  placeholder = 'Select scheme',
  searchable = true,
  filterByCategory = false,
  filterByRTA = false,
  className,
  disabled = false,
}: SchemeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [rtaFilter, setRtaFilter] = useState<string>('all');

  const categories = Array.from(new Set(schemes.map(s => s.category)));
  const rtas = Array.from(new Set(schemes.map(s => s.rta)));

  const filteredSchemes = schemes.filter(scheme => {
    const matchesSearch = !searchQuery || 
      scheme.schemeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || scheme.category === categoryFilter;
    const matchesRTA = rtaFilter === 'all' || scheme.rta === rtaFilter;
    
    return matchesSearch && matchesCategory && matchesRTA && scheme.isWhitelisted;
  });

  return (
    <div className={className}>
      {searchable && (
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search schemes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}
      
      {(filterByCategory || filterByRTA) && (
        <div className="mb-3 flex gap-2">
          {filterByCategory && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {filterByRTA && (
            <Select value={rtaFilter} onValueChange={setRtaFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="RTA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All RTAs</SelectItem>
                {rtas.map(rta => (
                  <SelectItem key={rta} value={rta}>{rta}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <Select
        value={value?.toString()}
        onValueChange={(val) => onValueChange(parseInt(val))}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {filteredSchemes.length === 0 ? (
            <SelectItem value="none" disabled>
              No schemes found
            </SelectItem>
          ) : (
            filteredSchemes.map((scheme) => (
              <SelectItem key={scheme.id} value={scheme.id.toString()}>
                {scheme.schemeName}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

