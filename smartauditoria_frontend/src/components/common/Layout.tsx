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
  FactCheck,
  ArrowForwardIos
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

  const currentUserRole = (user?.rol_nombre || (user as any)?.role || "").toUpperCase();
  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard", roles: ["ADMIN", "OPERADOR", "CONSULTOR"] },
    { text: "Activos", icon: <Security />, path: "/activos", roles: ["ADMIN", "OPERADOR", "CONSULTOR"] },
    { text: "Usuarios", icon: <People />, path: "/usuarios", roles: ["ADMIN"] },
    { text: "Riesgos", icon: <Assessment />, path: "/riesgos", roles: ["ADMIN", "OPERADOR", "CONSULTOR"] },
    { text: "Evaluacion", icon: <Star />, path: "/wizard", roles: ["ADMIN", "OPERADOR"] },
    { text: "Auditoría", icon: <FactCheck />, path: "/auditoria", roles: ["ADMIN", "OPERADOR"] },
    { text: "Reportes", icon: <Report />, path: "/reportes", roles: ["ADMIN", "OPERADOR", "CONSULTOR"] },
  ].filter(item => item.roles.includes(currentUserRole) || currentUserRole === "ADMIN");

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      background: 'linear-gradient(180deg, #1D3867 0%, #11223F 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Logo Section */}
      <Box sx={{ 
        p: 2.5, 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5
      }}>
        <Box sx={{
          width: 42,
          height: 42,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #eb6408 0%, #f97316 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(235, 100, 8, 0.35)',
          flexShrink: 0
        }}>
          <Shield sx={{ color: '#FFFFFF', fontSize: 24 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            className="font-poppins"
            sx={{
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '1.15rem',
              lineHeight: 1.2
            }}
          >
            SmartAuditorIA
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: '0.72rem',
              fontWeight: 500,
              display: 'block'
            }}
          >
            SedCauca • SGSI
          </Typography>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ px: 2, py: 2, flex: 1 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '10px',
                  py: 1.3,
                  px: 2,
                  minHeight: 46,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(235, 100, 8, 0.16)',
                    border: '1px solid rgba(235, 100, 8, 0.4)',
                    borderLeft: '4px solid #eb6408',
                    '&:hover': {
                      backgroundColor: 'rgba(235, 100, 8, 0.24)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: '#eb6408',
                    },
                    '& .MuiListItemText-primary': {
                      color: '#FFFFFF',
                      fontWeight: 600,
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <ListItemIcon sx={{ 
                  color: isSelected ? '#eb6408' : 'rgba(255,255,255,0.75)', 
                  minWidth: '40px',
                  transition: 'color 0.2s ease'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontFamily: "'Roboto', sans-serif",
                    fontWeight: isSelected ? 600 : 400,
                    color: 'rgba(255,255,255,0.92)',
                    fontSize: '0.92rem'
                  }}
                />
                <ArrowForwardIos sx={{ 
                  fontSize: '0.7rem', 
                  color: isSelected ? '#eb6408' : 'rgba(255,255,255,0.3)',
                  transition: 'transform 0.2s ease',
                  ml: 1
                }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User Info Footer in Drawer */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.15)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ 
            width: 38, 
            height: 38, 
            background: 'linear-gradient(135deg, #eb6408 0%, #f97316 100%)',
            color: '#FFFFFF',
            fontSize: '0.9rem',
            fontWeight: 700
          }}>
            {user?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.85rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {user?.username}
            </Typography>
            <Chip
              label={currentUserRole || "USUARIO"}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.68rem',
                fontWeight: 700,
                background: 'rgba(235, 100, 8, 0.2)',
                color: '#f97316',
                border: '1px solid rgba(235, 100, 8, 0.4)',
                '& .MuiChip-label': {
                  px: 0.8
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
          borderBottom: '1px solid #E2E8F0',
          boxShadow: '0 2px 6px rgba(29, 56, 103, 0.05)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        {/* Franja Superior Oficial GOV.CO */}
        <Box
          sx={{
            backgroundColor: '#3366CC',
            py: 0.6,
            px: { xs: 2, sm: 3 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <a
            href="https://www.gov.co/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <Box
              component="img"
              src="/assets/images/institutional/logoGov.svg"
              alt="Portal GOV.CO"
              sx={{
                height: 18,
                width: 'auto',
                filter: 'brightness(0) invert(1)',
              }}
            />
          </a>
          <Typography
            variant="caption"
            sx={{
              color: '#FFFFFF',
              fontWeight: 500,
              fontSize: '0.72rem',
              letterSpacing: '0.02em',
              display: { xs: 'none', md: 'block' },
            }}
          >
            Gobernación del Cauca • Secretaría de Educación y Cultura
          </Typography>
        </Box>

        {/* Encabezado Institucional Principal */}
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, py: 1, minHeight: '66px !important' }}>
          <IconButton
            color="inherit"
            aria-label="abrir menú"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 1.5,
              display: { sm: "none" },
              color: '#1D3867',
              '&:hover': {
                backgroundColor: '#F1F4F9',
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Escudos Institucionales en Header */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1.5,
              mr: 2,
            }}
          >
            <Box
              component="img"
              src="/assets/images/institutional/colombia.svg"
              alt="República de Colombia"
              sx={{
                height: 38,
                width: 'auto',
                objectFit: 'contain',
              }}
            />
            <Box
              component="img"
              src="/assets/images/institutional/logoCaucaHorizontal.png"
              alt="Gobernación del Cauca"
              sx={{
                height: 38,
                width: 'auto',
                objectFit: 'contain',
              }}
            />
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: '#E2E8F0' }} />
          </Box>
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                color: '#1D3867',
                fontWeight: 800,
                fontSize: { xs: '0.95rem', sm: '1.15rem' },
                lineHeight: 1.2,
                fontFamily: "'Poppins', sans-serif",
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Secretaría de Educación y Cultura
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#64748B',
                fontSize: '0.75rem',
                fontWeight: 500,
                display: 'block',
                lineHeight: 1.2,
              }}
            >
              Gobernación del Cauca • SmartAuditorIA SGSI
            </Typography>
          </Box>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ 
                width: 38, 
                height: 38, 
                background: 'linear-gradient(135deg, #1D3867 0%, #2A4F8A 100%)',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 700
              }}>
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#1D3867',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  {user?.username}
                </Typography>
                <Chip
                  label={currentUserRole || "USUARIO"}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: '#eb6408',
                    backgroundColor: 'rgba(235, 100, 8, 0.08)',
                    border: '1px solid rgba(235, 100, 8, 0.3)',
                    '& .MuiChip-label': {
                      px: 0.6,
                    },
                  }}
                />
              </Box>
            </Box>
            
            <IconButton
              size="large"
              aria-label="configuración de usuario"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              sx={{
                color: '#475569',
                '&:hover': {
                  backgroundColor: '#F1F4F9',
                  color: '#1D3867'
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
                  boxShadow: '0 10px 25px rgba(29, 56, 103, 0.1)',
                  border: '1px solid #E2E8F0',
                  mt: 1,
                  minWidth: 200
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E2E8F0' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1D3867' }}>
                  {user?.username}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Rol: {user?.rol_nombre}
                </Typography>
              </Box>
              <MenuItem
                onClick={handleLogout}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    backgroundColor: '#FEF2F2',
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#EF4444', minWidth: 36 }}>
                  <Logout fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Cerrar Sesión"
                  primaryTypographyProps={{
                    color: '#EF4444',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navegación del sistema"
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
          backgroundColor: '#F7F8FA',
          minHeight: '100vh',
        }}
      >
        {/* Espaciador para compensar el AppBar con Ribbon GOV.CO */}
        <Box sx={{ height: { xs: '100px', sm: '104px' } }} />
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            minHeight: 'calc(100vh - 104px)',
            backgroundColor: '#F7F8FA',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
