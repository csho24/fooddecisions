import { Layout } from "@/components/mobile-layout";
import { useFoodStore } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function FoodWastedPage() {
  const { archivedItems, deleteArchivedItem } = useFoodStore();

  const thrownItems = useMemo(() => {
    return archivedItems
      .filter(item => item.status === 'thrown')
      .sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime());
  }, [archivedItems]);

  return (
    <Layout showBack title="Food Wasted">
      <ScrollArea className="flex-1">
        <div className="space-y-3 pb-20 px-4 pt-4">
          {thrownItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No items thrown away yet.</p>
            </div>
          ) : (
            thrownItems.map((archivedItem) => {
              const isTestItem = archivedItem.name.toLowerCase().includes('test');
              const thrownDate = new Date(archivedItem.archivedAt);
              return (
                <div
                  key={archivedItem.id}
                  className="bg-card border border-red-200 bg-red-50/50 rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-base text-red-700">
                      {archivedItem.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {archivedItem.category && (
                        <span className="text-xs text-muted-foreground bg-secondary/50 px-1.5 rounded">
                          {archivedItem.category}
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(thrownDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  {isTestItem && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 shrink-0"
                      onClick={async () => {
                        try {
                          await deleteArchivedItem(archivedItem.id);
                        } catch (error) {
                          console.error("Failed to delete archived item:", error);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </Layout>
  );
}
