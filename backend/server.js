const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const supabase = require('./config/database');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Import des routes
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const quoteRoutes = require('./routes/quotes');
const serviceRoutes = require('./routes/services');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/services', serviceRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: "Bienvenue sur l'API du CRM Personnel" });
});

// Test Supabase Connection
supabase.from('users').select('count', { count: 'exact' })
  .then(() => console.log('Connection à Supabase établie avec succès.'))
  .catch(err => console.error('Impossible de se connecter à Supabase:', err));

// Middleware de gestion des erreurs
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
