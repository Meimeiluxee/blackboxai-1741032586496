import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

// Layout components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Quotes from './pages/Quotes';
import Services from './pages/Services';
import Login from './pages/Login';

// Auth Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

function AppContent() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <Box sx={{ display: 'flex' }}>
      {user && <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />}
      {user && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: user ? 8 : 0,
          ml: user && sidebarOpen ? '240px' : 0,
          transition: 'margin 225ms cubic-bezier(0, 0, 0.2, 1) 0ms'
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/clients" element={
            <PrivateRoute>
              <Clients />
            </PrivateRoute>
          } />
          <Route path="/quotes" element={
            <PrivateRoute>
              <Quotes />
            </PrivateRoute>
          } />
          <Route path="/services" element={
            <PrivateRoute>
              <Services />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
