import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFoodStore } from '../store';
import { FoodItem, FoodType, LocationDetail } from '../types';
import { getClosureSchedules, createClosureSchedules, deleteClosureSchedule, ClosureSchedule } from '../api';

interface AddInfoScreenProps {
  navigation: any;
  route: any;
}

const DAYS = [
  { id: 1, label: 'M' },
  { id: 2, label: 'T' },
  { id: 3, label: 'W' },
  { id: 4, label: 'T' },
  { id: 5, label: 'F' },
  { id: 6, label: 'S' },
  { id: 0, label: 'S' },
];

const FOOD_CATEGORIES = ['Noodles', 'Rice', 'Ethnic', 'Light', 'Western'];

export default function AddInfoScreen({ navigation, route }: AddInfoScreenProps) {
  const { items, fetchItems, updateItem, removeItem } = useFoodStore();
  
  // Check if we're viewing a specific item (from Food List > Out > item click)
  const itemId = route.params?.itemId;
  const selectedItem = items.find(item => item.id === itemId);
  
  // Location editing state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationDetail | null>(null);
  const [locationName, setLocationName] = useState('');
  const [hasOpeningHours, setHasOpeningHours] = useState(false);
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('21:00');
  const [closedDays, setClosedDays] = useState<number[]>([]);
  
  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>(FOOD_CATEGORIES);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Expiry state (for Add Info main screen)
  const [mainStep, setMainStep] = useState<'main' | 'closure' | 'cleaning' | 'timeoff' | 'expiry'>('main');
  const [selectedExpiryCategory, setSelectedExpiryCategory] = useState<'Fridge' | 'Snacks' | null>(null);
  const [selectedExpiryItem, setSelectedExpiryItem] = useState<FoodItem | null>(null);
  const [expiryDateInput, setExpiryDateInput] = useState('');
  
  // Closure calendar state
  const [savedClosures, setSavedClosures] = useState<ClosureSchedule[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [closureLocation, setClosureLocation] = useState('');
  const [selectedClosureFoodItem, setSelectedClosureFoodItem] = useState<FoodItem | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchItems();
  }, []);

  // Fetch closures when entering closure screens
  useEffect(() => {
    if (mainStep === 'cleaning' || mainStep === 'timeoff') {
      getClosureSchedules()
        .then(closures => setSavedClosures(closures))
        .catch(err => console.error('Failed to fetch closures:', err));
    }
  }, [mainStep]);

  // Get saved dates for a specific type
  const getSavedDatesForType = (type: 'cleaning' | 'timeoff'): Date[] => {
    return savedClosures
      .filter(c => c.type === type)
      .map(c => {
        const [year, month, day] = c.date.split('-').map(Number);
        return new Date(year, month - 1, day);
      });
  };

  // Check if a date is saved
  const isDateSaved = (date: Date, type: 'cleaning' | 'timeoff'): boolean => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return savedClosures.some(c => c.type === type && c.date === dateStr);
  };

  // Get closure for a date (for display)
  const getClosureForDate = (date: Date): ClosureSchedule | undefined => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return savedClosures.find(c => c.date === dateStr);
  };

  // Only show future/current closures in the "Scheduled Closures" list (past stay on calendar)
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const upcomingClosures = savedClosures.filter((c: ClosureSchedule) => c.date >= todayStr);
  const pastClosures = savedClosures.filter((c: ClosureSchedule) => c.date < todayStr);

  // Resolve display location: use full location name from food item when available
  const getClosureDisplayLocation = (c: ClosureSchedule): string => {
    if (c.foodItemId && items.length > 0) {
      const item = items.find((i: FoodItem) => i.id === c.foodItemId);
      if (item?.locations?.length) {
        const match = item.locations.find((loc: LocationDetail) =>
          (c.location && loc.name.toLowerCase().includes(c.location.toLowerCase()))
        );
        return (match ?? item.locations[0]).name;
      }
    }
    return c.location ?? '';
  };

  const handleDeleteClosure = async (id: number) => {
    try {
      await deleteClosureSchedule(id);
      const updated = await getClosureSchedules();
      setSavedClosures(updated);
      Alert.alert('Deleted', 'Closure removed.');
    } catch (err) {
      console.error('Failed to delete closure:', err);
      Alert.alert('Error', 'Failed to delete closure.');
    }
  };

  // Check if date is selected
  const isDateSelected = (date: Date): boolean => {
    return selectedDates.some(d => 
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    );
  };

  // Toggle date selection
  const toggleDateSelection = (date: Date, type: 'cleaning' | 'timeoff') => {
    const otherType = type === 'cleaning' ? 'timeoff' : 'cleaning';
    // Don't allow selecting if already saved for other type
    if (isDateSaved(date, otherType)) return;
    // Don't allow deselecting saved dates
    if (isDateSaved(date, type)) return;
    
    if (isDateSelected(date)) {
      setSelectedDates(selectedDates.filter(d => 
        !(d.getFullYear() === date.getFullYear() &&
          d.getMonth() === date.getMonth() &&
          d.getDate() === date.getDate())
      ));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  // Generate calendar days for current month
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before first day of month
    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    
    return days;
  };

  // Format expiry date input
  const formatExpiryInput = (text: string) => {
    let value = text.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + '/' + value.slice(5, 9);
    }
    return value;
  };

  // Calculate days remaining
  const getDaysRemaining = (expiryDate: string): number | null => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Auto-categorize food (same as web)
  const categorizeFood = (foodName: string): string => {
    const lower = foodName.toLowerCase();
    if (lower.includes('noodle') || lower.includes('mee') || lower.includes('laksa') || lower.includes('pasta')) {
      return 'Noodles';
    }
    if (lower.includes('rice') || lower.includes('nasi') || lower.includes('biryani')) {
      return 'Rice';
    }
    if (lower.includes('burger') || lower.includes('pizza') || lower.includes('steak') || lower.includes('fries')) {
      return 'Western';
    }
    if (lower.includes('salad') || lower.includes('soup') || lower.includes('sandwich')) {
      return 'Light';
    }
    return 'Ethnic';
  };

  // ============================================================
  // IF itemId exists - Show Item Details (clicked from Food List)
  // This matches web app: add-details.tsx step === 'edit'
  // ============================================================
  if (itemId) {
    if (!selectedItem) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.title}>Loading...</Text>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>
      );
    }

    // Use saved category if exists, otherwise auto-categorize
    const getCurrentCategory = (): string => {
      if (selectedItem.category && availableCategories.includes(selectedItem.category)) {
        return selectedItem.category;
      }
      return categorizeFood(selectedItem.name);
    };
    const currentCategory = getCurrentCategory();
    
    const handleSelectCategory = async (categoryName: string) => {
      try {
        await updateItem(selectedItem.id, { category: categoryName });
        Alert.alert('Category Updated', `Set to ${categoryName}`);
        setShowCategoryModal(false);
      } catch (error) {
        console.error('Failed to update category:', error);
        Alert.alert('Error', 'Failed to update category');
      }
    };

    const handleAddNewCategory = async () => {
      const trimmedName = newCategoryName.trim();
      if (!trimmedName) return;
      
      // Add to available categories if not exists
      if (!availableCategories.includes(trimmedName)) {
        setAvailableCategories([...availableCategories, trimmedName]);
      }
      
      // Assign this new category to the selected item
      await handleSelectCategory(trimmedName);
      
      setNewCategoryName('');
      setShowAddCategoryModal(false);
    };

    // Navigate back to FoodLists with the correct tab
    const handleBack = () => {
      const activeTab = selectedItem?.type || 'out';
      navigation.navigate('FoodLists', { activeTab });
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={{ width: 24 }} />
          <View style={{ flex: 1 }} />
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          {/* Item Name */}
          <Text style={styles.itemName}>{selectedItem.name}</Text>

          {/* Locations Section - matches web exactly */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Locations</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setEditingLocation(null);
                  setLocationName('');
                  setHasOpeningHours(false);
                  setOpenTime('09:00');
                  setCloseTime('21:00');
                  setClosedDays([]);
                  setShowLocationModal(true);
                }}
              >
                <Ionicons name="add" size={16} color="#111827" />
                <Text style={styles.addButtonText}>Add Location</Text>
              </TouchableOpacity>
            </View>

            {selectedItem.locations && selectedItem.locations.length > 0 ? (
              selectedItem.locations.map((loc) => (
                <View key={loc.id} style={styles.locationCard}>
                  <TouchableOpacity
                    style={styles.locationContent}
                    onPress={() => {
                      setEditingLocation(loc);
                      setLocationName(loc.name);
                      setHasOpeningHours(!!loc.openingHours);
                      setOpenTime(loc.openingHours?.open || '09:00');
                      setCloseTime(loc.openingHours?.close || '21:00');
                      setClosedDays(loc.closedDays || []);
                      setShowLocationModal(true);
                    }}
                  >
                    <Text style={styles.locationName}>{loc.name}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      Alert.alert(
                        'Delete Location?',
                        'Are you sure you want to remove this location?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              const updatedLocations = (selectedItem.locations || []).filter(
                                l => l.id !== loc.id
                              );
                              await updateItem(selectedItem.id, { locations: updatedLocations });
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No locations added yet.</Text>
              </View>
            )}
          </View>

          {/* Categories Section - matches web exactly */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setNewCategoryName('');
                  setShowAddCategoryModal(true);
                }}
              >
                <Ionicons name="add" size={16} color="#111827" />
                <Text style={styles.addButtonText}>Add Category</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={styles.categoryName}>{currentCategory}</Text>
              <Ionicons name="chevron-down" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Delete Food Item Button */}
          <TouchableOpacity
            style={styles.deleteItemButton}
            onPress={() => {
              Alert.alert(
                'Delete Food Item?',
                `Are you sure you want to delete "${selectedItem.name}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      await removeItem(selectedItem.id);
                      handleBack();
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.deleteItemButtonText}>Delete Food Item</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Location Modal - matches web location dialog */}
        <Modal
          visible={showLocationModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLocationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingLocation ? 'Edit Location Details' : 'Add Location'}
                </Text>
                <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={locationName}
                  onChangeText={setLocationName}
                  placeholder="e.g. Maxwell or Bedok"
                />

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Specific Opening Hours</Text>
                  <Switch
                    value={hasOpeningHours}
                    onValueChange={setHasOpeningHours}
                    trackColor={{ false: '#E5E7EB', true: '#111827' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {hasOpeningHours && (
                  <View style={styles.hoursSection}>
                    <View style={styles.timeRow}>
                      <View style={styles.timeInput}>
                        <Text style={styles.timeLabel}>Opens</Text>
                        <TextInput
                          style={styles.input}
                          value={openTime}
                          onChangeText={setOpenTime}
                          placeholder="09:00"
                        />
                      </View>
                      <Text style={styles.timeSeparator}>-</Text>
                      <View style={styles.timeInput}>
                        <Text style={styles.timeLabel}>Closes</Text>
                        <TextInput
                          style={styles.input}
                          value={closeTime}
                          onChangeText={setCloseTime}
                          placeholder="21:00"
                        />
                      </View>
                    </View>

                    <Text style={styles.inputLabel}>Days Business is Closed</Text>
                    <View style={styles.daysRow}>
                      {DAYS.map((day) => {
                        const isSelected = closedDays.includes(day.id);
                        return (
                          <TouchableOpacity
                            key={day.id}
                            style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                            onPress={() => {
                              if (isSelected) {
                                setClosedDays(closedDays.filter(d => d !== day.id));
                              } else {
                                setClosedDays([...closedDays, day.id]);
                              }
                            }}
                          >
                            <Text style={[styles.dayButtonText, isSelected && styles.dayButtonTextSelected]}>
                              {day.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity
                style={[styles.saveButton, !locationName.trim() && styles.saveButtonDisabled]}
                onPress={async () => {
                  if (!locationName.trim() || !selectedItem) return;

                  const newLocation: LocationDetail = {
                    id: editingLocation?.id || Math.random().toString(36).substr(2, 9),
                    name: locationName.trim(),
                    openingHours: hasOpeningHours ? { open: openTime, close: closeTime } : undefined,
                    closedDays: hasOpeningHours && closedDays.length > 0 ? closedDays : undefined,
                  };

                  let updatedLocations = selectedItem.locations || [];
                  if (editingLocation) {
                    updatedLocations = updatedLocations.map(l =>
                      l.id === editingLocation.id ? newLocation : l
                    );
                  } else {
                    updatedLocations = [...updatedLocations, newLocation];
                  }

                  await updateItem(selectedItem.id, { locations: updatedLocations });
                  setShowLocationModal(false);
                }}
                disabled={!locationName.trim()}
              >
                <Text style={styles.saveButtonText}>Save Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Category Modal */}
        <Modal
          visible={showCategoryModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.categoryModalContent}>
              <Text style={styles.modalTitle}>Change Category</Text>
              <View style={styles.categoryList}>
                {availableCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      currentCategory === cat && styles.categoryOptionSelected
                    ]}
                    onPress={() => handleSelectCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      currentCategory === cat && styles.categoryOptionTextSelected
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Add Category Modal */}
        <Modal
          visible={showAddCategoryModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddCategoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Category</Text>
                <TouchableOpacity onPress={() => setShowAddCategoryModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={styles.inputLabel}>Category Name</Text>
                <TextInput
                  style={styles.input}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="e.g. Pizza, Dessert, Drinks..."
                  autoCapitalize="words"
                />
              </ScrollView>

              <TouchableOpacity
                style={[styles.saveButton, !newCategoryName.trim() && styles.saveButtonDisabled]}
                onPress={handleAddNewCategory}
                disabled={!newCategoryName.trim()}
              >
                <Text style={styles.saveButtonText}>Add Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ============================================================
  // NO itemId - Show Add Info main screen (Closure / Expiry cards)
  // This matches web app: add-details.tsx step === 'select'
  // ============================================================
  
  const handleBack = () => {
    if (mainStep === 'expiry') {
      if (selectedExpiryItem) {
        setSelectedExpiryItem(null);
        setExpiryDateInput('');
      } else if (selectedExpiryCategory) {
        setSelectedExpiryCategory(null);
      } else {
        setMainStep('main');
      }
    } else if (mainStep === 'cleaning' || mainStep === 'timeoff') {
      setSelectedDates([]);
      setClosureLocation('');
      setSelectedClosureFoodItem(null);
      setMainStep('closure');
    } else if (mainStep === 'closure') {
      setMainStep('main');
    } else {
      navigation.goBack();
    }
  };

  const getTitle = () => {
    if (mainStep === 'expiry') {
      if (selectedExpiryItem) return selectedExpiryItem.name;
      if (selectedExpiryCategory) return selectedExpiryCategory;
      return 'Expiry';
    }
    // No title for cleaning/timeoff - shown in content
    if (mainStep === 'cleaning') return '';
    if (mainStep === 'timeoff') return '';
    if (mainStep === 'closure') return 'Closure';
    return 'Add Info';
  };

  // Main screen
  if (mainStep === 'main') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>{getTitle()}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.mainCard}
            onPress={() => setMainStep('closure')}
          >
            <View style={[styles.cardIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="calendar" size={28} color="#9333EA" />
            </View>
            <Text style={styles.cardTitle}>Closure</Text>
            <Text style={styles.cardSubtitle}>When is your fave stall closed?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mainCard}
            onPress={() => setMainStep('expiry')}
          >
            <View style={[styles.cardIcon, { backgroundColor: '#FFE4E6' }]}>
              <Ionicons name="time" size={28} color="#E11D48" />
            </View>
            <Text style={styles.cardTitle}>Expiry</Text>
            <Text style={styles.cardSubtitle}>Be reminded before food expires!</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Closure screen
  if (mainStep === 'closure') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>{getTitle()}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity 
            style={styles.mainCard}
            onPress={() => setMainStep('cleaning')}
          >
            <View style={[styles.cardIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="sparkles" size={28} color="#2563EB" />
            </View>
            <Text style={styles.cardTitle}>Cleaning</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.mainCard}
            onPress={() => setMainStep('timeoff')}
          >
            <View style={[styles.cardIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="calendar" size={28} color="#D97706" />
            </View>
            <Text style={styles.cardTitle}>Time Off</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Cleaning/Time Off Calendar Screen
  if (mainStep === 'cleaning' || mainStep === 'timeoff') {
    const closureType = mainStep;
    const otherType = closureType === 'cleaning' ? 'timeoff' : 'cleaning';
    const calendarDays = getCalendarDays();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const matchingItems = closureLocation.trim() 
      ? items.filter(item => 
          item.type === 'out' && 
          item.locations?.some(loc => 
            loc.name.toLowerCase().includes(closureLocation.toLowerCase())
          )
        )
      : [];

    const handleSave = async () => {
      try {
        if (closureType === 'cleaning') {
          // Cleaning: all stalls at this location — one closure per (date × stall)
          const fullLocation = matchingItems[0]?.locations?.find((loc: LocationDetail) =>
            loc.name.toLowerCase().includes(closureLocation.toLowerCase())
          )?.name ?? closureLocation.trim();
          const schedules: Array<{ type: 'cleaning'; date: string; location: string; foodItemId?: string; foodItemName?: string }> = [];
          for (const date of selectedDates) {
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
          Alert.alert('Saved!', `${fullLocation} — ${matchingItems.length} stall${matchingItems.length !== 1 ? 's' : ''} closed for cleaning on ${selectedDates.length} day${selectedDates.length !== 1 ? 's' : ''}.`);
        } else {
          // Time off: single stall
          const fullLocation = selectedClosureFoodItem?.locations?.find((loc: LocationDetail) =>
            loc.name.toLowerCase().includes(closureLocation.toLowerCase())
          )?.name ?? closureLocation.trim();
          const schedules = selectedDates.map(date => {
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
          const updated = await getClosureSchedules();
          setSavedClosures(updated);
          const itemName = selectedClosureFoodItem?.name || closureLocation;
          Alert.alert('Saved!', `${itemName} time off on ${selectedDates.length} day${selectedDates.length !== 1 ? 's' : ''}.`);
        }
        setSelectedDates([]);
        setClosureLocation('');
        setSelectedClosureFoodItem(null);
      } catch (error) {
        console.error('Error saving closure schedule:', error);
        Alert.alert('Error', 'Failed to save closure schedule.');
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>{getTitle()}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.calendarContainer}>
          <Text style={styles.calendarTitle}>
            {closureType === 'cleaning' ? 'Cleaning Days' : 'Time Off'}
          </Text>

          {/* Calendar */}
          <View style={styles.calendar}>
            {/* Month Navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                <Ionicons name="chevron-back" size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                <Ionicons name="chevron-forward" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Weekday Headers */}
            <View style={styles.weekdayRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <Text key={i} style={styles.weekdayText}>{d}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const isPast = closureType === 'timeoff' && date < today;
                const isSavedCurrent = isDateSaved(date, closureType);
                const isSavedOther = isDateSaved(date, otherType);
                const isSelected = isDateSelected(date);
                const closure = getClosureForDate(date);

                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      isSavedCurrent && (closureType === 'cleaning' ? styles.dayCellCleaning : styles.dayCellTimeoff),
                      isSavedOther && (closureType === 'cleaning' ? styles.dayCellTimeoff : styles.dayCellCleaning),
                      isPast && styles.dayCellDisabled,
                    ]}
                    onPress={() => !isPast && toggleDateSelection(date, closureType)}
                    disabled={isPast}
                  >
                    <Text style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      (isSavedCurrent || isSavedOther) && styles.dayTextSaved,
                      isPast && styles.dayTextDisabled,
                    ]}>
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Scheduled Closures List (only future/current; past stay on calendar) */}
          {upcomingClosures.length > 0 && (
            <View style={styles.closuresList}>
              <Text style={styles.closuresListTitle}>Scheduled Closures:</Text>
              {upcomingClosures.slice(0, 8).map((c) => {
                const displayLoc = getClosureDisplayLocation(c);
                return (
                  <View key={c.id} style={[
                    styles.closureItem,
                    c.type === 'cleaning' ? styles.closureItemCleaning : styles.closureItemTimeoff,
                    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }
                  ]}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[
                        styles.closureItemText,
                        c.type === 'cleaning' ? styles.closureTextCleaning : styles.closureTextTimeoff
                      ]} numberOfLines={1}>
                        {displayLoc && c.foodItemName 
                          ? `${displayLoc} › ${c.foodItemName}` 
                          : c.foodItemName || displayLoc}
                      </Text>
                      <Text style={[
                        styles.closureItemDate,
                        c.type === 'cleaning' ? styles.closureTextCleaning : styles.closureTextTimeoff
                      ]}>
                        {c.date.split('-')[2]}/{c.date.split('-')[1]} • {c.type === 'cleaning' ? 'Clean' : 'Off'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteClosure(c.id)} style={{ padding: 8 }} accessibilityLabel="Delete closure">
                      <Ionicons name="trash-outline" size={18} color="#b91c1c" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* Past closures (with delete) */}
          {pastClosures.length > 0 && (
            <View style={[styles.closuresList, { backgroundColor: 'rgba(0,0,0,0.04)', marginTop: 8 }]}>
              <Text style={[styles.closuresListTitle, { marginBottom: 8 }]}>Past closures</Text>
              {pastClosures.slice(0, 20).map((c) => {
                const displayLoc = getClosureDisplayLocation(c);
                return (
                  <View key={c.id} style={[
                    styles.closureItem,
                    c.type === 'cleaning' ? styles.closureItemCleaning : styles.closureItemTimeoff,
                    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }
                  ]}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[
                        styles.closureItemText,
                        c.type === 'cleaning' ? styles.closureTextCleaning : styles.closureTextTimeoff
                      ]} numberOfLines={1}>
                        {displayLoc && c.foodItemName 
                          ? `${displayLoc} › ${c.foodItemName}` 
                          : c.foodItemName || displayLoc}
                      </Text>
                      <Text style={[
                        styles.closureItemDate,
                        c.type === 'cleaning' ? styles.closureTextCleaning : styles.closureTextTimeoff
                      ]}>
                        {c.date.split('-')[2]}/{c.date.split('-')[1]} • {c.type === 'cleaning' ? 'Clean' : 'Off'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteClosure(c.id)} style={{ padding: 8 }} accessibilityLabel="Delete closure">
                      <Ionicons name="trash-outline" size={18} color="#b91c1c" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* Location Input - only show when dates selected */}
          {selectedDates.length > 0 && (
            <View style={styles.locationSection}>
              <Text style={styles.inputLabel}>
                {closureType === 'cleaning' ? 'Location (hawker centre / area)' : 'Location'}
              </Text>
              <TextInput
                style={styles.input}
                value={closureLocation}
                onChangeText={(text) => {
                  setClosureLocation(text);
                  setSelectedClosureFoodItem(null);
                }}
                placeholder={closureType === 'cleaning' ? 'e.g. Margaret Drive, Ghim Moh...' : 'e.g. Ghim Moh, Maxwell...'}
              />
              {closureType === 'cleaning' && (
                <Text style={[styles.noMatchSubtext, { marginTop: 4, color: '#6b7280' }]}>
                  All stalls at this location will be marked closed for cleaning on the selected day(s).
                </Text>
              )}

              {closureLocation.trim() && matchingItems.length === 0 && (
                <View style={styles.noMatchBox}>
                  <Text style={styles.noMatchText}>No food items found with "{closureLocation}"</Text>
                  <Text style={styles.noMatchSubtext}>Add this location to a food item first</Text>
                </View>
              )}

              {closureType === 'cleaning' && matchingItems.length > 0 && (
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Mark all {matchingItems.length} stalls closed</Text>
                </TouchableOpacity>
              )}

              {closureType === 'timeoff' && (
                <>
                  {matchingItems.length > 0 && (
                    <View style={styles.foodItemsSection}>
                      <Text style={styles.inputLabel}>Which stall?</Text>
                      {matchingItems.map(item => (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.foodItemButton,
                            selectedClosureFoodItem?.id === item.id && styles.foodItemButtonSelected
                          ]}
                          onPress={() => setSelectedClosureFoodItem(
                            selectedClosureFoodItem?.id === item.id ? null : item
                          )}
                        >
                          <Text style={[
                            styles.foodItemButtonText,
                            selectedClosureFoodItem?.id === item.id && styles.foodItemButtonTextSelected
                          ]}>
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      (!closureLocation.trim() || !selectedClosureFoodItem) && styles.saveButtonDisabled
                    ]}
                    onPress={handleSave}
                    disabled={!closureLocation.trim() || !selectedClosureFoodItem}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Expiry flow
  if (mainStep === 'expiry') {
    if (!selectedExpiryCategory) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.title}>{getTitle()}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.cardsContainer}>
            <TouchableOpacity
              style={styles.mainCard}
              onPress={() => setSelectedExpiryCategory('Fridge')}
            >
              <View style={[styles.cardIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="home" size={24} color="#2563EB" />
              </View>
              <Text style={styles.cardTitle}>Fridge</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mainCard}
              onPress={() => setSelectedExpiryCategory('Snacks')}
            >
              <View style={[styles.cardIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="restaurant" size={24} color="#D97706" />
              </View>
              <Text style={styles.cardTitle}>Snacks</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    if (!selectedExpiryItem) {
      const categoryItems = items.filter(
        item => item.type === 'home' && item.category === selectedExpiryCategory
      );

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.title}>{getTitle()}</Text>
            <View style={{ width: 24 }} />
          </View>

          <FlatList
            data={categoryItems}
            keyExtractor={item => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const daysRemaining = getDaysRemaining(item.expiryDate || '');
              return (
                <TouchableOpacity
                  style={styles.expiryItemRow}
                  onPress={() => {
                    setSelectedExpiryItem(item);
                    setExpiryDateInput('');
                  }}
                >
                  <Text style={styles.expiryItemText}>{item.name}</Text>
                  {daysRemaining !== null && (
                    <View style={[
                      styles.expiryBadge,
                      daysRemaining < 0 ? styles.expiredBadge :
                      daysRemaining === 0 ? styles.todayBadge :
                      daysRemaining <= 2 ? styles.soonBadge : styles.okBadge
                    ]}>
                      <Text style={[
                        styles.expiryBadgeText,
                        daysRemaining < 0 ? styles.expiredText :
                        daysRemaining === 0 ? styles.todayText :
                        daysRemaining <= 2 ? styles.soonText : styles.okText
                      ]}>
                        {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d ago` :
                         daysRemaining === 0 ? 'Today!' :
                         `${daysRemaining}d left`}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No {selectedExpiryCategory?.toLowerCase()} items found.</Text>
              </View>
            }
          />
        </SafeAreaView>
      );
    }

    // Expiry date input
    const previewDays = expiryDateInput.length === 10 ? (() => {
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
          return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
      }
      return null;
    })() : null;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>{getTitle()}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.inputLabel}>Expiry Date (DD/MM/YYYY)</Text>
          <TextInput
            style={styles.dateInput}
            value={expiryDateInput}
            onChangeText={(text) => setExpiryDateInput(formatExpiryInput(text))}
            placeholder="e.g. 25/12/2024"
            keyboardType="number-pad"
            maxLength={10}
          />

          {previewDays !== null && (
            <View style={[
              styles.previewBox,
              previewDays < 0 ? styles.expiredBg :
              previewDays === 0 ? styles.todayBg :
              previewDays <= 2 ? styles.soonBg : styles.okBg
            ]}>
              <Text style={[
                styles.previewText,
                previewDays < 0 ? styles.expiredText :
                previewDays === 0 ? styles.todayText :
                previewDays <= 2 ? styles.soonText : styles.okText
              ]}>
                {previewDays < 0 ? `Expired ${Math.abs(previewDays)} days ago` :
                 previewDays === 0 ? 'Expires today!' :
                 previewDays === 1 ? 'Expires tomorrow!' :
                 `${previewDays} days remaining`}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveButton, expiryDateInput.length !== 10 && styles.saveButtonDisabled]}
            onPress={async () => {
              const parts = expiryDateInput.split('/');
              if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const year = parseInt(parts[2]);
                const isoDate = new Date(year, month, day).toISOString().split('T')[0];
                await updateItem(selectedExpiryItem!.id, { expiryDate: isoDate });
                Alert.alert('Saved!', `${selectedExpiryItem!.name} expires on ${expiryDateInput}`);
                setSelectedExpiryItem(null);
                setExpiryDateInput('');
              }
            }}
            disabled={expiryDateInput.length !== 10}
          >
            <Text style={styles.saveButtonText}>Save Expiry Date</Text>
          </TouchableOpacity>

          {selectedExpiryItem.expiryDate && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={async () => {
                await updateItem(selectedExpiryItem.id, { expiryDate: undefined });
                Alert.alert('Cleared', 'Expiry date removed.');
                setSelectedExpiryItem(null);
                setExpiryDateInput('');
              }}
            >
              <Text style={styles.clearButtonText}>Clear Expiry Date</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  itemName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationContent: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
  },
  deleteButton: {
    padding: 8,
  },
  emptyBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
  },
  deleteItemButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  deleteItemButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#DC2626',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  hoursSection: {
    marginTop: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  timeSeparator: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    color: '#6B7280',
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  dayButtonSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    margin: 20,
    marginTop: 0,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Category modal
  categoryModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    margin: 24,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  categoryOptionSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  categoryOptionTextSelected: {
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Cards container for main/closure/expiry screens
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 16,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Expiry list
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  expiryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  expiryItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  expiryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  expiredBadge: { backgroundColor: '#FEE2E2' },
  todayBadge: { backgroundColor: '#FFEDD5' },
  soonBadge: { backgroundColor: '#FEF9C3' },
  okBadge: { backgroundColor: '#DCFCE7' },
  expiryBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  expiredText: { color: '#DC2626' },
  todayText: { color: '#EA580C' },
  soonText: { color: '#CA8A04' },
  okText: { color: '#16A34A' },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  // Date input for expiry
  dateContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  dateInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 24,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewBox: {
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  expiredBg: { backgroundColor: '#FEE2E2' },
  todayBg: { backgroundColor: '#FFEDD5' },
  soonBg: { backgroundColor: '#FEF9C3' },
  okBg: { backgroundColor: '#DCFCE7' },
  previewText: {
    fontSize: 18,
    fontWeight: '600',
  },
  clearButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  clearButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '500',
  },
  // Calendar styles
  calendarContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  calendar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayCellSelected: {
    backgroundColor: '#111827',
  },
  dayCellCleaning: {
    backgroundColor: '#3B82F6',
  },
  dayCellTimeoff: {
    backgroundColor: '#F59E0B',
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  dayTextSaved: {
    color: '#FFFFFF',
  },
  dayTextDisabled: {
    color: '#9CA3AF',
  },
  closuresList: {
    marginTop: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
  },
  closuresListTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  closureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  closureItemCleaning: {
    backgroundColor: '#DBEAFE',
  },
  closureItemTimeoff: {
    backgroundColor: '#FEF3C7',
  },
  closureItemText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  closureTextCleaning: {
    color: '#1d4ed8',
  },
  closureTextTimeoff: {
    color: '#B45309',
  },
  closureItemDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  locationSection: {
    marginTop: 16,
    paddingBottom: 24,
  },
  noMatchBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
  },
  noMatchText: {
    fontSize: 14,
    color: '#6B7280',
  },
  noMatchSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  foodItemsSection: {
    marginTop: 8,
  },
  foodItemButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  foodItemButtonSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  foodItemButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  foodItemButtonTextSelected: {
    color: '#FFFFFF',
  },
});
