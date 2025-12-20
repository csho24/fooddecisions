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

type MainStep = 'main' | 'closure' | 'expiry';
type ExpiryStep = 'category' | 'items' | 'date';

export default function AddInfoScreen({ navigation, route }: AddInfoScreenProps) {
  const { items, fetchItems, updateItem } = useFoodStore();
  
  // Main navigation state
  const [mainStep, setMainStep] = useState<MainStep>('main');
  
  // Expiry state
  const [expiryStep, setExpiryStep] = useState<ExpiryStep>('category');
  const [selectedExpiryCategory, setSelectedExpiryCategory] = useState<'Fridge' | 'Snacks' | null>(null);
  const [selectedExpiryItem, setSelectedExpiryItem] = useState<FoodItem | null>(null);
  const [expiryDateInput, setExpiryDateInput] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  // Get title based on current step
  const getTitle = () => {
    if (mainStep === 'expiry') {
      if (selectedExpiryItem) return selectedExpiryItem.name;
      if (selectedExpiryCategory) return selectedExpiryCategory;
      return 'Expiry';
    }
    if (mainStep === 'closure') return 'Closure';
    return 'Add Info';
  };

  // Handle back navigation
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

  // Save expiry date
  const saveExpiryDate = async () => {
    if (!selectedExpiryItem || expiryDateInput.length !== 10) return;
    
    const parts = expiryDateInput.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      const isoDate = new Date(year, month, day).toISOString().split('T')[0];
      
      try {
        await updateItem(selectedExpiryItem.id, { expiryDate: isoDate });
        Alert.alert('Saved!', `${selectedExpiryItem.name} expires on ${expiryDateInput}`);
        setSelectedExpiryItem(null);
        setExpiryDateInput('');
      } catch (error) {
        Alert.alert('Error', 'Failed to save expiry date');
      }
    }
  };

  // Main screen with Closure and Expiry cards
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

  // Closure screen (placeholder - can be expanded)
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
    // Step 1: Select category (Fridge or Snacks)
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
              style={styles.categoryCard}
              onPress={() => setSelectedExpiryCategory('Fridge')}
            >
              <View style={[styles.cardIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="home" size={24} color="#2563EB" />
              </View>
              <Text style={styles.cardTitle}>Fridge</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.categoryCard}
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

    // Step 2: Select item from category
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
                  style={styles.itemRow}
                  onPress={() => {
                    setSelectedExpiryItem(item);
                    setExpiryDateInput(item.expiryDate || '');
                  }}
                >
                  <Text style={styles.itemText}>{item.name}</Text>
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

    // Step 3: Enter expiry date
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
          <Text style={styles.dateLabel}>Expiry Date (DD/MM/YYYY)</Text>
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
            onPress={saveExpiryDate}
            disabled={expiryDateInput.length !== 10}
          >
            <Text style={styles.saveButtonText}>Save Expiry Date</Text>
          </TouchableOpacity>

          {selectedExpiryItem.expiryDate && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={async () => {
                try {
                  await updateItem(selectedExpiryItem.id, { expiryDate: undefined });
                  Alert.alert('Cleared', 'Expiry date removed.');
                  setSelectedExpiryItem(null);
                  setExpiryDateInput('');
                } catch (error) {
                  console.error('Error clearing expiry date:', error);
                }
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
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 8,
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  itemRow: {
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
  itemText: {
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
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  dateContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
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
  saveButton: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
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
