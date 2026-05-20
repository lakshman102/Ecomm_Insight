import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, cartItemsTable } from "@workspace/db";
import {
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  CreateOrderBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toNum(v: string | null | undefined): number | null {
  if (v == null) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

async function getOrderWithItems(orderId: number) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
  return {
    id: order.id,
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      quantity: i.quantity,
      price: toNum(i.price as unknown as string)!,
      productName: i.productName,
      productImage: i.productImage,
    })),
    subtotal: toNum(order.subtotal as unknown as string)!,
    shippingCost: toNum(order.shippingCost as unknown as string) ?? 0,
    total: toNum(order.total as unknown as string)!,
    status: order.status,
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt.toISOString(),
  };
}

router.get("/orders", async (_req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);
  const result = await Promise.all(orders.map((o) => getOrderWithItems(o.id)));
  res.json(result.filter(Boolean));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { shippingAddress, paymentMethod, items: inputItems } = parsed.data;

  // Determine items: from request or from cart
  let orderItems: { productId: number; quantity: number }[] = [];
  if (inputItems && inputItems.length > 0) {
    orderItems = inputItems;
  } else {
    const cartItems = await db.select().from(cartItemsTable);
    orderItems = cartItems.map((c) => ({ productId: c.productId, quantity: c.quantity }));
  }

  if (orderItems.length === 0) {
    res.status(400).json({ error: "No items to order" });
    return;
  }

  // Fetch products for pricing
  const products = await db.select().from(productsTable);
  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const enrichedItems = orderItems.map((item) => {
    const p = productMap.get(item.productId);
    const unitPrice = p
      ? (toNum(p.salePrice as unknown as string) ?? toNum(p.price as unknown as string) ?? 0)
      : 0;
    subtotal += unitPrice * item.quantity;
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: String(unitPrice),
      productName: p?.name ?? "Unknown",
      productImage: p?.imageUrl ?? "",
    };
  });

  const shippingCost = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + shippingCost;

  const [order] = await db
    .insert(ordersTable)
    .values({
      subtotal: String(subtotal),
      shippingCost: String(shippingCost),
      total: String(total),
      status: "pending",
      shippingAddress,
      paymentMethod: paymentMethod ?? "card",
    })
    .returning();

  await db.insert(orderItemsTable).values(
    enrichedItems.map((i) => ({ ...i, orderId: order.id }))
  );

  // Clear cart after order
  await db.delete(cartItemsTable);

  const result = await getOrderWithItems(order.id);
  res.status(201).json(result);
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetOrderParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const order = await getOrderWithItems(params.data.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateOrderStatusParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const result = await getOrderWithItems(updated.id);
  res.json(result);
});

export default router;
