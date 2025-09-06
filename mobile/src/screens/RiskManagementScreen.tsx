import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface RiskMetrics {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  totalValue: number;
  maxDrawdown: number;
  winRate: number;
  sharpeRatio: number;
}

export default function RiskManagementScreen() {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [riskLimits, setRiskLimits] = useState({
    maxDailyLoss: 5,
    maxPositionSize: 20,
    maxDrawdown: 10,
    stopLossPercent: 2
  });
  const [emergencyMode, setEmergencyMode] = useState(false);

  useEffect(() => {
    fetchRiskMetrics();
  }, []);

  const fetchRiskMetrics = async () => {
    // Mock risk metrics
    const mockMetrics: RiskMetrics = {
      riskScore: 65,
      riskLevel: 'MEDIUM',
      totalValue: 125000,
      maxDrawdown: 8.5,
      winRate: 72.3,
      sharpeRatio: 1.8
    };
    setRiskMetrics(mockMetrics);
  };

  const handleEmergencyStop = async () => {
    Alert.alert(
      'Emergency Stop',
      'This will stop all trading activities immediately. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop All Trading',
          style: 'destructive',
          onPress: () => {
            setEmergencyMode(true);
            setTimeout(() => setEmergencyMode(false), 5000);
            Alert.alert('Success', 'All trading activities stopped');
          }
        }
      ]
    );
  };

  const updateRiskLimits = async () => {
    try {
      // API call to update risk limits
      Alert.alert('Success', 'Risk limits updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update risk limits');
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return '#10B981';
      case 'MEDIUM': return '#F59E0B';
      case 'HIGH': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (!riskMetrics) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading risk assessment...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Risk Overview */}
      <Animated.View entering={FadeInUp.delay(100)} style={styles.overviewSection}>
        <Text style={styles.sectionTitle}>Risk Overview</Text>
        
        <View style={styles.riskScoreCard}>
          <LinearGradient 
            colors={['#1F2937', '#374151']} 
            style={styles.scoreGradient}
          >
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreTitle}>Risk Score</Text>
              <TouchableOpacity
                style={[
                  styles.emergencyButton,
                  emergencyMode && styles.emergencyActive
                ]}
                onPress={handleEmergencyStop}
              >
                <Ionicons 
                  name={emergencyMode ? 'checkmark-circle' : 'stop-circle'} 
                  size={20} 
                  color="#FFFFFF" 
                />
                <Text style={styles.emergencyText}>
                  {emergencyMode ? 'Stopped' : 'Emergency Stop'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.scoreDisplay}>
              <Text style={[styles.scoreValue, { color: getRiskColor(riskMetrics.riskLevel) }]}>
                {riskMetrics.riskScore}/100
              </Text>
              <Text style={[styles.riskLevel, { color: getRiskColor(riskMetrics.riskLevel) }]}>
                {riskMetrics.riskLevel} RISK
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Portfolio Value</Text>
            <Text style={styles.metricValue}>
              ${riskMetrics.totalValue.toLocaleString()}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Max Drawdown</Text>
            <Text style={[styles.metricValue, { color: '#EF4444' }]}>
              {riskMetrics.maxDrawdown.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Win Rate</Text>
            <Text style={[styles.metricValue, { color: '#10B981' }]}>
              {riskMetrics.winRate.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Sharpe Ratio</Text>
            <Text style={styles.metricValue}>
              {riskMetrics.sharpeRatio.toFixed(2)}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Risk Limits */}
      <Animated.View entering={FadeInUp.delay(200)} style={styles.limitsSection}>
        <Text style={styles.sectionTitle}>Risk Limits</Text>
        
        <View style={styles.limitsContainer}>
          <LinearGradient colors={['#1F2937', '#374151']} style={styles.limitsGradient}>
            <View style={styles.sliderGroup}>
              <Text style={styles.sliderLabel}>
                Max Daily Loss: {riskLimits.maxDailyLoss}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={20}
                value={riskLimits.maxDailyLoss}
                onValueChange={(value) => setRiskLimits(prev => ({ 
                  ...prev, 
                  maxDailyLoss: Math.round(value) 
                }))}
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="#4B5563"
                thumbStyle={styles.sliderThumb}
              />
            </View>

            <View style={styles.sliderGroup}>
              <Text style={styles.sliderLabel}>
                Max Position Size: {riskLimits.maxPositionSize}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={50}
                value={riskLimits.maxPositionSize}
                onValueChange={(value) => setRiskLimits(prev => ({ 
                  ...prev, 
                  maxPositionSize: Math.round(value) 
                }))}
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="#4B5563"
                thumbStyle={styles.sliderThumb}
              />
            </View>

            <View style={styles.sliderGroup}>
              <Text style={styles.sliderLabel}>
                Max Drawdown: {riskLimits.maxDrawdown}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={2}
                maximumValue={30}
                value={riskLimits.maxDrawdown}
                onValueChange={(value) => setRiskLimits(prev => ({ 
                  ...prev, 
                  maxDrawdown: Math.round(value) 
                }))}
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="#4B5563"
                thumbStyle={styles.sliderThumb}
              />
            </View>

            <TouchableOpacity style={styles.updateButton} onPress={updateRiskLimits}>
              <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.updateGradient}>
                <Text style={styles.updateText}>Update Risk Limits</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  overviewSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  riskScoreCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  scoreGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  emergencyActive: {
    backgroundColor: '#10B981',
  },
  emergencyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  scoreDisplay: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  riskLevel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  limitsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  limitsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  limitsGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sliderGroup: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 10,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#3B82F6',
    width: 20,
    height: 20,
  },
  updateButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  updateGradient: {
    padding: 16,
    alignItems: 'center',
  },
  updateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});