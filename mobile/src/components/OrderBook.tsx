import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export default function OrderBook() {
  const bids: OrderBookEntry[] = [
    { price: 67520, amount: 0.5234, total: 35345.23 },
    { price: 67515, amount: 1.2456, total: 84123.45 },
    { price: 67510, amount: 0.8901, total: 60089.12 },
    { price: 67505, amount: 2.1234, total: 143234.56 },
    { price: 67500, amount: 0.6789, total: 45823.45 },
  ];

  const asks: OrderBookEntry[] = [
    { price: 67525, amount: 0.4567, total: 30834.12 },
    { price: 67530, amount: 1.1234, total: 75845.67 },
    { price: 67535, amount: 0.7890, total: 53289.45 },
    { price: 67540, amount: 1.5678, total: 105923.78 },
    { price: 67545, amount: 0.9012, total: 60876.34 },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Book</Text>
      
      <LinearGradient colors={['#1F2937', '#374151']} style={styles.orderBook}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Price (USDT)</Text>
          <Text style={styles.headerText}>Amount (BTC)</Text>
          <Text style={styles.headerText}>Total</Text>
        </View>

        {/* Asks (Sell Orders) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Asks</Text>
          {asks.reverse().map((ask, index) => (
            <View key={index} style={styles.orderRow}>
              <Text style={[styles.priceText, styles.askPrice]}>
                {ask.price.toLocaleString()}
              </Text>
              <Text style={styles.amountText}>{ask.amount.toFixed(4)}</Text>
              <Text style={styles.totalText}>{ask.total.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Spread */}
        <View style={styles.spread}>
          <Text style={styles.spreadText}>Spread: $5.00 (0.007%)</Text>
        </View>

        {/* Bids (Buy Orders) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bids</Text>
          {bids.map((bid, index) => (
            <View key={index} style={styles.orderRow}>
              <Text style={[styles.priceText, styles.bidPrice]}>
                {bid.price.toLocaleString()}
              </Text>
              <Text style={styles.amountText}>{bid.amount.toFixed(4)}</Text>
              <Text style={styles.totalText}>{bid.total.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
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
  orderBook: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#4B5563',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    flex: 1,
    textAlign: 'center',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  askPrice: {
    color: '#EF4444',
  },
  bidPrice: {
    color: '#10B981',
  },
  amountText: {
    fontSize: 12,
    color: '#E5E7EB',
    flex: 1,
    textAlign: 'center',
  },
  totalText: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
    textAlign: 'center',
  },
  spread: {
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#4B5563',
    marginVertical: 8,
  },
  spreadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
});