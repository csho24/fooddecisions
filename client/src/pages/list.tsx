import { Layout } from "@/components/mobile-layout";
import { useFoodStore, FoodItem, FoodType } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, Utensils, Clock, X, MapPin, AlertCircle, Plus, ChevronDown, Check } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [filter, setFilter] = useState<'home' | 'out'>('home');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [_, setLocation] = useLocation();
  const [itemToArchive, setItemToArchive] = useState<string | null>(null);

  const filteredItems = items.filter(item => item.type === filter);

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
      category: "",
      location: "",
    },
  });

  const watchType = form.watch("type");

  // Reset category/location when type changes to avoid "left behind" values
  useEffect(() => {
    if (watchType === 'out') {
      form.setValue('category', '');
    } else {
      form.setValue('location', '');
    }
  }, [watchType, form]);

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
      category: "",
      location: "",
    });
    setIsQuickAddOpen(false);
  }

  const handleArchive = (reason: 'eaten' | 'thrown') => {
    if (itemToArchive) {
      removeItem(itemToArchive);
      setItemToArchive(null);
      // In a real app, we would send this to an archive table with the reason
    }
  };

  const handleEdit = (id: string) => {
    // We can pass state via navigation, but for now let's rely on the AddPage to find it via search or selection.
    // Actually, better to deep link. But AddPage currently uses local state. 
    // The user request was "click on options in food list>Out, it allows me to change..."
    // I'll implement a simple redirect to /add but ideally we'd pass the ID.
    // For now, let's just go to /add. The user can search.
    // Wait, user said "click on options... allows me to change".
    // To make this smooth, I should update AddPage to accept an ID or store selection.
    // But since I can't easily change AddPage's state from here without a global "selectedItem" store property,
    // I will instruct the user to use the Add Info page for editing for now, 
    // OR I can just navigate to /add and they can find it.
    // Actually, I can use a URL parameter ?edit=ID in the future.
    // For this iteration, let's make clicking the item navigate to /add.
    setLocation("/add");
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
      <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-muted/30 rounded-xl">
        <Button 
          variant={filter === 'home' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setFilter('home')}
          className="rounded-lg shadow-none"
        >
          <Home size={16} className="mr-2" />
          Home
        </Button>
        <Button 
          variant={filter === 'out' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setFilter('out')}
          className="rounded-lg shadow-none"
        >
          <Utensils size={16} className="mr-2" />
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
                {item.type === 'home' ? <Home size={20} /> : <Utensils size={20} />}
                
                {!item.status.available && (
                  <div className="absolute -top-1 -right-1 bg-muted-foreground text-white rounded-full p-0.5 border-2 border-card">
                    <AlertCircle size={10} />
                  </div>
                )}
              </div>
              
              {/* Clickable Area for Edit */}
              <div 
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => {
                  setLocation(`/add?id=${item.id}`); 
                }}
              >
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
              
              {/* Actions */}
              <div className="flex flex-col gap-1">
                {item.type === 'home' ? (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-green-600 -mr-2"
                    onClick={() => setItemToArchive(item.id)}
                  >
                    <Check size={18} />
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive -mr-2"
                    onClick={() => removeItem(item.id)}
                  >
                    <X size={18} />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
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
      <AlertDialog open={!!itemToArchive} onOpenChange={(open) => !open && setItemToArchive(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Food Item Consumed?</AlertDialogTitle>
            <AlertDialogDescription>
              Did you eat this item or did it go to waste?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <div className="flex gap-2 w-full sm:w-auto">
              <AlertDialogAction 
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
                onClick={() => handleArchive('thrown')}
              >
                Thrown
              </AlertDialogAction>
              <AlertDialogAction 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleArchive('eaten')}
              >
                Eaten
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
