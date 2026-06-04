import React, { useState, useEffect, useRef } from 'react';
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
  Pressable,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFoodStore } from '../store';
import { FoodItem, FoodType, LocationDetail } from '../types';
import { getClosureSchedules, createClosureSchedules, deleteClosureSchedule, ClosureSchedule } from '../api';
import { capitalizeWords, normalizeLocKey, normalizeClosureType } from '../../../shared/utils';
import {
  categorizeFood,
  getClosureDisplayLocation as getClosureDisplayLocationShared,
  buildScheduledClosureList,
  type ClosureListGroup,
} from '../../../shared/business-logic';

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

const HOME_CATEGORIES = ['Fridge', 'Snacks'] as const;
const FOOD_CATEGORIES = ['Noodles', 'Rice', 'Ethnic', 'Light', 'Western'];

export default function AddInfoScreen({ navigation, route }: AddInfoScreenProps) {
  const { items, fetchItems, updateItem, removeItem } = useFoodStore();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const closureScrollRef = useRef<ScrollView>(null);
  const locationSectionY = useRef(0);

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

  // Item edit form (when opened from Food List)
  const [editItemName, setEditItemName] = useState('');
  const [editHomeCategory, setEditHomeCategory] = useState<string>('Fridge');
  const [showHomeCategoryPicker, setShowHomeCategoryPicker] = useState(false);

  // Expiry state (for Add Info main screen)
  const [mainStep, setMainStep] = useState<'main' | 'closure' | 'cleaning' | 'timeoff' | 'expiry'>('main');
  const [selectedExpiryCategory, setSelectedExpiryCategory] = useState<'Fridge' | 'Snacks' | null>(null);
  const [selectedExpiryItem, setSelectedExpiryItem] = useState<FoodItem | null>(null);
  const [expiryDateInput, setExpiryDateInput] = useState('');
  
  // Closure calendar state
  const [savedClosures, setSavedClosures] = useState<ClosureSchedule[]>([]);
  const [selectedCleaningDates, setSelectedCleaningDates] = useState<Date[]>([]);
  const [selectedTimeOffDates, setSelectedTimeOffDates] = useState<Date[]>([]);
  const [closureLocation, setClosureLocation] = useState('');
  const [selectedClosureFoodItem, setSelectedClosureFoodItem] = useState<FoodItem | null>(null);
  const [selectingSpecificStalls, setSelectingSpecificStalls] = useState(false);
  const [selectedStallsForCleaning, setSelectedStallsForCleaning] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (!selectedItem || !itemId) return;
    setEditItemName(selectedItem.name);
    if (selectedItem.type === 'home') {
      const cat =
        selectedItem.category &&
        (HOME_CATEGORIES as readonly string[]).includes(selectedItem.category)
          ? selectedItem.category
          : 'Fridge';
      setEditHomeCategory(cat);
    }
  }, [selectedItem?.id, selectedItem?.name, selectedItem?.category, itemId]);

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
      .filter(c => normalizeClosureType(c.type) === type)
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
    return savedClosures.some(c => normalizeClosureType(c.type) === type && c.date === dateStr);
  };

  // Get closure for a date (for display)
  const getClosureForDate = (date: Date): ClosureSchedule | undefined => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return savedClosures.find(c => c.date === dateStr);
  };

  const toDateStr = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /** Match web: dark blue only when 2+ distinct locations on same cleaning date. */
  const getCleaningLocationCountForDate = (date: Date): number => {
    const dateStr = toDateStr(date);
    const locKeys = new Set(
      savedClosures
        .filter((c) => normalizeClosureType(c.type) === 'cleaning' && c.date === dateStr)
        .map((c) => normalizeLocKey(getClosureDisplayLocation(c)))
    );
    locKeys.delete('');
    return locKeys.size;
  };

  /** Match web: dark orange when 2+ distinct time-off stalls on same date. */
  const getTimeOffEntryCountForDate = (date: Date): number => {
    const dateStr = toDateStr(date);
    const keys = new Set(
      savedClosures
        .filter((c) => normalizeClosureType(c.type) === 'timeoff' && c.date === dateStr)
        .map((c) => `${normalizeLocKey(c.location ?? '')}|${normalizeLocKey(c.foodItemName ?? '')}`)
    );
    keys.delete('|');
    return keys.size;
  };

  // Only show future/current closures in the "Scheduled Closures" list (past stay on calendar)
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  // Resolve display location: use full location name from food item when available
  const getClosureDisplayLocation = (c: ClosureSchedule): string => {
    return getClosureDisplayLocationShared(c, items);
  };

  const scheduledClosureList = buildScheduledClosureList(
    savedClosures,
    getClosureDisplayLocation,
    todayStr
  );

  const handleDeleteClosureGroup = async (ids: number[]) => {
    try {
      for (const id of ids) {
        await deleteClosureSchedule(id);
      }
      const updated = await getClosureSchedules();
      setSavedClosures(updated);
      Alert.alert('Deleted', ids.length > 1 ? 'Closure schedule group removed.' : 'Closure removed.');
    } catch (err) {
      console.error('Failed to delete closure group:', err);
      Alert.alert('Error', 'Failed to delete closure.');
    }
  };

  const sameCalendarDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isDateSelected = (date: Date, type: 'cleaning' | 'timeoff'): boolean => {
    const list = type === 'cleaning' ? selectedCleaningDates : selectedTimeOffDates;
    return list.some((d) => sameCalendarDay(d, date));
  };

  const toggleDateSelection = (date: Date, type: 'cleaning' | 'timeoff') => {
    const setList = type === 'cleaning' ? setSelectedCleaningDates : setSelectedTimeOffDates;
    setList((prev) => {
      const exists = prev.some((d) => sameCalendarDay(d, date));
      if (exists) {
        return prev.filter((d) => !sameCalendarDay(d, date));
      }
      return [...prev, date];
    });
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

  /** Split month into Sun–Sat rows; pad only the last row (no extra blank weeks). */
  const getCalendarWeeks = (): (Date | null)[][] => {
    const days = getCalendarDays();
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      const week = days.slice(i, i + 7);
      while (week.length < 7) {
        week.push(null);
      }
      weeks.push(week);
    }
    return weeks;
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
  // categorizeFood is now imported from shared/business-logic

  // ============================================================
  // IF itemId exists - Show Item Details (clicked from Food List)
  // This matches web app: add-details.tsx step === 'edit'
  // ============================================================
  if (itemId) {
    if (!selectedItem) {
      return (
        <SafeAreaView style={styles.itemEditContainer}>
          <View style={styles.editLoadingWrap}>
            <Text style={styles.editLoadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      );
    }

    const isHomeItem = selectedItem.type === 'home';
    const isOutItem = selectedItem.type === 'out';

    const getCurrentCategory = (): string => {
      if (isHomeItem) {
        if (
          selectedItem.category &&
          (HOME_CATEGORIES as readonly string[]).includes(selectedItem.category)
        ) {
          return selectedItem.category;
        }
        return 'Fridge';
      }
      if (selectedItem.category && availableCategories.includes(selectedItem.category)) {
        return selectedItem.category;
      }
      return categorizeFood(selectedItem.name);
    };
    const currentCategory = getCurrentCategory();

    const handleSelectCategory = async (categoryName: string) => {
      if (isHomeItem) return;
      try {
        await updateItem(selectedItem.id, { category: categoryName });
        Alert.alert('Category Updated', `Set to ${categoryName}`);
        setShowCategoryModal(false);
      } catch (error) {
        console.error('Failed to update category:', error);
        Alert.alert('Error', 'Failed to update category');
      }
    };

    const handleSaveItem = async () => {
      const name = capitalizeWords(editItemName.trim());
      if (name.length < 2) {
        Alert.alert('Name required', 'Enter a name (at least 2 characters).');
        return;
      }
      try {
        if (isHomeItem) {
          await updateItem(selectedItem.id, {
            name,
            category: editHomeCategory,
          });
        } else {
          await updateItem(selectedItem.id, { name });
        }
        Alert.alert('Updated', 'Item details saved.');
        navigation.goBack();
      } catch (error) {
        console.error('Failed to save item:', error);
        Alert.alert('Error', 'Failed to save changes.');
      }
    };

    const handleAddNewCategory = async () => {
      if (isHomeItem) return;
      const trimmedName = newCategoryName.trim();
      if (!trimmedName) return;

      if (!availableCategories.includes(trimmedName)) {
        setAvailableCategories([...availableCategories, trimmedName]);
      }

      await handleSelectCategory(trimmedName);

      setNewCategoryName('');
      setShowAddCategoryModal(false);
    };

    const editScrollMinHeight = windowHeight - 56;

    const renderEditNameField = (withUnderline: boolean) => (
      <View
        style={[
          styles.editNameSection,
          withUnderline ? styles.editNameSectionUnderline : styles.editNameSectionOut,
        ]}
      >
        <TextInput
          style={[styles.editNameInput, withUnderline && styles.editNameInputUnderline]}
          value={editItemName}
          onChangeText={setEditItemName}
          onBlur={() => setEditItemName((v) => capitalizeWords(v))}
          placeholder="Item name"
          placeholderTextColor="#9CA3AF"
        />
      </View>
    );

    return (
      <SafeAreaView style={styles.itemEditContainer}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            isHomeItem ? styles.editScrollContentHome : styles.editScrollContentOut,
            isHomeItem && {
              flexGrow: 1,
              minHeight: editScrollMinHeight,
              justifyContent: 'center',
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {isHomeItem ? (
            <View style={styles.editPanel}>
              {renderEditNameField(true)}
              <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Category</Text>
                  <TouchableOpacity
                    style={styles.selectTrigger}
                    onPress={() => setShowHomeCategoryPicker(true)}
                  >
                    <Text style={styles.selectValue}>{editHomeCategory}</Text>
                    <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              <TouchableOpacity style={styles.saveItemButton} onPress={handleSaveItem}>
                <Text style={styles.saveItemButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
          {renderEditNameField(false)}

          {/* Out: stall locations */}
          {isOutItem && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.fieldLabelSection}>Locations</Text>
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
                                  (l) => l.id !== loc.id
                                );
                                await updateItem(selectedItem.id, { locations: updatedLocations });
                              },
                            },
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
          )}

          {/* Out: food type category (Noodles, Rice, etc.) */}
          {isOutItem && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.fieldLabelSection}>Categories</Text>
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
          )}

          <TouchableOpacity style={styles.saveItemButton} onPress={handleSaveItem}>
            <Text style={styles.saveItemButtonText}>Save Changes</Text>
          </TouchableOpacity>

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
                      navigation.goBack();
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.deleteItemButtonText}>Delete Food Item</Text>
          </TouchableOpacity>
            </>
          )}
        </ScrollView>

        <Modal
          visible={isHomeItem && showHomeCategoryPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowHomeCategoryPicker(false)}
        >
          <View style={styles.pickerOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowHomeCategoryPicker(false)}
            />
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerSheetTitle}>Category</Text>
              {HOME_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.pickerOption,
                    editHomeCategory === cat && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setEditHomeCategory(cat);
                    setShowHomeCategoryPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      editHomeCategory === cat && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Location Modal — out items only */}
        <Modal
          visible={isOutItem && showLocationModal}
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
          visible={isOutItem && showCategoryModal}
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
          visible={isOutItem && showAddCategoryModal}
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
      setSelectedCleaningDates([]);
      setSelectedTimeOffDates([]);
      setClosureLocation('');
      setSelectedClosureFoodItem(null);
      setSelectingSpecificStalls(false);
      setSelectedStallsForCleaning(new Set());
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

  const hubHeaderStyle = { paddingTop: insets.top + 16 };

  const renderHubHeader = (title: string, showBack: boolean) => (
    <View style={[styles.header, hubHeaderStyle]}>
      {showBack ? (
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerSide} />
      )}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.headerSide} />
    </View>
  );

  const hubScreenBottom = { paddingBottom: insets.bottom + 16 };

  // Main screen
  if (mainStep === 'main') {
    return (
      <View style={styles.container}>
        {renderHubHeader(getTitle(), false)}

        <View style={[styles.cardsContainer, hubScreenBottom]}>
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
      </View>
    );
  }

  // Closure screen
  if (mainStep === 'closure') {
    return (
      <View style={styles.container}>
        {renderHubHeader(getTitle(), true)}

        <View style={[styles.cardsContainer, hubScreenBottom]}>
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
      </View>
    );
  }

  // Cleaning/Time Off Calendar Screen
  if (mainStep === 'cleaning' || mainStep === 'timeoff') {
    const closureType = mainStep;
    const calendarWeeks = getCalendarWeeks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const matchCleaningLocationName = (locName: string, cleaned: string): boolean => {
      const n = locName.trim().toLowerCase();
      if (n === cleaned) return true;
      if (n.startsWith(`${cleaned} `) && n !== `${cleaned} link`) return true;
      return false;
    };

    const cleanedLocationQuery = closureLocation.trim().toLowerCase();

    const matchingItems =
      closureType === 'cleaning' && cleanedLocationQuery
        ? items.filter(
            (item) =>
              item.type === 'out' &&
              item.locations?.some((loc) =>
                matchCleaningLocationName(loc.name, cleanedLocationQuery)
              )
          )
        : closureLocation.trim()
          ? items.filter(
              (item) =>
                item.type === 'out' &&
                item.locations?.some((loc) =>
                  loc.name.toLowerCase().includes(closureLocation.toLowerCase())
                )
            )
          : [];

    const cleaningFullLocation =
      closureType === 'cleaning' && matchingItems.length > 0
        ? capitalizeWords(
            Array.from(
              new Set(
                matchingItems.flatMap((item) =>
                  (item.locations ?? [])
                    .filter((loc) => loc.name.trim().toLowerCase() === cleanedLocationQuery)
                    .map((loc) => loc.name)
                )
              )
            )[0] ?? closureLocation.trim()
          )
        : '';

    const cleaningItemsToSave = selectingSpecificStalls
      ? matchingItems.filter((item) => selectedStallsForCleaning.has(item.id))
      : matchingItems;

    const toggleStallForCleaning = (itemId: string) => {
      setSelectedStallsForCleaning((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) next.delete(itemId);
        else next.add(itemId);
        return next;
      });
    };

    const saveCleaningSchedules = async (itemsToSave: FoodItem[], fullLocation: string) => {
      const locKey = normalizeLocKey(fullLocation);
      const existingDates = new Set(
        savedClosures
          .filter(
            (c) =>
              normalizeClosureType(c.type) === 'cleaning' &&
              normalizeLocKey(getClosureDisplayLocation(c)) === locKey
          )
          .map((c) => c.date)
      );
      const newDates = selectedCleaningDates.filter((d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return !existingDates.has(`${year}-${month}-${day}`);
      });
      if (newDates.length === 0) {
        Alert.alert(
          'Already entered',
          `Cleaning on the selected day(s) is already saved for ${fullLocation}.`
        );
        return;
      }
      const locationSaved = capitalizeWords(fullLocation);
      const schedules: Array<{
        type: 'cleaning';
        date: string;
        location: string;
        foodItemId?: string;
        foodItemName?: string;
      }> = [];
      for (const date of newDates) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        for (const item of itemsToSave) {
          schedules.push({
            type: 'cleaning',
            date: dateStr,
            location: locationSaved,
            foodItemId: item.id,
            foodItemName: item.name,
          });
        }
      }
      await createClosureSchedules(schedules);
      const updated = await getClosureSchedules();
      setSavedClosures(updated);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dateStr =
        newDates.length === 1
          ? `${newDates[0].getDate()} ${months[newDates[0].getMonth()]}`
          : (() => {
              const sorted = [...newDates].sort((a, b) => a.getTime() - b.getTime());
              return `${sorted[0].getDate()}–${sorted[sorted.length - 1].getDate()} ${months[sorted[0].getMonth()]}`;
            })();
      Alert.alert(
        'Saved!',
        `${fullLocation} — ${itemsToSave.length} stall${itemsToSave.length !== 1 ? 's' : ''} closed for cleaning on ${dateStr}.`
      );
      setSelectedCleaningDates([]);
      setClosureLocation('');
      setSelectingSpecificStalls(false);
      setSelectedStallsForCleaning(new Set());
    };

    const handleSave = async () => {
      try {
        if (closureType === 'cleaning') {
          if (cleaningItemsToSave.length === 0) {
            Alert.alert('No stalls selected', 'Please select at least one stall.');
            return;
          }
          await saveCleaningSchedules(cleaningItemsToSave, cleaningFullLocation);
          return;
        } else {
          // Time off: single stall
          const fullLocation = selectedClosureFoodItem?.locations?.find((loc: LocationDetail) =>
            loc.name.toLowerCase().includes(closureLocation.toLowerCase())
          )?.name ?? closureLocation.trim();
          const schedules = selectedTimeOffDates.map(date => {
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
          Alert.alert('Saved!', `${itemName} time off on ${selectedTimeOffDates.length} day${selectedTimeOffDates.length !== 1 ? 's' : ''}.`);
        }
        setSelectedCleaningDates([]);
        setSelectedTimeOffDates([]);
        setClosureLocation('');
        setSelectedClosureFoodItem(null);
      } catch (error) {
        console.error('Error saving closure schedule:', error);
        Alert.alert('Error', 'Failed to save closure schedule.');
      }
    };

    const scrollLocationIntoView = () => {
      setTimeout(() => {
        if (locationSectionY.current > 0) {
          closureScrollRef.current?.scrollTo({
            y: Math.max(0, locationSectionY.current - 56),
            animated: true,
          });
        } else {
          closureScrollRef.current?.scrollToEnd({ animated: true });
        }
      }, Platform.OS === 'ios' ? 100 : 200);
    };

    return (
      <View style={styles.container}>
        {renderHubHeader(getTitle(), true)}

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={insets.top + 48}
        >
        <ScrollView
          ref={closureScrollRef}
          style={styles.calendarContainer}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
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

            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, styles.dayCellCleaning]} />
                <Text style={styles.legendText}>Cleaning</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, styles.dayCellTimeoff]} />
                <Text style={styles.legendText}>Time off</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendSwatchCombo}>
                  <View style={[styles.legendSwatchHalf, styles.dayCellCleaning]} />
                  <View style={[styles.legendSwatchHalf, styles.dayCellTimeoff]} />
                </View>
                <Text style={styles.legendText}>Both</Text>
              </View>
            </View>

            {/* Weekday Headers — same column width as day cells below */}
            <View style={styles.weekdayRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <View key={i} style={styles.calendarCol}>
                  <Text style={styles.weekdayText}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid — one row per week (avoids flexWrap ghost rows below last day) */}
            <View style={styles.calendarGrid}>
              {calendarWeeks.map((week, weekIndex) => (
                <View
                  key={`week-${weekIndex}`}
                  style={[
                    styles.calendarWeekRow,
                    weekIndex === calendarWeeks.length - 1 && styles.calendarWeekRowLast,
                  ]}
                >
                  {week.map((date, dayIndex) => {
                    if (!date) {
                      return (
                        <View
                          key={`empty-${weekIndex}-${dayIndex}`}
                          style={[styles.calendarCol, styles.dayCellEmpty]}
                        />
                      );
                    }

                    const isCleaning =
                      isDateSaved(date, 'cleaning') ||
                      (closureType === 'cleaning' && isDateSelected(date, 'cleaning'));
                    const isTimeoff =
                      isDateSaved(date, 'timeoff') ||
                      (closureType === 'timeoff' && isDateSelected(date, 'timeoff'));
                    const both = isCleaning && isTimeoff;
                    const isSelectedOnTab = isDateSelected(date, closureType);
                    const isToday =
                      date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear();
                    const darkBlue =
                      isCleaning && !both && getCleaningLocationCountForDate(date) >= 2;
                    const darkOrange =
                      isTimeoff && !both && getTimeOffEntryCountForDate(date) >= 2;

                    const dayNumber = date.getDate();
                    const textStyle = [
                      styles.dayText,
                      (isCleaning || isTimeoff) && styles.dayTextOnColor,
                      isToday && styles.dayTextToday,
                      isToday && (isCleaning || isTimeoff) && styles.dayTextTodayOnColor,
                    ];

                    if (both) {
                      return (
                        <TouchableOpacity
                          key={date.toISOString()}
                          style={[styles.calendarCol, styles.dayCell, isSelectedOnTab && styles.dayCellRing]}
                          onPress={() => toggleDateSelection(date, closureType)}
                        >
                          <View style={styles.dayCellComboWrap}>
                            <View style={styles.dayCellComboRow}>
                              <View style={[styles.dayCellComboHalf, styles.dayCellCleaning]} />
                              <View style={[styles.dayCellComboHalf, styles.dayCellTimeoff]} />
                            </View>
                          </View>
                          <Text style={textStyle}>{dayNumber}</Text>
                        </TouchableOpacity>
                      );
                    }

                    let fillStyle;
                    if (isTimeoff) {
                      fillStyle = darkOrange ? styles.dayCellTimeoffDark : styles.dayCellTimeoff;
                    } else if (isCleaning) {
                      fillStyle = darkBlue ? styles.dayCellCleaningDark : styles.dayCellCleaning;
                    }

                    return (
                      <TouchableOpacity
                        key={date.toISOString()}
                        style={[styles.calendarCol, styles.dayCell, fillStyle, isSelectedOnTab && styles.dayCellRing]}
                        onPress={() => toggleDateSelection(date, closureType)}
                      >
                        <Text style={textStyle}>{dayNumber}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Scheduled Closures List (only future/current; past stay on calendar) */}
          {scheduledClosureList.length > 0 && (
            <View style={styles.closuresList}>
              <Text style={styles.closuresListTitle}>
                Scheduled Closures{scheduledClosureList.length > 8 ? ` (${scheduledClosureList.length} — scroll for more)` : ''}:
              </Text>
              <ScrollView style={styles.closuresListScroll} nestedScrollEnabled>
                {scheduledClosureList.slice(0, 12).map((entry: ClosureListGroup) => {
                  const isCleaning = entry.kind === 'cleaning';
                  const label = isCleaning ? entry.displayLoc : entry.displayLabel;
                  const key = `${entry.kind}-${entry.startDate}-${label}`;
                  return (
                    <View
                      key={key}
                      style={[
                        styles.closureItem,
                        isCleaning ? styles.closureItemCleaning : styles.closureItemTimeoff,
                      ]}
                    >
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={[
                            styles.closureItemText,
                            isCleaning ? styles.closureTextOnCleaning : styles.closureTextOnTimeoff,
                          ]}
                          numberOfLines={2}
                        >
                          {label}
                        </Text>
                        <Text
                          style={[
                            styles.closureItemDate,
                            isCleaning ? styles.closureTextOnCleaning : styles.closureTextOnTimeoff,
                          ]}
                        >
                          {entry.dateRange} • {isCleaning ? 'Cleaning' : 'Time off'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteClosureGroup(entry.ids)}
                        style={{ padding: 8 }}
                        accessibilityLabel="Delete closure"
                      >
                        <Ionicons name="trash-outline" size={18} color="#b91c1c" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Location Input - only show when dates selected */}
          {(closureType === 'cleaning' ? selectedCleaningDates : selectedTimeOffDates).length > 0 && (
            <View
              style={styles.locationSection}
              onLayout={(e) => {
                locationSectionY.current = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.inputLabel}>
                {closureType === 'cleaning' ? 'Location (hawker centre / area)' : 'Location'}
              </Text>
              <TextInput
                style={styles.input}
                value={closureLocation}
                onChangeText={(text) => {
                  setClosureLocation(text);
                  setSelectedClosureFoodItem(null);
                  setSelectingSpecificStalls(false);
                  setSelectedStallsForCleaning(new Set());
                }}
                onFocus={scrollLocationIntoView}
                placeholder={closureType === 'cleaning' ? 'e.g. Margaret Drive, Ghim Moh...' : 'e.g. Ghim Moh, Maxwell...'}
              />

              {closureLocation.trim() && matchingItems.length === 0 && (
                <View style={styles.noMatchBox}>
                  <Text style={styles.noMatchText}>
                    {`No food items found with exact location "${closureLocation.trim()}"`}
                  </Text>
                  <Text style={styles.noMatchSubtext}>Add this location to a food item first</Text>
                </View>
              )}

              {closureType === 'cleaning' && matchingItems.length > 0 && (
                <View style={styles.cleaningActions}>
                  <Text style={styles.stallsIdentifiedText}>
                    {matchingItems.length} stall{matchingItems.length !== 1 ? 's' : ''} identified for{' '}
                    {cleaningFullLocation}
                  </Text>

                  {!selectingSpecificStalls ? (
                    <>
                      <TouchableOpacity
                        style={styles.saveButtonPrimary}
                        onPress={() => saveCleaningSchedules(matchingItems, cleaningFullLocation)}
                      >
                        <Text style={styles.saveButtonPrimaryText}>
                          Mark all {matchingItems.length} stalls closed
                        </Text>
                      </TouchableOpacity>
                      <Pressable
                        style={styles.selectSpecificStallsLink}
                        onPress={() => {
                          setSelectingSpecificStalls(true);
                          setSelectedStallsForCleaning(new Set(matchingItems.map((item) => item.id)));
                          setTimeout(() => {
                            closureScrollRef.current?.scrollToEnd({ animated: true });
                          }, 150);
                        }}
                      >
                        <Text style={styles.selectSpecificStallsLinkText}>Select specific stalls</Text>
                      </Pressable>
                    </>
                  ) : (
                    <View style={styles.specificStallsPanel}>
                      <Text style={styles.inputLabel}>Select stalls to mark closed:</Text>
                      <ScrollView
                        style={styles.specificStallsListScroll}
                        contentContainerStyle={styles.specificStallsListContent}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                      >
                        {matchingItems.map((item) => {
                          const checked = selectedStallsForCleaning.has(item.id);
                          return (
                            <Pressable
                              key={item.id}
                              style={styles.stallCheckRow}
                              onPress={() => toggleStallForCleaning(item.id)}
                            >
                              <Ionicons
                                name={checked ? 'checkbox' : 'square-outline'}
                                size={22}
                                color={checked ? '#F97316' : '#9CA3AF'}
                              />
                              <Text style={styles.stallCheckLabel}>{item.name}</Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                      <View style={styles.specificStallsButtons}>
                        <TouchableOpacity
                          style={styles.outlineButton}
                          onPress={() => {
                            setSelectingSpecificStalls(false);
                            setSelectedStallsForCleaning(new Set());
                          }}
                        >
                          <Text style={styles.outlineButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.saveButtonPrimary,
                            styles.saveButtonPrimaryFlex,
                            selectedStallsForCleaning.size === 0 && styles.saveButtonDisabled,
                          ]}
                          onPress={handleSave}
                          disabled={selectedStallsForCleaning.size === 0}
                        >
                          <Text style={styles.saveButtonPrimaryText}>
                            Save ({selectedStallsForCleaning.size} selected)
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
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
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Expiry flow
  if (mainStep === 'expiry') {
    if (!selectedExpiryCategory) {
      return (
        <View style={styles.container}>
          {renderHubHeader(getTitle(), true)}

          <View style={[styles.cardsContainer, hubScreenBottom]}>
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
        </View>
      );
    }

    if (!selectedExpiryItem) {
      const categoryItems = items.filter(
        item => item.type === 'home' && item.category === selectedExpiryCategory
      );

      return (
        <View style={styles.container}>
          {renderHubHeader(getTitle(), true)}

          <FlatList
            data={categoryItems}
            keyExtractor={item => item.id}
            style={styles.list}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
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
        </View>
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
      <View style={styles.container}>
        {renderHubHeader(getTitle(), true)}

        <View style={[styles.dateContainer, { paddingBottom: insets.bottom + 24 }]}>
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
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoid: {
    flex: 1,
  },
  itemEditContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  editLoadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editLoadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerSide: {
    width: 24,
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
  editScrollContentHome: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  editScrollContentOut: {
    paddingTop: 64,
    paddingBottom: 40,
  },
  editPanel: {
    width: '100%',
    gap: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editForm: {
    gap: 16,
  },
  editNameSection: {
    width: '100%',
  },
  editNameSectionUnderline: {
    marginBottom: 12,
  },
  editNameSectionOut: {
    paddingTop: 20,
    paddingBottom: 12,
  },
  editNameInput: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingTop: 6,
    paddingBottom: 6,
    fontSize: 17,
    fontWeight: '500',
    color: '#111827',
    borderWidth: 0,
  },
  editNameInputUnderline: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D1D5DB',
    paddingBottom: 18,
    paddingTop: 4,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 4,
  },
  fieldLabelSection: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  editInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '400',
    color: '#111827',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectValue: {
    fontSize: 16,
    fontWeight: '400',
    color: '#111827',
  },
  saveItemButton: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  saveItemButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 320,
  },
  pickerSheetTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  pickerOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickerOptionSelected: {
    backgroundColor: '#FFF7ED',
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#111827',
  },
  pickerOptionTextSelected: {
    color: '#EA580C',
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
    fontSize: 16,
    fontWeight: '400',
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
  homeCategoryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  homeCategoryChip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  homeCategoryChipActive: {
    backgroundColor: '#F97316',
  },
  homeCategoryChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  homeCategoryChipTextActive: {
    color: '#FFFFFF',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '400',
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
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
  calendarCol: {
    width: '14.285714%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
    paddingHorizontal: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendSwatchCombo: {
    width: 14,
    height: 14,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  legendSwatchHalf: {
    flex: 1,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  weekdayText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'column',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 4,
  },
  calendarWeekRowLast: {
    marginBottom: 0,
  },
  dayCellEmpty: {
    alignSelf: 'stretch',
  },
  dayCell: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dayCellRing: {
    borderWidth: 2,
    borderColor: '#f97316',
  },
  dayCellCleaning: {
    backgroundColor: '#60a5fa',
  },
  dayCellCleaningDark: {
    backgroundColor: '#1e40af',
  },
  dayCellTimeoff: {
    backgroundColor: '#f59e0b',
  },
  dayCellTimeoffDark: {
    backgroundColor: '#b45309',
  },
  dayCellComboWrap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dayCellComboRow: {
    flex: 1,
    flexDirection: 'row',
  },
  dayCellComboHalf: {
    flex: 1,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    zIndex: 1,
  },
  dayTextOnColor: {
    color: '#000000',
    fontWeight: '600',
  },
  dayTextToday: {
    color: '#15803D',
    fontWeight: '700',
    fontSize: 16,
  },
  dayTextTodayOnColor: {
    color: '#14532d',
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
  closuresListScroll: {
    maxHeight: 220,
  },
  closureItemCleaning: {
    backgroundColor: '#60a5fa',
  },
  closureItemTimeoff: {
    backgroundColor: '#f59e0b',
  },
  closureItemText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  closureTextOnCleaning: {
    color: '#000000',
  },
  closureTextOnTimeoff: {
    color: '#000000',
  },
  closureItemDate: {
    fontSize: 11,
    opacity: 0.85,
    marginTop: 2,
  },
  locationSection: {
    marginTop: 16,
    paddingBottom: 24,
  },
  cleaningActions: {
    marginTop: 12,
    gap: 12,
  },
  stallsIdentifiedText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    backgroundColor: 'rgba(243, 244, 246, 0.9)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  saveButtonPrimary: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonPrimaryFlex: {
    flex: 1,
    margin: 0,
  },
  saveButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  selectSpecificStallsLink: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  selectSpecificStallsLinkText: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  specificStallsPanel: {
    gap: 12,
  },
  specificStallsListScroll: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  specificStallsListContent: {
    padding: 12,
    gap: 8,
  },
  stallCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  stallCheckLabel: {
    fontSize: 15,
    color: '#111827',
    flex: 1,
  },
  specificStallsButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    paddingTop: 4,
  },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
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
