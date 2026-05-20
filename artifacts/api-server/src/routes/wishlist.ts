import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, wishlistItemsTable, productsTable, categoriesTable } from "@workspace/db";
import {
  AddToWishlistBody,
  RemoveFromWishlistParams,
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

router.get("/wishlist", async (_req, res): Promise<void> => {
  const items = await db.select().from(wishlistItemsTable);
  if (items.length === 0) {
    res.json([]);
    return;
  }
  const products = await db.select().from(productsTable);
  const categories = await db.select().from(categoriesTable);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const productMap = new Map(products.map((p) => [p.id, p]));

  res.json(
    items
      .filter((i) => productMap.has(i.productId))
      .map((i) => {
        const p = productMap.get(i.productId)!;
        return {
          id: i.id,
          productId: i.productId,
          product: formatProduct(p, catMap.get(p.categoryId)),
          createdAt: i.createdAt.toISOString(),
        };
      })
  );
});

router.post("/wishlist", async (req, res): Promise<void> => {
  const parsed = AddToWishlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { productId } = parsed.data;

  const [existing] = await db
    .select()
    .from(wishlistItemsTable)
    .where(eq(wishlistItemsTable.productId, productId));
  if (existing) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
    const categories = await db.select().from(categoriesTable);
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    res.status(201).json({
      id: existing.id,
      productId: existing.productId,
      product: product ? formatProduct(product, catMap.get(product.categoryId)) : null,
      createdAt: existing.createdAt.toISOString(),
    });
    return;
  }

  const [item] = await db.insert(wishlistItemsTable).values({ productId }).returning();
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  const categories = await db.select().from(categoriesTable);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  res.status(201).json({
    id: item.id,
    productId: item.productId,
    product: product ? formatProduct(product, catMap.get(product.categoryId)) : null,
    createdAt: item.createdAt.toISOString(),
  });
});

router.delete("/wishlist/:productId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const params = RemoveFromWishlistParams.safeParse({ productId: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid productId" });
    return;
  }
  await db.delete(wishlistItemsTable).where(eq(wishlistItemsTable.productId, params.data.productId));
  res.sendStatus(204);
});

export default router;
