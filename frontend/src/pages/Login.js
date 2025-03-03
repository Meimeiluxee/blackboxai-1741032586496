import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Tab,
  Tabs
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ marginTop: '20px' }}>
      {value === index && children}
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: ''
  });

  if (user) {
    navigate('/');
    return null;
  }

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleFieldBlur = (field) => {
    setTouched({ ...touched, [field]: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    const errors = {};
    if (!loginData.email) {
      errors.email = 'L\'email est requis';
    } else if (!validateEmail(loginData.email)) {
      errors.email = 'Email invalide';
    }
    if (!loginData.password) {
      errors.password = 'Le mot de passe est requis';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTouched({
        email: true,
        password: true
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await signIn({
        email: loginData.email,
        password: loginData.password
      });

      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error signing in:', error);
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});
    setLoading(true);

    const errors = {};
    if (!registerData.prenom) errors.prenom = 'Le prénom est requis';
    if (!registerData.nom) errors.nom = 'Le nom est requis';
    if (!registerData.email) {
      errors.email = 'L\'email est requis';
    } else if (!validateEmail(registerData.email)) {
      errors.email = 'Email invalide';
    }
    if (!registerData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (!validatePassword(registerData.password)) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTouched({
        prenom: true,
        nom: true,
        email: true,
        password: true
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            nom: registerData.nom,
            prenom: registerData.prenom
          }
        }
      });

      if (error) throw error;

      setSuccess('Vérifiez votre email pour confirmer votre inscription.');
      setTab(0);
      setRegisterData({
        email: '',
        password: '',
        nom: '',
        prenom: ''
      });
    } catch (error) {
      console.error('Error signing up:', error);
      if (error.message.includes('email')) {
        setFieldErrors({ email: 'Cette adresse email est déjà utilisée' });
        setTouched({ email: true });
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (e, newValue) => {
    setTab(newValue);
    setError('');
    setSuccess('');
    setFieldErrors({});
    setTouched({});
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            CRM Personnel
          </Typography>

          <Tabs
            value={tab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ mb: 3 }}
          >
            <Tab label="Connexion" />
            <Tab label="Inscription" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <TabPanel value={tab} index={0}>
            <form onSubmit={handleLogin}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email"
                type="email"
                autoComplete="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                onBlur={() => handleFieldBlur('email')}
                error={touched.email && !!fieldErrors.email}
                helperText={touched.email && fieldErrors.email}
                FormHelperTextProps={{
                  sx: { color: 'error.main' }
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Mot de passe"
                type="password"
                autoComplete="current-password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                onBlur={() => handleFieldBlur('password')}
                error={touched.password && !!fieldErrors.password}
                helperText={touched.password && fieldErrors.password}
                FormHelperTextProps={{
                  sx: { color: 'error.main' }
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <form onSubmit={handleRegister}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Prénom"
                value={registerData.prenom}
                onChange={(e) => setRegisterData({ ...registerData, prenom: e.target.value })}
                onBlur={() => handleFieldBlur('prenom')}
                error={touched.prenom && !!fieldErrors.prenom}
                helperText={touched.prenom && fieldErrors.prenom}
                FormHelperTextProps={{
                  sx: { color: 'error.main' }
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Nom"
                value={registerData.nom}
                onChange={(e) => setRegisterData({ ...registerData, nom: e.target.value })}
                onBlur={() => handleFieldBlur('nom')}
                error={touched.nom && !!fieldErrors.nom}
                helperText={touched.nom && fieldErrors.nom}
                FormHelperTextProps={{
                  sx: { color: 'error.main' }
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email"
                type="email"
                autoComplete="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                onBlur={() => handleFieldBlur('email')}
                error={touched.email && !!fieldErrors.email}
                helperText={touched.email && fieldErrors.email}
                FormHelperTextProps={{
                  sx: { color: 'error.main' }
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Mot de passe"
                type="password"
                autoComplete="new-password"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                onBlur={() => handleFieldBlur('password')}
                error={touched.password && !!fieldErrors.password}
                helperText={
                  (touched.password && fieldErrors.password) ||
                  'Le mot de passe doit contenir au moins 8 caractères'
                }
                FormHelperTextProps={{
                  sx: { 
                    color: touched.password && fieldErrors.password ? 'error.main' : 'text.secondary'
                  }
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? 'Inscription...' : "S'inscrire"}
              </Button>
            </form>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;
