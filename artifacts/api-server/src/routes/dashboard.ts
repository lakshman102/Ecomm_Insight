import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, productsTable, ordersTable, orderItemsTable, categoriesTable } from "@workspace/db";

const router: IRouter = Router();

function toNum(v: string | null | undefined): number | null {
  if (v == null) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [productCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable);

  const [orderCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ordersTable);

  const [revenueRow] = await db
    .select({ total: sql<string>`coalesce(sum(total), 0)` })
    .from(ordersTable);

  const [categoryCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(categoriesTable);

  // Recent orders (last 5)
  const recentOrders = await db
    .select()
    .from(ordersTable)
    .orderBy(ordersTable.createdAt)
    .limit(5);

  const recentOrdersWithItems = await Promise.all(
    recentOrders.map(async (o) => {
      const items = await db
        .select()
        .from(orderItemsTable)
        .where(sql`${orderItemsTable.orderId} = ${o.id}`);
      return {
        id: o.id,
        items: items.map((i) => ({
          id: i.id,
          productId: i.productId,
          quantity: i.quantity,
          price: toNum(i.price as unknown as string)!,
          productName: i.productName,
          productImage: i.productImage,
        })),
        subtotal: toNum(o.subtotal as unknown as string)!,
        shippingCost: toNum(o.shippingCost as unknown as string) ?? 0,
        total: toNum(o.total as unknown as string)!,
        status: o.status,
        shippingAddress: o.shippingAddress,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt.toISOString(),
      };
    })
  );

  // Top products by review count
  const topProducts = await db
    .select()
    .from(productsTable)
    .orderBy(sql`${productsTable.reviewCount} desc`)
    .limit(5);

  const categories = await db.select().from(categoriesTable);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  // Orders by status
  const statusCounts = await db
    .select({
      status: ordersTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(ordersTable)
    .groupBy(ordersTable.status);

  res.json({
    totalProducts: productCount?.count ?? 0,
    totalOrders: orderCount?.count ?? 0,
    totalRevenue: toNum(revenueRow?.total) ?? 0,
    totalCategories: categoryCount?.count ?? 0,
    recentOrders: recentOrdersWithItems,
    topProducts: topProducts.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: toNum(p.price as unknown as string)!,
      salePrice: p.salePrice != null ? toNum(p.salePrice as unknown as string) : null,
      categoryId: p.categoryId,
      categoryName: catMap.get(p.categoryId) ?? null,
      stock: p.stock,
      imageUrl: p.imageUrl,
      images: p.images ?? [],
      rating: toNum(p.rating as unknown as string) ?? 0,
      reviewCount: p.reviewCount,
      featured: p.featured,
      tags: p.tags ?? [],
      createdAt: p.createdAt.toISOString(),
    })),
    ordersByStatus: statusCounts.map((s) => ({ status: s.status, count: s.count })),
  });
});

export default router;
