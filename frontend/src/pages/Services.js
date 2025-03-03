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
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import supabase from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

const categories = [
  'Développement Web',
  'Design',
  'Marketing Digital',
  'Consulting',
  'Formation',
  'Autre'
];

function Services() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    prix_ht: '',
    categorie: ''
  });

  const fetchServices = useCallback(async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('services')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`titre.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, count, error } = await query
        .eq('user_id', user.id)
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1)
        .order('titre');

      if (error) throw error;

      setServices(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Erreur lors du chargement des services');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, user]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (service = null) => {
    if (!user) {
      setError('Vous devez être connecté pour créer ou modifier un service');
      return;
    }

    if (service) {
      setEditingService(service);
      setFormData(service);
    } else {
      setEditingService(null);
      setFormData({
        titre: '',
        description: '',
        prix_ht: '',
        categorie: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingService(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Vous devez être connecté pour créer ou modifier un service');
      return;
    }

    try {
      const serviceData = {
        ...formData,
        prix_ht: parseFloat(formData.prix_ht),
        user_id: user.id
      };

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id)
          .eq('user_id', user.id);
        if (error) throw error;
        setSuccess('Service modifié avec succès');
      } else {
        const { error } = await supabase
          .from('services')
          .insert([serviceData]);
        if (error) throw error;
        setSuccess('Service créé avec succès');
      }
      handleCloseDialog();
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      setError(error.message || 'Erreur lors de la sauvegarde du service');
    }
  };

  const handleDelete = async (id) => {
    if (!user) {
      setError('Vous devez être connecté pour supprimer un service');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      try {
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) throw error;
        setSuccess('Service supprimé avec succès');
        fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        setError('Erreur lors de la suppression du service');
      }
    }
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Vous devez être connecté pour accéder aux services
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Services</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouveau Service
        </Button>
      </Box>

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher un service..."
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
                <TableCell>Titre</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Catégorie</TableCell>
                <TableCell>Prix HT</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.titre}</TableCell>
                  <TableCell>{service.description}</TableCell>
                  <TableCell>{service.categorie}</TableCell>
                  <TableCell>{service.prix_ht.toFixed(2)} €</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(service)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(service.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {services.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Aucun service trouvé
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingService ? 'Modifier le service' : 'Nouveau service'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Titre"
                  required
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                />
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
                <TextField
                  fullWidth
                  label="Catégorie"
                  select
                  required
                  value={formData.categorie}
                  onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Prix HT"
                  type="number"
                  required
                  value={formData.prix_ht}
                  onChange={(e) => setFormData({ ...formData, prix_ht: e.target.value })}
                  InputProps={{
                    endAdornment: '€'
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annuler</Button>
            <Button type="submit" variant="contained">
              {editingService ? 'Modifier' : 'Créer'}
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

export default Services;
