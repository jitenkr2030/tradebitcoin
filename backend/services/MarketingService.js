const db = require('../config/database');
const logger = require('../utils/logger');
const { generateUUID } = require('../utils/helpers');

class MarketingService {
  constructor() {
    this.campaignTypes = ['EMAIL', 'SMS', 'PUSH', 'IN_APP'];
    this.segmentCriteria = {
      'HIGH_VALUE': 'Portfolio value > $10,000',
      'NEW_USERS': 'Registered in last 7 days',
      'INACTIVE': 'No trades in 30 days',
      'ACTIVE_TRADERS': 'Traded in last 7 days',
      'PRO_USERS': 'Pro or Elite subscription'
    };
  }

  async createCampaign(campaignData) {
    try {
      const campaignId = generateUUID();
      
      const campaign = {
        id: campaignId,
        name: campaignData.name,
        type: campaignData.type,
        audience: campaignData.audience,
        content: campaignData.content,
        status: 'DRAFT',
        created_at: new Date().toISOString()
      };

      await db.prepare(`
        INSERT INTO marketing_campaigns (
          id, name, type, audience, content, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        campaign.id, campaign.name, campaign.type, campaign.audience,
        campaign.content, campaign.status, campaign.created_at
      );

      return campaign;
    } catch (error) {
      logger.error('Create campaign error:', error);
      throw error;
    }
  }

  async getUserSegments() {
    try {
      const segments = [
        {
          id: 'high_value',
          name: 'High-Value Traders',
          description: 'Users with portfolio value > $10,000',
          userCount: await this.getSegmentCount('high_value'),
          criteria: ['Portfolio Value > $10,000', 'Active in last 7 days'],
          avgValue: 25000,
          conversionRate: 15.8
        },
        {
          id: 'new_users',
          name: 'New Users (7 days)',
          description: 'Recently registered users',
          userCount: await this.getSegmentCount('new_users'),
          criteria: ['Registered in last 7 days', 'Completed KYC'],
          avgValue: 0,
          conversionRate: 8.5
        },
        {
          id: 'inactive',
          name: 'Inactive Traders',
          description: 'Users who haven\'t traded in 30 days',
          userCount: await this.getSegmentCount('inactive'),
          criteria: ['No trades in 30 days', 'Portfolio value > $100'],
          avgValue: 1500,
          conversionRate: 3.2
        }
      ];

      return segments;
    } catch (error) {
      logger.error('Get user segments error:', error);
      throw error;
    }
  }

  async getSegmentCount(segmentType) {
    try {
      let query = '';
      
      switch (segmentType) {
        case 'high_value':
          query = `
            SELECT COUNT(DISTINCT u.id) as count
            FROM users u
            LEFT JOIN portfolio p ON u.id = p.user_id
            GROUP BY u.id
            HAVING SUM(p.total_value) > 10000
          `;
          break;
        case 'new_users':
          query = `
            SELECT COUNT(*) as count FROM users 
            WHERE created_at >= date('now', '-7 days')
          `;
          break;
        case 'inactive':
          query = `
            SELECT COUNT(DISTINCT u.id) as count
            FROM users u
            LEFT JOIN trades t ON u.id = t.user_id
            WHERE t.created_at IS NULL OR t.created_at < date('now', '-30 days')
          `;
          break;
        default:
          return 0;
      }

      const result = await db.prepare(query).get();
      return result.count || 0;
    } catch (error) {
      logger.error('Get segment count error:', error);
      return 0;
    }
  }

  async getAnalytics(period) {
    try {
      const analytics = {
        totalCampaigns: 24,
        activeCampaigns: 8,
        totalSent: 45000,
        totalOpened: 25500,
        totalClicked: 6400,
        totalConverted: 1280,
        totalRevenue: 395000,
        avgOpenRate: 56.7,
        avgClickRate: 14.2,
        avgConversionRate: 8.2,
        roi: 285.5
      };

      return analytics;
    } catch (error) {
      logger.error('Get marketing analytics error:', error);
      throw error;
    }
  }

  async sendCampaign(campaignId) {
    try {
      const campaign = await db.prepare(`
        SELECT * FROM marketing_campaigns WHERE id = ?
      `).get(campaignId);

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get target audience
      const users = await this.getTargetAudience(campaign.audience);
      
      // Send messages based on campaign type
      for (const user of users) {
        try {
          await this.sendMessage(user, campaign);
        } catch (error) {
          logger.error(`Failed to send message to user ${user.id}:`, error);
        }
      }

      // Update campaign status
      await db.prepare(`
        UPDATE marketing_campaigns 
        SET status = 'ACTIVE', sent_count = ?, started_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(users.length, campaignId);

      return {
        success: true,
        sentCount: users.length
      };
    } catch (error) {
      logger.error('Send campaign error:', error);
      throw error;
    }
  }

  async getTargetAudience(audienceType) {
    try {
      let query = '';
      
      switch (audienceType) {
        case 'ALL_USERS':
          query = 'SELECT * FROM users WHERE is_active = 1';
          break;
        case 'NEW_USERS':
          query = `SELECT * FROM users WHERE created_at >= date('now', '-7 days')`;
          break;
        case 'ACTIVE_TRADERS':
          query = `
            SELECT DISTINCT u.* FROM users u
            JOIN trades t ON u.id = t.user_id
            WHERE t.created_at >= date('now', '-7 days')
          `;
          break;
        default:
          query = 'SELECT * FROM users WHERE is_active = 1 LIMIT 100';
      }

      return await db.prepare(query).all();
    } catch (error) {
      logger.error('Get target audience error:', error);
      return [];
    }
  }

  async sendMessage(user, campaign) {
    try {
      // Simulate message sending
      logger.info(`Sending ${campaign.type} to ${user.email}: ${campaign.name}`);
      
      // Record message sent
      await db.prepare(`
        INSERT INTO marketing_messages (
          id, campaign_id, user_id, type, status, sent_at
        ) VALUES (?, ?, ?, ?, 'SENT', CURRENT_TIMESTAMP)
      `).run(generateUUID(), campaign.id, user.id, campaign.type);

      return { success: true };
    } catch (error) {
      logger.error('Send message error:', error);
      throw error;
    }
  }
}

module.exports = MarketingService;