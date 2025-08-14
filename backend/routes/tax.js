const express = require('express');
const { body, validationResult } = require('express-validator');

const db = require('../config/database');
const TaxService = require('../services/TaxService');
const logger = require('../utils/logger');

const router = express.Router();
const taxService = new TaxService();

// Calculate tax for a specific year
router.get('/calculate', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year = new Date().getFullYear() } = req.query;

    const taxCalculation = await taxService.calculateTax(userId, year);

    res.json({
      success: true,
      data: taxCalculation
    });
  } catch (error) {
    logger.error('Tax calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate tax'
    });
  }
});

// Generate tax report
router.post('/generate', [
  body('year').isInt({ min: 2020, max: new Date().getFullYear() })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const { year } = req.body;

    const report = await taxService.generateTaxReport(userId, year);

    res.json({
      success: true,
      message: 'Tax report generated successfully',
      data: report
    });
  } catch (error) {
    logger.error('Generate tax report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate tax report'
    });
  }
});

// Get tax reports
router.get('/reports', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year } = req.query;

    let query = db('tax_reports').where({ user_id: userId });
    
    if (year) {
      query = query.where({ tax_year: year });
    }

    const reports = await query.orderBy('created_at', 'desc');

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    logger.error('Get tax reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tax reports'
    });
  }
});

// Download tax report
router.get('/download/:reportId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reportId } = req.params;

    const report = await db('tax_reports')
      .where({ id: reportId, user_id: userId })
      .first();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Tax report not found'
      });
    }

    const pdfBuffer = await taxService.generatePDF(report);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="tax-report-${report.tax_year}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Download tax report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download tax report'
    });
  }
});

// Get tax optimization suggestions
router.get('/optimize', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year = new Date().getFullYear() } = req.query;

    const suggestions = await taxService.getTaxOptimizationSuggestions(userId, year);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    logger.error('Tax optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tax optimization suggestions'
    });
  }
});

module.exports = router;