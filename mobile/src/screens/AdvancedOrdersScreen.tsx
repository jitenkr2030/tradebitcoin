import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function AdvancedOrdersScreen() {
  const [orderType, setOrderType] = useState<'OCO' | 'TWAP' | 'ICEBERG'>('OCO');
  const [formData, setFormData] = useState({
    amount: '',
    limitPrice: '',
    stopPrice: '',
    stopLimitPrice: '',
    duration: '60',
    intervalMinutes: '5',
    visibleAmount: ''
  });

  const handleSubmit = async () => {
    if (!formData.amount) {
      Alert.alert('Error', 'Please enter amount');
      return;
    }

    try {
      // API call to create advanced order
      Alert.alert('Success', `${orderType} order created successfully`);
      // Reset form
      setFormData({
        amount: '',
        limitPrice: '',
        stopPrice: '',
        stopLimitPrice: '',
        duration: '60',
        intervalMinutes: '5',
        visibleAmount: ''
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to create order');
    }
  };

  const orderTypes = [
    { type: 'OCO', label: 'One-Cancels-Other', icon: 'swap-horizontal' },
    { type: 'TWAP', label: 'Time-Weighted Avg', icon: 'time' },
    { type: 'ICEBERG', label: 'Iceberg Order', icon: 'layers' }
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
        <Text style={styles.title}>Advanced Orders</Text>
        <Text style={styles.subtitle}>Professional trading order types</Text>
      </Animated.View>

      {/* Order Type Selector */}
      <Animated.View entering={FadeInUp.delay(200)} style={styles.orderTypeSection}>
        <Text style={styles.sectionTitle}>Order Type</Text>
        <View style={styles.orderTypeGrid}>
          {orderTypes.map(({ type, label, icon }) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.orderTypeCard,
                orderType === type && styles.selectedOrderType
              ]}
              onPress={() => setOrderType(type as any)}
            >
              <Ionicons 
                name={icon as any} 
                size={24} 
                color={orderType === type ? '#3B82F6' : '#9CA3AF'} 
              />
              <Text style={[
                styles.orderTypeLabel,
                orderType === type && styles.selectedOrderTypeLabel
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Order Form */}
      <Animated.View entering={FadeInUp.delay(300)} style={styles.formSection}>
        <LinearGradient colors={['#1F2937', '#374151']} style={styles.formContainer}>
          <Text style={styles.formTitle}>Order Details</Text>
          
          {/* Common Fields */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount (BTC)</Text>
            <TextInput
              style={styles.input}
              value={formData.amount}
              onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
              placeholder="0.001"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />
          </View>

          {/* OCO Specific Fields */}
          {orderType === 'OCO' && (
            <View style={styles.ocoFields}>
              <View style={styles.inputRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Limit Price</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.limitPrice}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, limitPrice: text }))}
                    placeholder="67523"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Stop Price</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.stopPrice}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, stopPrice: text }))}
                    placeholder="64000"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Stop Limit Price</Text>
                <TextInput
                  style={styles.input}
                  value={formData.stopLimitPrice}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, stopLimitPrice: text }))}
                  placeholder="63000"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {/* TWAP Specific Fields */}
          {orderType === 'TWAP' && (
            <View style={styles.twapFields}>
              <View style={styles.inputRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Duration</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.duration}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
                      style={styles.picker}
                    >
                      <Picker.Item label="30 minutes" value="30" />
                      <Picker.Item label="1 hour" value="60" />
                      <Picker.Item label="2 hours" value="120" />
                      <Picker.Item label="4 hours" value="240" />
                    </Picker>
                  </View>
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Interval</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.intervalMinutes}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, intervalMinutes: value }))}
                      style={styles.picker}
                    >
                      <Picker.Item label="1 minute" value="1" />
                      <Picker.Item label="5 minutes" value="5" />
                      <Picker.Item label="15 minutes" value="15" />
                    </Picker>
                  </View>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.submitGradient}>
              <Text style={styles.submitText}>Create {orderType} Order</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  orderTypeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  orderTypeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderTypeCard: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOrderType: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6/10',
  },
  orderTypeLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  selectedOrderTypeLabel: {
    color: '#3B82F6',
  },
  formSection: {
    paddingHorizontal: 20,
  },
  formContainer: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  ocoFields: {
    marginBottom: 15,
  },
  twapFields: {
    marginBottom: 15,
  },
  pickerContainer: {
    backgroundColor: '#374151',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  picker: {
    color: '#FFFFFF',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  submitGradient: {
    padding: 16,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});