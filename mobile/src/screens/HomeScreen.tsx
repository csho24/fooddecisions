import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getClosureSchedules, ClosureSchedule, getFoods } from '../api';
import { FoodItem } from '../types';
import {
  getHomeExpiryReminders,
  type ExpiryReminderItem,
} from '../../../shared/expiry-reminders';

interface HomeScreenProps {
  navigation: any;
}

interface RegularClosure {
  stallName: string;
  locationName: string | null;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [todaysClosures, setTodaysClosures] = useState<ClosureSchedule[]>([]);
  const [regularClosuresToday, setRegularClosuresToday] = useState<RegularClosure[]>([]);
  const [expiryReminders, setExpiryReminders] = useState<ExpiryReminderItem[]>([]);

  useEffect(() => {
    // Fetch scheduled closures and filter for today
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

    // Fetch food items and compute regular weekly closures
    getFoods()
      .then((items: FoodItem[]) => {
        setExpiryReminders(getHomeExpiryReminders(items));

        const todayDow = new Date().getDay(); // 0=Sunday, 1=Monday, ...
        const result: RegularClosure[] = [];

        for (const item of items) {
          if (item.type !== 'out') continue;

          if (item.locations && item.locations.length > 0) {
            const closedLocs = item.locations.filter(loc => {
              if (!loc.closedDays || !loc.closedDays.includes(todayDow)) return false;
              // Skip locations closed more than 5 days/week (reminder-only items like a Sunday church café)
              return loc.closedDays.length <= 5;
            });
            if (closedLocs.length === 0) continue;

            if (closedLocs.length === item.locations.length || item.locations.length === 1) {
              result.push({ stallName: item.name, locationName: null });
            } else {
              for (const loc of closedLocs) {
                result.push({ stallName: item.name, locationName: loc.name });
              }
            }
          } else if (item.closedDays && item.closedDays.includes(todayDow) && item.closedDays.length <= 5) {
            // Legacy: closedDays directly on item — skip reminder-only items closed 6+ days/week
            result.push({ stallName: item.name, locationName: null });
          }
        }

        setRegularClosuresToday(result);
      })
      .catch(err => console.error('Failed to fetch foods for closure check:', err));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name="restaurant"
          size={120}
          color="#F97316"
          style={styles.headerBgIcon}
        />
        <View style={styles.titleRow}>
          <Text style={styles.title}>Food{'\n'}Decisions</Text>
          <View style={styles.titleIconWrap}>
            <Ionicons name="restaurant" size={28} color="#F97316" />
          </View>
        </View>
        <Text style={styles.subtitle}>what and where shall we eat today?</Text>
      </View>

      <View style={styles.buttonsContainer}>
        {expiryReminders.length > 0 && (
          <View style={styles.expiryBanner}>
            <View style={styles.expiryBannerIcon}>
              <Ionicons name="time-outline" size={18} color="#BE123C" />
            </View>
            <View style={styles.expiryBannerContent}>
              <Text style={styles.expiryBannerTitle}>Expiring Soon</Text>
              {expiryReminders.map((r) => (
                <Text key={r.id} style={styles.expiryBannerLine}>
                  {r.name} — {r.daysRemaining}d left
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Closure Alert Banner */}
        {(todaysClosures.length > 0 || regularClosuresToday.length > 0) && (
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
              {regularClosuresToday.map((entry, i) => (
                <Text key={`reg-${i}`} style={styles.closureBannerRegular}>
                  {entry.locationName
                    ? `${entry.stallName} (${entry.locationName}) is closed today`
                    : `${entry.stallName} is closed today`}
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
            style={[styles.smallCard, styles.foodListCard]}
            onPress={() => navigation.navigate('FoodLists')}
            activeOpacity={0.9}
          >
            <View style={[styles.smallIconBg, styles.foodListIconBg]}>
              <Ionicons name="list" size={20} color="#1F4A38" />
            </View>
            <Text style={[styles.smallCardTitle, styles.foodListCardTitle]}>Food List</Text>
            <Ionicons
              name="list"
              size={80}
              color="rgba(31, 74, 56, 0.12)"
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
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBgIcon: {
    position: 'absolute',
    right: -16,
    top: 32,
    opacity: 0.07,
    transform: [{ rotate: '-12deg' }],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#F97316',
    lineHeight: 44,
    letterSpacing: -1,
    flexShrink: 1,
  },
  titleIconWrap: {
    marginTop: 6,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 8,
    paddingRight: 8,
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
  /** Match web home: bg-secondary (soft sage green) */
  foodListCard: {
    backgroundColor: '#E2EDE8',
  },
  foodListIconBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  foodListCardTitle: {
    color: '#1F4A38',
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
    padding: 14,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  closureBannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  closureBannerContent: {
    flex: 1,
    minWidth: 0,
  },
  closureBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 6,
  },
  closureBannerText: {
    fontSize: 14,
    color: '#B45309',
    marginBottom: 4,
  },
  closureBannerType: {
    fontSize: 12,
    color: '#D97706',
  },
  closureBannerRegular: {
    fontSize: 14,
    color: '#6B7280',
  },
  expiryBanner: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
  },
  expiryBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  expiryBannerContent: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  expiryBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9F1239',
    marginBottom: 8,
  },
  expiryBannerLine: {
    fontSize: 14,
    fontWeight: '500',
    color: '#881337',
    marginBottom: 4,
  },
});
