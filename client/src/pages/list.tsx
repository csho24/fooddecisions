import { Layout } from "@/components/mobile-layout";
import { useFoodStore, FoodItem, FoodType } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, Utensils, Clock, X, MapPin, AlertCircle, Plus, ChevronDown, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HOME_CATEGORIES = [
  "Fridge",
  "Snacks"
];

const quickAddSchema = z.object({
  name: z.string().min(2, "Name is required"),
  type: z.enum(['home', 'out']),
  category: z.string().optional(), // For Home
  location: z.string().optional(), // For Out - Restored
});

export default function ListPage() {
  const { items, removeItem, checkAvailability, addItem } = useFoodStore();
  const [filter, setFilter] = useState<'home' | 'out'>('home');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [_, setLocation] = useLocation();
  const [itemToArchive, setItemToArchive] = useState<string | null>(null);

  const filteredItems = items.filter(item => item.type === filter);

  // Sort items
  const sortedItems = filteredItems.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  // Quick Add Form
  const form = useForm<z.infer<typeof quickAddSchema>>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      name: "",
      type: "home", 
      category: "",
      location: "",
    },
  });

  const watchType = form.watch("type");

  function onQuickAdd(values: z.infer<typeof quickAddSchema>) {
    addItem({
      name: values.name,
      type: values.type as FoodType,
      category: values.type === 'home' ? values.category : undefined,
      // If Out type and location provided, add it as the first location
      locations: values.type === 'out' && values.location ? [{
        id: Math.random().toString(36).substr(2, 9),
        name: values.location,
        // Default hours/closed days can be empty
      }] : [],
    });
    form.reset({
      name: "",
      type: values.type as FoodType, 
      category: "",
      location: "",
    });
    setIsQuickAddOpen(false);
  }

  const handleArchive = (reason: 'eaten' | 'thrown') => {
    if (itemToArchive) {
      removeItem(itemToArchive);
      setItemToArchive(null);
    }
  };

  return (
    <Layout showBack title="My Food Lists">
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
                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground" onClick={() => setIsQuickAddOpen(false)}>
                   <span className="sr-only">Close</span>
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minus"><path d="M5 12h14"/></svg>
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
                              "flex-1 h-8 rounded-md text-xs font-medium transition-all",
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
                              "flex-1 h-8 rounded-md text-xs font-medium transition-all",
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
                            <Input placeholder="What is it?" {...field} className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all" />
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all">
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
                            <Input placeholder="Location" {...field} className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button type="submit" size="sm" className="w-full h-12 rounded-xl text-base font-medium">
                    Add Item
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </div>
      </Collapsible>

      {/* Filter Tabs */}
      <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-muted/30 rounded-xl">
        <Button 
          variant={filter === 'home' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setFilter('home')}
          className="rounded-lg shadow-none h-10"
        >
          <Home size={16} className="mr-2" />
          Home
        </Button>
        <Button 
          variant={filter === 'out' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setFilter('out')}
          className="rounded-lg shadow-none h-10"
        >
          <Utensils size={16} className="mr-2" />
          Out
        </Button>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-3 pb-20">
          {sortedItems.map((item) => {
            const status = checkAvailability(item);
            return (
            <div 
              key={item.id}
              className={cn(
                "bg-card border border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-all relative min-h-[80px]",
                item.type === 'home' && !status.available && "opacity-70 bg-muted/30"
              )}
            >
              {/* Main Content Container with Right Padding for Absolute Button */}
              <div 
                className="flex gap-3 items-center p-4 pr-24 cursor-pointer"
                onClick={() => setLocation(`/add?id=${item.id}`)}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative",
                  item.type === 'home' ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-600",
                  item.type === 'home' && !status.available && "grayscale opacity-50"
                )}>
                  {item.type === 'home' ? <Home size={20} /> : <Utensils size={20} />}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className={cn(
                    "font-bold text-lg leading-tight truncate",
                    item.type === 'home' && !status.available && "text-muted-foreground"
                  )}>{item.name}</h3>
                  
                  {/* Home Details */}
                  {item.type === 'home' && item.category && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span className="bg-secondary/50 px-1.5 rounded text-[10px] uppercase tracking-wide font-medium">
                        {item.category}
                      </span>
                      {(item.notes) && (
                        <span className="truncate text-xs opacity-70 max-w-[150px]">{item.notes}</span>
                      )}
                    </div>
                  )}

                  {/* Out Details - Show Location names if any */}
                  {item.type === 'out' && item.locations && item.locations.length > 0 && (
                     <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                       <span className="flex items-center gap-1 truncate">
                         <MapPin size={12} /> 
                         {item.locations.map(l => l.name).join(", ")}
                       </span>
                     </div>
                  )}
                </div>
              </div>
              
              {/* ABSOLUTE POSITIONED ACTION BUTTON - Moved further left to avoid cutoff */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                {item.type === 'home' ? (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-12 w-12 rounded-full bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800 transition-colors active:scale-95 shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setItemToArchive(item.id);
                    }}
                  >
                    <Check size={24} strokeWidth={3} />
                  </Button>
                ) : (
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-12 w-12 text-muted-foreground/50 hover:text-foreground"
                     onClick={() => setLocation(`/add?id=${item.id}`)}
                   >
                     <ChevronRight size={24} />
                   </Button>
                )}
              </div>
            </div>
          )})}
          
          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground space-y-4">
              <p>No items found in this list.</p>
              {!isQuickAddOpen && (
                <Button variant="outline" onClick={() => setIsQuickAddOpen(true)}>
                  Add your first item
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Eaten/Thrown Dialog */}
      <Dialog open={!!itemToArchive} onOpenChange={(open) => !open && setItemToArchive(null)}>
        <DialogContent className="w-[90%] rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center text-xl">Food Item Consumed?</DialogTitle>
            <DialogDescription className="text-center">
              Did you eat this item or did it go to waste?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 w-full">
            <Button 
              variant="destructive"
              className="flex-1 h-12 rounded-xl text-lg"
              onClick={() => handleArchive('thrown')}
            >
              Thrown
            </Button>
            <Button 
              className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white text-lg"
              onClick={() => handleArchive('eaten')}
            >
              Eaten
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
