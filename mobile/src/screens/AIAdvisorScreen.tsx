import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

interface AIRecommendation {
  type: 'BUY' | 'SELL' | 'HOLD';
  asset: string;
  confidence: number;
  reasoning: string;
  targetPrice: number;
  stopLoss: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  message: string;
  timestamp: string;
}

export default function AIAdvisorScreen() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRecommendations();
    initializeChat();
  }, []);

  const fetchRecommendations = async () => {
    // Simulate AI recommendations
    const mockRecommendations: AIRecommendation[] = [
      {
        type: 'BUY',
        asset: 'BTC/USDT',
        confidence: 85,
        reasoning: 'Strong bullish momentum with RSI oversold and positive sentiment',
        targetPrice: 70000,
        stopLoss: 65000,
      },
      {
        type: 'HOLD',
        asset: 'ETH/USDT',
        confidence: 72,
        reasoning: 'Consolidation phase, wait for breakout confirmation',
        targetPrice: 3500,
        stopLoss: 3000,
      },
    ];
    setRecommendations(mockRecommendations);
  };

  const initializeChat = () => {
    const welcomeMessage: ChatMessage = {
      id: '1',
      role: 'ai',
      message: 'Hello! I\'m TradeBitco AI. Ask me anything about crypto trading, market analysis, or investment strategies!',
      timestamp: new Date().toISOString(),
    };
    setChatMessages([welcomeMessage]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      message: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        message: generateAIResponse(inputMessage),
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('price') || lowerMessage.includes('btc')) {
      return 'Bitcoin is currently trading at $67,523. Based on technical analysis, I see bullish momentum with RSI at 45 and MACD showing positive divergence. Consider a small position with stop-loss at $65,000.';
    }
    
    if (lowerMessage.includes('portfolio') || lowerMessage.includes('invest')) {
      return 'Your portfolio shows good diversification. I recommend maintaining 60% BTC, 25% ETH, and 15% altcoins. Consider rebalancing if any asset exceeds 70% allocation.';
    }
    
    return 'I can help you with market analysis, trading strategies, portfolio optimization, and risk management. What specific aspect would you like to discuss?';
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'BUY': return ['#10B981', '#059669'];
      case 'SELL': return ['#EF4444', '#DC2626'];
      case 'HOLD': return ['#F59E0B', '#D97706'];
      default: return ['#6B7280', '#4B5563'];
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        {/* AI Recommendations */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>AI Recommendations</Text>
          {recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationCard}>
              <LinearGradient
                colors={['#1F2937', '#374151']}
                style={styles.cardGradient}
              >
                <View style={styles.recommendationHeader}>
                  <View style={styles.recommendationInfo}>
                    <LinearGradient
                      colors={getRecommendationColor(rec.type)}
                      style={styles.typeBadge}
                    >
                      <Text style={styles.typeText}>{rec.type}</Text>
                    </LinearGradient>
                    <Text style={styles.assetText}>{rec.asset}</Text>
                  </View>
                  <View style={styles.confidenceContainer}>
                    <Text style={styles.confidenceText}>{rec.confidence}%</Text>
                    <Text style={styles.confidenceLabel}>Confidence</Text>
                  </View>
                </View>
                
                <Text style={styles.reasoning}>{rec.reasoning}</Text>
                
                <View style={styles.targets}>
                  <View style={styles.targetItem}>
                    <Ionicons name="flag" size={16} color="#10B981" />
                    <Text style={styles.targetLabel}>Target: ${rec.targetPrice.toLocaleString()}</Text>
                  </View>
                  <View style={styles.targetItem}>
                    <Ionicons name="shield" size={16} color="#EF4444" />
                    <Text style={styles.targetLabel}>Stop: ${rec.stopLoss.toLocaleString()}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          ))}
        </Animated.View>

        {/* AI Chat */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.chatSection}>
          <Text style={styles.sectionTitle}>Ask TradeBitco AI</Text>
          <View style={styles.chatContainer}>
            <ScrollView style={styles.chatMessages}>
              {chatMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageContainer,
                    msg.role === 'user' ? styles.userMessage : styles.aiMessage,
                  ]}
                >
                  <Text style={styles.messageText}>{msg.message}</Text>
                </View>
              ))}
              {isLoading && (
                <View style={[styles.messageContainer, styles.aiMessage]}>
                  <View style={styles.typingIndicator}>
                    <Text style={styles.messageText}>TradeBitco AI is thinking...</Text>
                    <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Chat Input */}
      <Animated.View entering={FadeInDown.delay(300)} style={styles.chatInput}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Ask about crypto, trading strategies..."
            placeholderTextColor="#6B7280"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
          >
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.sendGradient}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  recommendationsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  recommendationCard: {
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  assetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  confidenceContainer: {
    alignItems: 'center',
  },
  confidenceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reasoning: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 20,
    marginBottom: 12,
  },
  targets: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  targetItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  chatSection: {
    paddingHorizontal: 20,
    flex: 1,
  },
  chatContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    height: 300,
  },
  chatMessages: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#374151',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
  },
  messageText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatInput: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1F2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  sendGradient: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});