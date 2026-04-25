import React, { useState } from "react";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  Chip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  Security,
  People,
  Assessment,
  Report,
  Logout,
  AccountCircle,
  Star,
  Shield,
  Settings,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/design-system.css";

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    handleClose();
  };

  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard", roles: ["ADMIN", "OPERADOR", "CONSULTOR"] },
    { text: "Activos", icon: <Security />, path: "/activos", roles: ["ADMIN", "OPERADOR", "CONSULTOR"] },
    { text: "Usuarios", icon: <People />, path: "/usuarios", roles: ["ADMIN"] },
    { text: "Riesgos", icon: <Assessment />, path: "/riesgos", roles: ["ADMIN", "OPERADOR", "CONSULTOR"] },
    { text: "Evaluacion", icon: <Star />, path: "/wizard", roles: ["ADMIN", "OPERADOR"] },
    { text: "Reportes", icon: <Report />, path: "/reportes", roles: ["ADMIN", "OPERADOR", "CONSULTOR"] },
  ].filter(item => item.roles.includes(user?.rol_nombre || ""));

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      background: 'linear-gradient(180deg, #1E3A8A 0%, #1E40AF 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Logo Section */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Box sx={{
          width: 40,
          height: 40,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #FACC15 0%, #FDE047 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(250, 204, 21, 0.3)'
        }}>
          <Shield sx={{ color: '#1E3A8A', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography
            variant="h6"
            className="font-poppins"
            sx={{
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '1.25rem',
              lineHeight: 1.2
            }}
          >
            SmartAuditorIA
          </Typography>
          <Typography
            variant="caption"
            className="font-roboto"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.75rem',
              fontWeight: 400
            }}
          >
            Auditoría Inteligente
          </Typography>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ px: 2, py: 2, flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: '12px',
                py: 1.5,
                px: 2,
                minHeight: 48,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(250, 204, 21, 0.15)',
                  border: '1px solid rgba(250, 204, 21, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(250, 204, 21, 0.2)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#FACC15',
                  },
                  '& .MuiListItemText-primary': {
                    color: '#FFFFFF',
                    fontWeight: 500,
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  transform: 'translateX(4px)',
                },
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <ListItemIcon sx={{ 
                color: 'rgba(255,255,255,0.7)', 
                minWidth: '44px',
                transition: 'color 0.25s ease'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontFamily: "'Roboto', sans-serif",
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '0.95rem'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* User Info Footer */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            width: 36, 
            height: 36, 
            background: 'linear-gradient(135deg, #FACC15 0%, #FDE047 100%)',
            color: '#1E3A8A',
            fontSize: '0.875rem',
            fontWeight: 600
          }}>
            {user?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              className="font-roboto"
              sx={{
                color: '#FFFFFF',
                fontWeight: 500,
                fontSize: '0.875rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {user?.username}
            </Typography>
            <Chip
              label={user?.rol_nombre}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                background: 'rgba(250, 204, 21, 0.2)',
                color: '#FACC15',
                border: '1px solid rgba(250, 204, 21, 0.3)',
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar sx={{ px: 4, py: 1, minHeight: '72px !important' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { sm: "none" },
              color: '#374151',
              '&:hover': {
                backgroundColor: '#F3F4F6',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h5"
              className="font-poppins"
              sx={{
                color: '#1E3A8A',
                fontWeight: 600,
                fontSize: '1.5rem',
                lineHeight: 1.2
              }}
            >
              SmartAuditorIA: Sistema Experto de Auditoría
            </Typography>
            <Typography
              variant="body2"
              className="font-roboto"
              sx={{
                color: '#6B7280',
                fontSize: '0.875rem',
                mt: 0.5
              }}
            >
              Plataforma integral para la gestion de activos y evaluacion de riesgos
            </Typography>
          </Box>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                width: 40, 
                height: 40, 
                background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="body2"
                  className="font-roboto"
                  sx={{
                    color: '#374151',
                    fontWeight: 500,
                    fontSize: '0.875rem'
                  }}
                >
                  {user?.username}
                </Typography>
                <Typography
                  variant="caption"
                  className="font-roboto"
                  sx={{
                    color: '#6B7280',
                    fontSize: '0.75rem'
                  }}
                >
                  {user?.rol_nombre}
                </Typography>
              </Box>
            </Box>
            
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              sx={{
                color: '#6B7280',
                '&:hover': {
                  backgroundColor: '#F3F4F6',
                  color: '#1E3A8A'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <Settings />
            </IconButton>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #E5E7EB',
                  mt: 1,
                  minWidth: 200
                },
              }}
            >
              <MenuItem
                onClick={handleLogout}
                sx={{
                  fontFamily: "'Roboto', sans-serif",
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    backgroundColor: '#F3F4F6',
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#EF4444', minWidth: 40 }}>
                  <Logout fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Cerrar Sesion"
                  primaryTypographyProps={{
                    fontFamily: "'Roboto', sans-serif",
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}
                />
              </MenuItem>\n            </Menu>\n          </Box>\n        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: '#F9FAFB',
          minHeight: '100vh',
        }}
      >
        <Toolbar sx={{ minHeight: '72px !important' }} />
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            minHeight: 'calc(100vh - 72px)',
            background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
