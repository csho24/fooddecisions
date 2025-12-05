import { Layout } from "@/components/mobile-layout";
import { useFoodStore, FoodType, FoodItem } from "@/lib/store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Search, ChevronDown, Home, Utensils } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name is required"),
  type: z.enum(['home', 'out']),
  location: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  hasOpeningHours: z.boolean().default(false),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  closedDays: z.array(z.number()).optional(),
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
  const { items, addItem, removeItem } = useFoodStore();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [step, setStep] = useState<'select' | 'edit'>('select');
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'home' | 'out'>('home');

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
      location: "",
      category: "",
      notes: "",
      hasOpeningHours: false,
      openTime: "09:00",
      closeTime: "21:00",
      closedDays: [],
    },
  });

  const watchType = form.watch("type");
  const watchHasHours = form.watch("hasOpeningHours");

  // Populate form when item selected
  useEffect(() => {
    if (selectedItem) {
      form.reset({
        id: selectedItem.id,
        name: selectedItem.name,
        type: selectedItem.type,
        location: selectedItem.location || "",
        category: selectedItem.category || "",
        notes: selectedItem.notes || "",
        hasOpeningHours: !!selectedItem.openingHours,
        openTime: selectedItem.openingHours?.open || "09:00",
        closeTime: selectedItem.openingHours?.close || "21:00",
        closedDays: selectedItem.closedDays || [],
      });
    }
  }, [selectedItem, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.id) {
      removeItem(values.id);
    }

    addItem({
      name: values.name,
      type: values.type as FoodType,
      location: values.type === 'out' ? values.location : undefined,
      category: values.type === 'home' ? values.category : undefined,
      notes: values.notes,
      openingHours: values.hasOpeningHours && values.openTime && values.closeTime ? {
        open: values.openTime,
        close: values.closeTime,
      } : undefined,
      closedDays: values.closedDays,
    });

    toast({
      title: "Updated!",
      description: `${values.name} details saved.`,
    });

    setLocation("/list");
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
              className="pl-9"
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
        <Button 
          variant="ghost" 
          size="sm" 
          className="-ml-2 text-muted-foreground mb-2"
          onClick={() => setStep('select')}
        >
          ← Back
        </Button>
        <h2 className="font-bold text-xl">{selectedItem?.name}</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-8">
          
          {/* Hidden Type Field - we just display it */}
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
                  <Input {...field} className="bg-card" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchType === 'home' && (
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-card">
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
          )}

          {watchType === 'out' && (
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Location" {...field} className="bg-card" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchType === 'out' && (
            <div className="space-y-4 border-t pt-4 border-border/50">
              <FormField
                control={form.control}
                name="hasOpeningHours"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-3 h-12 bg-card/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">
                        Opening Hours
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="h-5 w-5"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchHasHours && (
                <div className="flex gap-3 items-center bg-card/30 p-2 rounded-lg border border-dashed border-border/60">
                  <FormField
                    control={form.control}
                    name="openTime"
                    render={({ field }) => (
                      <FormItem className="flex-1 space-y-1">
                        <FormControl>
                          <Input type="time" {...field} className="h-8 text-sm bg-transparent border-border/60" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <span className="text-muted-foreground">-</span>
                  <FormField
                    control={form.control}
                    name="closeTime"
                    render={({ field }) => (
                      <FormItem className="flex-1 space-y-1">
                        <FormControl>
                          <Input type="time" {...field} className="h-8 text-sm bg-transparent border-border/60" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Days Business is Closed</Label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((day) => (
                    <FormField
                      key={day.id}
                      control={form.control}
                      name="closedDays"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={day.id}
                            className="flex flex-row items-start space-x-0 space-y-0"
                          >
                            <FormControl>
                              <div className="relative">
                                <Checkbox
                                  className="sr-only"
                                  checked={field.value?.includes(day.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), day.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== day.id
                                          )
                                        )
                                  }}
                                  id={`day-${day.id}`}
                                />
                                <Label 
                                  htmlFor={`day-${day.id}`}
                                  className={cn(
                                    "flex items-center justify-center w-9 h-9 rounded-full border text-xs font-medium cursor-pointer transition-all",
                                    field.value?.includes(day.id)
                                      ? "bg-destructive text-destructive-foreground border-destructive"
                                      : "bg-card hover:bg-accent border-border/60"
                                  )}
                                >
                                  {day.label.charAt(0)}
                                </Label>
                              </div>
                            </FormControl>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full h-14 text-lg rounded-xl mt-6 shadow-lg shadow-primary/20">
            Save
          </Button>
        </form>
      </Form>
    </Layout>
  );
}
