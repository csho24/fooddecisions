import { Layout } from "@/components/mobile-layout";
import { useFoodStore, FoodType } from "@/lib/store";
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

const formSchema = z.object({
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
  const { addItem } = useFoodStore();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

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

  function onSubmit(values: z.infer<typeof formSchema>) {
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
      title: "Added!",
      description: `${values.name} has been added to your list.`,
    });

    setLocation("/list");
  }

  return (
    <Layout showBack title="Add Details">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-8">
          
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Where is this?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-4"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="home" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Home
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="out" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Out
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name of Food / Place</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Chicken Rice" {...field} className="bg-card" />
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
                  <FormLabel>Location / Area</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Maxwell Food Centre" {...field} className="bg-card" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="e.g. Only buy if queue is short" 
                    className="resize-none bg-card" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchType === 'out' && (
            <div className="space-y-4 border-t pt-4 border-border/50">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Constraints</h3>
              
              <FormField
                control={form.control}
                name="hasOpeningHours"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-card">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Specific Opening Hours
                      </FormLabel>
                      <FormDescription>
                        Does this place close at a specific time?
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {watchHasHours && (
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="openTime"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Opens</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} className="bg-card" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="closeTime"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Closes</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} className="bg-card" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="space-y-3">
                <Label>Closed Days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <FormField
                      key={day.id}
                      control={form.control}
                      name="closedDays"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={day.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
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
                                    "flex items-center justify-center w-10 h-10 rounded-full border cursor-pointer transition-all",
                                    field.value?.includes(day.id)
                                      ? "bg-destructive text-destructive-foreground border-destructive"
                                      : "bg-card hover:bg-accent"
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
                <FormDescription>Select days when this place is CLOSED.</FormDescription>
              </div>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full h-14 text-lg rounded-xl mt-6 shadow-lg shadow-primary/20">
            Add to List
          </Button>
        </form>
      </Form>
    </Layout>
  );
}
