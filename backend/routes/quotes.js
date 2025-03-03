const express = require('express');
const router = express.Router();
const { 
  getQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  deleteQuote,
  generateQuotePDF
} = require('../controllers/quoteController');
const { protect } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(protect);

// Route /api/quotes
router.route('/')
  .get(getQuotes)
  .post(createQuote);

// Route /api/quotes/:id
router.route('/:id')
  .get(getQuoteById)
  .put(updateQuote)
  .delete(deleteQuote);

// Route pour générer le PDF
router.get('/:id/pdf', generateQuotePDF);

module.exports = router;
