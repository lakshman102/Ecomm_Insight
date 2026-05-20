import { Router, type IRouter } from "express";
import { eq, like, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { db, productsTable, categoriesTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  GetProductParams,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
  CreateProductBody,
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

router.get("/products", async (req, res): Promise<void> => {
  const raw = ListProductsQueryParams.safeParse(req.query);
  const params = raw.success ? raw.data : {};

  const categories = await db.select().from(categoriesTable);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  let query = db.select().from(productsTable).$dynamic();
  const conditions = [];

  if (params.search) {
    conditions.push(like(productsTable.name, `%${params.search}%`));
  }
  if (params.categoryId) {
    conditions.push(eq(productsTable.categoryId, params.categoryId));
  }
  if (params.minPrice != null) {
    conditions.push(gte(productsTable.price, String(params.minPrice)));
  }
  if (params.maxPrice != null) {
    conditions.push(lte(productsTable.price, String(params.maxPrice)));
  }
  if (params.featured != null) {
    conditions.push(eq(productsTable.featured, params.featured));
  }
  if (params.onSale) {
    conditions.push(sql`${productsTable.salePrice} IS NOT NULL`);
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  if (params.sort === "price_asc") {
    query = query.orderBy(asc(productsTable.price));
  } else if (params.sort === "price_desc") {
    query = query.orderBy(desc(productsTable.price));
  } else if (params.sort === "rating") {
    query = query.orderBy(desc(productsTable.rating));
  } else if (params.sort === "popular") {
    query = query.orderBy(desc(productsTable.reviewCount));
  } else {
    query = query.orderBy(desc(productsTable.createdAt));
  }

  if (params.limit) query = query.limit(params.limit);
  if (params.offset) query = query.offset(params.offset);

  const products = await query;
  res.json(products.map((p) => formatProduct(p, catMap.get(p.categoryId))));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;
  const [product] = await db
    .insert(productsTable)
    .values({
      name: d.name,
      description: d.description ?? "",
      price: String(d.price),
      salePrice: d.salePrice != null ? String(d.salePrice) : null,
      categoryId: d.categoryId,
      stock: d.stock,
      imageUrl: d.imageUrl,
      images: d.images ?? [],
      featured: d.featured ?? false,
      tags: d.tags ?? [],
    })
    .returning();
  res.status(201).json(formatProduct(product));
});

router.get("/products/featured", async (_req, res): Promise<void> => {
  const categories = await db.select().from(categoriesTable);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.featured, true))
    .orderBy(desc(productsTable.createdAt))
    .limit(8);
  res.json(products.map((p) => formatProduct(p, catMap.get(p.categoryId))));
});

router.get("/products/trending", async (_req, res): Promise<void> => {
  const categories = await db.select().from(categoriesTable);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const products = await db
    .select()
    .from(productsTable)
    .orderBy(desc(productsTable.reviewCount), desc(productsTable.rating))
    .limit(8);
  res.json(products.map((p) => formatProduct(p, catMap.get(p.categoryId))));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const categories = await db.select().from(categoriesTable);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(formatProduct(product, catMap.get(product.categoryId)));
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateProductParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;
  const updates: Record<string, unknown> = {};
  if (d.name !== undefined) updates.name = d.name;
  if (d.description !== undefined) updates.description = d.description;
  if (d.price !== undefined) updates.price = String(d.price);
  if ("salePrice" in d) updates.salePrice = d.salePrice != null ? String(d.salePrice) : null;
  if (d.categoryId !== undefined) updates.categoryId = d.categoryId;
  if (d.stock !== undefined) updates.stock = d.stock;
  if (d.imageUrl !== undefined) updates.imageUrl = d.imageUrl;
  if (d.images !== undefined) updates.images = d.images;
  if (d.featured !== undefined) updates.featured = d.featured;
  if (d.tags !== undefined) updates.tags = d.tags;

  const [product] = await db
    .update(productsTable)
    .set(updates)
    .where(eq(productsTable.id, params.data.id))
    .returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(formatProduct(product));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteProductParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(productsTable).where(eq(productsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
