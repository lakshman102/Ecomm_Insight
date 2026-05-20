import { MainLayout } from "@/components/layout";
import { useGetProduct, useListProducts, useListReviews, useCreateReview, useAddToCart, useAddToWishlist, useRemoveFromWishlist, useGetWishlist, getGetCartQueryKey, getGetWishlistQueryKey, getListReviewsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StarRating, ProductCard } from "@/components/product-card";
import { ShoppingBag, Heart, Minus, Plus, Share2, ShieldCheck, Truck, RefreshCcw } from "lucide-react";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProductDetail({ params }: { params: { id: string } }) {
  const productId = Number(params.id);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewName, setReviewName] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: product, isLoading } = useGetProduct(productId, { query: { enabled: !!productId } });
  const { data: relatedProducts } = useListProducts({ categoryId: product?.categoryId, limit: 4 }, { query: { enabled: !!product?.categoryId } });
  const { data: reviews } = useListReviews({ productId }, { query: { enabled: !!productId } });
  const { data: wishlist } = useGetWishlist();
  
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const createReview = useCreateReview();

  const inWishlist = wishlist?.some(item => item.productId === productId);
  const allImages = product ? [product.imageUrl, ...(product.images || [])] : [];

  const handleAddToCart = () => {
    if (!product) return;
    addToCart.mutate(
      { data: { productId: product.id, quantity } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({
            title: "Added to cart",
            description: `${quantity}x ${product.name} added to your cart.`,
          });
        }
      }
    );
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    if (inWishlist) {
      removeFromWishlist.mutate(
        { productId: product.id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
            toast({ title: "Removed from wishlist" });
          }
        }
      );
    } else {
      addToWishlist.mutate(
        { data: { productId: product.id } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
            toast({ title: "Added to wishlist" });
          }
        }
      );
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReview.mutate(
      { data: { productId, rating: reviewRating, comment: reviewComment, authorName: reviewName || "Anonymous" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey({ productId }) });
          setReviewComment("");
          setReviewRating(5);
          toast({ title: "Review submitted", description: "Thank you for your feedback!" });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container px-4 md:px-6 py-12 flex justify-center">
          <div className="animate-pulse flex flex-col md:flex-row gap-12 w-full">
            <div className="w-full md:w-1/2 aspect-square bg-muted rounded-2xl" />
            <div className="w-full md:w-1/2 space-y-6">
              <div className="h-10 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/4" />
              <div className="h-32 bg-muted rounded w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="container px-4 md:px-6 py-20 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Breadcrumbs */}
      <div className="bg-muted/30 border-b">
        <div className="container px-4 md:px-6 py-3 text-sm text-muted-foreground">
          Home / Products / {product.categoryName || "Category"} / <span className="text-foreground font-medium">{product.name}</span>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-10 md:py-16">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-2xl overflow-hidden relative border">
              <img 
                src={allImages[activeImage]} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.salePrice && (
                <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-1 text-sm font-bold rounded uppercase tracking-wider">
                  Sale
                </div>
              )}
            </div>
            
            {allImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {allImages.map((img, i) => (
                  <button 
                    key={i} 
                    className={cn(
                      "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                      activeImage === i ? "border-primary opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                    onClick={() => setActiveImage(i)}
                  >
                    <img src={img} alt={`Thumbnail ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-2">
              <span className="text-sm font-medium text-primary uppercase tracking-wider">{product.categoryName}</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <StarRating rating={product.rating} count={product.reviewCount} />
              <span className="text-muted-foreground text-sm">|</span>
              <span className={cn("text-sm font-medium", product.stock > 0 ? "text-green-600 dark:text-green-500" : "text-destructive")}>
                {product.stock > 0 ? `In Stock (${product.stock})` : "Out of Stock"}
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-8">
              {product.salePrice ? (
                <>
                  <span className="text-4xl font-bold text-destructive">${product.salePrice.toFixed(2)}</span>
                  <span className="text-xl text-muted-foreground line-through">${product.price.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-4xl font-bold">${product.price.toFixed(2)}</span>
              )}
            </div>

            <p className="text-muted-foreground leading-relaxed mb-8">{product.description}</p>

            <div className="space-y-6 pt-6 border-t mt-auto">
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-md h-12 bg-background">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-full rounded-none rounded-l-md px-3 hover:bg-muted"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="w-12 text-center font-medium">{quantity}</div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-full rounded-none rounded-r-md px-3 hover:bg-muted"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button 
                  className="flex-1 h-12 text-base shadow-lg shadow-primary/20" 
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0 || addToCart.isPending}
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={cn("h-12 w-12 flex-shrink-0", inWishlist && "text-destructive border-destructive/50 bg-destructive/10 hover:bg-destructive/20 hover:text-destructive")}
                  onClick={handleWishlistToggle}
                >
                  <Heart className={cn("h-5 w-5", inWishlist && "fill-current")} />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="h-4 w-4 text-foreground" />
                  <span>Free shipping over $100</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCcw className="h-4 w-4 text-foreground" />
                  <span>30-day return policy</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-foreground" />
                  <span>2 year warranty</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Share2 className="h-4 w-4 text-foreground" />
                  <span>Share this product</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs section */}
        <div className="mt-20 pt-10 border-t">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none">
              <TabsTrigger 
                value="description" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-base"
              >
                Description
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-base"
              >
                Reviews ({reviews?.length || 0})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="pt-6">
              <div className="prose max-w-none text-muted-foreground">
                <p>{product.description}</p>
                <p>This premium product features excellent craftsmanship and attention to detail. Designed to elevate your daily experience, it combines functional utility with an aesthetic that seamlessly blends into modern lifestyles.</p>
                <ul>
                  <li>High-quality materials</li>
                  <li>Durable construction</li>
                  <li>Thoughtful design</li>
                  <li>Imported</li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="pt-6">
              <div className="grid md:grid-cols-3 gap-10">
                <div className="md:col-span-1 space-y-6">
                  <div className="bg-muted/30 p-6 rounded-xl border">
                    <h3 className="font-bold text-lg mb-2">Customer Reviews</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-4xl font-extrabold">{product.rating.toFixed(1)}</div>
                      <div className="flex flex-col">
                        <StarRating rating={product.rating} />
                        <span className="text-sm text-muted-foreground mt-1">Based on {product.reviewCount} reviews</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Only verified customers can write reviews.</p>
                    </div>
                  </div>

                  <div className="bg-muted/10 p-6 rounded-xl border space-y-4">
                    <h4 className="font-bold">Write a review</h4>
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Rating</Label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="text-amber-500 hover:scale-110 transition-transform"
                            >
                              <Star className={cn("h-6 w-6", star <= reviewRating ? "fill-current" : "text-muted-foreground")} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input 
                          id="name" 
                          value={reviewName} 
                          onChange={(e) => setReviewName(e.target.value)} 
                          placeholder="Your name" 
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comment">Review</Label>
                        <Textarea 
                          id="comment" 
                          value={reviewComment} 
                          onChange={(e) => setReviewComment(e.target.value)} 
                          placeholder="What did you like or dislike?"
                          rows={4}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={createReview.isPending}>
                        Submit Review
                      </Button>
                    </form>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  {reviews && reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review.id} className="border-b pb-6 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold">{review.authorName}</div>
                            <div className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</div>
                          </div>
                          <StarRating rating={review.rating} />
                        </div>
                        <p className="text-foreground/80 mt-2">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                      <p>No reviews yet. Be the first to share your thoughts!</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-24">
            <h2 className="text-2xl font-bold tracking-tight mb-8 text-center md:text-left">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.filter(p => p.id !== product.id).slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
