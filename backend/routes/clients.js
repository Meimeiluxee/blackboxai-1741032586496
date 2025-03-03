const express = require('express');
const router = express.Router();
const { 
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(protect);

// Route /api/clients
router.route('/')
  .get(getClients)
  .post(createClient);

// Route /api/clients/:id
router.route('/:id')
  .get(getClientById)
  .put(updateClient)
  .delete(deleteClient);

module.exports = router;
