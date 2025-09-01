import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface PortfolioSummaryProps {
  navigation: any;
}

export default function PortfolioSummary({ navigation }: PortfolioSummaryProps) {
  const portfolioValue = 125000;
  const dailyChange = 2.45;
  const totalProfit = 15000;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Portfolio')}
    >
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.card}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Portfolio Value</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
        
        <View style={styles.valueContainer}>
          <Text style={styles.value}>₹{portfolioValue.toLocaleString()}</Text>
          <View style={[styles.changeContainer, { backgroundColor: dailyChange >= 0 ? '#10B981' : '#EF4444' }]}>
            <Ionicons 
              name={dailyChange >= 0 ? 'trending-up' : 'trending-down'} 
              size={16} 
              color="#FFFFFF" 
            />
            <Text style={styles.change}>
              {dailyChange >= 0 ? '+' : ''}{dailyChange.toFixed(2)}%
            </Text>
          </View>
        </View>

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Total P&L</Text>
            <Text style={[styles.metricValue, { color: totalProfit >= 0 ? '#10B981' : '#EF4444' }]}>
              ₹{Math.abs(totalProfit).toLocaleString()}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Assets</Text>
            <Text style={styles.metricValue}>5</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 12,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  change: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});