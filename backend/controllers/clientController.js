const Client = require('../models/Client');
const Quote = require('../models/Quote');
const { Op } = require('sequelize');

// @desc    Obtenir tous les clients
// @route   GET /api/clients
// @access  Private
const getClients = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    // Construire les conditions de recherche
    const whereConditions = search ? {
      [Op.or]: [
        { nom: { [Op.iLike]: `%${search}%` } },
        { societe: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ]
    } : {};

    // Calculer l'offset pour la pagination
    const offset = (page - 1) * limit;

    // Récupérer les clients avec pagination
    const clients = await Client.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['nom', 'ASC']],
    });

    res.json({
      success: true,
      clients: clients.rows,
      pagination: {
        total: clients.count,
        page: parseInt(page),
        pages: Math.ceil(clients.count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir un client par ID
// @route   GET /api/clients/:id
// @access  Private
const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      include: [{
        model: Quote,
        attributes: ['id', 'reference', 'totalHT', 'totalTTC', 'statut', 'createdAt']
      }]
    });

    if (client) {
      res.json({
        success: true,
        client
      });
    } else {
      res.status(404);
      throw new Error('Client non trouvé');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Créer un nouveau client
// @route   POST /api/clients
// @access  Private
const createClient = async (req, res, next) => {
  try {
    const { nom, societe, adresse, telephone, email, notes } = req.body;

    const client = await Client.create({
      nom,
      societe,
      adresse,
      telephone,
      email,
      notes
    });

    res.status(201).json({
      success: true,
      client
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour un client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      res.status(404);
      throw new Error('Client non trouvé');
    }

    const { nom, societe, adresse, telephone, email, notes } = req.body;

    client.nom = nom || client.nom;
    client.societe = societe || client.societe;
    client.adresse = adresse || client.adresse;
    client.telephone = telephone || client.telephone;
    client.email = email || client.email;
    client.notes = notes || client.notes;

    const updatedClient = await client.save();

    res.json({
      success: true,
      client: updatedClient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer un client
// @route   DELETE /api/clients/:id
// @access  Private
const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      res.status(404);
      throw new Error('Client non trouvé');
    }

    // Vérifier si le client a des devis associés
    const quotesCount = await Quote.count({
      where: { clientId: req.params.id }
    });

    if (quotesCount > 0) {
      res.status(400);
      throw new Error('Impossible de supprimer un client ayant des devis associés');
    }

    await client.destroy();

    res.json({
      success: true,
      message: 'Client supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
};
