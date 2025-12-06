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

export default function AddInfoScreen({ navigation, route }: AddInfoScreenProps) {
  const { items, fetchItems, updateItem, removeItem } = useFoodStore();
  const [activeTab, setActiveTab] = useState<FoodType>('home');
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationDetail | null>(null);
  const [locationName, setLocationName] = useState('');
  const [hasHours, setHasHours] = useState(false);
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('21:00');
  const [closedDays, setClosedDays] = useState<number[]>([]);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (route.params?.itemId) {
      const item = items.find(i => i.id === route.params.itemId);
      if (item) {
        setSelectedItem(item);
        setActiveTab(item.type);
      }
    }
  }, [route.params?.itemId, items]);

  const filteredItems = items.filter(
    item => item.type === activeTab && item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openLocationModal = (location?: LocationDetail) => {
    if (location) {
      setEditingLocation(location);
      setLocationName(location.name);
      setHasHours(!!location.openingHours);
      setOpenTime(location.openingHours?.open || '09:00');
      setCloseTime(location.openingHours?.close || '21:00');
      setClosedDays(location.closedDays || []);
    } else {
      setEditingLocation(null);
      setLocationName('');
      setHasHours(false);
      setOpenTime('09:00');
      setCloseTime('21:00');
      setClosedDays([]);
    }
    setLocationModalVisible(true);
  };

  const saveLocation = async () => {
    if (!selectedItem || !locationName.trim()) return;

    const newLocation: LocationDetail = {
      id: editingLocation?.id || Math.random().toString(36).substr(2, 9),
      name: locationName.trim(),
      openingHours: hasHours ? { open: openTime, close: closeTime } : undefined,
      closedDays: closedDays.length > 0 ? closedDays : undefined,
    };

    let updatedLocations = selectedItem.locations || [];
    if (editingLocation) {
      updatedLocations = updatedLocations.map(l => l.id === editingLocation.id ? newLocation : l);
    } else {
      updatedLocations = [...updatedLocations, newLocation];
    }

    try {
      await updateItem(selectedItem.id, { locations: updatedLocations });
      setSelectedItem({ ...selectedItem, locations: updatedLocations });
      setLocationModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save location');
    }
  };

  const deleteLocation = (locationId: string) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to remove this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!selectedItem) return;
            const updatedLocations = (selectedItem.locations || []).filter(l => l.id !== locationId);
            await updateItem(selectedItem.id, { locations: updatedLocations });
            setSelectedItem({ ...selectedItem, locations: updatedLocations });
          },
        },
      ]
    );
  };

  const toggleClosedDay = (dayId: number) => {
    if (closedDays.includes(dayId)) {
      setClosedDays(closedDays.filter(d => d !== dayId));
    } else {
      setClosedDays([...closedDays, dayId]);
    }
  };

  if (selectedItem) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedItem(null)}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Info</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.itemName}>{selectedItem.name}</Text>

          {selectedItem.type === 'out' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Locations</Text>
                <TouchableOpacity style={styles.addLocationBtn} onPress={() => openLocationModal()}>
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.addLocationText}>Add</Text>
                </TouchableOpacity>
              </View>

              {selectedItem.locations?.map(loc => (
                <View key={loc.id} style={styles.locationCard}>
                  <TouchableOpacity style={styles.locationInfo} onPress={() => openLocationModal(loc)}>
                    <Text style={styles.locationName}>{loc.name}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteLocation(loc.id)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              {(!selectedItem.locations || selectedItem.locations.length === 0) && (
                <View style={styles.emptyLocations}>
                  <Text style={styles.emptyText}>No locations added yet</Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert('Delete Food', `Delete "${selectedItem.name}"?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await removeItem(selectedItem.id);
                    setSelectedItem(null);
                  },
                },
              ]);
            }}
          >
            <Text style={styles.deleteButtonText}>Delete Food Item</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal visible={locationModalVisible} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingLocation ? 'Edit Location' : 'Add Location'}</Text>
              <TouchableOpacity onPress={saveLocation}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={locationName}
                  onChangeText={setLocationName}
                  placeholder="e.g. Maxwell or Bedok"
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Specific Opening Hours</Text>
                <Switch value={hasHours} onValueChange={setHasHours} />
              </View>

              {hasHours && (
                <View style={styles.hoursContainer}>
                  <View style={styles.timeInputGroup}>
                    <Text style={styles.timeLabel}>Opens</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={openTime}
                      onChangeText={setOpenTime}
                      placeholder="09:00"
                    />
                  </View>
                  <Text style={styles.timeSeparator}>-</Text>
                  <View style={styles.timeInputGroup}>
                    <Text style={styles.timeLabel}>Closes</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={closeTime}
                      onChangeText={setCloseTime}
                      placeholder="21:00"
                    />
                  </View>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Days Closed</Text>
                <View style={styles.daysRow}>
                  {DAYS.map(day => (
                    <TouchableOpacity
                      key={day.id}
                      style={[styles.dayButton, closedDays.includes(day.id) && styles.dayButtonActive]}
                      onPress={() => toggleClosedDay(day.id)}
                    >
                      <Text style={[styles.dayText, closedDays.includes(day.id) && styles.dayTextActive]}>
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Info</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'home' && styles.activeTab]}
          onPress={() => setActiveTab('home')}
        >
          <Ionicons name="home" size={18} color={activeTab === 'home' ? '#FFFFFF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'out' && styles.activeTab]}
          onPress={() => setActiveTab('out')}
        >
          <Ionicons name="restaurant" size={18} color={activeTab === 'out' ? '#FFFFFF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'out' && styles.activeTabText]}>Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.itemRow} onPress={() => setSelectedItem(item)}>
            <View>
              <Text style={styles.itemText}>{item.name}</Text>
              {item.type === 'out' && item.locations && item.locations.length > 0 && (
                <Text style={styles.locationCount}>{item.locations.length} Locations</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
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
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  addLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addLocationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  emptyLocations: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#E5E7EB',
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
    backgroundColor: '#111827',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  itemRow: {
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
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  locationCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeSeparator: {
    fontSize: 18,
    color: '#6B7280',
    paddingTop: 16,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
});
