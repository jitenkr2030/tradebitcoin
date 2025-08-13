const express = require('express');
const Stripe = require('stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const db = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Initialize payment gateways
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Subscription plans
const PLANS = {
  PRO: {
    name: 'Pro Plan',
    price: 2999, // ₹29.99 in paise
    features: ['Advanced AI trading', 'Portfolio analytics', 'Tax reports'],
    stripe_price_id: 'price_pro_monthly',
    razorpay_plan_id: 'plan_pro_monthly'
  },
  ELITE: {
    name: 'Elite Plan',
    price: 9999, // ₹99.99 in paise
    features: ['Everything in Pro', 'DeFi integration', 'Priority support'],
    stripe_price_id: 'price_elite_monthly',
    razorpay_plan_id: 'plan_elite_monthly'
  }
};

// Create subscription (Razorpay)
router.post('/create-subscription', async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.userId;

    if (!PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected'
      });
    }

    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: PLANS[plan].price,
      currency: 'INR',
      receipt: `sub_${userId}_${Date.now()}`,
      notes: {
        user_id: userId,
        plan: plan
      }
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        plan: PLANS[plan]
      }
    });

  } catch (error) {
    logger.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    });
  }
});

// Verify payment (Razorpay)
router.post('/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan
    } = req.body;

    const userId = req.user.userId;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update user subscription
    const subscriptionExpiry = new Date();
    subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1);

    await db('users')
      .where({ id: userId })
      .update({
        subscription: plan,
        subscription_expires_at: subscriptionExpiry,
        updated_at: new Date()
      });

    // Log payment
    await db('payments').insert({
      user_id: userId,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      amount: PLANS[plan].price,
      currency: 'INR',
      status: 'completed',
      plan: plan,
      gateway: 'razorpay'
    });

    logger.info(`Subscription upgraded: User ${userId} to ${plan}`);

    res.json({
      success: true,
      message: 'Payment verified and subscription activated',
      data: {
        subscription: plan,
        expiresAt: subscriptionExpiry
      }
    });

  } catch (error) {
    logger.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

// Create Stripe checkout session
router.post('/create-stripe-session', async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.userId;

    if (!PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected'
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: PLANS[plan].stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        plan: plan
      }
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });

  } catch (error) {
    logger.error('Stripe session creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment session'
    });
  }
});

// Get subscription status
router.get('/subscription-status', async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await db('users')
      .select(['subscription', 'subscription_expires_at'])
      .where({ id: userId })
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isActive = user.subscription_expires_at && 
      new Date(user.subscription_expires_at) > new Date();

    res.json({
      success: true,
      data: {
        subscription: user.subscription,
        expiresAt: user.subscription_expires_at,
        isActive,
        features: PLANS[user.subscription]?.features || []
      }
    });

  } catch (error) {
    logger.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription status'
    });
  }
});

// Cancel subscription
router.post('/cancel-subscription', async (req, res) => {
  try {
    const userId = req.user.userId;

    await db('users')
      .where({ id: userId })
      .update({
        subscription: 'FREE',
        subscription_expires_at: null,
        updated_at: new Date()
      });

    logger.info(`Subscription cancelled: User ${userId}`);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

module.exports = router;