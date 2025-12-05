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

// ... (rest of imports)

// ... inside AddPage component ...
  
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);

  // ... (existing functions)

  function confirmDeleteLocation() {
    if (locationToDelete && selectedItem) {
      deleteLocation(locationToDelete);
      setLocationToDelete(null);
    }
  }

// ... (render)

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
