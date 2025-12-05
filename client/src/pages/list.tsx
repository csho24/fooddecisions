import { Layout } from "@/components/mobile-layout";
import { useFoodStore, FoodItem, FoodType } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, Store, Clock, X, MapPin, AlertCircle, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HOME_CATEGORIES = [
  "Fridge",
  "Snacks"
];

const quickAddSchema = z.object({
  name: z.string().min(2, "Name is required"),
  type: z.enum(['home', 'out']),
  category: z.string().optional(), // For Home
  location: z.string().optional(), // For Out
});

export default function ListPage() {
  const { items, removeItem, checkAvailability, addItem } = useFoodStore();
  const [filter, setFilter] = useState<'all' | 'home' | 'out'>('all');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const filteredItems = items.filter(item => filter === 'all' || item.type === filter);

  // Sort items: Available first, then Unavailable
  const sortedItems = filteredItems.map(item => ({
    ...item,
    status: checkAvailability(item)
  })).sort((a, b) => {
    if (a.status.available === b.status.available) return 0;
    return a.status.available ? -1 : 1;
  });

  // Quick Add Form
  const form = useForm<z.infer<typeof quickAddSchema>>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      name: "",
      type: "home", // Default to home for quick add
      category: "Snacks",
      location: "",
    },
  });

  const watchType = form.watch("type");

  function onQuickAdd(values: z.infer<typeof quickAddSchema>) {
    addItem({
      name: values.name,
      type: values.type as FoodType,
      category: values.type === 'home' ? values.category : undefined,
      location: values.type === 'out' ? values.location : undefined,
    });
    form.reset({
      name: "",
      type: values.type as FoodType, // Keep last type
      category: values.category, // Keep last category
      location: values.location, // Keep last location
    });
    setIsQuickAddOpen(false);
  }

  return (
    <Layout showBack title="My Food List">
      {/* Quick Add Section */}
      <Collapsible 
        open={isQuickAddOpen} 
        onOpenChange={setIsQuickAddOpen}
        className="bg-card border border-border/50 rounded-2xl shadow-sm mb-4 overflow-hidden"
      >
        <div className="p-1">
          {!isQuickAddOpen ? (
             <Button 
               variant="ghost" 
               className="w-full justify-start gap-2 text-muted-foreground hover:text-primary h-12"
               onClick={() => setIsQuickAddOpen(true)}
             >
               <Plus size={20} className="text-primary" />
               <span className="font-medium text-foreground">Quick Add Item</span>
             </Button>
          ) : (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between mb-2">
                 <h3 className="font-semibold text-sm">Quick Add</h3>
                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsQuickAddOpen(false)}>
                   <X size={16} />
                 </Button>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onQuickAdd)} className="space-y-3">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex w-full p-1 bg-muted rounded-lg">
                          <Button
                            type="button"
                            variant="ghost"
                            className={cn(
                              "flex-1 h-8 rounded-md text-xs font-medium",
                              field.value === 'home' && "bg-background shadow-sm text-foreground"
                            )}
                            onClick={() => field.onChange('home')}
                          >
                            Home
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className={cn(
                              "flex-1 h-8 rounded-md text-xs font-medium",
                              field.value === 'out' && "bg-background shadow-sm text-foreground"
                            )}
                            onClick={() => field.onChange('out')}
                          >
                            Out
                          </Button>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="What is it?" {...field} className="h-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {watchType === 'home' ? (
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {HOME_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Location?" {...field} className="h-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button type="submit" size="sm" className="w-full rounded-lg">
                    Add Item
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </div>
      </Collapsible>

      {/* Filter Tabs */}
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
            <div className="text-center py-12 text-muted-foreground space-y-4">
              <p>No items found in this list.</p>
              {/* The Quick Add prompt is now redundant because Quick Add is always visible at top */}
              {!isQuickAddOpen && (
                <Button variant="outline" onClick={() => setIsQuickAddOpen(true)}>
                  Add your first item
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </Layout>
  );
}
