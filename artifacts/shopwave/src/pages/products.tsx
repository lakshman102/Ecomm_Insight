import { MainLayout } from "@/components/layout";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { ProductCard, ProductSkeleton } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useSearch } from "wouter";
import { useState, useEffect } from "react";
import { Filter, X, SlidersHorizontal, Search as SearchIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export default function Products() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState<number | undefined>(
    searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined
  );
  const [sort, setSort] = useState<any>(searchParams.get("sort") || "newest");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [onSale, setOnSale] = useState(searchParams.get("onSale") === "true");

  const { data: categories } = useListCategories();
  
  const { data: products, isLoading } = useListProducts({
    search: search || undefined,
    categoryId,
    sort,
    onSale: onSale || undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
  });

  // Simple debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      // Could sync to URL here
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const clearFilters = () => {
    setSearch("");
    setCategoryId(undefined);
    setSort("newest");
    setPriceRange([0, 1000]);
    setOnSale(false);
  };

  const activeFilterCount = 
    (search ? 1 : 0) + 
    (categoryId ? 1 : 0) + 
    (onSale ? 1 : 0) + 
    (priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0);

  const FiltersContent = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Categories</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="cat-all" 
              checked={categoryId === undefined}
              onCheckedChange={() => setCategoryId(undefined)}
            />
            <Label htmlFor="cat-all" className="cursor-pointer">All Categories</Label>
          </div>
          {categories?.map((cat) => (
            <div key={cat.id} className="flex items-center space-x-2">
              <Checkbox 
                id={`cat-${cat.id}`} 
                checked={categoryId === cat.id}
                onCheckedChange={() => setCategoryId(cat.id)}
              />
              <Label htmlFor={`cat-${cat.id}`} className="cursor-pointer">
                {cat.name} <span className="text-muted-foreground text-xs ml-1">({cat.productCount})</span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Price Range</h3>
        <Slider
          defaultValue={[0, 1000]}
          max={1000}
          step={10}
          value={priceRange}
          onValueChange={setPriceRange}
          className="mt-6"
        />
        <div className="flex items-center justify-between text-sm">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Status</h3>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="on-sale" 
            checked={onSale}
            onCheckedChange={(checked) => setOnSale(checked === true)}
          />
          <Label htmlFor="on-sale" className="cursor-pointer text-destructive font-medium">On Sale Items Only</Label>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="border-b bg-muted/20">
        <div className="container px-4 md:px-6 py-6 md:py-10">
          <h1 className="text-4xl font-bold tracking-tight mb-4">All Products</h1>
          <p className="text-muted-foreground max-w-2xl">
            Browse our complete collection of premium products designed for modern living.
          </p>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden md:block w-[250px] flex-shrink-0 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filters
              </h2>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-muted-foreground">
                  Reset
                </Button>
              )}
            </div>
            <FiltersContent />
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative w-full sm:max-w-xs">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search products..." 
                  className="pl-9 w-full bg-muted/50 border-none focus-visible:bg-background"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="md:hidden flex-1">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Filters {activeFilterCount > 0 && <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="py-6">
                      <FiltersContent />
                      {activeFilterCount > 0 && (
                        <Button className="w-full mt-8" variant="outline" onClick={clearFilters}>
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>

                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-muted/50 border-none">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest Arrivals</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="rating">Top Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Bar */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs font-medium text-muted-foreground mr-2">Active Filters:</span>
                {categoryId && categories?.find(c => c.id === categoryId) && (
                  <Badge variant="secondary" className="px-2 py-1 flex items-center gap-1 font-normal">
                    Category: {categories.find(c => c.id === categoryId)?.name}
                    <X className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" onClick={() => setCategoryId(undefined)} />
                  </Badge>
                )}
                {onSale && (
                  <Badge variant="secondary" className="px-2 py-1 flex items-center gap-1 font-normal">
                    On Sale
                    <X className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" onClick={() => setOnSale(false)} />
                  </Badge>
                )}
                {(priceRange[0] > 0 || priceRange[1] < 1000) && (
                  <Badge variant="secondary" className="px-2 py-1 flex items-center gap-1 font-normal">
                    ${priceRange[0]} - ${priceRange[1]}
                    <X className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" onClick={() => setPriceRange([0, 1000])} />
                  </Badge>
                )}
              </div>
            )}

            {/* Product Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : products?.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center">
                <SearchIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">No products found</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  We couldn't find any products matching your current filters. Try adjusting your search criteria.
                </p>
                <Button onClick={clearFilters}>Clear All Filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products?.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
