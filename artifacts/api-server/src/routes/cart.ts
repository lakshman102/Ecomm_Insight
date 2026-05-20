import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, cartItemsTable, productsTable, categoriesTable } from "@workspace/db";
import {
  AddToCartBody,
  UpdateCartItemParams,
  UpdateCartItemBody,
  RemoveFromCartParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toNum(v: string | null | undefined): number | null {
  if (v == null) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function formatProduct(p: typeof productsTable.$inferSelect, categoryName?: string | null) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: toNum(p.price as unknown as string)!,
    salePrice: p.salePrice != null ? toNum(p.salePrice as unknown as string) : null,
    categoryId: p.categoryId,
    categoryName: categoryName ?? null,
    stock: p.stock,
    imageUrl: p.imageUrl,
    images: p.images ?? [],
    rating: toNum(p.rating as unknown as string) ?? 0,
    reviewCount: p.reviewCount,
    featured: p.featured,
    tags: p.tags ?? [],
    createdAt: p.createdAt.toISOString(),
  };
}

async function getCartWithProducts() {
  const items = await db.select().from(cartItemsTable);
  if (items.length === 0) return [];
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await db.select().from(productsTable).where(
    productIds.length === 1
      ? eq(productsTable.id, productIds[0])
      : eq(productsTable.id, productIds[0])
  );
  const allProducts = productIds.length > 1
    ? await db.select().from(productsTable)
    : products;
  const categories = await db.select().from(categoriesTable);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const productMap = new Map(allProducts.map((p) => [p.id, p]));
  return items
    .filter((i) => productMap.has(i.productId))
    .map((i) => {
      const p = productMap.get(i.productId)!;
      return {
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        product: formatProduct(p, catMap.get(p.categoryId)),
      };
    });
}

router.get("/cart", async (_req, res): Promise<void> => {
  const cart = await getCartWithProducts();
  res.json(cart);
});

router.post("/cart", async (req, res): Promise<void> => {
  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { productId, quantity } = parsed.data;

  const [existing] = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.productId, productId));

  let item: typeof cartItemsTable.$inferSelect;
  if (existing) {
    [item] = await db
      .update(cartItemsTable)
      .set({ quantity: existing.quantity + quantity })
      .where(eq(cartItemsTable.id, existing.id))
      .returning();
  } else {
    [item] = await db.insert(cartItemsTable).values({ productId, quantity }).returning();
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  const categories = await db.select().from(categoriesTable);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  res.status(201).json({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    product: product ? formatProduct(product, catMap.get(product.categoryId)) : null,
  });
});

router.patch("/cart/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateCartItemParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db
    .update(cartItemsTable)
    .set({ quantity: parsed.data.quantity })
    .where(eq(cartItemsTable.id, params.data.id))
    .returning();
  if (!item) {
    res.status(404).json({ error: "Cart item not found" });
    return;
  }
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
  const categories = await db.select().from(categoriesTable);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  res.json({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    product: product ? formatProduct(product, catMap.get(product.categoryId)) : null,
  });
});

router.delete("/cart/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RemoveFromCartParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(cartItemsTable).where(eq(cartItemsTable.id, params.data.id));
  res.sendStatus(204);
});

router.delete("/cart", async (_req, res): Promise<void> => {
  await db.delete(cartItemsTable);
  res.sendStatus(204);
});

export default router;
