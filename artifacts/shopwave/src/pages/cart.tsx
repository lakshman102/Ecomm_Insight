import { MainLayout } from "@/components/layout";
import { useGetCart, useUpdateCartItem, useRemoveFromCart, useClearCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function Cart() {
  const { data: cart, isLoading } = useGetCart();
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();
  const clearCart = useClearCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleUpdateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return;
    updateCartItem.mutate(
      { id, data: { quantity } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        }
      }
    );
  };

  const handleRemove = (id: number, name: string) => {
    removeFromCart.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({ title: "Item removed", description: `${name} was removed from your cart.` });
        }
      }
    );
  };

  const handleClear = () => {
    clearCart.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "Cart cleared" });
      }
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container px-4 md:px-6 py-12">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1 space-y-6">
              {[1, 2].map(i => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
            <div className="w-full lg:w-[380px] h-64 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </MainLayout>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <MainLayout>
      <div className="container px-4 md:px-6 py-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-8">Shopping Cart</h1>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border border-dashed text-center">
            <div className="bg-background p-4 rounded-full shadow-sm mb-6">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Looks like you haven't added anything to your cart yet. Discover our latest collections.
            </p>
            <Button size="lg" asChild>
              <Link href="/products">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-muted-foreground">{cart.items.length} items</span>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleClear}>
                  Clear Cart
                </Button>
              </div>

              <div className="space-y-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4 sm:gap-6 py-2">
                    <Link href={`/products/${item.product.id}`} className="w-24 sm:w-32 flex-shrink-0 bg-muted rounded-lg overflow-hidden aspect-square border">
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    </Link>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link href={`/products/${item.product.id}`} className="font-bold text-lg hover:text-primary transition-colors">
                            {item.product.name}
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1">{item.product.categoryName}</p>
                        </div>
                        <div className="text-right">
                          {item.product.salePrice ? (
                            <>
                              <div className="font-bold text-destructive">${item.product.salePrice.toFixed(2)}</div>
                              <div className="text-sm text-muted-foreground line-through">${item.product.price.toFixed(2)}</div>
                            </>
                          ) : (
                            <div className="font-bold">${item.product.price.toFixed(2)}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center border rounded-md h-9 bg-background">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-full w-9 rounded-none rounded-l-md"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updateCartItem.isPending}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="w-10 text-center text-sm font-medium">{item.quantity}</div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-full w-9 rounded-none rounded-r-md"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock || updateCartItem.isPending}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(item.id, item.product.name)}
                          disabled={removeFromCart.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Remove</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-[380px] flex-shrink-0">
              <div className="bg-muted/30 border rounded-2xl p-6 lg:sticky lg:top-24">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                
                <div className="space-y-4 text-sm mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground">${cart.items.reduce((acc, item) => acc + (item.product.salePrice || item.product.price) * item.quantity, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>
                
                <Separator className="mb-6" />
                
                <div className="flex justify-between font-bold text-lg mb-8">
                  <span>Total</span>
                  <span>${cart.items.reduce((acc, item) => acc + (item.product.salePrice || item.product.price) * item.quantity, 0).toFixed(2)}</span>
                </div>
                
                <Button size="lg" className="w-full text-base h-14 font-bold shadow-lg shadow-primary/20" onClick={() => setLocation("/checkout")}>
                  Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Secure checkout powered by ShopWave.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
