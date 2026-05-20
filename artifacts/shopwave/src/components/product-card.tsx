import { Link } from "wouter";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAddToCart, useAddToWishlist, useRemoveFromWishlist, useGetWishlist, getGetCartQueryKey, getGetWishlistQueryKey } from "@workspace/api-client-react";
import type { Product } from "@workspace/api-client-react/src/generated/api.schemas";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex text-amber-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "w-4 h-4",
              star <= rating ? "fill-current" : "fill-muted text-muted"
            )}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground ml-1">({count})</span>
      )}
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { data: wishlist } = useGetWishlist();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  
  const inWishlist = wishlist?.some(item => item.productId === product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart.mutate(
      { data: { productId: product.id, quantity: 1 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({
            title: "Added to cart",
            description: `${product.name} was added to your cart.`,
          });
        }
      }
    );
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inWishlist) {
      removeFromWishlist.mutate(
        { productId: product.id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
            toast({
              title: "Removed from wishlist",
              description: `${product.name} was removed from your wishlist.`,
            });
          }
        }
      );
    } else {
      addToWishlist.mutate(
        { data: { productId: product.id } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
            toast({
              title: "Added to wishlist",
              description: `${product.name} was added to your wishlist.`,
            });
          }
        }
      );
    }
  };

  return (
    <Link href={`/products/${product.id}`} className="group flex flex-col space-y-3 relative h-full">
      <div className="relative aspect-[4/5] bg-muted rounded-xl overflow-hidden isolation-auto">
        <img 
          src={product.imageUrl || `https://ui-avatars.com/api/?name=${product.name}&background=random`} 
          alt={product.name}
          className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {product.salePrice && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground px-2 py-1 text-xs font-bold rounded-md uppercase tracking-wider">
            Sale
          </div>
        )}
        
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 transform translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 z-10">
          <Button 
            variant="secondary" 
            size="icon" 
            className={cn("h-8 w-8 rounded-full shadow-md", inWishlist && "text-destructive hover:text-destructive")}
            onClick={handleWishlistToggle}
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
            <span className="sr-only">Wishlist</span>
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full transition-transform duration-300 ease-in-out group-hover:translate-y-0 z-10 bg-gradient-to-t from-black/50 to-transparent">
          <Button 
            className="w-full shadow-lg" 
            onClick={handleAddToCart}
            disabled={addToCart.isPending || product.stock <= 0}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
          </Button>
        </div>
      </div>
      <div className="flex flex-col flex-1">
        <h3 className="font-medium text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{product.categoryName}</p>
        
        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            {product.salePrice ? (
              <div className="flex items-center gap-2">
                <span className="font-bold text-destructive">${product.salePrice.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground line-through">${product.price.toFixed(2)}</span>
              </div>
            ) : (
              <span className="font-bold">${product.price.toFixed(2)}</span>
            )}
          </div>
          <StarRating rating={product.rating} count={product.reviewCount} />
        </div>
      </div>
    </Link>
  );
}

export function ProductSkeleton() {
  return (
    <div className="space-y-4">
      <div className="aspect-[4/5] bg-muted animate-pulse rounded-xl" />
      <div className="space-y-2">
        <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
        <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="h-5 bg-muted animate-pulse rounded w-1/4" />
        <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
      </div>
    </div>
  );
}
