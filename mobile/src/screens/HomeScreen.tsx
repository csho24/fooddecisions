import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getClosureSchedules, ClosureSchedule } from '../api';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [todaysClosures, setTodaysClosures] = useState<ClosureSchedule[]>([]);

  useEffect(() => {
    // Fetch closures and filter for today
    getClosureSchedules()
      .then(closures => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        const todayClosures = closures.filter(c => c.date === todayStr);
        setTodaysClosures(todayClosures);
      })
      .catch(err => console.error('Failed to fetch closures:', err));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Food{'\n'}Decisions</Text>
          <Ionicons name="sparkles" size={20} color="#F97316" style={styles.sparkle} />
        </View>
        <Text style={styles.subtitle}>what and where shall we eat today?</Text>
      </View>

      <View style={styles.buttonsContainer}>
        {/* Closure Alert Banner */}
        {todaysClosures.length > 0 && (
          <View style={styles.closureBanner}>
            <View style={styles.closureBannerIcon}>
              <Ionicons name="alert-circle" size={18} color="#D97706" />
            </View>
            <View style={styles.closureBannerContent}>
              <Text style={styles.closureBannerTitle}>Closed Today</Text>
              {todaysClosures.map((c, i) => (
                <Text key={i} style={styles.closureBannerText}>
                  {c.location && c.foodItemName 
                    ? `${c.location} › ${c.foodItemName}` 
                    : c.foodItemName || c.location}
                  <Text style={styles.closureBannerType}>
                    {' '}({c.type === 'cleaning' ? 'Cleaning' : 'Time Off'})
                  </Text>
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* DECIDE - Big card at top */}
        <TouchableOpacity
          style={styles.decideCard}
          onPress={() => navigation.navigate('Decide')}
          activeOpacity={0.9}
        >
          <View style={styles.decideIconBg}>
            <Ionicons name="restaurant" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.decideTextContainer}>
            <Text style={styles.decideTitle}>Decide</Text>
            <Text style={styles.decideSubtext}>Help me choose what to eat</Text>
          </View>
          <Ionicons 
            name="restaurant" 
            size={140} 
            color="rgba(255,255,255,0.15)" 
            style={styles.decideBackground}
          />
        </TouchableOpacity>

        {/* Bottom row - Food List & Add Info */}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={styles.smallCard}
            onPress={() => navigation.navigate('FoodLists')}
            activeOpacity={0.9}
          >
            <View style={styles.smallIconBg}>
              <Ionicons name="list" size={20} color="#374151" />
            </View>
            <Text style={styles.smallCardTitle}>Food List</Text>
            <Ionicons 
              name="list" 
              size={80} 
              color="rgba(0,0,0,0.05)" 
              style={styles.smallCardBg}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallCard, styles.addInfoCard]}
            onPress={() => navigation.navigate('AddInfo')}
            activeOpacity={0.9}
          >
            <View style={[styles.smallIconBg, styles.addInfoIcon]}>
              <Ionicons name="add" size={20} color="#6B7280" />
            </View>
            <Text style={styles.smallCardTitle}>Add Info</Text>
            <Ionicons 
              name="add" 
              size={80} 
              color="rgba(0,0,0,0.03)" 
              style={styles.smallCardBg}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#F97316',
    lineHeight: 44,
    letterSpacing: -1,
  },
  sparkle: {
    marginLeft: 8,
    marginTop: 4,
    opacity: 0.6,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 8,
  },
  buttonsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 16,
  },
  // DECIDE card - Big and prominent
  decideCard: {
    height: 180,
    backgroundColor: '#F97316',
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  decideIconBg: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decideTextContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
  },
  decideTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  decideSubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  decideBackground: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    transform: [{ rotate: '-15deg' }],
  },
  // Bottom row cards
  bottomRow: {
    flexDirection: 'row',
    gap: 16,
  },
  smallCard: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 28,
    padding: 20,
    overflow: 'hidden',
  },
  addInfoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
  },
  smallIconBg: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addInfoIcon: {
    backgroundColor: '#F3F4F6',
  },
  smallCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  smallCardBg: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  // Closure Banner
  closureBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  closureBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closureBannerContent: {
    flex: 1,
  },
  closureBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  closureBannerText: {
    fontSize: 14,
    color: '#B45309',
  },
  closureBannerType: {
    fontSize: 12,
    color: '#D97706',
  },
});
