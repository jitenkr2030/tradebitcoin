import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

import { useTrading } from '../contexts/TradingContext';
import { useAuth } from '../contexts/AuthContext';
import PriceCard from '../components/PriceCard';
import TradingControls from '../components/TradingControls';
import PortfolioSummary from '../components/PortfolioSummary';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const { marketData, isTrading, loading, fetchMarketData } = useTrading();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMarketData();
    setRefreshing(false);
  };

  const chartData = {
    labels: ['1h', '6h', '12h', '1d', '7d', '30d'],
    datasets: [
      {
        data: [65000, 66500, 67200, 67523, 68000, 69500],
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#1F2937',
    backgroundGradientFrom: '#1F2937',
    backgroundGradientTo: '#374151',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3B82F6',
    },
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Trader'}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications" size={24} color="#3B82F6" />
          <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Trading Status */}
      <Animated.View entering={FadeInUp.delay(200)} style={styles.tradingStatus}>
        <LinearGradient
          colors={isTrading ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626']}
          style={styles.statusGradient}
        >
          <View style={styles.statusContent}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: '#FFFFFF' }]} />
              <Text style={styles.statusText}>
                {isTrading ? 'AI Trading Active' : 'Trading Paused'}
              </Text>
            </View>
            <Ionicons 
              name={isTrading ? 'play-circle' : 'pause-circle'} 
              size={30} 
              color="#FFFFFF" 
            />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Price Cards */}
      <Animated.View entering={FadeInUp.delay(300)} style={styles.priceSection}>
        <Text style={styles.sectionTitle}>Market Overview</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <PriceCard
            symbol="BTC/USD"
            price={67523}
            change={1.25}
            icon="logo-bitcoin"
            color="#F59E0B"
          />
          <PriceCard
            symbol="ETH/USD"
            price={3215}
            change={-0.87}
            icon="diamond"
            color="#627EEA"
          />
          <PriceCard
            symbol="BNB/USD"
            price={542}
            change={2.26}
            icon="triangle"
            color="#F3BA2F"
          />
        </ScrollView>
      </Animated.View>

      {/* Portfolio Summary */}
      <Animated.View entering={FadeInUp.delay(400)}>
        <PortfolioSummary navigation={navigation} />
      </Animated.View>

      {/* Price Chart */}
      <Animated.View entering={FadeInUp.delay(500)} style={styles.chartSection}>
        <Text style={styles.sectionTitle}>BTC Price Chart</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      </Animated.View>

      {/* Trading Controls */}
      <Animated.View entering={FadeInUp.delay(600)}>
        <TradingControls />
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View entering={FadeInDown.delay(700)} style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AI Advisor')}
          >
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.actionGradient}>
              <Ionicons name="brain" size={30} color="#FFFFFF" />
              <Text style={styles.actionText}>AI Advisor</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('TaxAssistant')}
          >
            <LinearGradient colors={['#10B981', '#059669']} style={styles.actionGradient}>
              <Ionicons name="calculator" size={30} color="#FFFFFF" />
              <Text style={styles.actionText}>Tax Assistant</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('DeFi')}
          >
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.actionGradient}>
              <Ionicons name="layers" size={30} color="#FFFFFF" />
              <Text style={styles.actionText}>DeFi</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Education')}
          >
            <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.actionGradient}>
              <Ionicons name="book" size={30} color="#FFFFFF" />
              <Text style={styles.actionText}>Learn</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingIcon: {
    position: 'absolute',
    opacity: 0.1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tradingStatus: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statusGradient: {
    padding: 20,
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  priceSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  chartSection: {
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  chart: {
    borderRadius: 16,
  },
  quickActions: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  actionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
});