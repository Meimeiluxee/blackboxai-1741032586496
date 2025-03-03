const Quote = require('../models/Quote');
const Client = require('../models/Client');
const Service = require('../models/Service');
const PDFService = require('../services/pdfService');
const { Op } = require('sequelize');

// @desc    Obtenir tous les devis
// @route   GET /api/quotes
// @access  Private
const getQuotes = async (req, res, next) => {
  try {
    const { 
      search, 
      clientId, 
      statut,
      dateDebut,
      dateFin,
      page = 1, 
      limit = 10 
    } = req.query;

    // Construire les conditions de recherche
    let whereConditions = {};
    
    if (search) {
      whereConditions.reference = { [Op.iLike]: `%${search}%` };
    }
    
    if (clientId) {
      whereConditions.clientId = clientId;
    }
    
    if (statut) {
      whereConditions.statut = statut;
    }
    
    if (dateDebut && dateFin) {
      whereConditions.createdAt = {
        [Op.between]: [new Date(dateDebut), new Date(dateFin)]
      };
    }

    // Calculer l'offset pour la pagination
    const offset = (page - 1) * limit;

    // Récupérer les devis avec pagination
    const quotes = await Quote.findAndCountAll({
      where: whereConditions,
      include: [{
        model: Client,
        attributes: ['nom', 'societe']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      quotes: quotes.rows,
      pagination: {
        total: quotes.count,
        page: parseInt(page),
        pages: Math.ceil(quotes.count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir un devis par ID
// @route   GET /api/quotes/:id
// @access  Private
const getQuoteById = async (req, res, next) => {
  try {
    const quote = await Quote.findByPk(req.params.id, {
      include: [{
        model: Client,
        attributes: ['id', 'nom', 'societe', 'adresse', 'email', 'telephone']
      }]
    });

    if (quote) {
      res.json({
        success: true,
        quote
      });
    } else {
      res.status(404);
      throw new Error('Devis non trouvé');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Créer un nouveau devis
// @route   POST /api/quotes
// @access  Private
const createQuote = async (req, res, next) => {
  try {
    const {
      clientId,
      description,
      items,
      conditions,
      dateValidite,
      options
    } = req.body;

    // Vérifier si le client existe
    const client = await Client.findByPk(clientId);
    if (!client) {
      res.status(404);
      throw new Error('Client non trouvé');
    }

    // Vérifier et enrichir les items avec les détails des services si serviceId est fourni
    const enrichedItems = await Promise.all(items.map(async (item) => {
      if (item.serviceId) {
        const service = await Service.findByPk(item.serviceId);
        if (!service) {
          throw new Error(`Service non trouvé pour l'ID: ${item.serviceId}`);
        }
        return {
          ...item,
          description: item.description || service.titre,
          prixUnitaireHT: item.prixUnitaireHT || service.prixHT
        };
      }
      return item;
    }));

    const quote = await Quote.create({
      clientId,
      description,
      items: enrichedItems,
      conditions,
      dateValidite,
      options
    });

    // Récupérer le devis créé avec les informations du client
    const newQuote = await Quote.findByPk(quote.id, {
      include: [{
        model: Client,
        attributes: ['nom', 'societe']
      }]
    });

    res.status(201).json({
      success: true,
      quote: newQuote
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour un devis
// @route   PUT /api/quotes/:id
// @access  Private
const updateQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findByPk(req.params.id);

    if (!quote) {
      res.status(404);
      throw new Error('Devis non trouvé');
    }

    // Vérifier si le devis peut être modifié
    if (quote.statut === 'FACTURÉ') {
      res.status(400);
      throw new Error('Un devis facturé ne peut plus être modifié');
    }

    const {
      description,
      items,
      conditions,
      dateValidite,
      options,
      statut
    } = req.body;

    quote.description = description || quote.description;
    
    // Si des nouveaux items sont fournis, les enrichir avec les détails des services
    if (items) {
      const enrichedItems = await Promise.all(items.map(async (item) => {
        if (item.serviceId) {
          const service = await Service.findByPk(item.serviceId);
          if (!service) {
            throw new Error(`Service non trouvé pour l'ID: ${item.serviceId}`);
          }
          return {
            ...item,
            description: item.description || service.titre,
            prixUnitaireHT: item.prixUnitaireHT || service.prixHT
          };
        }
        return item;
      }));
      quote.items = enrichedItems;
    }
    
    quote.conditions = conditions || quote.conditions;
    quote.dateValidite = dateValidite || quote.dateValidite;
    quote.options = options || quote.options;
    quote.statut = statut || quote.statut;

    const updatedQuote = await quote.save();

    res.json({
      success: true,
      quote: updatedQuote
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer un devis
// @route   DELETE /api/quotes/:id
// @access  Private
const deleteQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findByPk(req.params.id);

    if (!quote) {
      res.status(404);
      throw new Error('Devis non trouvé');
    }

    // Vérifier si le devis peut être supprimé
    if (quote.statut === 'FACTURÉ') {
      res.status(400);
      throw new Error('Un devis facturé ne peut pas être supprimé');
    }

    await quote.destroy();

    res.json({
      success: true,
      message: 'Devis supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Générer le PDF d'un devis
// @route   GET /api/quotes/:id/pdf
// @access  Private
const generateQuotePDF = async (req, res, next) => {
  try {
    const quote = await Quote.findByPk(req.params.id, {
      include: [{
        model: Client,
        attributes: ['nom', 'societe', 'adresse', 'email', 'telephone']
      }]
    });

    if (!quote) {
      res.status(404);
      throw new Error('Devis non trouvé');
    }

    // Générer le PDF
    const pdfBuffer = await PDFService.generateQuotePDF(quote);

    // Configurer les en-têtes pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=devis-${quote.reference}.pdf`);

    // Envoyer le PDF
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  deleteQuote,
  generateQuotePDF
};
