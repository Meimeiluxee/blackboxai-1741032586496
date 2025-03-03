const supabase = require('../config/database');

const Service = {
  async getAll({ search, categorie, page = 1, limit = 10 }) {
    let query = supabase
      .from('services')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`titre.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (categorie) {
      query = query.eq('categorie', categorie);
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('titre', { ascending: true });

    if (error) throw error;

    return {
      services: data,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    };
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('services')
      .select()
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(serviceData) {
    // Ensure prixHT is a number
    if (serviceData.prixHT) {
      serviceData.prixHT = parseFloat(serviceData.prixHT);
    }

    const { data, error } = await supabase
      .from('services')
      .insert([serviceData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    // Ensure prixHT is a number if provided
    if (updates.prixHT) {
      updates.prixHT = parseFloat(updates.prixHT);
    }

    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    // TODO: Add check to prevent deletion if service is used in quotes
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};

module.exports = Service;
