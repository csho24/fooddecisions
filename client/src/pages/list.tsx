import { Layout } from "@/components/mobile-layout";
import { useFoodStore, FoodItem } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, Store, Clock, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ListPage() {
  const { items, removeItem } = useFoodStore();
  const [filter, setFilter] = useState<'all' | 'home' | 'out'>('all');

  const filteredItems = items.filter(item => filter === 'all' || item.type === filter);

  return (
    <Layout showBack title="My Food List">
      <div className="flex gap-2 mb-4">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('all')}
          className="rounded-full"
        >
          All
        </Button>
        <Button 
          variant={filter === 'home' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('home')}
          className="rounded-full"
        >
          Home
        </Button>
        <Button 
          variant={filter === 'out' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setFilter('out')}
          className="rounded-full"
        >
          Out
        </Button>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-3 pb-8">
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              className="bg-card border border-border/50 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex gap-4 items-start group"
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                item.type === 'home' ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-600"
              )}>
                {item.type === 'home' ? <Home size={20} /> : <Store size={20} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg leading-tight truncate">{item.name}</h3>
                
                {item.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin size={12} />
                    <span className="truncate">{item.location}</span>
                  </div>
                )}
                
                {(item.notes) && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {item.notes}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {item.closedDays && item.closedDays.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-red-100 text-red-700 hover:bg-red-100">
                      Closed: {item.closedDays.map(d => DAYS[d]).join(', ')}
                    </Badge>
                  )}
                  
                  {item.openingHours && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal flex gap-1 items-center">
                      <Clock size={10} />
                      {item.openingHours.open}-{item.openingHours.close}
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive -mr-2"
                onClick={() => removeItem(item.id)}
              >
                <X size={16} />
              </Button>
            </div>
          ))}
          
          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No items found in this list.</p>
              <Button variant="link" asChild>
                <a href="/add">Add something?</a>
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </Layout>
  );
}
