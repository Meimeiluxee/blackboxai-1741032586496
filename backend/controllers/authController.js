const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Générer le token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Inscription utilisateur
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { email, password, nom, prenom } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      res.status(400);
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Créer l'utilisateur
    const user = await User.create({
      email,
      password,
      nom,
      prenom
    });

    if (user) {
      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom
        },
        token: generateToken(user.id)
      });
    } else {
      res.status(400);
      throw new Error('Données utilisateur invalides');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Connexion utilisateur
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Vérifier l'email et le mot de passe
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      res.status(401);
      throw new Error('Email ou mot de passe incorrect');
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      res.status(401);
      throw new Error('Email ou mot de passe incorrect');
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom
      },
      token: generateToken(user.id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir le profil utilisateur
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (user) {
      res.json({
        success: true,
        user
      });
    } else {
      res.status(404);
      throw new Error('Utilisateur non trouvé');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour le profil utilisateur
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { email, nom, prenom, password } = req.body;
    
    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email) {
      const existingUser = await User.findOne({ 
        where: { 
          email,
          id: { $ne: req.user.id }
        } 
      });
      
      if (existingUser) {
        res.status(400);
        throw new Error('Cet email est déjà utilisé');
      }
    }

    const updatedUser = await User.update(req.user.id, {
      email,
      nom,
      prenom,
      password
    });

    if (!updatedUser) {
      res.status(404);
      throw new Error('Utilisateur non trouvé');
    }

    res.json({
      success: true,
      user: updatedUser,
      token: generateToken(updatedUser.id)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};
