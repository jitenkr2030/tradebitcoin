import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTrading } from '../contexts/TradingContext';

export default function TradingControls() {
  const { executeTrade, isTrading, startTrading, stopTrading } = useTrading();
  const [amount, setAmount] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');

  const handleTrade = async (type: 'BUY' | 'SELL') => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await executeTrade(type, selectedSymbol, parseFloat(amount));
      setAmount('');
      Alert.alert('Success', `${type} order executed successfully`);
    } catch (error) {
      Alert.alert('Error', 'Trade execution failed');
    }
  };

  const toggleTrading = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (isTrading) {
      stopTrading();
    } else {
      startTrading();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trading Controls</Text>
      
      {/* Auto Trading Toggle */}
      <TouchableOpacity style={styles.toggleContainer} onPress={toggleTrading}>
        <LinearGradient
          colors={isTrading ? ['#10B981', '#059669'] : ['#6B7280', '#4B5563']}
          style={styles.toggleGradient}
        >
          <View style={styles.toggleContent}>
            <View>
              <Text style={styles.toggleTitle}>Auto Trading</Text>
              <Text style={styles.toggleSubtitle}>
                {isTrading ? 'AI bot is active' : 'AI bot is paused'}
              </Text>
            </View>
            <Ionicons 
              name={isTrading ? 'toggle' : 'toggle-outline'} 
              size={32} 
              color="#FFFFFF" 
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Manual Trading */}
      <View style={styles.manualTrading}>
        <Text style={styles.subtitle}>Manual Trading</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Amount ({selectedSymbol.split('/')[0]})</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.001"
            placeholderTextColor="#6B7280"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.tradeButtons}>
          <TouchableOpacity
            style={[styles.tradeButton, styles.buyButton]}
            onPress={() => handleTrade('BUY')}
          >
            <LinearGradient colors={['#10B981', '#059669']} style={styles.buttonGradient}>
              <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>BUY</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tradeButton, styles.sellButton]}
            onPress={() => handleTrade('SELL')}
          >
            <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.buttonGradient}>
              <Ionicons name="arrow-down" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>SELL</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  toggleContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  toggleGradient: {
    padding: 20,
  },
  toggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  toggleSubtitle: {
    fontSize: 14,
    color: '#E5E7EB',
    marginTop: 2,
  },
  manualTrading: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  tradeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tradeButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buyButton: {},
  sellButton: {},
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});