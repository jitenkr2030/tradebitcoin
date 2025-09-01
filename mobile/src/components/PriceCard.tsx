import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface PriceCardProps {
  symbol: string;
  price: number;
  change: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function PriceCard({ symbol, price, change, icon, color }: PriceCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={['#1F2937', '#374151']}
          style={styles.card}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={styles.symbol}>{symbol}</Text>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${price.toLocaleString()}</Text>
            <View style={[styles.changeContainer, { backgroundColor: change >= 0 ? '#10B981' : '#EF4444' }]}>
              <Ionicons 
                name={change >= 0 ? 'trending-up' : 'trending-down'} 
                size={12} 
                color="#FFFFFF" 
              />
              <Text style={styles.change}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 15,
    marginLeft: 5,
  },
  card: {
    width: 160,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  symbol: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
});