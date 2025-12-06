import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Food Decisions</Text>
        <Text style={styles.subtitle}>What do you want to eat?</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => navigation.navigate('FoodLists')}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="list" size={28} color="#D97706" />
          </View>
          <Text style={styles.buttonText}>Food Lists</Text>
          <Text style={styles.buttonSubtext}>Add & manage foods</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => navigation.navigate('AddInfo')}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="information-circle" size={28} color="#2563EB" />
          </View>
          <Text style={styles.buttonText}>Add Info</Text>
          <Text style={styles.buttonSubtext}>Details & locations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainButton, styles.decideButton]}
          onPress={() => navigation.navigate('Decide')}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="restaurant" size={28} color="#059669" />
          </View>
          <Text style={styles.buttonText}>Decide</Text>
          <Text style={styles.buttonSubtext}>What to eat now</Text>
        </TouchableOpacity>
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
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  buttonsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 16,
  },
  mainButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 12,
  },
  decideButton: {
    borderColor: '#059669',
    borderWidth: 2,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
});
