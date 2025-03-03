const supabase = require('../config/database');

const Quote = {
  async getAll({ search, clientId, statut, dateDebut, dateFin, page = 1, limit = 10 }) {
    let query = supabase
      .from('quotes')
      .select(`
        *,
        client:clients(nom, societe)
      `, { count: 'exact' });

    if (search) {
      query = query.ilike('reference', `%${search}%`);
    }

    if (clientId) {
      query = query.eq('clientId', clientId);
    }

    if (statut) {
      query = query.eq('statut', statut);
    }

    if (dateDebut && dateFin) {
      query = query.gte('createdAt', dateDebut).lte('createdAt', dateFin);
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return {
      quotes: data,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    };
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        client:clients(
          id,
          nom,
          societe,
          adresse,
          email,
          telephone
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(quoteData) {
    // Generate reference
    const date = new Date();
    const reference = `DEV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Calculate totals
    const totalHT = quoteData.items.reduce((sum, item) => {
      return sum + (item.quantite * item.prixUnitaireHT);
    }, 0);

    const totalTTC = totalHT * (1 + (quoteData.tva || 20) / 100);

    const { data, error } = await supabase
      .from('quotes')
      .insert([{
        ...quoteData,
        reference,
        totalHT,
        totalTTC
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    // If items are updated, recalculate totals
    if (updates.items) {
      updates.totalHT = updates.items.reduce((sum, item) => {
        return sum + (item.quantite * item.prixUnitaireHT);
      }, 0);
      updates.totalTTC = updates.totalHT * (1 + (updates.tva || 20) / 100);
    }

    const { data, error } = await supabase
      .from('quotes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    // Check if quote can be deleted (not invoiced)
    const { data: quote, error: getError } = await supabase
      .from('quotes')
      .select('statut')
      .eq('id', id)
      .single();

    if (getError) throw getError;

    if (quote.statut === 'FACTURÉ') {
      throw new Error('Un devis facturé ne peut pas être supprimé');
    }

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};

module.exports = Quote;
