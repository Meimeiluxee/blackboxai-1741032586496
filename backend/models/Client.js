const supabase = require('../config/database');

const Client = {
  async getAll({ search, page = 1, limit = 10 }) {
    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`nom.ilike.%${search}%,societe.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('nom', { ascending: true });

    if (error) throw error;

    return {
      clients: data,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    };
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        quotes:quotes(
          id,
          reference,
          totalHT,
          totalTTC,
          statut,
          createdAt
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(clientData) {
    const { data, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    // First check if client has any quotes
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id')
      .eq('clientId', id);

    if (quotesError) throw quotesError;

    if (quotes.length > 0) {
      throw new Error('Impossible de supprimer un client ayant des devis associés');
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};

module.exports = Client;
