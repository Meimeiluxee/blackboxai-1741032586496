const supabase = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
  async create({ email, password, nom, prenom }) {
    try {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user in database
      const { data, error } = await supabase
        .from('users')
        .insert([{
          email,
          password: hashedPassword,
          nom,
          prenom
        }])
        .select('id, email, nom, prenom')
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('Un utilisateur avec cet email existe déjà');
        }
        throw error;
      }

      return data;
    } catch (error) {
      throw new Error(`Erreur lors de la création: ${error.message}`);
    }
  },

  async findOne({ where }) {
    try {
      let query = supabase
        .from('users')
        .select('*');

      // Handle complex where conditions
      Object.entries(where).forEach(([key, value]) => {
        if (typeof value === 'object' && value.$ne !== undefined) {
          // Handle not equal condition
          query = query.not(key, 'eq', value.$ne);
        } else {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
        throw error;
      }

      if (data) {
        // Add comparePassword method to user object
        data.comparePassword = async function(candidatePassword) {
          return await bcrypt.compare(candidatePassword, this.password);
        };
      }

      return data;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche: ${error.message}`);
    }
  },

  async findByPk(id, options = {}) {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await query;

      if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
        throw error;
      }

      if (data && options.attributes && options.attributes.exclude) {
        options.attributes.exclude.forEach(field => {
          delete data[field];
        });
      }

      return data;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche par ID: ${error.message}`);
    }
  },

  async update(id, updates) {
    try {
      // If password is being updated, hash it
      if (updates.password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(updates.password, salt);
      }

      // Remove undefined fields
      Object.keys(updates).forEach(key => 
        updates[key] === undefined && delete updates[key]
      );

      // updated_at is handled by database trigger
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select('id, email, nom, prenom, created_at, updated_at')
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('Cet email est déjà utilisé');
        }
        throw error;
      }

      return data;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  }
};

module.exports = User;
