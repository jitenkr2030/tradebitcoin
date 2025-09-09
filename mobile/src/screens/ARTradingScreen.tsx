import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import { PanGestureHandler, PinchGestureHandler } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

interface CryptoNode {
  id: string;
  symbol: string;
  price: number;
  change: number;
  x: number;
  y: number;
  color: string;
}

export default function ARTradingScreen() {
  const [cryptoNodes, setCryptoNodes] = useState<CryptoNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<CryptoNode | null>(null);
  const [isVRMode, setIsVRMode] = useState(false);

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    initializeCryptoNodes();
    startAnimations();
  }, []);

  const initializeCryptoNodes = () => {
    const nodes: CryptoNode[] = [
      {
        id: '1',
        symbol: 'BTC',
        price: 67500,
        change: 2.45,
        x: width * 0.5,
        y: height * 0.3,
        color: '#F59E0B'
      },
      {
        id: '2',
        symbol: 'ETH',
        price: 3200,
        change: -1.23,
        x: width * 0.3,
        y: height * 0.4,
        color: '#627EEA'
      },
      {
        id: '3',
        symbol: 'BNB',
        price: 540,
        change: 3.67,
        x: width * 0.7,
        y: height * 0.5,
        color: '#F3BA2F'
      },
      {
        id: '4',
        symbol: 'ADA',
        price: 0.45,
        change: -0.89,
        x: width * 0.4,
        y: height * 0.6,
        color: '#0033AD'
      },
      {
        id: '5',
        symbol: 'DOT',
        price: 6.8,
        change: 1.56,
        x: width * 0.6,
        y: height * 0.35,
        color: '#E6007A'
      }
    ];
    setCryptoNodes(nodes);
  };

  const startAnimations = () => {
    // Continuous rotation for VR mode
    rotation.value = withRepeat(
      withTiming(360, { duration: 20000 }),
      -1,
      false
    );
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${isVRMode ? rotation.value : 0}deg` }
      ],
    };
  });

  const handleNodePress = (node: CryptoNode) => {
    setSelectedNode(node);
    scale.value = withSpring(1.2, {}, () => {
      scale.value = withSpring(1);
    });
  };

  const handleTrade = (type: 'BUY' | 'SELL') => {
    if (!selectedNode) return;
    
    Alert.alert(
      'Confirm Trade',
      `${type} ${selectedNode.symbol} at $${selectedNode.price.toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => {
            Alert.alert('Success', `${type} order placed for ${selectedNode.symbol}`);
            setSelectedNode(null);
          }
        }
      ]
    );
  };

  const toggleVRMode = () => {
    setIsVRMode(!isVRMode);
    if (!isVRMode) {
      scale.value = withSpring(0.8);
    } else {
      scale.value = withSpring(1);
    }
  };

  return (
    <View style={styles.container}>
      {/* AR/VR Header */}
      <LinearGradient colors={['#111827', '#1F2937']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="cube" size={24} color="#8B5CF6" />
            <Text style={styles.headerTitle}>AR Trading Floor</Text>
            {isVRMode && (
              <View style={styles.vrBadge}>
                <Text style={styles.vrText}>VR</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.vrToggle}
              onPress={toggleVRMode}
            >
              <Ionicons 
                name={isVRMode ? 'glasses' : 'glasses-outline'} 
                size={20} 
                color={isVRMode ? '#8B5CF6' : '#9CA3AF'} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* AR Trading Space */}
      <PanGestureHandler>
        <PinchGestureHandler>
          <Animated.View style={[styles.tradingSpace, animatedStyle]}>
            {/* Background Grid */}
            <View style={styles.backgroundGrid}>
              {Array.from({ length: 10 }).map((_, i) => (
                <View key={i} style={[styles.gridLine, { left: (i * width) / 10 }]} />
              ))}
              {Array.from({ length: 15 }).map((_, i) => (
                <View key={i} style={[styles.gridLineHorizontal, { top: (i * height) / 15 }]} />
              ))}
            </View>

            {/* Crypto Nodes */}
            {cryptoNodes.map((node) => (
              <TouchableOpacity
                key={node.id}
                style={[
                  styles.cryptoNode,
                  {
                    left: node.x - 40,
                    top: node.y - 40,
                    borderColor: node.color
                  }
                ]}
                onPress={() => handleNodePress(node)}
              >
                <LinearGradient
                  colors={[`${node.color}20`, `${node.color}40`]}
                  style={styles.nodeGradient}
                >
                  <Text style={[styles.nodeSymbol, { color: node.color }]}>
                    {node.symbol}
                  </Text>
                  <Text style={styles.nodePrice}>
                    ${node.price.toLocaleString()}
                  </Text>
                  <Text style={[
                    styles.nodeChange,
                    { color: node.change >= 0 ? '#10B981' : '#EF4444' }
                  ]}>
                    {node.change >= 0 ? '+' : ''}{node.change.toFixed(2)}%
                  </Text>
                </LinearGradient>

                {/* Floating Animation */}
                <Animated.View style={styles.floatingIndicator}>
                  <Ionicons 
                    name={node.change >= 0 ? 'trending-up' : 'trending-down'} 
                    size={16} 
                    color={node.change >= 0 ? '#10B981' : '#EF4444'} 
                  />
                </Animated.View>
              </TouchableOpacity>
            ))}

            {/* Connection Lines */}
            {cryptoNodes.map((node, index) => (
              cryptoNodes.slice(index + 1).map((otherNode) => (
                <View
                  key={`${node.id}-${otherNode.id}`}
                  style={[
                    styles.connectionLine,
                    {
                      left: node.x,
                      top: node.y,
                      width: Math.sqrt(
                        Math.pow(otherNode.x - node.x, 2) + 
                        Math.pow(otherNode.y - node.y, 2)
                      ),
                      transform: [{
                        rotate: `${Math.atan2(
                          otherNode.y - node.y,
                          otherNode.x - node.x
                        )}rad`
                      }]
                    }
                  ]}
                />
              ))
            ))}
          </Animated.View>
        </PinchGestureHandler>
      </PanGestureHandler>

      {/* Selected Node Details */}
      {selectedNode && (
        <View style={styles.nodeDetails}>
          <LinearGradient colors={['#1F2937', '#374151']} style={styles.detailsGradient}>
            <View style={styles.detailsHeader}>
              <View style={styles.detailsInfo}>
                <Text style={[styles.detailsSymbol, { color: selectedNode.color }]}>
                  {selectedNode.symbol}
                </Text>
                <Text style={styles.detailsPrice}>
                  ${selectedNode.price.toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedNode(null)}
              >
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.tradeButtons}>
              <TouchableOpacity
                style={styles.buyButton}
                onPress={() => handleTrade('BUY')}
              >
                <LinearGradient colors={['#10B981', '#059669']} style={styles.tradeButtonGradient}>
                  <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
                  <Text style={styles.tradeButtonText}>BUY</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sellButton}
                onPress={() => handleTrade('SELL')}
              >
                <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.tradeButtonGradient}>
                  <Ionicons name="arrow-down" size={20} color="#FFFFFF" />
                  <Text style={styles.tradeButtonText}>SELL</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* AR Controls */}
      <View style={styles.arControls}>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="refresh" size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="expand" size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="settings" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          {isVRMode 
            ? '🥽 VR Mode: Tilt device to navigate • Tap nodes to trade'
            : '👆 Tap nodes for details • Pinch to zoom • Drag to pan'
          }
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  vrBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  vrText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vrToggle: {
    padding: 8,
    backgroundColor: '#374151',
    borderRadius: 8,
    marginRight: 10,
  },
  settingsButton: {
    padding: 8,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  tradingSpace: {
    flex: 1,
    position: 'relative',
  },
  backgroundGrid: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: '#374151',
    opacity: 0.3,
  },
  gridLineHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#374151',
    opacity: 0.3,
  },
  cryptoNode: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    overflow: 'hidden',
  },
  nodeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  nodeSymbol: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  nodePrice: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  nodeChange: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  floatingIndicator: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 4,
  },
  connectionLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#4B5563',
    opacity: 0.5,
  },
  nodeDetails: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailsGradient: {
    padding: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailsInfo: {
    flex: 1,
  },
  detailsSymbol: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailsPrice: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  tradeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buyButton: {
    flex: 1,
    marginRight: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sellButton: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tradeButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  tradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  arControls: {
    position: 'absolute',
    top: 120,
    right: 20,
    flexDirection: 'column',
  },
  controlButton: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 25,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  instructions: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 12,
  },
  instructionText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});