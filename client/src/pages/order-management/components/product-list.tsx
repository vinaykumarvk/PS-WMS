import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Info, FileText, AlertTriangle, Star } from 'lucide-react';
import { Product } from '../types/order.types';
import { apiRequest } from '@/lib/queryClient';
import SchemeInfoOverlay from './overlays/scheme-info-overlay';
import DocumentsOverlay from './overlays/documents-overlay';
import { useAddFavorite, useRemoveFavorite, useFavorites } from '../hooks/use-quick-order';

interface ProductListProps {
  onAddToCart: (product: Product) => void;
  onOpenDocuments?: (productId: number) => void;
  onOpenDeviations?: (productId: number) => void;
}

export default function ProductList({ 
  onAddToCart, 
  onOpenDocuments, 
  onOpenDeviations 
}: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [rtaFilter, setRtaFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [documentsProductId, setDocumentsProductId] = useState<number | null>(null);

  // Quick Order hooks
  const { data: favorites = [] } = useFavorites();
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();

  // Check if product is favorited
  const isFavorite = (productId: number) => {
    return favorites.some(fav => fav.productId === productId);
  };

  // Get favorite ID for a product
  const getFavoriteId = (productId: number) => {
    const favorite = favorites.find(fav => fav.productId === productId);
    return favorite?.id;
  };

  // Handle toggle favorite
  const handleToggleFavorite = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isFavorite(product.id)) {
        const favoriteId = getFavoriteId(product.id);
        if (favoriteId) {
          await removeFavoriteMutation.mutateAsync(favoriteId);
        }
      } else {
        await addFavoriteMutation.mutateAsync(product.id);
      }
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/order-management/products'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/order-management/products');
      const data = await response.json();
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    },
  });

  // Ensure products is always an array before filtering
  const productsArray = Array.isArray(products) ? products : [];
  const filteredProducts = productsArray.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.schemeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesRta = rtaFilter === 'all' || product.rta === rtaFilter;
    return matchesSearch && matchesCategory && matchesRta && product.isWhitelisted;
  });

  const categories = Array.from(new Set(productsArray.map(p => p.category)));
  const rtas = Array.from(new Set(productsArray.map(p => p.rta)));

  if (isLoading) {
    return (
      <div data-testid="product-list-skeleton" className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="text-sm font-medium text-destructive">Failed to load products. Please try again.</p>
        </div>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <EmptyState
        icon={<Search className="h-12 w-12 text-muted-foreground" />}
        title="No products found"
        description={searchQuery || categoryFilter !== 'all' || rtaFilter !== 'all'
          ? "Try adjusting your filters to find what you're looking for."
          : "No products available at this time."}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 min-h-[44px] text-base sm:text-sm"
              aria-label="Search products"
            />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px] min-h-[44px] text-base sm:text-sm" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={rtaFilter} onValueChange={setRtaFilter}>
          <SelectTrigger className="w-full sm:w-[180px] min-h-[44px] text-base sm:text-sm" aria-label="Filter by RTA">
            <SelectValue placeholder="RTA" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All RTAs</SelectItem>
            {rtas.map(rta => (
              <SelectItem key={rta} value={rta}>{rta}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base break-words">{product.schemeName}</h3>
                    <Badge variant="outline" className="text-xs">{product.category}</Badge>
                    <Badge variant="secondary" className="text-xs">{product.rta}</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">NAV:</span> ₹{product.nav.toFixed(2)}
                    </div>
                    <div>
                      <span className="font-medium">Min:</span> ₹{product.minInvestment.toLocaleString()}
                    </div>
                    {product.maxInvestment && (
                      <div>
                        <span className="font-medium">Max:</span> ₹{product.maxInvestment.toLocaleString()}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Risk:</span> {product.riskLevel}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleToggleFavorite(product, e)}
                    aria-label={`${isFavorite(product.id) ? 'Remove from' : 'Add to'} favorites`}
                    title={isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                    type="button"
                    disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                    className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
                  >
                    <Star 
                      className={`h-4 w-4 sm:h-5 sm:w-5 ${isFavorite(product.id) ? 'text-yellow-500 fill-yellow-500' : ''}`}
                      aria-hidden="true"
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedProduct(product)}
                    aria-label={`View scheme info for ${product.schemeName}`}
                    title="Scheme Info"
                    type="button"
                    className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
                  >
                    <Info className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  </Button>
                  {onOpenDocuments && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDocumentsProductId(product.id);
                        onOpenDocuments(product.id);
                      }}
                      aria-label={`View documents for ${product.schemeName}`}
                      title="Documents"
                      type="button"
                      className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
                    >
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                    </Button>
                  )}
                  {onOpenDeviations && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onOpenDeviations(product.id)}
                      aria-label={`View deviations for ${product.schemeName}`}
                      title="Deviations"
                      type="button"
                      className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
                    >
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-warning" aria-hidden="true" />
                    </Button>
                  )}
                  <Button
                    onClick={() => onAddToCart(product)}
                    size="sm"
                    type="button"
                    aria-label={`Add ${product.schemeName} to cart`}
                    className="min-h-[44px] touch-manipulation text-xs sm:text-sm flex-1 sm:flex-initial"
                  >
                    <Plus className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline">Add to Cart</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scheme Info Overlay */}
      <SchemeInfoOverlay
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      />

      {/* Documents Overlay */}
      {documentsProductId !== null && (
        <DocumentsOverlay
          productId={documentsProductId}
          open={documentsProductId !== null}
          onOpenChange={(open) => !open && setDocumentsProductId(null)}
        />
      )}
    </div>
  );
}

