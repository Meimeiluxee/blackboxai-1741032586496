const Service = require('../models/Service');
const { Op } = require('sequelize');

// @desc    Obtenir tous les services
// @route   GET /api/services
// @access  Private
const getServices = async (req, res, next) => {
  try {
    const { search, categorie, page = 1, limit = 10 } = req.query;
    
    // Construire les conditions de recherche
    let whereConditions = {};
    
    if (search) {
      whereConditions[Op.or] = [
        { titre: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (categorie) {
      whereConditions.categorie = categorie;
    }

    // Calculer l'offset pour la pagination
    const offset = (page - 1) * limit;

    // Récupérer les services avec pagination
    const services = await Service.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['titre', 'ASC']],
    });

    res.json({
      success: true,
      services: services.rows,
      pagination: {
        total: services.count,
        page: parseInt(page),
        pages: Math.ceil(services.count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir un service par ID
// @route   GET /api/services/:id
// @access  Private
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (service) {
      res.json({
        success: true,
        service
      });
    } else {
      res.status(404);
      throw new Error('Service non trouvé');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Créer un nouveau service
// @route   POST /api/services
// @access  Private
const createService = async (req, res, next) => {
  try {
    const { titre, description, prixHT, categorie } = req.body;

    // Validation des champs requis
    if (!titre || !prixHT) {
      res.status(400);
      throw new Error('Le titre et le prix HT sont requis');
    }

    const service = await Service.create({
      titre,
      description,
      prixHT,
      categorie
    });

    res.status(201).json({
      success: true,
      service
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour un service
// @route   PUT /api/services/:id
// @access  Private
const updateService = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      res.status(404);
      throw new Error('Service non trouvé');
    }

    const { titre, description, prixHT, categorie } = req.body;

    // Mise à jour des champs
    service.titre = titre || service.titre;
    service.description = description || service.description;
    service.prixHT = prixHT || service.prixHT;
    service.categorie = categorie || service.categorie;

    const updatedService = await service.save();

    res.json({
      success: true,
      service: updatedService
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer un service
// @route   DELETE /api/services/:id
// @access  Private
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      res.status(404);
      throw new Error('Service non trouvé');
    }

    // TODO: Ajouter une vérification pour s'assurer que le service n'est pas utilisé dans des devis
    
    await service.destroy();

    res.json({
      success: true,
      message: 'Service supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};
