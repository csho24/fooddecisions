import { useState, useMemo } from "react";
import { Layout } from "@/components/mobile-layout";
import { useFoodStore, FoodItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Home as HomeIcon, Store, ChevronRight, MapPin, Clock, AlertCircle, Search, X, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { categorizeFood, FoodCategory } from "../../../shared/business-logic";

export default function Decide() {
  const { items, checkAvailability } = useFoodStore();
  const [step, setStep] = useState<'type' | 'options'>('type');
  const [selectedType, setSelectedType] = useState<'home' | 'out' | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [outTab, setOutTab] = useState<'location' | 'food' | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<FoodCategory | null>(null);
  const [selectedFoodFromLocation, setSelectedFoodFromLocation] = useState<string | null>(null);
  const [selectedFoodFromCategory, setSelectedFoodFromCategory] = useState<string | null>(null);

  // Derived state for filtering and sorting
  const groupedItems = useMemo(() => {
    // If searching, ignore selectedType and search across ALL items
    let filtered = items;

    if (searchQuery.trim()) {
       const query = searchQuery.toLowerCase();
       filtered = items.filter(item => 
         item.name.toLowerCase().includes(query) ||
         item.notes?.toLowerCase().includes(query) ||
         item.location?.toLowerCase().includes(query) ||
         item.category?.toLowerCase().includes(query)
       );
    } else if (selectedType) {
       filtered = items.filter(i => i.type === selectedType);
    } else {
       return {}; // No search, no type selected -> return empty
    }

    // Process availability for all items first
    const itemsWithAvailability = filtered.map(item => ({
      ...item,
      status: checkAvailability(item)
    }));

    // Grouping Logic
    if (searchQuery.trim()) {
      // When searching, group by Type (Home vs Out) to show mixed results clearly
      return itemsWithAvailability.reduce((acc, item) => {
        const typeLabel = item.type === 'home' ? 'Eat at Home' : 'Go Out';
        if (!acc[typeLabel]) acc[typeLabel] = [];
        acc[typeLabel].push(item);
        return acc;
      }, {} as Record<string, typeof itemsWithAvailability>);
    } else if (selectedType === 'home') {
      // Group by Category for Home
      return itemsWithAvailability.reduce((acc, item) => {
        const cat = item.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {} as Record<string, typeof itemsWithAvailability>);
    } else {
      // For Out items, return as-is (will be handled by tabs)
      return itemsWithAvailability.reduce((acc, item) => {
        const key = 'All';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {} as Record<string, typeof itemsWithAvailability>);
    }
  }, [items, selectedType, checkAvailability, searchQuery]);

  // Get unique locations from Out items
  const uniqueLocations = useMemo(() => {
    if (selectedType !== 'out') return [];
    const locationMap = new Map<string, string>(); // lowercase key -> display name
    items
      .filter(item => item.type === 'out')
      .forEach(item => {
        if (item.locations && item.locations.length > 0) {
          item.locations.forEach(loc => {
            const normalizedKey = loc.name.trim().toLowerCase();
            const displayName = loc.name.trim();
            // Keep the first occurrence's capitalization
            if (!locationMap.has(normalizedKey)) {
              locationMap.set(normalizedKey, displayName);
            }
          });
        }
      });
    return Array.from(locationMap.values()).sort();
  }, [items, selectedType]);

  // Get items grouped by food category - use saved category if exists, otherwise auto-categorize
  const itemsByFoodCategory: Record<FoodCategory, Array<FoodItem & { status: ReturnType<typeof checkAvailability>; foodCategory: FoodCategory }>> = useMemo(() => {
    if (selectedType !== 'out') return {} as Record<FoodCategory, Array<FoodItem & { status: ReturnType<typeof checkAvailability>; foodCategory: FoodCategory }>>;
    const outItems = items
      .filter(item => item.type === 'out')
      .map(item => ({
        ...item,
        status: checkAvailability(item),
        // Use saved category if it exists and is a valid FoodCategory, otherwise auto-categorize
        foodCategory: (item.category && ['Noodles', 'Rice', 'Ethnic', 'Light', 'Western'].includes(item.category)) 
          ? (item.category as FoodCategory) 
          : categorizeFood(item.name)
      }));
    
    return outItems.reduce((acc, item) => {
      const category = item.foodCategory;
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<FoodCategory, typeof outItems>);
  }, [items, selectedType, checkAvailability]);

  // Get items for selected location
  const itemsByLocation = useMemo(() => {
    if (selectedType !== 'out' || !selectedLocation) return [];
    return items
      .filter(item => 
        item.type === 'out' && 
        item.locations?.some(loc => loc.name === selectedLocation)
      )
      .map(item => ({
        ...item,
        status: checkAvailability(item)
      }));
  }, [items, selectedType, selectedLocation, checkAvailability]);

  const handleTypeSelect = (type: 'home' | 'out') => {
    setSelectedType(type);
    setStep('options');
    setSearchQuery(""); // Clear search when manually selecting type
    setOutTab(null); // Reset out tab selection
    setSelectedLocation(null); // Reset location selection
    setSelectedFoodCategory(null); // Reset food category selection
    setSelectedFoodFromLocation(null); // Reset food from location selection
    setSelectedFoodFromCategory(null); // Reset food from category selection
  };

  const isSearching = searchQuery.trim().length > 0;

  // Helper function to render items list
  const renderItemsList = (itemsToRender: Array<FoodItem & { status: ReturnType<typeof checkAvailability> }>, allUnavailable?: boolean) => {
    if (itemsToRender.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No items found.</p>
        </div>
      );
    }

    const sortedItems = [...itemsToRender].sort((a, b) => {
      if (a.status.available === b.status.available) return 0;
      return a.status.available ? -1 : 1;
    });

    const isUnavailable = allUnavailable ?? sortedItems.every(i => !i.status.available);

    return (
      <div className={cn(
        "bg-card rounded-2xl border shadow-sm overflow-hidden",
        isUnavailable && "opacity-60 bg-muted/50"
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
              
              {item.locations && item.locations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.locations.map(loc => (
                    <span key={loc.id} className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin size={10} /> {loc.name}
                    </span>
                  ))}
                </div>
              )}
              
              {item.notes && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {item.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Hide header back when drilled into Go Out → Food (category) or Go Out → Location (location detail);
  // only the in-page "Back to Categories" / "Back to Locations" should show.
  const hideHeaderBack = step === 'options' && selectedType === 'out' && (
    (outTab === 'food' && selectedFoodCategory !== null) ||
    (outTab === 'location' && selectedLocation !== null)
  );

  return (
    <Layout 
      showBack={!hideHeaderBack} 
      title={
        isSearching ? 'Search Results' : 
        (step === 'options' ? (selectedType === 'home' ? 'Eat at Home' : 'Go Out') : 'Decide')
      }
    >
      <AnimatePresence mode="wait">
        {(step === 'type' || isSearching) && (
          <motion.div 
            className="flex flex-col h-full gap-4"
            initial={false}
            animate={{ opacity: 1 }}
          >
            {!isSearching && (
               <div className="text-center space-y-2 mb-2 mt-4">
                 <h2 className="text-2xl font-bold">What's the vibe?</h2>
               </div>
            )}

            {/* Large Buttons - Hide when searching */}
            {!isSearching && (
              <div className="grid grid-cols-1 gap-4 shrink-0">
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
            )}

            {/* Search Bar */}
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search for cravings..." 
                className="pl-9 pr-9 h-12 rounded-xl bg-card text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={14} />
                </Button>
              )}
            </div>

            {/* Search Results List */}
            {isSearching && (
               <ScrollArea className="flex-1 -mx-4 px-4 pb-8 mt-2">
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
                         {groupName === 'Eat at Home' ? <HomeIcon size={16} /> : <Store size={16} />}
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
                               
                               <div className="flex items-center gap-2 mt-1">
                                 {item.locations && item.locations.length > 0 && (
                                   <div className="flex flex-col gap-1 mt-1">
                                     {item.locations.map(loc => (
                                       <span key={loc.id} className="text-xs text-muted-foreground flex items-center gap-1">
                                          <MapPin size={10} /> {loc.name}
                                       </span>
                                     ))}
                                   </div>
                                 )}
                                 {item.category && (
                                   <span className="text-xs text-muted-foreground bg-secondary/50 px-1.5 rounded">
                                      {item.category}
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
                     <p>No matches found.</p>
                   </div>
                 )}
               </div>
             </ScrollArea>
            )}
          </motion.div>
        )}

        {!isSearching && step === 'options' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col h-full"
          >
            {selectedType === 'out' ? (
              <>
                <ScrollArea className="flex-1 -mx-4 px-4 pb-8">
                  {!outTab ? (
                    <div className="flex flex-col gap-4 h-full justify-center">
                      <Button 
                        variant="outline"
                        className="h-32 text-xl rounded-3xl flex flex-col gap-3 border-2 hover:border-blue-500 hover:bg-blue-50 transition-all"
                        onClick={() => setOutTab('location')}
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <MapPin size={24} />
                        </div>
                        <span>Location</span>
                        <span className="text-xs font-normal text-muted-foreground">Browse by Area</span>
                      </Button>
                      
                      <Button 
                        variant="outline"
                        className="h-32 text-xl rounded-3xl flex flex-col gap-3 border-2 hover:border-orange-500 hover:bg-orange-50 transition-all"
                        onClick={() => setOutTab('food')}
                      >
                        <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                          <Utensils size={24} />
                        </div>
                        <span>Food</span>
                        <span className="text-xs font-normal text-muted-foreground">Browse by Category</span>
                      </Button>
                    </div>
                  ) : outTab === 'location' ? (
                    <>
                      {!selectedLocation ? (
                        <div className="space-y-3">
                          {uniqueLocations.map(location => (
                            <Button
                              key={location}
                              variant="outline"
                              className="w-full h-16 text-left justify-start rounded-xl"
                              onClick={() => setSelectedLocation(location)}
                            >
                              <MapPin size={20} className="mr-3 text-primary" />
                              <span className="text-lg font-medium">{location}</span>
                            </Button>
                          ))}
                          {uniqueLocations.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground space-y-4">
                              <p>No locations found.</p>
                              <Button asChild className="rounded-xl">
                                <a href="/add">Add Food & Details</a>
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : !selectedFoodFromLocation ? (
                        <div className="space-y-4">
                          <Button
                            variant="ghost"
                            className="mb-4"
                            onClick={() => {
                              setSelectedLocation(null);
                              setSelectedFoodFromLocation(null);
                            }}
                          >
                            ← Back to Locations
                          </Button>
                          <div className="space-y-3">
                            {itemsByLocation.map(item => (
                              <Button
                                key={item.id}
                                variant="outline"
                                className="w-full h-16 text-left justify-start rounded-xl"
                                onClick={() => setSelectedFoodFromLocation(item.name)}
                              >
                                <Utensils size={20} className="mr-3 text-primary" />
                                <span className="text-lg font-medium">{item.name}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Button
                            variant="ghost"
                            className="mb-4"
                            onClick={() => setSelectedFoodFromLocation(null)}
                          >
                            ← Back to {selectedLocation}
                          </Button>
                          <div className="space-y-2">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-muted-foreground px-1">
                              <Utensils size={16} />
                              {selectedFoodFromLocation}
                            </h3>
                            {(() => {
                              const foodItem = items.find(i => i.name === selectedFoodFromLocation);
                              if (!foodItem || !foodItem.locations || foodItem.locations.length === 0) {
                                return <div className="text-muted-foreground text-center py-8">No locations found</div>;
                              }
                              return (
                                <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                                  {foodItem.locations.map((loc, index) => (
                                    <div 
                                      key={loc.id}
                                      className={cn(
                                        "p-4",
                                        index !== 0 && "border-t border-border/50"
                                      )}
                                    >
                                      <div className="flex items-start gap-3">
                                        <MapPin size={18} className="text-primary mt-1" />
                                        <div className="flex-1">
                                          <div className="font-semibold text-lg">{loc.name}</div>
                                          {loc.notes && (
                                            <p className="text-sm text-muted-foreground mt-1">{loc.notes}</p>
                                          )}
                                          {loc.openingHours && (
                                            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                              <Clock size={12} />
                                              {loc.openingHours.open} - {loc.openingHours.close}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {!selectedFoodCategory ? (
                        <div className="space-y-3">
                          {(['Noodles', 'Rice', 'Ethnic', 'Light', 'Western'] as FoodCategory[]).map(category => {
                            const categoryItems = (itemsByFoodCategory as any)[category] || [];
                            return (
                              <Button
                                key={category}
                                variant="outline"
                                className="w-full h-16 text-left justify-between rounded-xl"
                                onClick={() => setSelectedFoodCategory(category)}
                              >
                                <div className="flex items-center">
                                  <Utensils size={20} className="mr-3 text-primary" />
                                  <span className="text-lg font-medium">{category}</span>
                                </div>
                                {categoryItems.length > 0 && (
                                  <span className="text-sm text-muted-foreground">
                                    {categoryItems.length}
                                  </span>
                                )}
                              </Button>
                            );
                          })}
                        </div>
                      ) : !selectedFoodFromCategory ? (
                        <div className="space-y-4">
                          <Button
                            variant="ghost"
                            className="mb-4"
                            onClick={() => {
                              setSelectedFoodCategory(null);
                              setSelectedFoodFromCategory(null);
                            }}
                          >
                            ← Back to Categories
                          </Button>
                          <div className="space-y-3">
                            {((itemsByFoodCategory as any)[selectedFoodCategory] || []).map((item: FoodItem & { status: ReturnType<typeof checkAvailability> }) => (
                              <Button
                                key={item.id}
                                variant="outline"
                                className="w-full h-16 text-left justify-start rounded-xl"
                                onClick={() => setSelectedFoodFromCategory(item.name)}
                              >
                                <Utensils size={20} className="mr-3 text-primary" />
                                <span className="text-lg font-medium">{item.name}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Button
                            variant="ghost"
                            className="mb-4"
                            onClick={() => setSelectedFoodFromCategory(null)}
                          >
                            ← Back to {selectedFoodCategory}
                          </Button>
                          <div className="space-y-2">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-muted-foreground px-1">
                              <Utensils size={16} />
                              {selectedFoodFromCategory}
                            </h3>
                            {(() => {
                              const foodItem = items.find(i => i.name === selectedFoodFromCategory);
                              if (!foodItem || !foodItem.locations || foodItem.locations.length === 0) {
                                return <div className="text-muted-foreground text-center py-8">No locations found</div>;
                              }
                              return (
                                <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                                  {foodItem.locations.map((loc, index) => (
                                    <div 
                                      key={loc.id}
                                      className={cn(
                                        "p-4",
                                        index !== 0 && "border-t border-border/50"
                                      )}
                                    >
                                      <div className="flex items-start gap-3">
                                        <MapPin size={18} className="text-primary mt-1" />
                                        <div className="flex-1">
                                          <div className="font-semibold text-lg">{loc.name}</div>
                                          {loc.notes && (
                                            <p className="text-sm text-muted-foreground mt-1">{loc.notes}</p>
                                          )}
                                          {loc.openingHours && (
                                            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                              <Clock size={12} />
                                              {loc.openingHours.open} - {loc.openingHours.close}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </ScrollArea>
              </>
            ) : (
              /* Home type - keep existing logic */
              <ScrollArea className="flex-1 -mx-4 px-4 pb-8">
                <div className="space-y-6">
                  {Object.entries(groupedItems).map(([groupName, groupItems]) => {
                    const sortedItems = [...groupItems].sort((a, b) => {
                      if (a.status.available === b.status.available) return 0;
                      return a.status.available ? -1 : 1;
                    });
                    const allUnavailable = sortedItems.every(i => !i.status.available);

                    return (
                      <div key={groupName} className="space-y-2">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-muted-foreground px-1">
                          {groupName}
                        </h3>
                        {renderItemsList(sortedItems, allUnavailable)}
                      </div>
                    );
                  })}

                  {Object.keys(groupedItems).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground space-y-4">
                      <p>No items found in this category.</p>
                      <Button asChild className="rounded-xl">
                        <a href="/add">Add Food & Details</a>
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
