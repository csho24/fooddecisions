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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { capitalizeWords, normalizeLocKey } from "../../../shared/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { useSavedLocations } from "@/hooks/use-saved-locations";
import { Search, ChevronDown, Home, Utensils, Clock, Plus, MapPin, X, Trash2, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { createClosureSchedules, getClosureSchedules, deleteClosureSchedule, ClosureSchedule } from "@/lib/api";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { categorizeFood, getClosureDisplayLocation as getClosureDisplayLocationShared } from "../../../shared/business-logic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name is required"),
  type: z.enum(['home', 'out']),
  category: z.string().optional(),
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
  const { saveLocation: saveLocationToHistory } = useSavedLocations();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const searchString = useSearch();
  
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [step, setStep] = useState<'select' | 'edit'>('select');
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'home' | 'out'>('home');
  const [closureStep, setClosureStep] = useState<'main' | 'closure' | 'cleaning' | 'timeoff' | 'expiry'>('main');
  const [selectedCleaningDates, setSelectedCleaningDates] = useState<Date[]>([]);
  const [selectedTimeOffDates, setSelectedTimeOffDates] = useState<Date[]>([]);
  const [cleaningLocation, setCleaningLocation] = useState("");
  const [selectedClosureFoodItem, setSelectedClosureFoodItem] = useState<FoodItem | null>(null);
  const [savedClosures, setSavedClosures] = useState<ClosureSchedule[]>([]);

  // Debug: confirms which bundle is running. Open DevTools Console on /add — if you see this, new code is loaded.
  useEffect(() => {
    console.log('%c[ADD PAGE] Current bundle loaded (instruction under Cleaning Days location removed)', 'color: green; font-weight: bold');
  }, []);

  // Fetch saved closures when entering closure screens
  useEffect(() => {
    if (closureStep === 'cleaning' || closureStep === 'timeoff') {
      getClosureSchedules()
        .then(closures => setSavedClosures(closures))
        .catch(err => console.error('Failed to fetch closures:', err));
    }
  }, [closureStep]);

  // Get saved dates for a specific type (parse as local date to avoid timezone shift)
  const getSavedDatesForType = (type: 'cleaning' | 'timeoff'): Date[] => {
    return savedClosures
      .filter(c => c.type === type)
      .map(c => {
        const [year, month, day] = c.date.split('-').map(Number);
        return new Date(year, month - 1, day);
      });
  };

  // Check if a date is saved (can't be deselected)
  const isDateSaved = (date: Date, type: 'cleaning' | 'timeoff'): boolean => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return savedClosures.some(c => c.type === type && c.date === dateStr);
  };

  // Get closure info for a date (for tooltip)
  const getClosureForDate = (date: Date): ClosureSchedule | undefined => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return savedClosures.find(c => c.date === dateStr);
  };

  // Only show future/current closures in the "Scheduled Closures" list (past ones stay on calendar)
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const upcomingClosures = savedClosures.filter(c => c.date >= todayStr);
  const pastClosures = savedClosures.filter(c => c.date < todayStr);

  // Resolve display location: use full location name from food item when available
  const getClosureDisplayLocation = (c: ClosureSchedule): string => {
    return getClosureDisplayLocationShared(c, items);
  };

  // Tooltip text for a closure (e.g. "Ghim Moh › Duck Rice • Time off")
  const getClosureTooltip = (c: ClosureSchedule): string => {
    const loc = getClosureDisplayLocation(c);
    const label = c.type === 'cleaning' ? 'Cleaning' : 'Time off';
    return loc && c.foodItemName ? `${loc} › ${c.foodItemName} • ${label}` : (c.foodItemName || loc || label);
  };

  // Group cleaning by (location, date range); consecutive dates become "16–17 Mar"
  type CleaningGroup = { dateRange: string; displayLoc: string; ids: number[] };
  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const formatDateRange = (start: string, end: string): string => {
    const [, m1, d1] = start.split('-').map(Number);
    const [, m2, d2] = end.split('-').map(Number);
    if (start === end) return `${d1} ${MONTHS_SHORT[m1 - 1]}`;
    return `${d1}–${d2} ${MONTHS_SHORT[m1 - 1]}`;
  };
  const mergeConsecutiveDates = (dateToIds: Map<string, number[]>): Array<{ dateRange: string; ids: number[] }> => {
    const sortedDates = Array.from(dateToIds.keys()).sort();
    if (sortedDates.length === 0) return [];
    const ranges: Array<{ start: string; end: string; ids: number[] }> = [];
    let current: string[] = [];
    for (const d of sortedDates) {
      if (current.length === 0) {
        current = [d];
        continue;
      }
      const prev = current[current.length - 1];
      const prevT = new Date(prev).getTime();
      const currT = new Date(d).getTime();
      const diffDays = (currT - prevT) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        current.push(d);
      } else {
        ranges.push({
          start: current[0],
          end: current[current.length - 1],
          ids: current.flatMap(date => dateToIds.get(date) ?? [])
        });
        current = [d];
      }
    }
    ranges.push({
      start: current[0],
      end: current[current.length - 1],
      ids: current.flatMap(date => dateToIds.get(date) ?? [])
    });
    return ranges.map(r => ({ dateRange: formatDateRange(r.start, r.end), ids: r.ids }));
  };
  const buildCleaningGroups = (closures: ClosureSchedule[]): CleaningGroup[] => {
    const cleaning = closures.filter(c => c.type === 'cleaning');
    const byLoc = new Map<string, { displayLoc: string; dateToIds: Map<string, number[]> }>();
    for (const c of cleaning) {
      const displayLoc = getClosureDisplayLocation(c);
      const locKey = normalizeLocKey(displayLoc);
      if (!byLoc.has(locKey)) byLoc.set(locKey, { displayLoc, dateToIds: new Map() });
      const entry = byLoc.get(locKey)!;
      const ids = entry.dateToIds.get(c.date) ?? [];
      ids.push(c.id);
      entry.dateToIds.set(c.date, ids);
    }
    const result: CleaningGroup[] = [];
    for (const { displayLoc, dateToIds } of Array.from(byLoc.values())) {
      for (const { dateRange, ids } of mergeConsecutiveDates(dateToIds)) {
        result.push({ dateRange, displayLoc, ids });
      }
    }
    return result;
  };
  const upcomingCleaningGroups = buildCleaningGroups(upcomingClosures);
  const upcomingTimeOff = upcomingClosures.filter(c => c.type === 'timeoff');
  const pastCleaningGroups = buildCleaningGroups(pastClosures);
  const pastTimeOff = pastClosures.filter(c => c.type === 'timeoff');
  const upcomingClosuresList = [...upcomingCleaningGroups, ...upcomingTimeOff];
  const pastClosuresList = [...pastCleaningGroups, ...pastTimeOff];

  const handleDeleteClosure = async (id: number) => {
    try {
      await deleteClosureSchedule(id);
      const updated = await getClosureSchedules();
      setSavedClosures(updated);
      toast({ title: "Deleted", description: "Closure removed." });
    } catch (err) {
      console.error('Failed to delete closure:', err);
      toast({ title: "Error", description: "Failed to delete closure.", variant: "destructive" });
    }
  };

  const handleDeleteClosureGroup = async (ids: number[]) => {
    try {
      for (const id of ids) await deleteClosureSchedule(id);
      const updated = await getClosureSchedules();
      setSavedClosures(updated);
      toast({ title: "Deleted", description: ids.length > 1 ? `${ids.length} closures removed.` : "Closure removed." });
    } catch (err) {
      console.error('Failed to delete closure:', err);
      toast({ title: "Error", description: "Failed to delete closure.", variant: "destructive" });
    }
  };

  // Expiry State
  const [selectedExpiryCategory, setSelectedExpiryCategory] = useState<'Fridge' | 'Snacks' | null>(null);
  const [selectedExpiryItem, setSelectedExpiryItem] = useState<FoodItem | null>(null);
  const [expiryDateInput, setExpiryDateInput] = useState("");
  
  // Location Editing State
  const [editingLocation, setEditingLocation] = useState<LocationDetail | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isHoursOpen, setIsHoursOpen] = useState(false);
  
  // Category State
  const [availableCategories, setAvailableCategories] = useState<string[]>(['Noodles', 'Rice', 'Ethnic', 'Light', 'Western']);
  const [isChangeCategoryDialogOpen, setIsChangeCategoryDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  
  // Delete Confirmation State
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);

  // Handle deep linking via ID - only set selectedItem when ID changes, not on every items update
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const id = params.get('id');
    if (id) {
      const found = items.find(i => i.id === id);
      // Only update selectedItem if:
      // 1. We don't have a selectedItem yet, OR
      // 2. The ID in the URL changed (navigating to a different item)
      if (found && (!selectedItem || selectedItem.id !== id)) {
        setSelectedItem(found);
        setStep('edit');
      }
    } else {
      // No ID in URL, clear selection if we had one
      if (selectedItem) {
        setSelectedItem(null);
        setStep('select');
    }
    }
  }, [searchString, items, selectedItem]);

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

  // Populate form when item selected - only reset when ID changes to prevent overwriting user edits
  const lastSelectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedItem && selectedItem.id !== lastSelectedIdRef.current) {
      lastSelectedIdRef.current = selectedItem.id;
      form.reset({
        id: selectedItem.id,
        name: selectedItem.name,
        type: selectedItem.type,
        category: selectedItem.category || "",
      });
    } else if (!selectedItem) {
      lastSelectedIdRef.current = null;
    }
  }, [selectedItem, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Ensure capitalization even if onBlur didn't fire
    const capitalizedName = capitalizeWords(values.name.trim());
    try {
    if (selectedItem) {
        await updateItem(selectedItem.id, {
        name: capitalizedName,
        category: values.type === 'home' ? values.category : undefined,
      });
      toast({ title: "Updated!", description: "Item details saved." });
    } else {
        // Creating new item from scratch via this page (unlikely given flow, but possible)
        await addItem({
            name: capitalizedName,
            type: values.type as FoodType,
            category: values.category,
            locations: [],
        });
        toast({ title: "Created!", description: "New item added." });
    }
    // Restore filter from sessionStorage when navigating back
    const savedFilter = sessionStorage.getItem('food-list-filter');
    const filterParam = savedFilter && (savedFilter === 'home' || savedFilter === 'out') ? `?filter=${savedFilter}` : '';
    setLocation(`/list${filterParam}`);
    } catch (error) {
      console.error("Failed to save item:", error);
      toast({ 
        title: "Error", 
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    }
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

    const capitalizedLocationName = capitalizeWords(values.name);

    const newLocation: LocationDetail = {
      id: values.id || Math.random().toString(36).substr(2, 9),
      name: capitalizedLocationName,
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

    // Save to saved locations list for quick access
    saveLocationToHistory(capitalizedLocationName);

    updateItem(selectedItem.id, { locations: updatedLocations });
    
    // Update local state to reflect changes immediately
    setSelectedItem({ ...selectedItem, locations: updatedLocations });
    
    setIsLocationDialogOpen(false);
    toast({ title: "Location Saved", description: `${capitalizedLocationName} updated.` });
  }

  function deleteLocation(id: string) {
    if (!selectedItem) return;
    const updatedLocations = (selectedItem.locations || []).filter(l => l.id !== id);
    updateItem(selectedItem.id, { locations: updatedLocations });
    setSelectedItem({ ...selectedItem, locations: updatedLocations });
    toast({ title: "Deleted", description: "Location removed." });
  }

  function confirmDeleteLocation() {
    if (locationToDelete && selectedItem) {
      deleteLocation(locationToDelete);
      setLocationToDelete(null);
    }
  }

  // Category Management Functions
  function getCurrentCategory(): string {
    if (!selectedItem) return "Ethnic";
    // Use saved category if exists, otherwise auto-categorize
    if (selectedItem.category) {
      return selectedItem.category;
    }
    return categorizeFood(selectedItem.name);
  }

  async function handleSelectCategory(categoryName: string) {
    if (!selectedItem) return;
    try {
      await updateItem(selectedItem.id, { category: categoryName });
      // Update local state to reflect change immediately
      setSelectedItem({ ...selectedItem, category: categoryName });
      toast({ title: "Category Updated", description: `Set to ${categoryName}` });
    } catch (error) {
      console.error("Failed to update category:", error);
      toast({ 
        title: "Error", 
        description: "Failed to update category.",
        variant: "destructive"
      });
    }
    setIsChangeCategoryDialogOpen(false);
  }

  async function handleAddNewCategory() {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return;
    
    // Add to available categories
    if (!availableCategories.includes(trimmedName)) {
      setAvailableCategories([...availableCategories, trimmedName]);
    }
    
    // If there's a selected item, assign this new category to it
    if (selectedItem) {
      await handleSelectCategory(trimmedName);
    }
    
    setNewCategoryName("");
    setIsAddCategoryDialogOpen(false);
    toast({ title: "Category Added", description: `${trimmedName} created` });
  }

  // Handle back navigation for nested steps
  const handleBack = () => {
    if (closureStep === 'expiry') {
      if (selectedExpiryItem) {
        setSelectedExpiryItem(null);
        setExpiryDateInput("");
      } else if (selectedExpiryCategory) {
        setSelectedExpiryCategory(null);
      } else {
        setClosureStep('main');
      }
    } else if (closureStep === 'closure' || closureStep === 'cleaning' || closureStep === 'timeoff') {
      if (closureStep === 'cleaning') {
        setSelectedCleaningDates([]);
        setCleaningLocation("");
        setSelectedClosureFoodItem(null);
        setClosureStep('closure');
      } else if (closureStep === 'timeoff') {
        setSelectedTimeOffDates([]);
        setCleaningLocation("");
        setSelectedClosureFoodItem(null);
        setClosureStep('closure');
      } else {
        setClosureStep('main');
      }
    } else {
      // At main, go to home
      setLocation('/');
    }
  };

  // Determine title based on current step
  const getTitle = () => {
    if (closureStep === 'expiry') {
      if (selectedExpiryItem) return selectedExpiryItem.name;
      if (selectedExpiryCategory) return selectedExpiryCategory;
      return 'Expiry';
    }
    // No title for cleaning/timeoff - shown as h3 in content
    if (closureStep === 'cleaning') return '';
    if (closureStep === 'timeoff') return '';
    if (closureStep === 'closure') return 'Closure';
    return 'Add Info';
  };

  if (step === 'select') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      <Layout showBack title={getTitle()} onBack={handleBack}>
        <div className="flex-1 flex flex-col min-h-0">
          {closureStep === 'main' ? (
            <div className="grid grid-cols-1 gap-4">
              <Button 
                variant="outline"
                className="h-32 text-xl rounded-3xl flex flex-col gap-3 border-2 hover:border-purple-500 hover:bg-purple-50 transition-all"
                onClick={() => setClosureStep('closure')}
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <CalendarIcon size={24} />
                </div>
                <span>Closure</span>
                <span className="text-xs font-normal text-muted-foreground">When is your fave stall closed?</span>
              </Button>
              
              <Button 
                variant="outline"
                className="h-32 text-xl rounded-3xl flex flex-col gap-3 border-2 hover:border-rose-500 hover:bg-rose-50 transition-all"
                onClick={() => setClosureStep('expiry')}
              >
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <span>Expiry</span>
                <span className="text-xs font-normal text-muted-foreground">Be reminded before food expires!</span>
              </Button>
            </div>
          ) : closureStep === 'closure' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Button 
                  variant="outline"
                  className="h-32 text-xl rounded-3xl flex flex-col gap-3 border-2 hover:border-blue-500 hover:bg-blue-50 transition-all"
                  onClick={() => setClosureStep('cleaning')}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Sparkles size={24} />
                  </div>
                  <span>Cleaning</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="h-32 text-xl rounded-3xl flex flex-col gap-3 border-2 hover:border-amber-500 hover:bg-amber-50 transition-all"
                  onClick={() => setClosureStep('timeoff')}
                >
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <CalendarIcon size={24} />
                  </div>
                  <span>Time Off</span>
                </Button>
              </div>
            </div>
          ) : closureStep === 'cleaning' ? (
            <div className="flex-1 flex flex-col space-y-4 pb-8 overflow-y-auto">
              <h3 className="font-bold text-lg">Cleaning Days</h3>
              <Calendar
                mode="multiple"
                selected={[...getSavedDatesForType('cleaning'), ...selectedCleaningDates]}
                onSelect={(dates) => {
                  if (!dates) {
                    setSelectedCleaningDates([]);
                    return;
                  }
                  // Filter out saved dates (both types) - only keep newly selected ones
                  const newDates = dates.filter(d => 
                    !isDateSaved(d, 'cleaning') && !isDateSaved(d, 'timeoff')
                  );
                  setSelectedCleaningDates(newDates);
                }}
                disabled={(date) => isDateSaved(date, 'timeoff')}
                modifiers={{
                  cleaning: [...getSavedDatesForType('cleaning'), ...selectedCleaningDates],
                  timeoff: getSavedDatesForType('timeoff')
                }}
                modifiersStyles={{
                  cleaning: { 
                    backgroundColor: '#2563eb', 
                    color: '#ffffff',
                    opacity: 0.8
                  },
                  timeoff: { 
                    backgroundColor: '#f59e0b', 
                    color: '#ffffff',
                    opacity: 0.8
                  },
                  today: {
                    backgroundColor: 'transparent',
                    fontWeight: 'normal'
                  }
                }}
                components={{
                  DayButton: (props) => {
                    const closure = getClosureForDate(props.day.date);
                    const title = closure ? getClosureTooltip(closure) : undefined;
                    const isCleaning = (props as { modifiers?: { cleaning?: boolean; timeoff?: boolean } }).modifiers?.cleaning;
                    const isTimeoff = (props as { modifiers?: { cleaning?: boolean; timeoff?: boolean } }).modifiers?.timeoff;
                    return (
                      <CalendarDayButton
                        {...props}
                        title={title}
                        className={cn(
                          props.className,
                          "!rounded-xl",
                          isCleaning && "!bg-[#2563eb] !text-white",
                          isTimeoff && "!bg-[#f59e0b] !text-white"
                        )}
                      />
                    );
                  }
                }}
                className="rounded-xl border w-full"
              />
              {/* Show scheduled closures list (all entries, scroll if many) */}
              {upcomingClosuresList.length > 0 && (
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Scheduled Closures{upcomingClosuresList.length > 5 ? ` (${upcomingClosuresList.length} — scroll to see all)` : ''}:
                  </p>
                  <div className="max-h-[220px] overflow-y-scroll overflow-x-hidden rounded-md border border-transparent pr-1" style={{ scrollbarGutter: 'stable' }}>
                    <div className="space-y-1.5 pr-1">
                  {upcomingClosuresList.map((entry) => {
                    if ('ids' in entry && entry.ids) {
                      const g = entry as CleaningGroup;
                      return (
                        <div key={`cleaning-${g.dateRange}-${normalizeLocKey(g.displayLoc)}`} className="text-xs px-2 py-1 rounded flex justify-between items-center gap-2 bg-blue-100 text-blue-700">
                          <span className="min-w-0 flex-1">{g.displayLoc}</span>
                          <span className="opacity-70 shrink-0">{g.dateRange}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClosureGroup(g.ids)} aria-label="Delete closure">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    }
                    const c = entry as ClosureSchedule;
                    const displayLoc = getClosureDisplayLocation(c);
                    return (
                      <div key={c.id} className="text-xs px-2 py-1 rounded flex justify-between items-center gap-2 bg-amber-100 text-amber-700">
                        <span className="min-w-0 flex-1">
                          {displayLoc && c.foodItemName ? `${displayLoc} › ${c.foodItemName}` : c.foodItemName || displayLoc}
                        </span>
                        <span className="opacity-70 shrink-0">{c.date.split('-')[2]}/{c.date.split('-')[1]}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClosure(c.id)} aria-label="Delete closure">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                    </div>
                  </div>
                </div>
              )}
              {pastClosuresList.length > 0 && (
                <Collapsible className="bg-muted/20 rounded-xl p-3">
                  <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground">
                    Past closures
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="max-h-[220px] overflow-y-scroll overflow-x-hidden rounded-md border border-transparent pr-1" style={{ scrollbarGutter: 'stable' }}>
                      <div className="space-y-1.5 pr-1">
                    {pastClosuresList.map((entry) => {
                      if ('ids' in entry && entry.ids) {
                        const g = entry as CleaningGroup;
                        return (
                          <div key={`past-cleaning-${g.dateRange}-${normalizeLocKey(g.displayLoc)}`} className="text-xs px-2 py-1 rounded flex justify-between items-center gap-2 bg-blue-100 text-blue-700">
                            <span className="min-w-0 flex-1">{g.displayLoc}</span>
                            <span className="opacity-70 shrink-0">{g.dateRange}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClosureGroup(g.ids)} aria-label="Delete closure">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      }
                      const c = entry as ClosureSchedule;
                      const displayLoc = getClosureDisplayLocation(c);
                      return (
                        <div key={c.id} className="text-xs px-2 py-1 rounded flex justify-between items-center gap-2 bg-amber-100 text-amber-700">
                          <span className="min-w-0 flex-1">
                            {displayLoc && c.foodItemName ? `${displayLoc} › ${c.foodItemName}` : c.foodItemName || displayLoc}
                          </span>
                          <span className="opacity-70 shrink-0">{c.date.split('-')[2]}/{c.date.split('-')[1]}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClosure(c.id)} aria-label="Delete closure">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
              {selectedCleaningDates.length > 0 && (
                <div className="space-y-4">
                  <div className="space-y-2 px-1">
                    <Label>Location (hawker centre / area)</Label>
                    <div className="min-w-0 overflow-visible">
                      <Input 
                        list="cleaning-location-list"
                        placeholder="e.g. Margaret Drive, Ghim Moh, Ghim Moh Link..."
                        value={cleaningLocation}
                        onChange={(e) => {
                          setCleaningLocation(e.target.value);
                        }}
                        onBlur={(e) => {
                          const capitalized = capitalizeWords(e.target.value);
                          setCleaningLocation(capitalized);
                        }}
                        className="h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      />
                      <datalist id="cleaning-location-list">
                        {(() => {
                          const byNorm = new Map<string, string>();
                          for (const item of items.filter(i => i.type === 'out')) {
                            for (const loc of item.locations ?? []) {
                              const n = normalizeLocKey(loc.name);
                              if (!byNorm.has(n)) byNorm.set(n, loc.name);
                            }
                          }
                          return Array.from(byNorm.values()).sort((a, b) => a.localeCompare(b)).map(name => (
                            <option key={name} value={name} />
                          ));
                        })()}
                      </datalist>
                    </div>
                  </div>
                  {/* Find this string on the page to confirm new bundle is loaded: ADD_DETAILS_NO_INSTR */}
                  <span aria-hidden="true" style={{ position: 'absolute', left: -9999, opacity: 0 }}>ADD_DETAILS_NO_INSTR</span>
                  {cleaningLocation.trim() && (() => {
                    const cleaned = cleaningLocation.trim().toLowerCase();
                    // Exact match only: location name must equal typed text (case-insensitive, trim). "Ghim Moh" does NOT match "Ghim Moh Link".
                    const matchingItems = items.filter(item =>
                      item.type === 'out' &&
                      item.locations?.some(loc =>
                        loc.name.trim().toLowerCase() === cleaned
                      )
                    );

                    if (matchingItems.length === 0) {
                      return (
                        <div className="text-center py-3 text-muted-foreground bg-muted/20 rounded-xl border border-dashed text-sm">
                          <p>No food items found with exact location &quot;{cleaningLocation.trim()}&quot;</p>
                        </div>
                      );
                    }

                    // Matched location name from data (exact match, so one name)
                    const matchedLocationNames = Array.from(new Set(
                      matchingItems.flatMap(item =>
                        (item.locations ?? []).filter(loc => loc.name.trim().toLowerCase() === cleaned).map(loc => loc.name)
                      )
                    ));
                    const fullLocation = matchedLocationNames[0] ?? cleaningLocation.trim();

                    return (
                      <div className="space-y-4">
                        <p className="text-xs font-medium text-muted-foreground rounded-lg bg-muted/40 px-3 py-2">
                          {matchingItems.length} stall{matchingItems.length !== 1 ? 's' : ''} identified for {fullLocation}
                        </p>
                        <Button 
                          onClick={async () => {
                            try {
                              const locKey = normalizeLocKey(fullLocation);
                              const existingDates = new Set(
                                savedClosures
                                  .filter(c => c.type === 'cleaning' && normalizeLocKey(getClosureDisplayLocation(c)) === locKey)
                                  .map(c => c.date)
                              );
                              const newDates = selectedCleaningDates.filter(d => {
                                const year = d.getFullYear();
                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                const day = String(d.getDate()).padStart(2, '0');
                                return !existingDates.has(`${year}-${month}-${day}`);
                              });
                              if (newDates.length === 0) {
                                const existingStr = Array.from(existingDates).sort().map(d => {
                                  const [y, m, day] = d.split('-');
                                  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                                  return `${parseInt(day, 10)} ${months[parseInt(m, 10) - 1]}`;
                                }).join(', ');
                                toast({ title: "Already entered", description: `Cleaning schedule on ${existingStr} already entered for ${fullLocation}.`, variant: "default" });
                                return;
                              }
                              const schedules: Array<{ type: 'cleaning'; date: string; location: string; foodItemId?: string; foodItemName?: string }> = [];
                              for (const date of newDates) {
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                const dateStr = `${year}-${month}-${day}`;
                                for (const item of matchingItems) {
                                  schedules.push({
                                    type: 'cleaning',
                                    date: dateStr,
                                    location: fullLocation,
                                    foodItemId: item.id,
                                    foodItemName: item.name
                                  });
                                }
                              }
                              await createClosureSchedules(schedules);
                              const updated = await getClosureSchedules();
                              setSavedClosures(updated);
                              toast({ title: "Saved!", description: `${fullLocation} — ${matchingItems.length} stall${matchingItems.length !== 1 ? 's' : ''} closed for cleaning.` });
                              setSelectedCleaningDates([]);
                              setCleaningLocation("");
                            } catch (error) {
                              console.error('Error saving cleaning schedule:', error);
                              toast({ title: "Error", description: "Failed to save cleaning schedule.", variant: "destructive" });
                            }
                          }}
                          className="w-full h-14 text-lg rounded-xl"
                        >
                          Mark all {matchingItems.length} stalls closed
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : closureStep === 'timeoff' ? (
            <div className="flex-1 flex flex-col space-y-4 pb-8 overflow-y-auto">
              <h3 className="font-bold text-lg">Time Off</h3>
              <Calendar
                mode="multiple"
                selected={[...getSavedDatesForType('timeoff'), ...selectedTimeOffDates]}
                onSelect={(dates) => {
                  if (!dates) {
                    setSelectedTimeOffDates([]);
                    return;
                  }
                  // Filter out saved dates (both types) and past dates - only keep newly selected ones
                  const newDates = dates.filter(d => 
                    !isDateSaved(d, 'timeoff') && !isDateSaved(d, 'cleaning') && d >= today
                  );
                  setSelectedTimeOffDates(newDates);
                }}
                disabled={(date) => date < today || isDateSaved(date, 'cleaning')}
                modifiers={{
                  cleaning: getSavedDatesForType('cleaning'),
                  timeoff: [...getSavedDatesForType('timeoff'), ...selectedTimeOffDates]
                }}
                modifiersStyles={{
                  cleaning: { 
                    backgroundColor: '#2563eb', 
                    color: '#ffffff',
                    opacity: 0.8
                  },
                  timeoff: { 
                    backgroundColor: '#f59e0b', 
                    color: '#ffffff',
                    opacity: 0.8
                  },
                  today: {
                    backgroundColor: 'transparent',
                    fontWeight: 'normal'
                  }
                }}
                components={{
                  DayButton: (props) => {
                    const closure = getClosureForDate(props.day.date);
                    const title = closure ? getClosureTooltip(closure) : undefined;
                    const isCleaning = (props as { modifiers?: { cleaning?: boolean; timeoff?: boolean } }).modifiers?.cleaning;
                    const isTimeoff = (props as { modifiers?: { cleaning?: boolean; timeoff?: boolean } }).modifiers?.timeoff;
                    return (
                      <CalendarDayButton
                        {...props}
                        title={title}
                        className={cn(
                          props.className,
                          "!rounded-xl",
                          isCleaning && "!bg-[#2563eb] !text-white",
                          isTimeoff && "!bg-[#f59e0b] !text-white"
                        )}
                      />
                    );
                  }
                }}
                className="rounded-xl border w-full"
              />
              {/* Show scheduled closures list (all entries, scroll if many) */}
              {upcomingClosuresList.length > 0 && (
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Scheduled Closures{upcomingClosuresList.length > 5 ? ` (${upcomingClosuresList.length} — scroll to see all)` : ''}:
                  </p>
                  <div className="max-h-[220px] overflow-y-scroll overflow-x-hidden rounded-md border border-transparent pr-1" style={{ scrollbarGutter: 'stable' }}>
                    <div className="space-y-1.5 pr-1">
                  {upcomingClosuresList.map((entry) => {
                    if ('ids' in entry && entry.ids) {
                      const g = entry as CleaningGroup;
                      return (
                        <div key={`to-${g.dateRange}-${normalizeLocKey(g.displayLoc)}`} className="text-xs px-2 py-1 rounded flex justify-between items-center gap-2 bg-blue-100 text-blue-700">
                          <span className="min-w-0 flex-1">{g.displayLoc}</span>
                          <span className="opacity-70 shrink-0">{g.dateRange}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClosureGroup(g.ids)} aria-label="Delete closure">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    }
                    const c = entry as ClosureSchedule;
                    const displayLoc = getClosureDisplayLocation(c);
                    return (
                      <div key={c.id} className="text-xs px-2 py-1 rounded flex justify-between items-center gap-2 bg-amber-100 text-amber-700">
                        <span className="min-w-0 flex-1">
                          {displayLoc && c.foodItemName ? `${displayLoc} › ${c.foodItemName}` : c.foodItemName || displayLoc}
                        </span>
                        <span className="opacity-70 shrink-0">{c.date.split('-')[2]}/{c.date.split('-')[1]}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClosure(c.id)} aria-label="Delete closure">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                    </div>
                  </div>
                </div>
              )}
              {pastClosuresList.length > 0 && (
                <Collapsible className="bg-muted/20 rounded-xl p-3">
                  <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground">
                    Past closures
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="max-h-[220px] overflow-y-scroll overflow-x-hidden rounded-md border border-transparent pr-1" style={{ scrollbarGutter: 'stable' }}>
                      <div className="space-y-1.5 pr-1">
                    {pastClosuresList.map((entry) => {
                      if ('ids' in entry && entry.ids) {
                        const g = entry as CleaningGroup;
                        return (
                          <div key={`past-to-${g.dateRange}-${normalizeLocKey(g.displayLoc)}`} className="text-xs px-2 py-1 rounded flex justify-between items-center gap-2 bg-blue-100 text-blue-700">
                            <span className="min-w-0 flex-1">{g.displayLoc}</span>
                            <span className="opacity-70 shrink-0">{g.dateRange}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClosureGroup(g.ids)} aria-label="Delete closure">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      }
                      const c = entry as ClosureSchedule;
                      const displayLoc = getClosureDisplayLocation(c);
                      return (
                        <div key={c.id} className="text-xs px-2 py-1 rounded flex justify-between items-center gap-2 bg-amber-100 text-amber-700">
                          <span className="min-w-0 flex-1">
                            {displayLoc && c.foodItemName ? `${displayLoc} › ${c.foodItemName}` : c.foodItemName || displayLoc}
                          </span>
                          <span className="opacity-70 shrink-0">{c.date.split('-')[2]}/{c.date.split('-')[1]}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClosure(c.id)} aria-label="Delete closure">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
              {selectedTimeOffDates.length > 0 && (
                <div className="space-y-4">
                  <div className="space-y-2 px-1">
                    <Label>Location</Label>
                    <div className="min-w-0 overflow-visible">
                      <Input 
                        placeholder="e.g. Ghim Moh, Maxwell..."
                        value={cleaningLocation}
                        onChange={(e) => {
                          setCleaningLocation(e.target.value);
                          setSelectedClosureFoodItem(null);
                        }}
                        onBlur={(e) => {
                          const capitalized = capitalizeWords(e.target.value);
                          setCleaningLocation(capitalized);
                        }}
                        className="h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      />
                    </div>
                  </div>
                  
                  {cleaningLocation.trim() && (() => {
                    const matchingItems = items.filter(item => 
                      item.type === 'out' && 
                      item.locations?.some(loc => 
                        loc.name.toLowerCase().includes(cleaningLocation.toLowerCase())
                      )
                    );
                    
                    if (matchingItems.length === 0) {
                      return (
                        <div className="text-center py-3 text-muted-foreground bg-muted/20 rounded-xl border border-dashed text-sm">
                          <p>No food items found with "{cleaningLocation}"</p>
                          <p className="text-xs mt-1">Add this location to a food item first</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-2">
                        <Label>Which stall?</Label>
                        <div className="space-y-1.5">
                          {matchingItems.map(item => (
                            <Button
                              key={item.id}
                              type="button"
                              variant={selectedClosureFoodItem?.id === item.id ? "default" : "outline"}
                              className="w-full h-auto py-2.5 px-3 text-left justify-start rounded-xl text-sm"
                              onClick={() => setSelectedClosureFoodItem(
                                selectedClosureFoodItem?.id === item.id ? null : item
                              )}
                            >
                              <span className="font-medium">{item.name}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  
                  <Button 
                    onClick={async () => {
                      try {
                        // Use full location name from selected food item (not search query e.g. "GH")
                        const fullLocation = selectedClosureFoodItem?.locations?.find(loc =>
                          loc.name.toLowerCase().includes(cleaningLocation.toLowerCase())
                        )?.name ?? cleaningLocation.trim();
                        const schedules = selectedTimeOffDates.map(date => {
                          // Format as local date (YYYY-MM-DD) to avoid timezone shift
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          return {
                            type: 'timeoff' as const,
                            date: `${year}-${month}-${day}`,
                            location: fullLocation,
                            foodItemId: selectedClosureFoodItem?.id,
                            foodItemName: selectedClosureFoodItem?.name
                          };
                        });
                        
                        await createClosureSchedules(schedules);
                        
                        // Refetch to show saved dates
                        const updated = await getClosureSchedules();
                        setSavedClosures(updated);
                        
                        const itemName = selectedClosureFoodItem?.name || cleaningLocation;
                        toast({ 
                          title: "Saved!", 
                          description: `${itemName} time off on ${selectedTimeOffDates.length} day${selectedTimeOffDates.length !== 1 ? 's' : ''}.` 
                        });
                        
                        // Reset for next entry
                        setSelectedTimeOffDates([]);
                        setCleaningLocation("");
                        setSelectedClosureFoodItem(null);
                      } catch (error) {
                        console.error('Error saving time off schedule:', error);
                        toast({ 
                          title: "Error", 
                          description: "Failed to save time off schedule.",
                          variant: "destructive"
                        });
                      }
                    }}
                    className="w-full h-14 text-lg rounded-xl"
                    disabled={!cleaningLocation.trim() || !selectedClosureFoodItem}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
          ) : closureStep === 'expiry' ? (
            <div className="space-y-4">
              {!selectedExpiryCategory ? (
                // Step 1: Select category (Fridge or Snacks)
                <div className="grid grid-cols-1 gap-4">
                  <Button 
                    variant="outline"
                    className="h-28 text-xl rounded-3xl flex flex-col gap-2 border-2 hover:border-blue-500 hover:bg-blue-50 transition-all"
                    onClick={() => setSelectedExpiryCategory('Fridge')}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Home size={20} />
                    </div>
                    <span>Fridge</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-28 text-xl rounded-3xl flex flex-col gap-2 border-2 hover:border-amber-500 hover:bg-amber-50 transition-all"
                    onClick={() => setSelectedExpiryCategory('Snacks')}
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Utensils size={20} />
                    </div>
                    <span>Snacks</span>
                  </Button>
                </div>
              ) : !selectedExpiryItem ? (
                // Step 2: Select item from category
                <div className="space-y-3">
                  {items.filter(item => item.type === 'home' && item.category === selectedExpiryCategory).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                      <p>No {selectedExpiryCategory.toLowerCase()} items found.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {items.filter(item => item.type === 'home' && item.category === selectedExpiryCategory).map(item => {
                        // Calculate days remaining if expiry exists
                        let daysRemaining: number | null = null;
                        if (item.expiryDate) {
                          const expiry = new Date(item.expiryDate);
                          const now = new Date();
                          now.setHours(0, 0, 0, 0);
                          expiry.setHours(0, 0, 0, 0);
                          daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        }
                        
                        return (
                          <Button
                            key={item.id}
                            type="button"
                            variant="outline"
                            className="w-full h-auto py-2.5 px-3 text-left justify-between rounded-lg text-sm"
                            onClick={() => {
                              setSelectedExpiryItem(item);
                              setExpiryDateInput(item.expiryDate || "");
                            }}
                          >
                            <span className="font-medium">{item.name}</span>
                            {daysRemaining !== null && (
                              <span className={cn(
                                "text-xs font-medium px-1.5 py-0.5 rounded",
                                daysRemaining < 0 ? "bg-red-100 text-red-700" :
                                daysRemaining === 0 ? "bg-orange-100 text-orange-700" :
                                daysRemaining <= 2 ? "bg-yellow-100 text-yellow-700" :
                                "bg-green-100 text-green-700"
                              )}>
                                {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d ago` :
                                 daysRemaining === 0 ? "Today!" :
                                 `${daysRemaining}d left`}
                              </span>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                // Step 3: Enter expiry date
                <div className="space-y-4">
                  
                  <div className="bg-card border rounded-xl p-4">
                    <h4 className="font-semibold text-lg">{selectedExpiryItem.name}</h4>
                    {selectedExpiryItem.category && (
                      <span className="text-sm text-muted-foreground">{selectedExpiryItem.category}</span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Expiry Date (DD/MM/YYYY)</Label>
                    <Input
                      type="text"
                      placeholder="e.g. 25/12/2024"
                      value={expiryDateInput}
                      onChange={(e) => {
                        // Auto-format as user types
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2);
                        }
                        if (value.length >= 5) {
                          value = value.slice(0, 5) + '/' + value.slice(5, 9);
                        }
                        setExpiryDateInput(value);
                      }}
                      className="h-14 text-xl text-center rounded-xl bg-muted/30"
                      maxLength={10}
                    />
                  </div>
                  
                  {/* Show preview of days remaining */}
                  {expiryDateInput.length === 10 && (() => {
                    const parts = expiryDateInput.split('/');
                    if (parts.length === 3) {
                      const day = parseInt(parts[0]);
                      const month = parseInt(parts[1]) - 1;
                      const year = parseInt(parts[2]);
                      const expiry = new Date(year, month, day);
                      const now = new Date();
                      now.setHours(0, 0, 0, 0);
                      expiry.setHours(0, 0, 0, 0);
                      
                      if (!isNaN(expiry.getTime())) {
                        const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <div className={cn(
                            "text-center py-4 rounded-xl font-medium text-lg",
                            daysRemaining < 0 ? "bg-red-100 text-red-700" :
                            daysRemaining === 0 ? "bg-orange-100 text-orange-700" :
                            daysRemaining <= 2 ? "bg-yellow-100 text-yellow-700" :
                            "bg-green-100 text-green-700"
                          )}>
                            {daysRemaining < 0 ? `Expired ${Math.abs(daysRemaining)} days ago` :
                             daysRemaining === 0 ? "Expires today!" :
                             daysRemaining === 1 ? "Expires tomorrow!" :
                             `${daysRemaining} days remaining`}
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}
                  
                  <Button
                    type="button"
                    className="w-full h-14 text-lg rounded-xl"
                    disabled={expiryDateInput.length !== 10}
                    onClick={async () => {
                      // Parse DD/MM/YYYY to ISO date
                      const parts = expiryDateInput.split('/');
                      if (parts.length === 3) {
                        const day = parseInt(parts[0]);
                        const month = parseInt(parts[1]) - 1;
                        const year = parseInt(parts[2]);
                        const isoDate = new Date(year, month, day).toISOString().split('T')[0];
                        
                        try {
                          await updateItem(selectedExpiryItem.id, { expiryDate: isoDate });
                          toast({ 
                            title: "Expiry Set!", 
                            description: `${selectedExpiryItem.name} expires on ${expiryDateInput}` 
                          });
                          setSelectedExpiryItem(null);
                          setExpiryDateInput("");
                        } catch (error) {
                          console.error('Error saving expiry date:', error);
                          toast({ 
                            title: "Error", 
                            description: "Failed to save expiry date.",
                            variant: "destructive"
                          });
                        }
                      }
                    }}
                  >
                    Save Expiry Date
                  </Button>
                  
                  {selectedExpiryItem.expiryDate && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={async () => {
                        try {
                          await updateItem(selectedExpiryItem.id, { expiryDate: undefined });
                          toast({ title: "Cleared", description: "Expiry date removed." });
                          setSelectedExpiryItem(null);
                          setExpiryDateInput("");
                        } catch (error) {
                          console.error('Error clearing expiry date:', error);
                        }
                      }}
                    >
                      Clear Expiry Date
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </Layout>
    );
  }

  // Handle back navigation - go back to list with preserved filter
  const handleEditBack = () => {
    const savedFilter = sessionStorage.getItem('food-list-filter');
    const filterParam = savedFilter && (savedFilter === 'home' || savedFilter === 'out') ? `?filter=${savedFilter}` : '';
    setLocation(`/list${filterParam}`);
  };

  return (
    <Layout showBack onBack={handleEditBack}>
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
                  <Input 
                    {...field} 
                    className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all"
                    onBlur={(e) => {
                      const capitalized = capitalizeWords(e.target.value);
                      field.onChange(capitalized);
                    }}
                  />
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                        <div key={loc.id} className="bg-card border rounded-xl p-4 flex justify-between items-center group">
                            <div className="flex-1 cursor-pointer" onClick={() => handleEditLocation(loc)}>
                                <div className="font-medium text-lg">{loc.name}</div>
                            </div>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setLocationToDelete(loc.id)}
                            >
                                <Trash2 size={18} />
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

          {/* Categories Section for Out Items */}
          {watchType === 'out' && selectedItem && (
            <div className="space-y-4 border-t pt-4 border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Categories</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => setIsAddCategoryDialogOpen(true)}>
                  <Plus size={16} className="mr-1" /> Add Category
                </Button>
              </div>

              <div className="space-y-2">
                <div 
                  className="bg-card border rounded-xl p-4 flex justify-between items-center group cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setIsChangeCategoryDialogOpen(true)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-lg">{getCurrentCategory()}</div>
                  </div>
                  <ChevronDown size={18} className="text-muted-foreground" />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full h-14 text-lg rounded-xl mt-6 shadow-lg shadow-primary/20">
            Save Changes
          </Button>

          {selectedItem && selectedItem.type === 'out' && (
             <Button 
               type="button" 
               variant="ghost" 
               size="lg" 
               className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
               onClick={() => {
                 if (selectedItem.id) {
                  removeItem(selectedItem.id);
                  toast({ title: "Deleted", description: `${selectedItem.name} removed.` });
                  // Restore filter from sessionStorage when navigating back
                  const savedFilter = sessionStorage.getItem('food-list-filter');
                  const filterParam = savedFilter && (savedFilter === 'home' || savedFilter === 'out') ? `?filter=${savedFilter}` : '';
                  setLocation(`/list${filterParam}`);
                 }
               }}
             >
               Delete Food Item
             </Button>
          )}
        </form>
      </Form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!locationToDelete} onOpenChange={(open) => !open && setLocationToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this location? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLocation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Location Edit Dialog */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="max-w-[90%] w-full rounded-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{editingLocation ? 'Edit Location Details' : 'Add Location'}</DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label>Location</Label>
                    <Input 
                        value={locationForm.watch('name')} 
                        onChange={(e) => locationForm.setValue('name', e.target.value)}
                        onBlur={(e) => {
                          const capitalized = capitalizeWords(e.target.value);
                          locationForm.setValue('name', capitalized);
                        }}
                        placeholder="e.g. Maxwell or Bedok"
                        className="h-12 rounded-xl bg-muted/30"
                    />
                </div>
                
                {/* Notes field removed as requested */}

                <div className="flex items-center justify-between">
                    <Label htmlFor="has-hours" className="text-sm font-medium">Specific Opening Hours</Label>
                    <Switch 
                        id="has-hours"
                        checked={isHoursOpen}
                        onCheckedChange={setIsHoursOpen}
                    />
                </div>

                {isHoursOpen && (
                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex gap-3 items-center">
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

                        <div className="space-y-2">
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
                )}
            </div>

            <DialogFooter>
                <Button onClick={() => saveLocation(locationForm.getValues())} className="w-full h-12 rounded-xl">Save Location</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Category Dialog */}
      <Dialog open={isChangeCategoryDialogOpen} onOpenChange={setIsChangeCategoryDialogOpen}>
        <DialogContent className="max-w-[90%] w-full rounded-2xl">
          <DialogHeader>
            <DialogTitle>Change Category</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((cat) => {
                const currentCategory = getCurrentCategory();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-medium transition-all border-2",
                      currentCategory === cat
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/30 text-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Category Dialog */}
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent className="max-w-[90%] w-full rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewCategory();
                  }
                }}
                placeholder="e.g. Pizza, Dessert, Drinks..."
                className="h-12 rounded-xl bg-muted/30"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleAddNewCategory} className="w-full h-12 rounded-xl">
              <Plus size={16} className="mr-2" /> Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
