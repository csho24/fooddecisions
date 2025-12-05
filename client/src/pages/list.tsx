import { Layout } from "@/components/mobile-layout";
import { useFoodStore, FoodItem } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, Store, Clock, X, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ListPage() {
  const { items, removeItem, checkAvailability } = useFoodStore();
  const [filter, setFilter] = useState<'all' | 'home' | 'out'>('all');

  const filteredItems = items.filter(item => filter === 'all' || item.type === filter);

  // Sort items: Available first, then Unavailable
  const sortedItems = filteredItems.map(item => ({
    ...item,
    status: checkAvailability(item)
  })).sort((a, b) => {
    if (a.status.available === b.status.available) return 0;
    return a.status.available ? -1 : 1;
  });

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
          {sortedItems.map((item) => (
            <div 
              key={item.id}
              className={cn(
                "bg-card border border-border/50 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex gap-4 items-start group relative overflow-hidden",
                !item.status.available && "opacity-70 bg-muted/30"
              )}
            >
              {/* Availability Indicator Strip */}
              {!item.status.available && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted-foreground/20" />
              )}

              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative",
                item.type === 'home' ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-600",
                !item.status.available && "grayscale opacity-50"
              )}>
                {item.type === 'home' ? <Home size={20} /> : <Store size={20} />}
                
                {!item.status.available && (
                  <div className="absolute -top-1 -right-1 bg-muted-foreground text-white rounded-full p-0.5 border-2 border-card">
                    <AlertCircle size={10} />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-bold text-lg leading-tight truncate",
                  !item.status.available && "text-muted-foreground"
                )}>{item.name}</h3>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  {item.type === 'out' && item.location && (
                    <span className="flex items-center gap-1 truncate max-w-[120px]">
                      <MapPin size={12} /> {item.location}
                    </span>
                  )}
                  {item.type === 'home' && item.category && (
                    <span className="bg-secondary/50 px-1.5 rounded text-[10px] uppercase tracking-wide font-medium">
                      {item.category}
                    </span>
                  )}
                </div>
                
                {(item.notes) && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {item.notes}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {!item.status.available && (
                     <Badge variant="destructive" className="text-[10px] h-5 px-1.5 font-normal bg-muted-foreground text-white hover:bg-muted-foreground">
                        {item.status.reason}
                     </Badge>
                  )}

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
