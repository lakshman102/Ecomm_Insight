import { MainLayout } from "@/components/layout";
import { useListCategories } from "@workspace/api-client-react";
import { Link } from "wouter";

export default function Categories() {
  const { data: categories, isLoading } = useListCategories();

  return (
    <MainLayout>
      <div className="border-b bg-muted/20">
        <div className="container px-4 md:px-6 py-10 md:py-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Shop by Category</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Explore our thoughtfully organized collections to find exactly what you're looking for.
          </p>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-12 md:py-20">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[16/9] bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {categories?.map((category) => (
              <Link 
                key={category.id} 
                href={`/products?categoryId=${category.id}`}
                className="group relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted flex items-center justify-center border hover:shadow-xl transition-all"
              >
                <img 
                  src={category.imageUrl || `https://ui-avatars.com/api/?name=${category.name}&background=random`} 
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                <div className="relative z-10 text-center p-6 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 mx-6 transform transition-transform group-hover:scale-105">
                  <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
                  <p className="text-white/80 text-sm mb-4 line-clamp-2">{category.description}</p>
                  <div className="inline-flex items-center text-sm font-medium text-white group-hover:text-primary transition-colors">
                    Explore {category.productCount} items
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
