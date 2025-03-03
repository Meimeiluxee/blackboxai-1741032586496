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

      console.log('Insert response:', { data, error }); // Log the response

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

  // Other methods remain unchanged...
};

module.exports = User;
