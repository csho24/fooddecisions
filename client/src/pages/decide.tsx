import { useState, useMemo } from "react";
import { Layout } from "@/components/mobile-layout";
import { useFoodStore, FoodItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Home as HomeIcon, Store, ChevronRight, MapPin, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Decide() {
  const { items, checkAvailability } = useFoodStore();
  const [step, setStep] = useState<'type' | 'options'>('type');
  const [selectedType, setSelectedType] = useState<'home' | 'out' | null>(null);

  // Derived state for filtering and sorting
  const groupedItems = useMemo(() => {
    if (!selectedType) return {};

    const filtered = items.filter(i => i.type === selectedType);

    // Process availability for all items first
    const itemsWithAvailability = filtered.map(item => ({
      ...item,
      status: checkAvailability(item)
    }));

    if (selectedType === 'home') {
      // Group by Category for Home
      return itemsWithAvailability.reduce((acc, item) => {
        const cat = item.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {} as Record<string, typeof itemsWithAvailability>);
    } else {
      // Group by Location for Out
      return itemsWithAvailability.reduce((acc, item) => {
        const loc = item.location || 'Unspecified';
        if (!acc[loc]) acc[loc] = [];
        acc[loc].push(item);
        return acc;
      }, {} as Record<string, typeof itemsWithAvailability>);
    }
  }, [items, selectedType, checkAvailability]);

  const handleTypeSelect = (type: 'home' | 'out') => {
    setSelectedType(type);
    setStep('options');
  };

  return (
    <Layout showBack={step === 'options'} title={step === 'options' ? (selectedType === 'home' ? 'Eat at Home' : 'Go Out') : 'Decide'}>
      <AnimatePresence mode="wait">
        {step === 'type' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full justify-center gap-6"
          >
            <div className="text-center space-y-2 mb-4">
              <h2 className="text-2xl font-bold">What's the vibe?</h2>
              <p className="text-muted-foreground">Choose your path to see options</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Button 
                variant="outline"
                className="h-32 text-xl rounded-3xl flex flex-col gap-3 border-2 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => handleTypeSelect('home')}
              >
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <HomeIcon size={24} />
                </div>
                <span>Eat at Home</span>
                <span className="text-xs font-normal text-muted-foreground">Browse by Category</span>
              </Button>
              
              <Button 
                variant="outline"
                className="h-32 text-xl rounded-3xl flex flex-col gap-3 border-2 hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                onClick={() => handleTypeSelect('out')}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Store size={24} />
                </div>
                <span>Go Out</span>
                <span className="text-xs font-normal text-muted-foreground">Browse by Location</span>
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'options' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col h-full"
          >
            <ScrollArea className="flex-1 -mx-4 px-4 pb-8">
              <div className="space-y-6">
                {Object.entries(groupedItems).map(([groupName, groupItems]) => {
                  // Sort items: Available first, then unavailable
                  const sortedItems = [...groupItems].sort((a, b) => {
                    if (a.status.available === b.status.available) return 0;
                    return a.status.available ? -1 : 1;
                  });

                  // Check if all items in this group are unavailable (for UI styling)
                  const allUnavailable = sortedItems.every(i => !i.status.available);

                  return (
                    <div key={groupName} className="space-y-2">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-muted-foreground px-1">
                        {selectedType === 'out' && <MapPin size={16} />}
                        {groupName}
                      </h3>
                      
                      <div className={cn(
                        "bg-card rounded-2xl border shadow-sm overflow-hidden",
                        allUnavailable && "opacity-60 bg-muted/50"
                      )}>
                        {sortedItems.map((item, index) => (
                          <div 
                            key={item.id}
                            className={cn(
                              "p-4 flex items-start gap-3 transition-colors",
                              index !== 0 && "border-t border-border/50",
                              !item.status.available ? "bg-muted/30 text-muted-foreground" : "hover:bg-accent/50 cursor-pointer"
                            )}
                          >
                            <div className={cn(
                              "w-2 h-2 mt-2 rounded-full shrink-0",
                              item.status.available ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-300"
                            )} />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <h4 className={cn(
                                  "font-semibold text-base leading-tight",
                                  !item.status.available && "line-through decoration-muted-foreground/50"
                                )}>
                                  {item.name}
                                </h4>
                                {!item.status.available && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 bg-destructive/10 text-destructive rounded flex items-center gap-1 whitespace-nowrap">
                                    <Clock size={10} /> {item.status.reason || "Closed"}
                                  </span>
                                )}
                              </div>
                              
                              {item.notes && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {item.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {Object.keys(groupedItems).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No items found.</p>
                    <Button variant="link" onClick={() => setStep('type')}>Go back</Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
