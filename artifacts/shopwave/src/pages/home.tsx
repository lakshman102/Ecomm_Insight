import { MainLayout } from "@/components/layout";
import { useGetFeaturedProducts, useGetTrendingProducts, useListCategories } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ProductCard, ProductSkeleton } from "@/components/product-card";
import { ArrowRight, Zap, Shield, Sparkles, Heart } from "lucide-react";

export default function Home() {
  const { data: featuredProducts, isLoading: isLoadingFeatured } = useGetFeaturedProducts();
  const { data: trendingProducts, isLoading: isLoadingTrending } = useGetTrendingProducts();
  const { data: categories, isLoading: isLoadingCategories } = useListCategories();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-16 md:pt-24 lg:pt-32 pb-16 md:pb-24 lg:pb-32 border-b">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                New Summer Collection
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
                Define Your <br/>
                <span className="text-primary italic">Aesthetic</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-[600px] leading-relaxed">
                ShopWave brings you the season's most sought-after pieces. Experience premium quality with zero friction.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="h-14 px-8 text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-1" asChild>
                  <Link href="/products">Shop the Collection</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-base" asChild>
                  <Link href="/categories">Browse Categories</Link>
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-8 border-t">
                <div>
                  <p className="text-3xl font-bold text-foreground">10k+</p>
                  <p className="text-sm text-muted-foreground">Premium Products</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">24h</p>
                  <p className="text-sm text-muted-foreground">Fast Delivery</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">4.9/5</p>
                  <p className="text-sm text-muted-foreground">Customer Rating</p>
                </div>
              </div>
            </div>
            
            <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden bg-accent/20 border p-4 hidden lg:block">
              <div className="absolute inset-4 rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop" 
                  alt="Hero fashion" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Featured Hits</h2>
              <p className="text-muted-foreground">Handpicked selections for the season.</p>
            </div>
            <Link href="/products?featured=true" className="group flex items-center text-sm font-semibold text-primary hover:underline">
              View all
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {isLoadingFeatured ? (
              Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : (
              featuredProducts?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Categories Banner */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tight mb-10 text-center">Shop by Category</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {isLoadingCategories ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded-2xl" />
              ))
            ) : (
              categories?.slice(0, 4).map((category) => (
                <Link 
                  key={category.id} 
                  href={`/products?categoryId=${category.id}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-muted flex items-center justify-center"
                >
                  <img 
                    src={category.imageUrl || `https://ui-avatars.com/api/?name=${category.name}&background=random`} 
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="relative z-10 text-center mt-auto pb-6 translate-y-2 transition-transform group-hover:translate-y-0">
                    <h3 className="text-xl font-bold text-white mb-1">{category.name}</h3>
                    <p className="text-white/80 text-sm opacity-0 transition-opacity group-hover:opacity-100">
                      Explore
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6">
          <div className="grid sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-primary-foreground/20">
            <div className="flex flex-col items-center pt-8 sm:pt-0">
              <Zap className="h-8 w-8 mb-4 opacity-80" />
              <h3 className="font-bold text-lg mb-2">Lightning Fast</h3>
              <p className="text-primary-foreground/70 text-sm max-w-xs">Optimized for speed. Your shopping experience has never been this fluid.</p>
            </div>
            <div className="flex flex-col items-center pt-8 sm:pt-0">
              <Shield className="h-8 w-8 mb-4 opacity-80" />
              <h3 className="font-bold text-lg mb-2">Secure Checkout</h3>
              <p className="text-primary-foreground/70 text-sm max-w-xs">Bank-level encryption to keep your data safe while you shop.</p>
            </div>
            <div className="flex flex-col items-center pt-8 sm:pt-0">
              <Heart className="h-8 w-8 mb-4 opacity-80" />
              <h3 className="font-bold text-lg mb-2">Curated With Love</h3>
              <p className="text-primary-foreground/70 text-sm max-w-xs">Every product is hand-picked by our expert team of stylists.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Trending Now</h2>
              <p className="text-muted-foreground">What everyone is adding to their cart.</p>
            </div>
            <Link href="/products?sort=popular" className="group flex items-center text-sm font-semibold text-primary hover:underline">
              View all
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {isLoadingTrending ? (
              Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : (
              trendingProducts?.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
