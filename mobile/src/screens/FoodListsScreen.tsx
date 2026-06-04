import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useFoodStore } from '../store';
import { FoodType, FoodItem, LocationDetail } from '../types';
import { compareHomeFoodListItems } from '../../../shared/home-list-sort';
import { capitalizeWords } from '../../../shared/utils';
import { useSavedLocations } from '../hooks/use-saved-locations';

interface FoodListsScreenProps {
  navigation: any;
  route: any;
}

export default function FoodListsScreen({ navigation, route }: FoodListsScreenProps) {
  const { items, fetchItems, addItem, removeItem, archiveItem } = useFoodStore();
  const [activeTab, setActiveTab] = useState<FoodType>(route.params?.activeTab || 'home');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<FoodType>('home');
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddLocation, setQuickAddLocation] = useState('');
  const [quickAddCategory, setQuickAddCategory] = useState('Fridge');
  const [locationQuery, setLocationQuery] = useState('');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [itemToArchive, setItemToArchive] = useState<FoodItem | null>(null);

  const storeLocations = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of items) {
      if (item.type !== 'out') continue;
      for (const loc of item.locations || []) {
        const key = loc.name?.trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        result.push(loc.name.trim());
      }
    }
    return result;
  }, [items]);

  const { saveLocation, getFilteredLocations } = useSavedLocations(storeLocations);

  const locationSuggestions = useMemo(
    () => getFilteredLocations(locationQuery || quickAddLocation),
    [locationQuery, quickAddLocation, getFilteredLocations]
  );

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    navigation.setParams({ activeTab });
  }, [activeTab, navigation]);

  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.activeTab) {
        setActiveTab(route.params.activeTab);
      }
    }, [route.params?.activeTab])
  );

  useEffect(() => {
    if (quickAddOpen) {
      setQuickAddType(activeTab);
    }
  }, [activeTab, quickAddOpen]);

  const filteredItems = items.filter((item) => item.type === activeTab);
  const sortedItems =
    activeTab === 'home'
      ? [...filteredItems].sort(compareHomeFoodListItems)
      : [...filteredItems].sort((a, b) => a.name.localeCompare(b.name));
  const homeCategories = ['Fridge', 'Snacks'];

  const resetQuickAdd = () => {
    setQuickAddName('');
    setQuickAddLocation('');
    setLocationQuery('');
    setShowLocationSuggestions(false);
    setQuickAddCategory('Fridge');
  };

  const closeQuickAdd = () => {
    setQuickAddOpen(false);
    resetQuickAdd();
  };

  const applyLocationPick = (loc: string) => {
    const v = capitalizeWords(loc);
    setQuickAddLocation(v);
    setLocationQuery(v);
    setShowLocationSuggestions(false);
  };

  const handleQuickAdd = async () => {
    const name = quickAddName.trim();
    if (name.length < 2) {
      Alert.alert('Name required', 'Enter a name (at least 2 characters).');
      return;
    }

    if (quickAddType === 'out') {
      const loc = quickAddLocation.trim();
      if (loc.length < 2) {
        Alert.alert('Location required', 'Out items need a location (e.g. Maxwell, Empress Place).');
        return;
      }
    }

    try {
      const capitalizedName = capitalizeWords(name);

      if (quickAddType === 'out') {
        const capitalizedLocation = capitalizeWords(quickAddLocation.trim());
        saveLocation(capitalizedLocation);
        const locationDetail: LocationDetail = {
          id: Math.random().toString(36).substr(2, 9),
          name: capitalizedLocation,
        };
        await addItem({
          name: capitalizedName,
          type: 'out',
          locations: [locationDetail],
        });
      } else {
        await addItem({
          name: capitalizedName,
          type: 'home',
          category: quickAddCategory,
          locations: [],
        });
      }

      closeQuickAdd();
    } catch {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleArchive = async (status: 'eaten' | 'thrown') => {
    if (!itemToArchive) return;
    try {
      if (archiveItem) {
        await archiveItem(itemToArchive.id, status);
      } else {
        await removeItem(itemToArchive.id);
      }
      setArchiveModalVisible(false);
      setItemToArchive(null);
    } catch {
      Alert.alert('Error', 'Failed to archive item');
    }
  };

  const getDaysRemaining = (expiryDate?: string): number | null => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const groupedHomeItems = activeTab === 'home'
    ? homeCategories.reduce((acc, cat) => {
        acc[cat] = sortedItems.filter((item) => item.category === cat);
        return acc;
      }, {} as Record<string, typeof sortedItems>)
    : {};

  const renderItemTypeIcon = (type: FoodType) => (
    <View
      style={[
        styles.itemTypeIcon,
        type === 'home' ? styles.itemTypeIconHome : styles.itemTypeIconOut,
      ]}
    >
      <Ionicons
        name={type === 'home' ? 'home' : 'restaurant'}
        size={20}
        color={type === 'home' ? '#EA580C' : '#059669'}
      />
    </View>
  );

  const renderHomeItem = (item: FoodItem) => {
    const daysRemaining = getDaysRemaining(item.expiryDate);

    return (
      <View key={item.id} style={styles.itemRow}>
        {renderItemTypeIcon('home')}
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => navigation.navigate('AddInfo', { itemId: item.id })}
        >
          <Text style={styles.itemText}>{item.name}</Text>
          <View style={styles.itemMeta}>
            {item.category && (
              <Text style={styles.categoryTag}>{item.category}</Text>
            )}
            {daysRemaining !== null && (
              <View
                style={[
                  styles.expiryBadge,
                  daysRemaining < 0
                    ? styles.expiredBadge
                    : daysRemaining === 0
                      ? styles.todayBadge
                      : daysRemaining <= 2
                        ? styles.soonBadge
                        : styles.okBadge,
                ]}
              >
                <Text
                  style={[
                    styles.expiryText,
                    daysRemaining < 0
                      ? styles.expiredText
                      : daysRemaining === 0
                        ? styles.todayText
                        : daysRemaining <= 2
                          ? styles.soonText
                          : styles.okText,
                  ]}
                >
                  {daysRemaining < 0
                    ? `EXP ${Math.abs(daysRemaining)}d ago`
                    : daysRemaining === 0
                      ? 'EXP TODAY'
                      : `${daysRemaining}d left`}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.checkButton}
          onPress={() => {
            setItemToArchive(item);
            setArchiveModalVisible(true);
          }}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderQuickAdd = () => (
    <View style={styles.quickAddCard}>
      {!quickAddOpen ? (
        <TouchableOpacity
          style={styles.quickAddTrigger}
          onPress={() => {
            setQuickAddType(activeTab);
            setQuickAddOpen(true);
          }}
        >
          <Ionicons name="add-circle-outline" size={22} color="#F97316" />
          <Text style={styles.quickAddTriggerText}>Quick Add Item</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.quickAddBody}>
          <View style={styles.quickAddHeader}>
            <Text style={styles.quickAddTitle}>Quick Add</Text>
            <TouchableOpacity onPress={closeQuickAdd} hitSlop={12}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeChip, quickAddType === 'home' && styles.typeChipActive]}
              onPress={() => setQuickAddType('home')}
            >
              <Text style={[styles.typeChipText, quickAddType === 'home' && styles.typeChipTextActive]}>
                Home
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeChip, quickAddType === 'out' && styles.typeChipActive]}
              onPress={() => {
                setQuickAddType('out');
                setShowLocationSuggestions(false);
              }}
            >
              <Text style={[styles.typeChipText, quickAddType === 'out' && styles.typeChipTextActive]}>
                Out
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="What is it?"
            value={quickAddName}
            onChangeText={setQuickAddName}
            returnKeyType="next"
          />

          {quickAddType === 'home' && (
            <View style={styles.categorySelector}>
              {homeCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, quickAddCategory === cat && styles.activeCategoryChip]}
                  onPress={() => setQuickAddCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      quickAddCategory === cat && styles.activeCategoryChipText,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {quickAddType === 'out' && (
            <View style={styles.locationField}>
              <TextInput
                style={styles.input}
                placeholder="Location (e.g. Maxwell, Empress Place)"
                value={quickAddLocation}
                onChangeText={(text) => {
                  setQuickAddLocation(text);
                  setLocationQuery(text);
                  setShowLocationSuggestions(true);
                }}
                onFocus={() => setShowLocationSuggestions(true)}
                onBlur={() => {
                  setQuickAddLocation((prev) => capitalizeWords(prev));
                  setTimeout(() => setShowLocationSuggestions(false), 200);
                }}
              />
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <View style={styles.suggestionsList}>
                  {locationSuggestions.map((loc) => (
                    <Pressable
                      key={loc}
                      style={({ pressed }) => [
                        styles.suggestionRow,
                        pressed && styles.suggestionRowPressed,
                      ]}
                      onPress={() => applyLocationPick(loc)}
                    >
                      <Ionicons name="location-outline" size={16} color="#6B7280" />
                      <Text style={styles.suggestionText}>{loc}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleQuickAdd}>
            <Text style={styles.submitButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Food Lists</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'home' && styles.activeTab]}
          onPress={() => {
            setActiveTab('home');
            setShowLocationSuggestions(false);
          }}
        >
          <Ionicons name="home" size={18} color={activeTab === 'home' ? '#FFFFFF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'out' && styles.activeTab]}
          onPress={() => {
            setActiveTab('out');
            setShowLocationSuggestions(false);
          }}
        >
          <Ionicons name="restaurant" size={18} color={activeTab === 'out' ? '#FFFFFF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'out' && styles.activeTabText]}>Out</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardWrap}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.quickAddWrap}>{renderQuickAdd()}</View>

        <FlatList
          data={activeTab === 'home' ? [] : sortedItems}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            activeTab === 'home' ? (
              <View>
                {homeCategories.map((cat) => {
                  const catItems = groupedHomeItems[cat] || [];
                  if (catItems.length === 0) return null;
                  return (
                    <View key={cat} style={styles.categorySection}>
                      <Text style={styles.categoryTitle}>{cat}</Text>
                      {catItems.map((item) => renderHomeItem(item))}
                    </View>
                  );
                })}
                {sortedItems.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No items yet. Use Quick Add above.</Text>
                  </View>
                )}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              {renderItemTypeIcon('out')}
              <TouchableOpacity
                style={styles.itemContent}
                onPress={() => navigation.navigate('AddInfo', { itemId: item.id })}
              >
                <Text style={styles.itemText}>{item.name}</Text>
                {item.locations && item.locations.length > 0 && (
                  <Text style={styles.locationMeta}>
                    {item.locations.map((l) => l.name).join(', ')}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('AddInfo', { itemId: item.id })}
                style={styles.chevronButton}
              >
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            activeTab === 'out' ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No items yet. Use Quick Add above.</Text>
              </View>
            ) : null
          }
        />
      </KeyboardAvoidingView>

      <Modal
        visible={archiveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setArchiveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Food Item Consumed?</Text>
            <Text style={styles.modalSubtitle}>Did you eat this item or did it go to waste?</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.thrownButton} onPress={() => handleArchive('thrown')}>
                <Text style={styles.thrownButtonText}>Thrown</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.eatenButton} onPress={() => handleArchive('eaten')}>
                <Text style={styles.eatenButtonText}>Eaten</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setArchiveModalVisible(false);
                setItemToArchive(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const SCREEN_PADDING = 20;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: SCREEN_PADDING,
    marginBottom: 8,
    backgroundColor: 'rgba(245, 242, 239, 0.85)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#F97316',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  keyboardWrap: {
    flex: 1,
  },
  quickAddWrap: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    paddingBottom: 16,
  },
  quickAddCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  quickAddTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  quickAddTriggerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  quickAddBody: {
    padding: 16,
    gap: 16,
  },
  quickAddHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickAddTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeChipActive: {
    backgroundColor: '#FFFFFF',
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeChipTextActive: {
    color: '#111827',
  },
  categorySelector: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  activeCategoryChip: {
    backgroundColor: '#F97316',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeCategoryChipText: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationField: {
    position: 'relative',
    zIndex: 10,
  },
  suggestionsList: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionRowPressed: {
    backgroundColor: '#F3F4F6',
  },
  suggestionText: {
    fontSize: 15,
    color: '#111827',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 14,
    paddingVertical: 12,
    marginBottom: 10,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  itemTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemTypeIconHome: {
    backgroundColor: '#FFEDD5',
  },
  itemTypeIconOut: {
    backgroundColor: '#D1FAE5',
  },
  itemContent: {
    flex: 1,
    paddingVertical: 4,
    minWidth: 0,
  },
  chevronButton: {
    padding: 8,
    flexShrink: 0,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  locationMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1F4A38',
    backgroundColor: '#E2EDE8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expiryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expiredBadge: { backgroundColor: '#FEE2E2' },
  todayBadge: { backgroundColor: '#FFEDD5' },
  soonBadge: { backgroundColor: '#FEF9C3' },
  okBadge: { backgroundColor: '#DCFCE7' },
  expiryText: {
    fontSize: 10,
    fontWeight: '500',
  },
  expiredText: { color: '#DC2626' },
  todayText: { color: '#EA580C' },
  soonText: { color: '#CA8A04' },
  okText: { color: '#16A34A' },
  checkButton: {
    width: 40,
    height: 40,
    backgroundColor: '#22C55E',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#16A34A',
    flexShrink: 0,
    marginLeft: 4,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  thrownButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  thrownButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  eatenButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  eatenButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
