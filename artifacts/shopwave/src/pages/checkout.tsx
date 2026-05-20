import { MainLayout } from "@/components/layout";
import { useGetCart, useCreateOrder, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Truck, Wallet, ShieldCheck, ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function Checkout() {
  const { data: cart, isLoading } = useGetCart();
  const createOrder = useCreateOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("credit_card");

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container px-4 md:px-6 py-12 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <MainLayout>
        <div className="container px-4 md:px-6 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Button asChild><Link href="/products">Continue Shopping</Link></Button>
        </div>
      </MainLayout>
    );
  }

  const subtotal = cart.items.reduce((acc, item) => acc + (item.product.salePrice || item.product.price) * item.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 15;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !city || !zip) {
      toast({ title: "Incomplete address", description: "Please fill in all address fields", variant: "destructive" });
      return;
    }

    const fullAddress = `${address}, ${city}, ${zip}`;

    createOrder.mutate(
      { data: { shippingAddress: fullAddress, paymentMethod } },
      {
        onSuccess: (order) => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({ title: "Order placed successfully!" });
          setLocation(`/orders/${order.id}`);
        }
      }
    );
  };

  return (
    <MainLayout>
      <div className="bg-muted/30 border-b">
        <div className="container px-4 md:px-6 py-4">
          <Link href="/cart" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cart
          </Link>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight mb-8">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          <div className="flex-1 space-y-10">
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-10">
              
              {/* Shipping Address */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xl font-bold border-b pb-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <h2>Shipping Information</h2>
                </div>
                
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input id="address" required value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" required value={city} onChange={e => setCity(e.target.value)} placeholder="New York" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP / Postal Code</Label>
                      <Input id="zip" required value={zip} onChange={e => setZip(e.target.value)} placeholder="10001" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xl font-bold border-b pb-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <h2>Payment Method</h2>
                </div>

                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Label 
                    htmlFor="credit_card" 
                    className={`flex flex-col items-center justify-center p-6 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors ${paymentMethod === 'credit_card' ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
                  >
                    <RadioGroupItem value="credit_card" id="credit_card" className="sr-only" />
                    <CreditCard className="h-8 w-8 mb-3 text-muted-foreground" />
                    <span className="font-semibold">Credit Card</span>
                  </Label>
                  
                  <Label 
                    htmlFor="paypal" 
                    className={`flex flex-col items-center justify-center p-6 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors ${paymentMethod === 'paypal' ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
                  >
                    <RadioGroupItem value="paypal" id="paypal" className="sr-only" />
                    <svg className="h-8 w-8 mb-3 text-[#00457C]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.11c-.473 0-.867.319-.98.777l-.956 3.938-.041.247-.431 2.737c-.078.472-.495.845-.986.845zm2.416-3.95l.036-.188.756-3.351a2.003 2.003 0 0 1 1.96-1.579h2.11c3.084 0 5.421-1.127 6.136-4.662.015-.078.031-.157.045-.236.438-2.607-.059-4.225-2.222-5.116-1.026-.423-2.646-.576-4.685-.576H6.848l-2.66 15.708h3.04l.115-.499a2.003 2.003 0 0 1 1.956-1.517z"/>
                    </svg>
                    <span className="font-semibold">PayPal</span>
                  </Label>
                </RadioGroup>

                {paymentMethod === 'credit_card' && (
                  <div className="bg-muted/30 p-6 rounded-xl border space-y-4">
                    <div className="space-y-2">
                      <Label>Card Number</Label>
                      <Input placeholder="0000 0000 0000 0000" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Expiry Date</Label>
                        <Input placeholder="MM/YY" />
                      </div>
                      <div className="space-y-2">
                        <Label>CVC</Label>
                        <Input placeholder="123" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-[400px] flex-shrink-0">
            <div className="bg-muted/30 border rounded-2xl p-6 lg:sticky lg:top-24">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-auto pr-2">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-md bg-muted overflow-hidden flex-shrink-0 border">
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center text-sm">
                      <div className="font-medium line-clamp-1">{item.product.name}</div>
                      <div className="text-muted-foreground mt-1">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-medium text-sm flex items-center">
                      ${((item.product.salePrice || item.product.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />
              
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-foreground font-medium">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated Tax</span>
                  <span className="text-foreground font-medium">${tax.toFixed(2)}</span>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="flex justify-between font-extrabold text-xl mb-8">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              <Button 
                type="submit" 
                form="checkout-form" 
                size="lg" 
                className="w-full h-14 text-base font-bold shadow-xl shadow-primary/20" 
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? "Processing..." : `Pay $${total.toFixed(2)}`}
              </Button>
              
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-6">
                <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-500" />
                <span>Secure encrypted checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
