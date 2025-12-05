import { Layout } from "@/components/mobile-layout";
import { useFoodStore, FoodType, FoodItem, LocationDetail } from "@/lib/store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useSearch } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Search, ChevronDown, Home, Utensils, Clock, Plus, MapPin, X, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name is required"),
  type: z.enum(['home', 'out']),
  category: z.string().optional(),
  notes: z.string().optional(),
});

const locationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Location name is required"),
  hasOpeningHours: z.boolean().default(false),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  closedDays: z.array(z.number()).optional(),
  notes: z.string().optional(),
});

const DAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

const HOME_CATEGORIES = [
  "Fridge",
  "Snacks"
];

export default function AddPage() {
  const { items, addItem, updateItem, removeItem } = useFoodStore();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const searchString = useSearch();
  
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [step, setStep] = useState<'select' | 'edit'>('select');
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'home' | 'out'>('home');
  
  // Location Editing State
  const [editingLocation, setEditingLocation] = useState<LocationDetail | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isHoursOpen, setIsHoursOpen] = useState(false);

  // Handle deep linking via ID
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const id = params.get('id');
    if (id) {
      const found = items.find(i => i.id === id);
      if (found) {
        setSelectedItem(found);
        setStep('edit');
      }
    }
  }, [searchString, items]);

  // Filter items for selection
  const filteredItems = items.filter(item => 
    item.type === activeTab &&
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "out",
      category: "",
      notes: "",
    },
  });

  const locationForm = useForm<z.infer<typeof locationSchema>>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      hasOpeningHours: false,
      openTime: "09:00",
      closeTime: "21:00",
      closedDays: [],
      notes: "",
    },
  });

  const watchType = form.watch("type");

  // Populate form when item selected
  useEffect(() => {
    if (selectedItem) {
      form.reset({
        id: selectedItem.id,
        name: selectedItem.name,
        type: selectedItem.type,
        category: selectedItem.category || "",
        notes: selectedItem.notes || "",
      });
    }
  }, [selectedItem, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (selectedItem) {
      updateItem(selectedItem.id, {
        name: values.name,
        category: values.type === 'home' ? values.category : undefined,
        notes: values.notes,
      });
      toast({ title: "Updated!", description: "Item details saved." });
    } else {
        // Creating new item from scratch via this page (unlikely given flow, but possible)
        addItem({
            name: values.name,
            type: values.type as FoodType,
            category: values.category,
            notes: values.notes,
            locations: [],
        });
        toast({ title: "Created!", description: "New item added." });
    }
    setLocation("/list");
  }

  function handleAddLocation() {
    setEditingLocation(null);
    locationForm.reset({
      name: "",
      hasOpeningHours: false,
      openTime: "09:00",
      closeTime: "21:00",
      closedDays: [],
      notes: "",
    });
    setIsHoursOpen(false);
    setIsLocationDialogOpen(true);
  }

  function handleEditLocation(loc: LocationDetail) {
    setEditingLocation(loc);
    locationForm.reset({
      id: loc.id,
      name: loc.name,
      hasOpeningHours: !!loc.openingHours,
      openTime: loc.openingHours?.open || "09:00",
      closeTime: loc.openingHours?.close || "21:00",
      closedDays: loc.closedDays || [],
      notes: loc.notes || "",
    });
    setIsHoursOpen(!!loc.openingHours);
    setIsLocationDialogOpen(true);
  }

  function saveLocation(values: z.infer<typeof locationSchema>) {
    if (!selectedItem) return;

    const newLocation: LocationDetail = {
      id: values.id || Math.random().toString(36).substr(2, 9),
      name: values.name,
      notes: values.notes,
      openingHours: isHoursOpen && values.openTime && values.closeTime ? {
        open: values.openTime,
        close: values.closeTime,
      } : undefined,
      closedDays: values.closedDays,
    };

    let updatedLocations = selectedItem.locations || [];
    
    if (editingLocation) {
      updatedLocations = updatedLocations.map(l => l.id === editingLocation.id ? newLocation : l);
    } else {
      updatedLocations = [...updatedLocations, newLocation];
    }

    updateItem(selectedItem.id, { locations: updatedLocations });
    
    // Update local state to reflect changes immediately
    setSelectedItem({ ...selectedItem, locations: updatedLocations });
    
    setIsLocationDialogOpen(false);
    toast({ title: "Location Saved", description: `${values.name} updated.` });
  }

  function deleteLocation(id: string) {
    if (!selectedItem) return;
    const updatedLocations = (selectedItem.locations || []).filter(l => l.id !== id);
    updateItem(selectedItem.id, { locations: updatedLocations });
    setSelectedItem({ ...selectedItem, locations: updatedLocations });
    toast({ title: "Deleted", description: "Location removed." });
  }

  if (step === 'select') {
    return (
      <Layout showBack title="Add Info">
        <div className="space-y-4 h-full flex flex-col">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-xl">
            <Button 
              variant={activeTab === 'home' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => { setActiveTab('home'); setSearchQuery(""); }}
              className="rounded-lg shadow-none"
            >
              <Home size={16} className="mr-2" />
              Home
            </Button>
            <Button 
              variant={activeTab === 'out' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => { setActiveTab('out'); setSearchQuery(""); }}
              className="rounded-lg shadow-none"
            >
              <Utensils size={16} className="mr-2" />
              Out
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder={`Search ${activeTab}...`} 
              className="pl-9 h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ScrollArea className="flex-1 -mx-4 px-4">
            <div className="space-y-2 pb-4">
              {filteredItems.map(item => (
                <div 
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setStep('edit');
                  }}
                  className="p-4 bg-card border border-border/50 rounded-xl flex justify-between items-center hover:bg-accent/50 cursor-pointer transition-all"
                >
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    {item.type === 'out' && item.locations && item.locations.length > 0 && (
                        <p className="text-xs text-muted-foreground">{item.locations.length} Locations</p>
                    )}
                  </div>
                  <ChevronDown className="-rotate-90 text-muted-foreground" size={16} />
                </div>
              ))}
              
              {filteredItems.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No items found.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBack title="Edit Info">
      <div className="mb-6">
        <h2 className="font-bold text-xl">{selectedItem?.name}</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-8">
          
          <div className="hidden">
            <p>{watchType}</p>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchType === 'home' && (
            <>
                <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all">
                            <SelectValue placeholder="Select category" />
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
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                        <Textarea {...field} className="bg-muted/30 border-transparent" placeholder="Any notes?" />
                        </FormControl>
                    </FormItem>
                    )}
                />
            </>
          )}

          {/* Locations Management for Out Items */}
          {watchType === 'out' && (
            <div className="space-y-4 border-t pt-4 border-border/50">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Locations</Label>
                    <Button type="button" size="sm" variant="outline" onClick={handleAddLocation}>
                        <Plus size={16} className="mr-1" /> Add Location
                    </Button>
                </div>

                <div className="space-y-2">
                    {selectedItem?.locations?.map(loc => (
                        <div key={loc.id} className="bg-card border rounded-xl p-3 flex justify-between items-center group">
                            <div className="flex-1 cursor-pointer" onClick={() => handleEditLocation(loc)}>
                                <div className="font-medium">{loc.name}</div>
                                <div className="text-xs text-muted-foreground flex gap-2">
                                    {loc.openingHours && (
                                        <span className="flex items-center gap-1"><Clock size={10}/> {loc.openingHours.open}-{loc.openingHours.close}</span>
                                    )}
                                    {loc.closedDays && loc.closedDays.length > 0 && (
                                        <span className="text-red-500">Closed: {loc.closedDays.map(d => DAYS.find(dy => dy.id === d)?.label.charAt(0)).join(', ')}</span>
                                    )}
                                </div>
                            </div>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => deleteLocation(loc.id)}
                            >
                                <X size={16} />
                            </Button>
                        </div>
                    ))}
                    {(!selectedItem?.locations || selectedItem.locations.length === 0) && (
                        <div className="text-center py-4 text-muted-foreground text-sm bg-muted/20 rounded-xl border border-dashed">
                            No locations added yet.
                        </div>
                    )}
                </div>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full h-14 text-lg rounded-xl mt-6 shadow-lg shadow-primary/20">
            Save Changes
          </Button>

          {selectedItem && (
             <Button 
               type="button" 
               variant="ghost" 
               size="lg" 
               className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
               onClick={() => {
                 if (selectedItem.id) {
                   removeItem(selectedItem.id);
                   toast({ title: "Deleted", description: `${selectedItem.name} removed.` });
                   setLocation("/list");
                 }
               }}
             >
               Delete Food Item
             </Button>
          )}
        </form>
      </Form>

      {/* Location Edit Dialog */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="max-w-[90%] w-full rounded-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{editingLocation ? 'Edit Location Details' : 'Add Location'}</DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label>Location Name</Label>
                    <Input 
                        value={locationForm.watch('name')} 
                        onChange={(e) => locationForm.setValue('name', e.target.value)}
                        placeholder="e.g. Maxwell or Bedok"
                        className="h-12 rounded-xl bg-muted/30"
                    />
                </div>

                {/* Only show details fields if we are EDITING or if user wants to expand them.
                    But user said "When I click add location I don't want to see the rest of it".
                    So let's hide the detailed fields for a NEW location unless explicitly toggled.
                    Actually, the simplest interpretation is: Add = Name Only. Edit = Full Box.
                    Let's just make the details collapsible or conditional on 'editingLocation' existing?
                    User said: "only in 'add info' function does the full box appear.. and thats correct."
                    Wait, this page IS 'Add Info'. 
                    So maybe they want the full box HERE.
                    
                    Let's keep the full box here because we are in 'Add Info' page.
                    BUT the user said "When i click add location, i dont wanna see the rest of it".
                    This implies the 'Add Location' dialog should be simple.
                */}
                
                <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea 
                        value={locationForm.watch('notes')} 
                        onChange={(e) => locationForm.setValue('notes', e.target.value)}
                        placeholder="Queue info, stall unit number..."
                        className="bg-muted/30"
                    />
                </div>

                <Collapsible 
                    open={isHoursOpen} 
                    onOpenChange={setIsHoursOpen}
                    className="border rounded-xl overflow-hidden bg-card/50"
                >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <Clock size={20} className="text-muted-foreground" />
                            <span className="font-medium text-sm">Specific Opening Hours</span>
                        </div>
                        <ChevronDown size={16} className={cn("text-muted-foreground transition-transform duration-200", isHoursOpen && "rotate-180")} />
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="p-4 pt-0 space-y-4 bg-card/30">
                        <div className="flex gap-3 items-center pt-2">
                            <div className="flex-1 space-y-1">
                                <Label className="text-xs text-muted-foreground">Opens</Label>
                                <Input 
                                    type="time" 
                                    value={locationForm.watch('openTime')} 
                                    onChange={(e) => locationForm.setValue('openTime', e.target.value)}
                                    className="h-10 text-sm" 
                                />
                            </div>
                            <span className="text-muted-foreground pt-6">-</span>
                            <div className="flex-1 space-y-1">
                                <Label className="text-xs text-muted-foreground">Closes</Label>
                                <Input 
                                    type="time" 
                                    value={locationForm.watch('closeTime')} 
                                    onChange={(e) => locationForm.setValue('closeTime', e.target.value)}
                                    className="h-10 text-sm" 
                                />
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                <div className="space-y-2 pt-2">
                    <Label className="text-sm font-medium">Days Business is Closed</Label>
                    <div className="flex flex-wrap gap-1.5">
                        {DAYS.map((day) => {
                            const currentClosed = locationForm.watch('closedDays') || [];
                            const isSelected = currentClosed.includes(day.id);
                            return (
                                <div 
                                    key={day.id}
                                    onClick={() => {
                                        if (isSelected) {
                                            locationForm.setValue('closedDays', currentClosed.filter(d => d !== day.id));
                                        } else {
                                            locationForm.setValue('closedDays', [...currentClosed, day.id]);
                                        }
                                    }}
                                    className={cn(
                                        "flex items-center justify-center w-10 h-10 rounded-full border text-sm font-medium cursor-pointer transition-all select-none",
                                        isSelected
                                            ? "bg-destructive text-destructive-foreground border-destructive"
                                            : "bg-card hover:bg-accent border-border/60"
                                    )}
                                >
                                    {day.label.charAt(0)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button onClick={() => saveLocation(locationForm.getValues())} className="w-full h-12 rounded-xl">Save Location</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
