import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, CandlestickChart } from 'react-native-chart-kit';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTrading } from '../contexts/TradingContext';
import TechnicalIndicators from '../components/TechnicalIndicators';
import OrderBook from '../components/OrderBook';

const { width } = Dimensions.get('window');

export default function TradingScreen() {
  const { executeTrade, marketData } = useTrading();
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('MARKET');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [chartType, setChartType] = useState<'LINE' | 'CANDLE'>('LINE');

  const chartData = {
    labels: ['9AM', '12PM', '3PM', '6PM', '9PM', 'Now'],
    datasets: [
      {
        data: [65000, 66500, 67200, 67523, 68000, 67800],
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
    style: { borderRadius: 16 },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#3B82F6',
    },
  };

  const handleTrade = async (type: 'BUY' | 'SELL') => {
    if (!amount) {
      Alert.alert('Error', 'Please enter amount');
      return;
    }

    try {
      await executeTrade(type, selectedPair, parseFloat(amount));
      setAmount('');
      Alert.alert('Success', `${type} order placed successfully`);
    } catch (error) {
      Alert.alert('Error', 'Trade execution failed');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Trading Pair Selector */}
      <Animated.View entering={FadeInUp.delay(100)} style={styles.pairSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT'].map((pair) => (
            <TouchableOpacity
              key={pair}
              style={[
                styles.pairButton,
                selectedPair === pair && styles.selectedPair,
              ]}
              onPress={() => setSelectedPair(pair)}
            >
              <Text style={[
                styles.pairText,
                selectedPair === pair && styles.selectedPairText,
              ]}>
                {pair}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Current Price */}
      <Animated.View entering={FadeInUp.delay(200)} style={styles.priceSection}>
        <LinearGradient colors={['#1F2937', '#374151']} style={styles.priceCard}>
          <View style={styles.priceHeader}>
            <Text style={styles.pairTitle}>{selectedPair}</Text>
            <View style={styles.chartTypeToggle}>
              <TouchableOpacity
                style={[styles.toggleButton, chartType === 'LINE' && styles.activeToggle]}
                onPress={() => setChartType('LINE')}
              >
                <Text style={styles.toggleText}>Line</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, chartType === 'CANDLE' && styles.activeToggle]}
                onPress={() => setChartType('CANDLE')}
              >
                <Text style={styles.toggleText}>Candle</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.priceInfo}>
            <Text style={styles.currentPrice}>$67,523.45</Text>
            <View style={styles.priceChange}>
              <Ionicons name="trending-up" size={16} color="#10B981" />
              <Text style={styles.changeText}>+1.25% (+$845)</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Chart */}
      <Animated.View entering={FadeInUp.delay(300)} style={styles.chartSection}>
        <LineChart
          data={chartData}
          width={width - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </Animated.View>

      {/* Technical Indicators */}
      <Animated.View entering={FadeInUp.delay(400)}>
        <TechnicalIndicators />
      </Animated.View>

      {/* Order Form */}
      <Animated.View entering={FadeInUp.delay(500)} style={styles.orderForm}>
        <Text style={styles.sectionTitle}>Place Order</Text>
        
        {/* Order Type Selector */}
        <View style={styles.orderTypeSelector}>
          {['MARKET', 'LIMIT', 'STOP'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.orderTypeButton,
                orderType === type && styles.selectedOrderType,
              ]}
              onPress={() => setOrderType(type as any)}
            >
              <Text style={[
                styles.orderTypeText,
                orderType === type && styles.selectedOrderTypeText,
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input Fields */}
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.orderInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.001"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />
          </View>
          
          {orderType !== 'MARKET' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price</Text>
              <TextInput
                style={styles.orderInput}
                value={price}
                onChangeText={setPrice}
                placeholder="67523"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
              />
            </View>
          )}
        </View>

        {/* Trade Buttons */}
        <View style={styles.orderButtons}>
          <TouchableOpacity
            style={styles.orderButton}
            onPress={() => handleTrade('BUY')}
          >
            <LinearGradient colors={['#10B981', '#059669']} style={styles.orderButtonGradient}>
              <Text style={styles.orderButtonText}>BUY {selectedPair.split('/')[0]}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.orderButton}
            onPress={() => handleTrade('SELL')}
          >
            <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.orderButtonGradient}>
              <Text style={styles.orderButtonText}>SELL {selectedPair.split('/')[0]}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Order Book */}
      <Animated.View entering={FadeInUp.delay(600)}>
        <OrderBook />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  pairSelector: {
    paddingVertical: 15,
    paddingLeft: 20,
  },
  pairButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#374151',
  },
  selectedPair: {
    backgroundColor: '#3B82F6',
  },
  pairText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  selectedPairText: {
    color: '#FFFFFF',
  },
  priceSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  priceCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  pairTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chartTypeToggle: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: '#3B82F6',
  },
  toggleText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  chartSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  chart: {
    borderRadius: 16,
  },
  orderForm: {
    marginHorizontal: 20,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  orderTypeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  orderTypeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#374151',
    marginHorizontal: 2,
    borderRadius: 8,
  },
  selectedOrderType: {
    backgroundColor: '#3B82F6',
  },
  orderTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  selectedOrderTypeText: {
    color: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  inputLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  orderInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  orderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  orderButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  orderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});