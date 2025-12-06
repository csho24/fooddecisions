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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFoodStore } from '../store';
import { FoodType } from '../types';

interface FoodListsScreenProps {
  navigation: any;
}

export default function FoodListsScreen({ navigation }: FoodListsScreenProps) {
  const { items, isLoading, fetchItems, addItem, removeItem } = useFoodStore();
  const [activeTab, setActiveTab] = useState<FoodType>('home');
  const [newItemName, setNewItemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Fridge');

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items.filter(item => item.type === activeTab);
  const homeCategories = ['Fridge', 'Snacks'];

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    try {
      await addItem({
        name: newItemName.trim(),
        type: activeTab,
        category: activeTab === 'home' ? selectedCategory : undefined,
        locations: [],
      });
      setNewItemName('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleDeleteItem = (id: string, name: string) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeItem(id),
        },
      ]
    );
  };

  const groupedHomeItems = activeTab === 'home'
    ? homeCategories.reduce((acc, cat) => {
        acc[cat] = filteredItems.filter(item => item.category === cat);
        return acc;
      }, {} as Record<string, typeof filteredItems>)
    : {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Food Lists</Text>
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

      {activeTab === 'home' && (
        <View style={styles.categorySelector}>
          {homeCategories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.activeCategoryChip]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.activeCategoryChipText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          placeholder={`Add ${activeTab === 'home' ? selectedCategory.toLowerCase() : 'food'} item...`}
          value={newItemName}
          onChangeText={setNewItemName}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </KeyboardAvoidingView>

      <FlatList
        data={activeTab === 'home' ? [] : filteredItems}
        keyExtractor={item => item.id}
        style={styles.list}
        ListHeaderComponent={
          activeTab === 'home' ? (
            <View>
              {homeCategories.map(cat => {
                const catItems = groupedHomeItems[cat] || [];
                if (catItems.length === 0) return null;
                return (
                  <View key={cat} style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>{cat}</Text>
                    {catItems.map(item => (
                      <View key={item.id} style={styles.itemRow}>
                        <Text style={styles.itemText}>{item.name}</Text>
                        <View style={styles.itemActions}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('AddInfo', { itemId: item.id })}
                          >
                            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={styles.itemContent}>
              <Text style={styles.itemText}>{item.name}</Text>
              {item.locations && item.locations.length > 0 && (
                <Text style={styles.locationCount}>{item.locations.length} locations</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AddInfo', { itemId: item.id })}
            >
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          activeTab === 'out' ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No items yet. Add some!</Text>
            </View>
          ) : null
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
  categorySelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  activeCategoryChip: {
    backgroundColor: '#111827',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeCategoryChipText: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: '#111827',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  locationCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
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
