import { Layout } from "@/components/mobile-layout";
import { useFoodStore, FoodItem, FoodType } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, Utensils, Clock, X, MapPin, AlertCircle, Plus, ChevronDown, Check, ChevronRight, Trash2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HOME_CATEGORIES = [
  "Fridge",
  "Snacks"
];

const quickAddSchema = z.object({
  name: z.string().min(2, "Name is required"),
  type: z.enum(['home', 'out']),
  category: z.string().optional(), // For Home
});

export default function ListPage() {
  const { items, archivedItems, removeItem, checkAvailability, addItem, archiveItem } = useFoodStore();
  const [filter, setFilter] = useState<'home' | 'out'>('home');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [_, setLocation] = useLocation();
  const [itemToArchive, setItemToArchive] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);

  const filteredItems = items.filter(item => item.type === filter);
  // Show all archived items (they're already removed from active items when archived)
  const filteredArchivedItems = archivedItems;

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
    },
  });

  const watchType = form.watch("type");

  function onQuickAdd(values: z.infer<typeof quickAddSchema>) {
    addItem({
      name: values.name,
      type: values.type as FoodType,
      category: values.type === 'home' ? values.category : undefined,
      locations: values.type === 'out' ? [] : undefined, 
    });
    form.reset({
      name: "",
      type: values.type as FoodType, 
      category: "",
    });
    setIsQuickAddOpen(false);
  }

  const handleArchive = async (reason: 'eaten' | 'thrown') => {
    if (itemToArchive) {
      try {
        await archiveItem(itemToArchive, reason);
        setItemToArchive(null);
      } catch (error) {
        console.error("Failed to archive item:", error);
      }
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
                            <Input placeholder="What is it?" {...field} className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {watchType === 'home' && (
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
                className="flex gap-3 items-center p-4 pr-16 cursor-pointer"
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
                </div>
              </div>
              
              {/* ABSOLUTE POSITIONED ACTION BUTTON - Guaranteed not to be cut off */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                {item.type === 'home' ? (
                  <Checkbox
                    className="h-8 w-8 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary cursor-pointer"
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setItemToArchive(item.id);
                      } else {
                        // Uncheck if clicked again
                        setItemToArchive(null);
                      }
                    }}
                    checked={itemToArchive === item.id}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-12 w-12 text-muted-foreground/50 hover:text-foreground"
                     onClick={(e) => {
                       e.stopPropagation();
                       setLocation(`/add?id=${item.id}`);
                     }}
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

      {/* Archive Section */}
      {filter === 'home' && filteredArchivedItems.length > 0 && (
        <div className="mt-6 border-t border-border/50 pt-4">
          <Collapsible open={showArchive} onOpenChange={setShowArchive}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between mb-3">
                <span className="font-medium">Archive ({filteredArchivedItems.length})</span>
                <ChevronDown className={cn("transition-transform", showArchive && "rotate-180")} size={16} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2">
                {filteredArchivedItems.map((archivedItem) => (
                  <div
                    key={archivedItem.id}
                    className={cn(
                      "bg-card border rounded-xl p-3 flex items-center gap-3",
                      archivedItem.status === 'thrown' && "border-red-200 bg-red-50/50",
                      archivedItem.status === 'eaten' && "border-green-200 bg-green-50/50"
                    )}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      archivedItem.status === 'thrown' && "bg-red-500",
                      archivedItem.status === 'eaten' && "bg-green-500"
                    )} />
                    <div className="flex-1">
                      <p className={cn(
                        "font-medium text-sm",
                        archivedItem.status === 'thrown' && "text-red-700",
                        archivedItem.status === 'eaten' && "text-green-700"
                      )}>
                        {archivedItem.name}
                      </p>
                      {archivedItem.category && (
                        <p className="text-xs text-muted-foreground">{archivedItem.category}</p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        archivedItem.status === 'thrown' && "border-red-300 text-red-700",
                        archivedItem.status === 'eaten' && "border-green-300 text-green-700"
                      )}
                    >
                      {archivedItem.status === 'thrown' ? 'Thrown' : 'Eaten'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

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
