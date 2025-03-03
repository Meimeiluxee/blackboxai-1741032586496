import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../contexts/AuthContext';

function Navbar({ onMenuClick }) {
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          CRM Personnel
        </Typography>
        {user && (
          <div>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                {user.user_metadata?.prenom?.[0] || user.email[0].toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                {user.user_metadata?.prenom
                  ? `${user.user_metadata.prenom} ${user.user_metadata.nom}`
                  : user.email}
              </MenuItem>
              <MenuItem onClick={handleLogout}>Se déconnecter</MenuItem>
            </Menu>
          </div>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
