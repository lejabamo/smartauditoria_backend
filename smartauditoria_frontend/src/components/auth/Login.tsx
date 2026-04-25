import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  Container,
  Stack,
} from "@mui/material";
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  Login as LoginIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/design-system.css";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        navigate("/dashboard");
      } else {
        setError("Credenciales invalidas");
      }
    } catch (error) {
      setError("Error al iniciar sesion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          {/* Logo Section */}
          <Box sx={{ textAlign: "center" }}>
            <Box sx={{
              width: 80,
              height: 80,
              borderRadius: "20px",
              background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 25px rgba(30, 58, 138, 0.3)",
              mb: 3,
              mx: "auto"
            }}>
              <ShieldIcon sx={{ color: "#FFFFFF", fontSize: 40 }} />
            </Box>
            <Typography
              variant="h3"
              className="font-poppins"
              sx={{
                color: "#1E3A8A",
                fontWeight: 700,
                fontSize: "2.5rem",
                mb: 1,
                letterSpacing: "-0.02em"
              }}
            >
              SGSRI
            </Typography>
            <Typography
              variant="h6"
              className="font-poppins"
              sx={{
                color: "#6B7280",
                fontWeight: 500,
                fontSize: "1.1rem",
                mb: 0.5
              }}
            >
              Sistema de Gestion de Riesgos
            </Typography>
            <Typography
              variant="body1"
              className="font-roboto"
              sx={{
                color: "#9CA3AF",
                fontSize: "0.95rem"
              }}
            >
              de Informacion
            </Typography>
          </Box>
        </Box>

        <Card
          className="card"
          sx={{
            maxWidth: 480,
            mx: "auto",
            borderRadius: "20px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid #E5E7EB",
            overflow: "hidden"
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography
                variant="h5"
                className="font-poppins"
                sx={{
                  color: "#1E3A8A",
                  fontWeight: 600,
                  mb: 1
                }}
              >
                Iniciar Sesion
              </Typography>
              <Typography
                variant="body2"
                className="font-roboto"
                sx={{
                  color: "#6B7280",
                  fontSize: "0.95rem"
                }}
              >
                Ingresa tus credenciales para acceder al sistema
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: "12px",
                  fontFamily: "'Roboto', sans-serif",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  '& .MuiAlert-icon': {
                    color: '#DC2626',
                  },
                  '& .MuiAlert-message': {
                    color: '#DC2626',
                  }
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="input"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: "#6B7280" }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: "12px" }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1E3A8A',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1E3A8A',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      '&.Mui-focused': {
                        color: '#1E3A8A',
                      },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Contrasena"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="input"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: "#6B7280" }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: "12px" }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1E3A8A',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1E3A8A',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      '&.Mui-focused': {
                        color: '#1E3A8A',
                      },
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  className="btn btn-primary"
                  disabled={isLoading}
                  startIcon={!isLoading && <LoginIcon />}
                  sx={{
                    background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)",
                    color: "#FFFFFF",
                    py: 2,
                    borderRadius: "12px",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "1rem",
                    boxShadow: "0 4px 12px rgba(30, 58, 138, 0.3)",
                    '&:hover': {
                      background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 16px rgba(30, 58, 138, 0.4)",
                    },
                    '&:disabled': {
                      background: "#9CA3AF",
                      transform: "none",
                      boxShadow: "none",
                    },
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} sx={{ color: "#FFFFFF" }} />
                  ) : (
                    "Iniciar Sesion"
                  )}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Footer */}
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography
            variant="caption"
            className="font-roboto"
            sx={{
              color: "#9CA3AF",
              fontSize: "0.8rem"
            }}
          >
            Â© 2025 Sistema de Gestion de Riesgos de Informacion
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
