import { MainLayout } from "@/components/layout";
import { useGetWishlist, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard, ProductSkeleton } from "@/components/product-card";

export default function Wishlist() {
  const { data: wishlist, isLoading } = useGetWishlist();

  return (
    <MainLayout>
      <div className="border-b bg-muted/20">
        <div className="container px-4 md:px-6 py-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">My Wishlist</h1>
          <p className="text-muted-foreground">
            {wishlist?.length || 0} {wishlist?.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : !wishlist || wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
            <div className="bg-muted p-6 rounded-full mb-6">
              <Heart className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-8">
              Save your favorite items here so you can find them easily later.
            </p>
            <Button size="lg" asChild>
              <Link href="/products">
                <Search className="mr-2 h-4 w-4" />
                Explore Products
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <ProductCard key={item.id} product={item.product} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
