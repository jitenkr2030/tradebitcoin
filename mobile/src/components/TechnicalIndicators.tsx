import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function TechnicalIndicators() {
  const indicators = {
    rsi: 45.2,
    macd: { value: 125.5, signal: 'BUY' },
    bb: { position: 'MIDDLE', strength: 'NEUTRAL' },
    volume: { value: '2.5B', trend: 'UP' },
  };

  const getRSIColor = (rsi: number) => {
    if (rsi > 70) return '#EF4444'; // Overbought - Red
    if (rsi < 30) return '#10B981'; // Oversold - Green
    return '#F59E0B'; // Neutral - Yellow
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return '#10B981';
      case 'SELL': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Technical Indicators</Text>
      
      <View style={styles.indicatorGrid}>
        {/* RSI */}
        <View style={styles.indicatorCard}>
          <LinearGradient colors={['#1F2937', '#374151']} style={styles.cardGradient}>
            <View style={styles.indicatorHeader}>
              <Text style={styles.indicatorName}>RSI</Text>
              <Ionicons name="pulse" size={20} color={getRSIColor(indicators.rsi)} />
            </View>
            <Text style={[styles.indicatorValue, { color: getRSIColor(indicators.rsi) }]}>
              {indicators.rsi.toFixed(1)}
            </Text>
            <Text style={styles.indicatorStatus}>
              {indicators.rsi > 70 ? 'Overbought' : indicators.rsi < 30 ? 'Oversold' : 'Neutral'}
            </Text>
          </LinearGradient>
        </View>

        {/* MACD */}
        <View style={styles.indicatorCard}>
          <LinearGradient colors={['#1F2937', '#374151']} style={styles.cardGradient}>
            <View style={styles.indicatorHeader}>
              <Text style={styles.indicatorName}>MACD</Text>
              <Ionicons name="trending-up" size={20} color={getSignalColor(indicators.macd.signal)} />
            </View>
            <Text style={[styles.indicatorValue, { color: getSignalColor(indicators.macd.signal) }]}>
              {indicators.macd.value.toFixed(1)}
            </Text>
            <Text style={styles.indicatorStatus}>{indicators.macd.signal}</Text>
          </LinearGradient>
        </View>

        {/* Bollinger Bands */}
        <View style={styles.indicatorCard}>
          <LinearGradient colors={['#1F2937', '#374151']} style={styles.cardGradient}>
            <View style={styles.indicatorHeader}>
              <Text style={styles.indicatorName}>Bollinger</Text>
              <Ionicons name="analytics" size={20} color="#8B5CF6" />
            </View>
            <Text style={[styles.indicatorValue, { color: '#8B5CF6' }]}>
              {indicators.bb.position}
            </Text>
            <Text style={styles.indicatorStatus}>{indicators.bb.strength}</Text>
          </LinearGradient>
        </View>

        {/* Volume */}
        <View style={styles.indicatorCard}>
          <LinearGradient colors={['#1F2937', '#374151']} style={styles.cardGradient}>
            <View style={styles.indicatorHeader}>
              <Text style={styles.indicatorName}>Volume</Text>
              <Ionicons name="bar-chart" size={20} color="#3B82F6" />
            </View>
            <Text style={[styles.indicatorValue, { color: '#3B82F6' }]}>
              {indicators.volume.value}
            </Text>
            <Text style={styles.indicatorStatus}>{indicators.volume.trend}</Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  indicatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  indicatorCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  indicatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  indicatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  indicatorValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  indicatorStatus: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});