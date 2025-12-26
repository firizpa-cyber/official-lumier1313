import { Layout } from "@/components/layout/Layout";
import { CollectionCard } from "@/components/cards/CollectionCard";
import { collections } from "@/data/movies";
import { Play, Compass, Film, Smile, Flame } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  popular: Play,
  adventures: Compass,
  "popular-series": Film,
  sports: () => <span className="text-3xl">⚽</span>,
  documentary: Film,
  kids: Smile,
  new: Flame,
};

const CollectionsPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
          Коллекция
        </h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {collections.map((collection) => {
            const Icon = iconMap[collection.id];
            return (
              <CollectionCard
                key={collection.id}
                id={collection.id}
                title={collection.title}
                gradient={collection.gradient}
                images={collection.images}
                icon={Icon as any}
              />
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default CollectionsPage;
