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
  
  // Expiry state (for Add Info main screen)
  const [mainStep, setMainStep] = useState<'main' | 'closure' | 'expiry'>('main');
  const [selectedExpiryCategory, setSelectedExpiryCategory] = useState<'Fridge' | 'Snacks' | null>(null);
  const [selectedExpiryItem, setSelectedExpiryItem] = useState<FoodItem | null>(null);
  const [expiryDateInput, setExpiryDateInput] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

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
    const currentCategory = (selectedItem.category && FOOD_CATEGORIES.includes(selectedItem.category))
      ? selectedItem.category
      : categorizeFood(selectedItem.name);

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Info</Text>
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
                      navigation.goBack();
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
                {FOOD_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      currentCategory === cat && styles.categoryOptionSelected
                    ]}
                    onPress={async () => {
                      try {
                        await updateItem(selectedItem.id, { category: cat });
                        setShowCategoryModal(false);
                        Alert.alert('Category Updated', `Set to ${cat}`);
                      } catch (error) {
                        console.error('Failed to update category:', error);
                        Alert.alert('Error', 'Failed to update category');
                      }
                    }}
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
          <TouchableOpacity style={styles.mainCard}>
            <View style={[styles.cardIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="sparkles" size={28} color="#2563EB" />
            </View>
            <Text style={styles.cardTitle}>Cleaning</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mainCard}>
            <View style={[styles.cardIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="calendar" size={28} color="#D97706" />
            </View>
            <Text style={styles.cardTitle}>Time Off</Text>
          </TouchableOpacity>
        </View>
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
});
