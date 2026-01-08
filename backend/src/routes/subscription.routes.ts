import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = Router();

// Get all subscription plans
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const [plans] = await pool.execute<any[]>(
      `SELECT id, name, price, currency, billing_cycle, max_products, 
              trial_days, features, is_active
       FROM subscription_plans
       WHERE is_active = TRUE
       ORDER BY price ASC`,
    );

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans',
    });
  }
});

// Get current business subscription
router.get(
  '/current',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.businessId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const [subscriptions] = await pool.execute<any[]>(
        `SELECT bs.*, sp.name as plan_name, sp.price, sp.currency, 
                sp.max_products, sp.features
         FROM business_subscriptions bs
         JOIN subscription_plans sp ON bs.plan_id = sp.id
         WHERE bs.business_id = ?
         ORDER BY bs.created_at DESC
         LIMIT 1`,
        [req.user.businessId],
      );

      if (subscriptions.length === 0) {
        res.json({
          success: true,
          data: null,
        });
        return;
      }

      res.json({
        success: true,
        data: subscriptions[0],
      });
    } catch (error) {
      console.error('Get current subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscription',
      });
    }
  },
);

// Subscribe to a plan
router.post(
  '/subscribe',
  authenticateToken,
  requirePermission('manage_subscription'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.businessId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { planId, mobileNumber } = req.body;

      if (!planId || !mobileNumber) {
        res.status(400).json({
          success: false,
          message: 'Plan ID and mobile number are required',
        });
        return;
      }

      // Get plan details
      const [plans] = await pool.execute<any[]>(
        'SELECT * FROM subscription_plans WHERE id = ? AND is_active = TRUE',
        [planId],
      );

      if (plans.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Plan not found',
        });
        return;
      }

      const plan = plans[0];
      const now = new Date();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      // Create subscription
      const [result] = await pool.execute<any>(
        `INSERT INTO business_subscriptions 
         (business_id, plan_id, status, current_period_start, current_period_end)
         VALUES (?, ?, 'active', ?, ?)`,
        [req.user.businessId, planId, now, periodEnd],
      );

      const subscriptionId = result.insertId;

      // Create payment record
      await pool.execute(
        `INSERT INTO subscription_payments 
         (business_id, subscription_id, plan_id, amount, currency, 
          payment_method, mobile_number, status)
         VALUES (?, ?, ?, ?, ?, 'mobile_money', ?, 'pending')`,
        [
          req.user.businessId,
          subscriptionId,
          planId,
          plan.price,
          plan.currency,
          mobileNumber,
        ],
      );

      res.json({
        success: true,
        message: `Please send UGX ${plan.price.toLocaleString()} to ${mobileNumber} and enter transaction reference`,
        data: {
          subscriptionId,
          amount: plan.price,
          currency: plan.currency,
          mobileNumber,
        },
      });
    } catch (error) {
      console.error('Subscribe error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create subscription',
      });
    }
  },
);

// Confirm payment
router.post(
  '/confirm-payment',
  authenticateToken,
  requirePermission('manage_subscription'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.businessId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { subscriptionId, transactionReference } = req.body;

      if (!subscriptionId || !transactionReference) {
        res.status(400).json({
          success: false,
          message: 'Subscription ID and transaction reference are required',
        });
        return;
      }

      // Update payment record
      await pool.execute(
        `UPDATE subscription_payments 
         SET status = 'completed', 
             transaction_reference = ?,
             payment_date = NOW()
         WHERE subscription_id = ? AND business_id = ?`,
        [transactionReference, subscriptionId, req.user.businessId],
      );

      // Update subscription status
      await pool.execute(
        `UPDATE business_subscriptions 
         SET status = 'active'
         WHERE id = ? AND business_id = ?`,
        [subscriptionId, req.user.businessId],
      );

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
      });
    } catch (error) {
      console.error('Confirm payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to confirm payment',
      });
    }
  },
);

// Get subscription history
router.get(
  '/history',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.businessId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const [payments] = await pool.execute<any[]>(
        `SELECT sp.*, spl.name as plan_name
         FROM subscription_payments sp
         JOIN subscription_plans spl ON sp.plan_id = spl.id
         WHERE sp.business_id = ?
         ORDER BY sp.created_at DESC`,
        [req.user.businessId],
      );

      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      console.error('Get subscription history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscription history',
      });
    }
  },
);

// Check product limit
router.get(
  '/check-limit',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.businessId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Get current subscription
      const [subscriptions] = await pool.execute<any[]>(
        `SELECT bs.*, sp.max_products
         FROM business_subscriptions bs
         JOIN subscription_plans sp ON bs.plan_id = sp.id
         WHERE bs.business_id = ? AND bs.status IN ('trial', 'active')
         ORDER BY bs.created_at DESC
         LIMIT 1`,
        [req.user.businessId],
      );

      if (subscriptions.length === 0) {
        res.json({
          success: true,
          data: {
            hasActiveSubscription: false,
            maxProducts: 0,
            currentProducts: 0,
            canAddMore: false,
          },
        });
        return;
      }

      const subscription = subscriptions[0];

      // Get current product count
      const [productCount] = await pool.execute<any[]>(
        'SELECT COUNT(*) as count FROM products WHERE business_id = ?',
        [req.user.businessId],
      );

      const currentProducts = productCount[0].count;
      const maxProducts = subscription.max_products;

      res.json({
        success: true,
        data: {
          hasActiveSubscription: true,
          maxProducts,
          currentProducts,
          canAddMore: currentProducts < maxProducts,
          remaining: maxProducts - currentProducts,
        },
      });
    } catch (error) {
      console.error('Check limit error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check product limit',
      });
    }
  },
);

export default router;
