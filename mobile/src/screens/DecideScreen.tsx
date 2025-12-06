import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFoodStore } from '../store';
import { FoodType } from '../types';

interface DecideScreenProps {
  navigation: any;
}

export default function DecideScreen({ navigation }: DecideScreenProps) {
  const { items, fetchItems, checkAvailability } = useFoodStore();
  const [step, setStep] = useState<'type' | 'options'>('type');
  const [selectedType, setSelectedType] = useState<FoodType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const groupedItems = useMemo(() => {
    let filtered = items;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      );
    } else if (selectedType) {
      filtered = items.filter(i => i.type === selectedType);
    } else {
      return {};
    }

    const itemsWithStatus = filtered.map(item => ({
      ...item,
      status: checkAvailability(item),
    }));

    if (searchQuery.trim()) {
      return itemsWithStatus.reduce((acc, item) => {
        const typeLabel = item.type === 'home' ? 'Eat at Home' : 'Go Out';
        if (!acc[typeLabel]) acc[typeLabel] = [];
        acc[typeLabel].push(item);
        return acc;
      }, {} as Record<string, typeof itemsWithStatus>);
    } else if (selectedType === 'home') {
      return itemsWithStatus.reduce((acc, item) => {
        const cat = item.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {} as Record<string, typeof itemsWithStatus>);
    } else {
      const locationGroups: Record<string, typeof itemsWithStatus> = {};
      itemsWithStatus.forEach(item => {
        if (item.locations && item.locations.length > 0) {
          item.locations.forEach(loc => {
            if (!locationGroups[loc.name]) locationGroups[loc.name] = [];
            locationGroups[loc.name].push(item);
          });
        } else {
          if (!locationGroups['Unspecified']) locationGroups['Unspecified'] = [];
          locationGroups['Unspecified'].push(item);
        }
      });
      return locationGroups;
    }
  }, [items, selectedType, searchQuery, checkAvailability]);

  const sections = Object.entries(groupedItems).map(([title, data]) => ({
    title,
    data: data.sort((a, b) => (a.status.available === b.status.available ? 0 : a.status.available ? -1 : 1)),
  }));

  const isSearching = searchQuery.trim().length > 0;

  const handleTypeSelect = (type: FoodType) => {
    setSelectedType(type);
    setStep('options');
    setSearchQuery('');
  };

  if (step === 'type' && !isSearching) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Decide</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.vibeContainer}>
          <Text style={styles.vibeText}>What's the vibe?</Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.vibeButton} onPress={() => handleTypeSelect('home')}>
            <View style={[styles.vibeIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="home" size={28} color="#D97706" />
            </View>
            <Text style={styles.vibeButtonText}>Eat at Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.vibeButton} onPress={() => handleTypeSelect('out')}>
            <View style={[styles.vibeIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="storefront" size={28} color="#059669" />
            </View>
            <Text style={styles.vibeButtonText}>Go Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for cravings..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (isSearching) {
            setSearchQuery('');
          } else {
            setStep('type');
            setSelectedType(null);
          }
        }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isSearching ? 'Search Results' : selectedType === 'home' ? 'Eat at Home' : 'Go Out'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {isSearching && (
        <View style={styles.searchContainerActive}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for cravings..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.id + index}
        style={styles.list}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            {selectedType === 'out' && <Ionicons name="location" size={16} color="#6B7280" />}
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.itemCard, !item.status.available && styles.itemCardUnavailable]}>
            <View style={[styles.statusDot, item.status.available ? styles.dotAvailable : styles.dotUnavailable]} />
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, !item.status.available && styles.itemNameUnavailable]}>
                {item.name}
              </Text>
            </View>
            {!item.status.available && (
              <View style={styles.closedBadge}>
                <Text style={styles.closedText}>{item.status.reason || 'Closed'}</Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {isSearching ? 'No matches found' : 'No items in this category'}
            </Text>
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
  vibeContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  vibeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  buttonsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  vibeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  vibeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vibeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchContainerActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemCardUnavailable: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  dotAvailable: {
    backgroundColor: '#22C55E',
  },
  dotUnavailable: {
    backgroundColor: '#9CA3AF',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  itemNameUnavailable: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  closedBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  closedText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#DC2626',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
