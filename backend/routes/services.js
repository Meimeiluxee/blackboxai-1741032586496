const express = require('express');
const router = express.Router();
const { 
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

// Protéger toutes les routes
router.use(protect);

// Routes pour /api/services
router.route('/')
  .get(getServices)
  .post(createService);

// Routes pour /api/services/:id
router.route('/:id')
  .get(getServiceById)
  .put(updateService)
  .delete(deleteService);

module.exports = router;
