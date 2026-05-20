import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, reviewsTable, productsTable } from "@workspace/db";
import {
  ListReviewsQueryParams,
  CreateReviewBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reviews", async (req, res): Promise<void> => {
  const params = ListReviewsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "productId is required" });
    return;
  }
  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.productId, params.data.productId))
    .orderBy(reviewsTable.createdAt);
  res.json(
    reviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      rating: r.rating,
      comment: r.comment,
      authorName: r.authorName,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/reviews", async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { productId, rating, comment, authorName } = parsed.data;

  const [review] = await db
    .insert(reviewsTable)
    .values({ productId, rating, comment, authorName })
    .returning();

  // Update product rating average and reviewCount
  const allReviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.productId, productId));
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await db
    .update(productsTable)
    .set({ rating: String(Math.round(avg * 100) / 100), reviewCount: allReviews.length })
    .where(eq(productsTable.id, productId));

  res.status(201).json({
    id: review.id,
    productId: review.productId,
    rating: review.rating,
    comment: review.comment,
    authorName: review.authorName,
    createdAt: review.createdAt.toISOString(),
  });
});

export default router;
