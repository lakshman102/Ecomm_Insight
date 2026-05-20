import { MainLayout } from "@/components/layout";
import { useListOrders } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function OrderStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-500 dark:border-yellow-900/50">Pending</Badge>;
    case 'processing':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-500 dark:border-blue-900/50">Processing</Badge>;
    case 'shipped':
      return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-500 dark:border-purple-900/50">Shipped</Badge>;
    case 'delivered':
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-500 dark:border-green-900/50">Delivered</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-500 dark:border-red-900/50">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function Orders() {
  const { data: orders, isLoading } = useListOrders();

  return (
    <MainLayout>
      <div className="border-b bg-muted/20">
        <div className="container px-4 md:px-6 py-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Order History</h1>
          <p className="text-muted-foreground">View and track your past orders.</p>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
            <div className="bg-muted p-6 rounded-full mb-6">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-4">No orders yet</h2>
            <p className="text-muted-foreground mb-8">
              When you place an order, it will appear here so you can track its status.
            </p>
            <Button size="lg" asChild>
              <Link href="/products">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="border rounded-xl p-6 hover:border-primary/50 transition-colors bg-card flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-full hidden sm:block">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg">Order #{order.id}</h3>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:gap-4">
                      <span>{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="font-medium text-foreground">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t md:border-0 pt-4 md:pt-0">
                  <div className="flex -space-x-2 mr-4">
                    {order.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden relative z-10" style={{ zIndex: 10 - i }}>
                        <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold relative z-0">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                  
                  <Button variant="outline" asChild>
                    <Link href={`/orders/${order.id}`}>
                      View Details <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
