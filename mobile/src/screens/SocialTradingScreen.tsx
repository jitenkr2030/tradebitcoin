import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface TradingPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    verified: boolean;
    followers: number;
  };
  content: string;
  trade?: {
    type: 'BUY' | 'SELL';
    symbol: string;
    price: number;
    amount: number;
  };
  timestamp: string;
  likes: number;
  comments: number;
  liked: boolean;
}

export default function SocialTradingScreen() {
  const [posts, setPosts] = useState<TradingPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [activeTab, setActiveTab] = useState<'feed' | 'competitions'>('feed');

  useEffect(() => {
    fetchSocialFeed();
  }, []);

  const fetchSocialFeed = async () => {
    const mockPosts: TradingPost[] = [
      {
        id: '1',
        author: {
          name: 'CryptoKing',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face',
          verified: true,
          followers: 12500
        },
        content: 'Bitcoin showing strong support at $67K. This could be the perfect entry point for a swing trade! 🚀',
        trade: {
          type: 'BUY',
          symbol: 'BTC/USDT',
          price: 67500,
          amount: 0.5
        },
        timestamp: '2h ago',
        likes: 245,
        comments: 38,
        liked: false
      },
      {
        id: '2',
        author: {
          name: 'AITrader',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face',
          verified: true,
          followers: 8900
        },
        content: 'ETH looking bullish above $3200. Layer 2 adoption is driving the fundamentals higher! 📈',
        timestamp: '4h ago',
        likes: 189,
        comments: 25,
        liked: true
      }
    ];
    setPosts(mockPosts);
  };

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleCopyTrade = (trade: any) => {
    Alert.alert(
      'Copy Trade',
      `Copy ${trade.type} ${trade.amount} ${trade.symbol} at $${trade.price.toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Copy Trade', 
          onPress: () => Alert.alert('Success', 'Trade copied successfully!')
        }
      ]
    );
  };

  const submitPost = () => {
    if (!newPost.trim()) return;
    
    const post: TradingPost = {
      id: Date.now().toString(),
      author: {
        name: 'You',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop&crop=face',
        verified: false,
        followers: 0
      },
      content: newPost,
      timestamp: 'now',
      likes: 0,
      comments: 0,
      liked: false
    };

    setPosts(prev => [post, ...prev]);
    setNewPost('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#111827', '#1F2937']} style={styles.header}>
        <Text style={styles.title}>Social Trading</Text>
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
            onPress={() => setActiveTab('feed')}
          >
            <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
              Feed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'competitions' && styles.activeTab]}
            onPress={() => setActiveTab('competitions')}
          >
            <Text style={[styles.tabText, activeTab === 'competitions' && styles.activeTabText]}>
              Competitions
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {activeTab === 'feed' && (
        <ScrollView style={styles.content}>
          {/* Create Post */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.createPost}>
            <LinearGradient colors={['#1F2937', '#374151']} style={styles.createPostGradient}>
              <TextInput
                style={styles.postInput}
                value={newPost}
                onChangeText={setNewPost}
                placeholder="Share your trading insights..."
                placeholderTextColor="#6B7280"
                multiline
                maxLength={280}
              />
              <View style={styles.postActions}>
                <TouchableOpacity style={styles.addTradeButton}>
                  <Ionicons name="trending-up" size={16} color="#3B82F6" />
                  <Text style={styles.addTradeText}>Add Trade</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.postButton}
                  onPress={submitPost}
                  disabled={!newPost.trim()}
                >
                  <Text style={styles.postButtonText}>Post</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Posts Feed */}
          {posts.map((post, index) => (
            <Animated.View 
              key={post.id} 
              entering={FadeInUp.delay(200 + index * 100)} 
              style={styles.postCard}
            >
              <LinearGradient colors={['#1F2937', '#374151']} style={styles.postGradient}>
                {/* Post Header */}
                <View style={styles.postHeader}>
                  <View style={styles.authorInfo}>
                    <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
                    <View>
                      <View style={styles.authorName}>
                        <Text style={styles.nameText}>{post.author.name}</Text>
                        {post.author.verified && (
                          <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
                        )}
                      </View>
                      <Text style={styles.authorStats}>
                        {post.author.followers.toLocaleString()} followers • {post.timestamp}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Post Content */}
                <Text style={styles.postContent}>{post.content}</Text>

                {/* Trade Details */}
                {post.trade && (
                  <View style={styles.tradeDetails}>
                    <View style={styles.tradeHeader}>
                      <View style={styles.tradeInfo}>
                        <View style={[
                          styles.tradeType,
                          { backgroundColor: post.trade.type === 'BUY' ? '#10B981' : '#EF4444' }
                        ]}>
                          <Text style={styles.tradeTypeText}>{post.trade.type}</Text>
                        </View>
                        <Text style={styles.tradeSymbol}>{post.trade.symbol}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.copyTradeButton}
                        onPress={() => handleCopyTrade(post.trade)}
                      >
                        <Text style={styles.copyTradeText}>Copy Trade</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.tradeMetrics}>
                      <Text style={styles.tradePrice}>
                        ${post.trade.price.toLocaleString()}
                      </Text>
                      <Text style={styles.tradeAmount}>
                        {post.trade.amount} {post.trade.symbol.split('/')[0]}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Post Actions */}
                <View style={styles.postActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleLike(post.id)}
                  >
                    <Ionicons 
                      name={post.liked ? 'heart' : 'heart-outline'} 
                      size={20} 
                      color={post.liked ? '#EF4444' : '#9CA3AF'} 
                    />
                    <Text style={styles.actionText}>{post.likes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="chatbubble-outline" size={20} color="#9CA3AF" />
                    <Text style={styles.actionText}>{post.comments}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="share-outline" size={20} color="#9CA3AF" />
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          ))}
        </ScrollView>
      )}

      {activeTab === 'competitions' && (
        <ScrollView style={styles.content}>
          <Animated.View entering={FadeInUp.delay(100)} style={styles.competitionCard}>
            <LinearGradient colors={['#1F2937', '#374151']} style={styles.competitionGradient}>
              <View style={styles.competitionHeader}>
                <View>
                  <Text style={styles.competitionTitle}>Bitcoin Bull Run Challenge</Text>
                  <Text style={styles.competitionDescription}>
                    Trade Bitcoin and compete for highest returns in 30 days
                  </Text>
                </View>
                <View style={styles.prizeContainer}>
                  <Text style={styles.prizeAmount}>₹1,00,000</Text>
                  <Text style={styles.prizeLabel}>Prize Pool</Text>
                </View>
              </View>

              <View style={styles.competitionStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>1,250</Text>
                  <Text style={styles.statLabel}>Participants</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>15 days</Text>
                  <Text style={styles.statLabel}>Remaining</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>45.8%</Text>
                  <Text style={styles.statLabel}>Top Return</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.joinButton}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.joinGradient}>
                  <Text style={styles.joinText}>Join Competition</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      )}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  createPost: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  createPostGradient: {
    padding: 16,
  },
  postInput: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addTradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addTradeText: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 4,
    fontWeight: '600',
  },
  postButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  postCard: {
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
  },
  postGradient: {
    padding: 16,
  },
  postHeader: {
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorName: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 6,
  },
  authorStats: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  postContent: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 20,
    marginBottom: 12,
  },
  tradeDetails: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tradeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tradeType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  tradeTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tradeSymbol: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  copyTradeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  copyTradeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tradeMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tradePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tradeAmount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  competitionCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  competitionGradient: {
    padding: 20,
  },
  competitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  competitionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  competitionDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    maxWidth: '70%',
  },
  prizeContainer: {
    alignItems: 'center',
  },
  prizeAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  prizeLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  competitionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  joinButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  joinGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});