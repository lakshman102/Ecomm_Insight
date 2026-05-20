# ShopWave E-Commerce

A fully functional e-commerce web application with product catalog, shopping cart, wishlist, checkout, order management, reviews, and an admin dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/shopwave run dev` — run the frontend (port 23798)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter (routing), TanStack Query, Tailwind CSS, Framer Motion, Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle schema (categories, products, reviews, cart, wishlist, orders)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/shopwave/src/pages/` — React pages (home, products, product detail, cart, checkout, orders, etc.)
- `artifacts/shopwave/src/components/` — Shared components (ProductCard, layout, etc.)
- `lib/api-client-react/src/generated/` — Generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — Generated Zod schemas for server validation (do not edit)

## Architecture decisions

- Contract-first: all API changes start in `openapi.yaml`, then run codegen
- Cart and wishlist are session-based (no user auth), stored in DB as shared state
- Checkout clears the cart automatically after order creation
- Free shipping on orders over $100; $9.99 otherwise
- Product ratings are auto-recalculated when a review is submitted

## Product

- **Home**: Hero, featured products grid, category tiles, trending products
- **Browse**: Full product grid with sidebar filters (category, price, sort, on-sale)
- **Product Detail**: Image gallery, add-to-cart, wishlist, tabs for description & reviews
- **Cart**: Quantity controls, subtotal, order summary, proceed to checkout
- **Checkout**: Shipping address, payment method, order summary, place order
- **Orders**: History with status badges, full order detail breakdown
- **Wishlist**: Saved products, move to cart
- **Dashboard**: Revenue stats, orders by status chart, top products, recent orders

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- The `products/featured` and `products/trending` routes must come BEFORE `products/:id` in Express router order
- `cart` hook returns `CartItem[]` directly (not `{ items: CartItem[] }`)
- Numeric fields from DB come back as strings from pg-core `numeric()` — always parse with `parseFloat()`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
