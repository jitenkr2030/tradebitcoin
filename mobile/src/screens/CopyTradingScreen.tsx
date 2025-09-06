import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface Trader {
  id: string;
  name: string;
  totalFollowers: number;
  totalProfit: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  verifiedTrader: boolean;
  subscriptionFee: number;
  performanceFee: number;
}

export default function CopyTradingScreen() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [allocationPercent, setAllocationPercent] = useState('10');
  const [maxRisk, setMaxRisk] = useState('5');

  useEffect(() => {
    fetchTopTraders();
    fetchFollowing();
  }, []);

  const fetchTopTraders = async () => {
    const mockTraders: Trader[] = [
      {
        id: '1',
        name: 'CryptoKing',
        totalFollowers: 1250,
        totalProfit: 45.8,
        winRate: 78.5,
        maxDrawdown: 8.2,
        sharpeRatio: 2.4,
        verifiedTrader: true,
        subscriptionFee: 2,
        performanceFee: 15
      },
      {
        id: '2',
        name: 'AITrader',
        totalFollowers: 890,
        totalProfit: 32.1,
        winRate: 72.3,
        maxDrawdown: 12.1,
        sharpeRatio: 1.8,
        verifiedTrader: true,
        subscriptionFee: 1.5,
        performanceFee: 12
      }
    ];
    setTraders(mockTraders);
  };

  const fetchFollowing = async () => {
    setFollowing(['1']); // Mock following data
  };

  const handleFollowTrader = async () => {
    if (!selectedTrader) return;
    
    try {
      // API call to follow trader
      setFollowing(prev => [...prev, selectedTrader.id]);
      setModalVisible(false);
      Alert.alert('Success', `Now following ${selectedTrader.name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to follow trader');
    }
  };

  const getRiskColor = (drawdown: number) => {
    if (drawdown <= 5) return '#10B981';
    if (drawdown <= 15) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <Text style={styles.title}>Copy Trading</Text>
          <Text style={styles.subtitle}>Follow expert traders and copy their strategies</Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{following.length}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>+12.5%</Text>
            <Text style={styles.statLabel}>Avg Return</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{traders.length}</Text>
            <Text style={styles.statLabel}>Top Traders</Text>
          </View>
        </Animated.View>

        {/* Traders List */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.tradersSection}>
          <Text style={styles.sectionTitle}>Top Performers</Text>
          {traders.map((trader, index) => (
            <TouchableOpacity
              key={trader.id}
              style={styles.traderCard}
              onPress={() => {
                setSelectedTrader(trader);
                setModalVisible(true);
              }}
            >
              <LinearGradient colors={['#1F2937', '#374151']} style={styles.cardGradient}>
                <View style={styles.traderHeader}>
                  <View style={styles.traderInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {trader.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <View style={styles.nameContainer}>
                        <Text style={styles.traderName}>{trader.name}</Text>
                        {trader.verifiedTrader && (
                          <Ionicons name="shield-checkmark" size={16} color="#3B82F6" />
                        )}
                      </View>
                      <Text style={styles.followers}>{trader.totalFollowers} followers</Text>
                    </View>
                  </View>
                  {following.includes(trader.id) && (
                    <View style={styles.followingBadge}>
                      <Text style={styles.followingText}>Following</Text>
                    </View>
                  )}
                </View>

                <View style={styles.metricsGrid}>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Profit</Text>
                    <Text style={[styles.metricValue, { color: '#10B981' }]}>
                      +{trader.totalProfit.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Win Rate</Text>
                    <Text style={styles.metricValue}>{trader.winRate.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Drawdown</Text>
                    <Text style={[styles.metricValue, { color: getRiskColor(trader.maxDrawdown) }]}>
                      {trader.maxDrawdown.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Sharpe</Text>
                    <Text style={styles.metricValue}>{trader.sharpeRatio.toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.feeInfo}>
                  <Text style={styles.feeText}>
                    Fee: {trader.subscriptionFee}% + {trader.performanceFee}% profit
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Follow Trader Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Follow {selectedTrader?.name}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Portfolio Allocation (%)</Text>
                <TextInput
                  style={styles.input}
                  value={allocationPercent}
                  onChangeText={setAllocationPercent}
                  keyboardType="numeric"
                  placeholder="10"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Max Risk Per Trade (%)</Text>
                <TextInput
                  style={styles.input}
                  value={maxRisk}
                  onChangeText={setMaxRisk}
                  keyboardType="numeric"
                  placeholder="5"
                />
              </View>

              <View style={styles.termsContainer}>
                <Text style={styles.termsTitle}>Terms:</Text>
                <Text style={styles.termsText}>
                  • Subscription: {selectedTrader?.subscriptionFee}% monthly{'\n'}
                  • Performance: {selectedTrader?.performanceFee}% of profits{'\n'}
                  • Minimum period: 7 days{'\n'}
                  • Stop anytime
                </Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.followButton}
                onPress={handleFollowTrader}
              >
                <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.followGradient}>
                  <Text style={styles.followButtonText}>Start Copying</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 15,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  tradersSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  traderCard: {
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  traderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  traderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  traderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 6,
  },
  followers: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  followingBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  followingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  feeInfo: {
    alignItems: 'center',
  },
  feeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalBody: {
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
  },
  termsContainer: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  followButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  followGradient: {
    padding: 12,
    alignItems: 'center',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});