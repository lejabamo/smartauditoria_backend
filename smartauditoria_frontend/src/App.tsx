import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline, CircularProgress, Box } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/common/Layout";
import Login from "./components/auth/Login";

// Lazy loading de componentes para code splitting
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const Activos = lazy(() => import("./pages/activos/Activos"));
const Usuarios = lazy(() => import("./pages/usuarios/Usuarios"));
const Riesgos = lazy(() => import("./pages/riesgos/Riesgos"));
const Reportes = lazy(() => import("./pages/reportes/Reportes"));
const InformeRiesgos = lazy(() => import("./pages/reportes/InformeRiesgos"));
const EstadisticasActivos = lazy(() => import("./pages/reportes/EstadisticasActivos"));
const TendenciasSeguridad = lazy(() => import("./pages/reportes/TendenciasSeguridad"));
const ReportesUsuarios = lazy(() => import("./pages/reportes/ReportesUsuarios"));
const RiskAssessmentWizard = lazy(() => import("./pages/wizard/RiskAssessmentWizard"));
const AuditControl = lazy(() => import("./pages/auditoria/AuditControl"));
const MapaRiesgosDAFPView = lazy(() => import("./components/reportes/MapaRiesgosDAFPView").then(m => ({ default: m.MapaRiesgosDAFPView })));

const theme = createTheme({
  palette: {
    primary: {
      main: "#1D3867", // Deep Cauca Navy
      light: "#2A4F8A",
      dark: "#122443",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#eb6408", // Cauca Vibrant Orange
      light: "#f97316",
      dark: "#c85305",
      contrastText: "#FFFFFF",
    },
    info: {
      main: "#3366CC", // GOV.CO Blue
    },
    background: {
      default: "#F7F8FA",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1D3867",
      secondary: "#475569",
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 600,
      color: "#1D3867",
    },
    h2: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 600,
      color: "#1D3867",
    },
    h3: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 600,
      color: "#1D3867",
    },
    h4: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 600,
      color: "#1D3867",
    },
    h5: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 600,
      color: "#1D3867",
    },
    h6: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 500,
      color: "#1D3867",
    },
    button: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.95rem',
          fontWeight: 500,
          boxShadow: '0 2px 8px rgba(29, 56, 103, 0.12)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 16px rgba(29, 56, 103, 0.2)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          backgroundColor: '#1D3867',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#122443',
          },
        },
        containedSecondary: {
          backgroundColor: '#eb6408',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#c85305',
          },
        },
        outlined: {
          borderColor: '#1D3867',
          color: '#1D3867',
          '&:hover': {
            borderColor: '#122443',
            backgroundColor: 'rgba(29, 56, 103, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(29, 56, 103, 0.06)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(29, 56, 103, 0.1)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease-in-out',
            '&:hover fieldset': {
              borderColor: '#3366CC',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1D3867',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(29, 56, 103, 0.06)',
        },
      },
    },
  },
});

// Configuracion optimizada de React Query con cache
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Componente de carga para lazy loading
const LoadingFallback: React.FC = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    bgcolor="background.default"
  >
    <CircularProgress />
  </Box>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const currentUserRole = (user?.rol_nombre || (user as any)?.rol || (user as any)?.role || "").toUpperCase();
  if (allowedRoles && user && !allowedRoles.map(r => r.toUpperCase()).includes(currentUserRole)) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <Layout>
      <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/activos"
                  element={
                    <ProtectedRoute>
                      <Activos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/usuarios"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <Usuarios />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/riesgos"
                  element={
                    <ProtectedRoute>
                      <Riesgos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reportes"
                  element={
                    <ProtectedRoute>
                      <Reportes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reportes/mapa-riesgos-dafp"
                  element={
                    <ProtectedRoute>
                      <MapaRiesgosDAFPView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reportes/informe-riesgos"
                  element={
                    <ProtectedRoute>
                      <InformeRiesgos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reportes/estadisticas-activos"
                  element={
                    <ProtectedRoute>
                      <EstadisticasActivos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reportes/tendencias-seguridad"
                  element={
                    <ProtectedRoute>
                      <TendenciasSeguridad />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reportes/reportes-usuarios"
                  element={
                    <ProtectedRoute>
                      <ReportesUsuarios />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wizard"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN", "OPERADOR", "CONSULTOR"]}>
                      <RiskAssessmentWizard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/auditoria"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN", "OPERADOR"]}>
                      <AuditControl />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
        <Toaster position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
