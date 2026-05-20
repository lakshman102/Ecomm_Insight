import { MainLayout } from "@/components/layout";
import { useGetOrder } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowLeft, Package, MapPin, CreditCard, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "./orders";
import { Separator } from "@/components/ui/separator";

export default function OrderDetail({ params }: { params: { id: string } }) {
  const { data: order, isLoading } = useGetOrder(Number(params.id), { query: { enabled: !!params.id } });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container px-4 md:px-6 py-12 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <div className="container px-4 md:px-6 py-20 text-center">
          <h1 className="text-2xl font-bold">Order not found</h1>
          <Button className="mt-4" asChild><Link href="/orders">Back to Orders</Link></Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-muted/30 border-b">
        <div className="container px-4 md:px-6 py-4">
          <Link href="/orders" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
          </Link>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-10 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Order #{order.id}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-lg border">
            <span className="font-semibold text-sm">Status:</span>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="border rounded-xl p-5 bg-card">
            <div className="flex items-center gap-2 font-bold mb-3">
              <MapPin className="h-5 w-5 text-primary" /> Shipping Address
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {order.shippingAddress}
            </p>
          </div>
          
          <div className="border rounded-xl p-5 bg-card">
            <div className="flex items-center gap-2 font-bold mb-3">
              <CreditCard className="h-5 w-5 text-primary" /> Payment Method
            </div>
            <p className="text-sm text-muted-foreground capitalize">
              {order.paymentMethod?.replace('_', ' ') || 'Credit Card'}
            </p>
          </div>
          
          <div className="border rounded-xl p-5 bg-card">
            <div className="flex items-center gap-2 font-bold mb-3">
              <Truck className="h-5 w-5 text-primary" /> Delivery Method
            </div>
            <p className="text-sm text-muted-foreground">
              Standard Shipping
            </p>
          </div>
        </div>

        <div className="border rounded-2xl overflow-hidden bg-card mb-8">
          <div className="bg-muted/50 p-4 border-b font-bold flex items-center gap-2">
            <Package className="h-5 w-5" /> Order Items ({order.items.length})
          </div>
          <div className="divide-y">
            {order.items.map((item) => (
              <div key={item.id} className="p-4 sm:p-6 flex gap-4 sm:gap-6 items-center">
                <Link href={`/products/${item.productId}`} className="w-16 sm:w-20 h-16 sm:h-20 bg-muted rounded-md overflow-hidden flex-shrink-0 border group">
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.productId}`} className="font-bold text-base hover:text-primary transition-colors line-clamp-1">
                    {item.productName}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
                </div>
                <div className="font-bold text-right flex-shrink-0">
                  ${(item.price * item.quantity).toFixed(2)}
                  {item.quantity > 1 && <div className="text-xs text-muted-foreground font-normal mt-1">${item.price.toFixed(2)} each</div>}
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-muted/30 p-6 border-t flex flex-col items-end">
            <div className="w-full sm:w-64 space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{order.shippingCost === 0 ? "Free" : `$${order.shippingCost?.toFixed(2) || '0.00'}`}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-extrabold text-xl">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
