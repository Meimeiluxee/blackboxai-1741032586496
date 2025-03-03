import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import {
  People as PeopleIcon,
  Description as DescriptionIcon,
  Build as BuildIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import supabase from '../config/supabase';

function StatCard({ title, value, icon, loading }) {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <Box>
        <Typography color="textSecondary" variant="h6" gutterBottom>
          {title}
        </Typography>
        {loading ? (
          <CircularProgress size={20} />
        ) : (
          <Typography variant="h4">{value}</Typography>
        )}
      </Box>
      <Box
        sx={{
          backgroundColor: 'primary.light',
          borderRadius: '50%',
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {icon}
      </Box>
    </Paper>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({
    clients: 0,
    quotes: 0,
    services: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch clients count
        const { count: clientsCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true });

        // Fetch quotes count
        const { count: quotesCount } = await supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true });

        // Fetch services count
        const { count: servicesCount } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true });

        // Calculate monthly revenue from quotes
        const { data: monthlyQuotes } = await supabase
          .from('quotes')
          .select('total_ttc')
          .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString());

        const monthlyRevenue = monthlyQuotes?.reduce((sum, quote) => sum + (quote.total_ttc || 0), 0) || 0;

        setStats({
          clients: clientsCount || 0,
          quotes: quotesCount || 0,
          services: servicesCount || 0,
          monthlyRevenue
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tableau de bord
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Clients"
            value={stats.clients}
            icon={<PeopleIcon />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Devis"
            value={stats.quotes}
            icon={<DescriptionIcon />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Services"
            value={stats.services}
            icon={<BuildIcon />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="CA Mensuel"
            value={`${stats.monthlyRevenue.toFixed(2)} €`}
            icon={<TrendingUpIcon />}
            loading={loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
