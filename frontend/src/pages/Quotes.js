import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  RemoveCircle as RemoveIcon
} from '@mui/icons-material';
import supabase from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

const statuses = [
  { value: 'BROUILLON', label: 'Brouillon', color: 'default' },
  { value: 'ENVOYÉ', label: 'Envoyé', color: 'primary' },
  { value: 'ACCEPTÉ', label: 'Accepté', color: 'success' },
  { value: 'REFUSÉ', label: 'Refusé', color: 'error' },
  { value: 'FACTURÉ', label: 'Facturé', color: 'secondary' }
];

function Quotes() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    client_id: '', // Changed from clientId
    description: '',
    items: [],
    conditions: '',
    tva: 20,
    statut: 'BROUILLON',
    date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Changed from dateValidite
  });

  const fetchQuotes = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('quotes')
        .select(`
          *,
          client:clients(nom, societe)
        `, { count: 'exact' });

      if (search) {
        query = query.or(`reference.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, count, error } = await query
        .eq('user_id', user.id)
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setQuotes(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setError('Erreur lors du chargement des devis');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, user]);

  const fetchClients = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('nom');
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Erreur lors du chargement des clients');
    }
  }, [user]);

  const fetchServices = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('titre');
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Erreur lors du chargement des services');
    }
  }, [user]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  useEffect(() => {
    fetchClients();
    fetchServices();
  }, [fetchClients, fetchServices]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (quote = null) => {
    if (!user) {
      setError('Vous devez être connecté pour créer ou modifier un devis');
      return;
    }

    if (quote) {
      setEditingQuote(quote);
      setFormData(quote);
    } else {
      setEditingQuote(null);
      setFormData({
        client_id: '',
        description: '',
        items: [],
        conditions: '',
        tva: 20,
        statut: 'BROUILLON',
        date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingQuote(null);
    setError('');
  };

  const handleAddService = (service) => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          service_id: service.id,
          titre: service.titre,
          description: service.description,
          quantite: 1,
          prix_unitaire_ht: service.prix_ht
        }
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotals = () => {
    const total_ht = formData.items.reduce((sum, item) => {
      return sum + (item.quantite * item.prix_unitaire_ht);
    }, 0);
    const total_ttc = total_ht * (1 + (formData.tva / 100));
    return { total_ht, total_ttc };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Vous devez être connecté pour créer ou modifier un devis');
      return;
    }

    try {
      const { total_ht, total_ttc } = calculateTotals();
      const quoteData = {
        ...formData,
        total_ht,
        total_ttc,
        user_id: user.id
      };

      if (editingQuote) {
        const { error } = await supabase
          .from('quotes')
          .update(quoteData)
          .eq('id', editingQuote.id)
          .eq('user_id', user.id);
        if (error) throw error;
        setSuccess('Devis modifié avec succès');
      } else {
        quoteData.reference = `DEV-${Date.now()}`;
        const { error } = await supabase
          .from('quotes')
          .insert([quoteData]);
        if (error) throw error;
        setSuccess('Devis créé avec succès');
      }
      handleCloseDialog();
      fetchQuotes();
    } catch (error) {
      console.error('Error saving quote:', error);
      setError(error.message || 'Erreur lors de la sauvegarde du devis');
    }
  };

  const handleDelete = async (id) => {
    if (!user) {
      setError('Vous devez être connecté pour supprimer un devis');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      try {
        const { error } = await supabase
          .from('quotes')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) throw error;
        setSuccess('Devis supprimé avec succès');
        fetchQuotes();
      } catch (error) {
        console.error('Error deleting quote:', error);
        setError('Erreur lors de la suppression du devis');
      }
    }
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  const getStatusChip = (status) => {
    const statusConfig = statuses.find(s => s.value === status) || statuses[0];
    return (
      <Chip
        label={statusConfig.label}
        color={statusConfig.color}
        size="small"
      />
    );
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Vous devez être connecté pour accéder aux devis
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Devis</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouveau Devis
        </Button>
      </Box>

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher un devis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Référence</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Total TTC</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>{quote.reference}</TableCell>
                  <TableCell>
                    {quote.client?.societe
                      ? `${quote.client.nom} (${quote.client.societe})`
                      : quote.client?.nom}
                  </TableCell>
                  <TableCell>
                    {new Date(quote.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{quote.total_ttc?.toFixed(2)} €</TableCell>
                  <TableCell>{getStatusChip(quote.statut)}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(quote)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(quote.id)}>
                      <DeleteIcon />
                    </IconButton>
                    <IconButton>
                      <PdfIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {quotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Aucun devis trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingQuote ? 'Modifier le devis' : 'Nouveau devis'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Client"
                  select
                  required
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.societe ? `${client.nom} (${client.societe})` : client.nom}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Services
                </Typography>
                <TextField
                  fullWidth
                  label="Ajouter un service"
                  select
                  value=""
                  onChange={(e) => {
                    const service = services.find(s => s.id === e.target.value);
                    if (service) handleAddService(service);
                  }}
                >
                  {services.map((service) => (
                    <MenuItem key={service.id} value={service.id}>
                      {service.titre} - {service.prix_ht.toFixed(2)} €
                    </MenuItem>
                  ))}
                </TextField>
                <List>
                  {formData.items.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={item.titre}
                        secondary={
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <TextField
                                label="Quantité"
                                type="number"
                                size="small"
                                value={item.quantite}
                                onChange={(e) => handleUpdateItem(index, 'quantite', parseInt(e.target.value))}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                label="Prix unitaire HT"
                                type="number"
                                size="small"
                                value={item.prix_unitaire_ht}
                                onChange={(e) => handleUpdateItem(index, 'prix_unitaire_ht', parseFloat(e.target.value))}
                              />
                            </Grid>
                          </Grid>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleRemoveItem(index)}>
                          <RemoveIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="TVA (%)"
                  type="number"
                  required
                  value={formData.tva}
                  onChange={(e) => setFormData({ ...formData, tva: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date de validité"
                  type="date"
                  required
                  value={formData.date_validite}
                  onChange={(e) => setFormData({ ...formData, date_validite: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Conditions"
                  multiline
                  rows={2}
                  value={formData.conditions}
                  onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Statut"
                  select
                  required
                  value={formData.statut}
                  onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                >
                  {statuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Total HT: {calculateTotals().total_ht.toFixed(2)} €
                </Typography>
                <Typography variant="subtitle1">
                  Total TTC: {calculateTotals().total_ttc.toFixed(2)} €
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annuler</Button>
            <Button type="submit" variant="contained">
              {editingQuote ? 'Modifier' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Quotes;
