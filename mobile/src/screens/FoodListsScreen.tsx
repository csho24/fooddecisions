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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFoodStore } from '../store';
import { FoodType, FoodItem } from '../types';

interface FoodListsScreenProps {
  navigation: any;
}

export default function FoodListsScreen({ navigation }: FoodListsScreenProps) {
  const { items, isLoading, fetchItems, addItem, removeItem, archiveItem } = useFoodStore();
  const [activeTab, setActiveTab] = useState<FoodType>('home');
  const [newItemName, setNewItemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Fridge');
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [itemToArchive, setItemToArchive] = useState<FoodItem | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items
    .filter(item => item.type === activeTab)
    .sort((a, b) => a.name.localeCompare(b.name));
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

  const handleArchive = async (status: 'eaten' | 'thrown') => {
    if (!itemToArchive) return;
    try {
      if (archiveItem) {
        await archiveItem(itemToArchive.id, status);
      } else {
        // Fallback to just removing if archiveItem not available
        await removeItem(itemToArchive.id);
      }
      setArchiveModalVisible(false);
      setItemToArchive(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to archive item');
    }
  };

  // Calculate days remaining for expiry
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
        acc[cat] = filteredItems.filter(item => item.category === cat);
        return acc;
      }, {} as Record<string, typeof filteredItems>)
    : {};

  const renderHomeItem = (item: FoodItem) => {
    const daysRemaining = getDaysRemaining(item.expiryDate);
    
    return (
      <View key={item.id} style={styles.itemRow}>
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
              <View style={[
                styles.expiryBadge,
                daysRemaining < 0 ? styles.expiredBadge :
                daysRemaining === 0 ? styles.todayBadge :
                daysRemaining <= 2 ? styles.soonBadge : styles.okBadge
              ]}>
                <Text style={[
                  styles.expiryText,
                  daysRemaining < 0 ? styles.expiredText :
                  daysRemaining === 0 ? styles.todayText :
                  daysRemaining <= 2 ? styles.soonText : styles.okText
                ]}>
                  {daysRemaining < 0 ? `EXP ${Math.abs(daysRemaining)}d ago` :
                   daysRemaining === 0 ? 'EXP TODAY' :
                   `${daysRemaining}d left`}
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
          <Ionicons name="checkmark" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>My Food Lists</Text>
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
                    {catItems.map(item => renderHomeItem(item))}
                  </View>
                );
              })}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.itemRow}
            onPress={() => navigation.navigate('AddInfo', { itemId: item.id })}
          >
            <View style={styles.itemContent}>
              <Text style={styles.itemText}>{item.name}</Text>
              {item.locations && item.locations.length > 0 && (
                <Text style={styles.locationCount}>{item.locations.length} locations</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          activeTab === 'out' ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No items yet. Add some!</Text>
            </View>
          ) : null
        }
      />

      {/* Archive Modal */}
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
              <TouchableOpacity
                style={styles.thrownButton}
                onPress={() => handleArchive('thrown')}
              >
                <Text style={styles.thrownButtonText}>Thrown</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.eatenButton}
                onPress={() => handleArchive('eaten')}
              >
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
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemContent: {
    flex: 1,
    paddingVertical: 8,
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
  categoryTag: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
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
  locationCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  checkButton: {
    width: 48,
    height: 48,
    backgroundColor: '#22C55E',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  emptyState: {
    paddingVertical: 48,
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
