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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  LinearProgress,
  Chip,
} from "@mui/material";
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  Login as LoginIcon,
  VpnKey as KeyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { usuariosService } from "../../services/backend";
import "../../styles/design-system.css";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Estados para Recuperación de Contraseña (HU-010 / SCRUM-37)
  const [openRecoveryDialog, setOpenRecoveryDialog] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(0);
  const [recoveryIdentifier, setRecoveryIdentifier] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverySuccessData, setRecoverySuccessData] = useState<any>(null);

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
        toast.success("¡Bienvenido al sistema!");
        navigate("/dashboard");
      } else {
        setError("Credenciales inválidas o cuenta temporalmente bloqueada");
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRecovery = () => {
    setRecoveryStep(0);
    setRecoveryIdentifier(username || "");
    setRecoveryToken("");
    setRecoveryCode("");
    setNewPassword("");
    setConfirmPassword("");
    setRecoverySuccessData(null);
    setOpenRecoveryDialog(true);
  };

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryIdentifier.trim()) {
      toast.error("Por favor ingresa tu nombre de usuario o correo");
      return;
    }

    setIsRecovering(true);
    try {
      const data = await usuariosService.forgotPassword(recoveryIdentifier.trim());
      setRecoverySuccessData(data);
      setRecoveryToken(data.reset_token || "");
      setRecoveryCode(data.reset_code || "");
      setRecoveryStep(1);
      toast.success("Token de recuperación generado exitosamente");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "No se encontró usuario con los datos ingresados";
      toast.error(msg);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryToken) {
      toast.error("El token de recuperación es requerido");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("La contraseña debe tener mínimo 8 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setIsRecovering(true);
    try {
      const res = await usuariosService.resetPasswordWithToken(recoveryToken, newPassword);
      toast.success(res.message || "Contraseña restablecida exitosamente");
      // Pre-cargar username en login
      if (recoverySuccessData?.username) {
        setUsername(recoverySuccessData.username);
      }
      setPassword("");
      setOpenRecoveryDialog(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Error al restablecer la contraseña";
      toast.error(msg);
    } finally {
      setIsRecovering(false);
    }
  };

  // Cálculo de fortaleza de contraseña
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score += 25;
    return score;
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #FFFFFF 0%, #F4F6F9 100%)",
      }}
    >
      {/* 1. Franja Superior Oficial GOV.CO */}
      <Box
        component="header"
        sx={{
          backgroundColor: "#3366CC", // colorGob oficial
          py: 1,
          px: { xs: 2, sm: 4 },
          display: "flex",
          alignItems: "center",
          justifyContent: { xs: "center", sm: "flex-start" },
          boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
          zIndex: 10,
        }}
      >
        <a
          href="https://www.gov.co/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          <Box
            component="img"
            src="/assets/images/institutional/logoGov.svg"
            alt="Portal GOV.CO"
            sx={{
              height: 24,
              width: "auto",
              filter: "brightness(0) invert(1)", // Blanco puro oficial
            }}
          />
        </a>
      </Box>

      {/* 2. Encabezado Institucional - Escudos y Secretaría */}
      <Box
        sx={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          py: { xs: 1.2, sm: 1.8 },
          px: { xs: 2, sm: 4 },
          boxShadow: "0 1px 3px rgba(29, 56, 103, 0.05)",
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            {/* Escudos Oficiales */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              <Box
                component="img"
                src="/assets/images/institutional/colombia.svg"
                alt="República de Colombia"
                sx={{
                  height: { xs: 38, sm: 48 },
                  width: "auto",
                  objectFit: "contain",
                }}
              />
              <Box
                sx={{
                  height: { xs: 32, sm: 40 },
                  width: "1px",
                  backgroundColor: "#CBD5E1",
                }}
              />
              <Box
                component="img"
                src="/assets/images/institutional/logoCaucaHorizontal.png"
                alt="Gobernación del Cauca"
                sx={{
                  height: { xs: 38, sm: 48 },
                  width: "auto",
                  objectFit: "contain",
                }}
              />
            </Box>

            {/* Título de la Entidad */}
            <Box sx={{ textAlign: { xs: "center", md: "right" } }}>
              <Typography
                variant="h6"
                sx={{
                  color: "#1D3867", // Cauca Navy
                  fontWeight: 800,
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                  fontFamily: "'Poppins', sans-serif",
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                }}
              >
                Secretaría de Educación y Cultura
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: { xs: "0.8rem", sm: "0.9rem" },
                  lineHeight: 1.3,
                }}
              >
                Gobernación del Cauca
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 3. Contenedor Principal del Formulario */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 2.5, sm: 3.5 },
          px: 2,
        }}
      >
        <Container maxWidth="sm">
          {/* Badge del Sistema SmartAuditorIA */}
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.2,
                px: 2.2,
                py: 0.6,
                borderRadius: "50px",
                backgroundColor: "rgba(29, 56, 103, 0.06)",
                border: "1px solid rgba(29, 56, 103, 0.15)",
                mb: 1,
              }}
            >
              <ShieldIcon sx={{ color: "#eb6408", fontSize: 20 }} />
              <Typography
                variant="subtitle2"
                sx={{
                  color: "#1D3867",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  fontSize: "0.85rem",
                }}
              >
                SmartAuditorIA • SGSI
              </Typography>
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: "#64748B",
                fontSize: "0.82rem",
                fontWeight: 500,
              }}
            >
              ISO/IEC 27001 • MIPG / DAFP V7 • Control de Acceso RBAC
            </Typography>
          </Box>

          {/* Tarjeta de Inicio de Sesión */}
          <Card
            sx={{
              maxWidth: 450,
              mx: "auto",
              borderRadius: "16px",
              boxShadow: "0 12px 36px -10px rgba(29, 56, 103, 0.14)",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              overflow: "hidden",
            }}
          >
            {/* Franja superior decorativa en tarjeta */}
            <Box
              sx={{
                height: 4,
                background: "linear-gradient(90deg, #1D3867 0%, #3366CC 50%, #eb6408 100%)",
              }}
            />

            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <Box sx={{ textAlign: "center", mb: 2.5 }}>
                <Typography
                  variant="h5"
                  sx={{
                    color: "#1D3867",
                    fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: { xs: "1.25rem", sm: "1.45rem" },
                    mb: 0.5,
                  }}
                >
                  Iniciar Sesión
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#64748B",
                    fontSize: "0.85rem",
                  }}
                >
                  Ingresa tus credenciales autorizadas del sistema
                </Typography>
              </Box>

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    borderRadius: "10px",
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#991B1B",
                  }}
                >
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label="Usuario o Correo Institucional"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="ej. admin, operador, auxiliar"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: "#1D3867" }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: "10px" },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Contraseña"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: "#1D3867" }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: { borderRadius: "10px" },
                    }}
                  />

                  {/* Enlace de recuperación de contraseña */}
                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<KeyIcon sx={{ fontSize: "1rem", color: "#eb6408" }} />}
                      onClick={handleOpenRecovery}
                      sx={{
                        color: "#1D3867",
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        p: 0,
                        "&:hover": {
                          backgroundColor: "transparent",
                          color: "#eb6408",
                          textDecoration: "underline",
                        },
                      }}
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </Box>

                  {/* Botón Principal en Naranja Cauca Oficial #eb6408 */}
                  <Button
                    type="submit"
                    fullWidth
                    disabled={isLoading}
                    startIcon={!isLoading && <LoginIcon />}
                    sx={{
                      background: "linear-gradient(135deg, #eb6408 0%, #f97316 100%)",
                      color: "#FFFFFF",
                      py: 1.5,
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "1rem",
                      boxShadow: "0 4px 14px rgba(235, 100, 8, 0.35)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #c85305 0%, #eb6408 100%)",
                        transform: "translateY(-1px)",
                        boxShadow: "0 6px 18px rgba(235, 100, 8, 0.45)",
                      },
                      "&:disabled": {
                        background: "#CBD5E1",
                        color: "#94A3B8",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isLoading ? (
                      <CircularProgress size={24} sx={{ color: "#FFFFFF" }} />
                    ) : (
                      "Acceder al Sistema"
                    )}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>

          {/* Pie Institucional */}
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography
              variant="caption"
              sx={{
                color: "#64748B",
                fontSize: "0.82rem",
                display: "block",
                lineHeight: 1.6,
              }}
            >
              Gobernación del Cauca • Secretaría de Educación y Cultura<br />
              Sistema de Gestión de Seguridad de la Información (SGSI) • Popayán, Colombia
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Modal de Recuperación de Contraseña (HU-010 / SCRUM-37) */}
        <Dialog
          open={openRecoveryDialog}
          onClose={() => !isRecovering && setOpenRecoveryDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              p: 1,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1E40AF",
                }}
              >
                <KeyIcon />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
                  Recuperación de Contraseña
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748B" }}>
                  Autoservicio Seguro con Token Criptográfico (SCRUM-37)
                </Typography>
              </Box>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ pt: 2 }}>
            <Stepper activeStep={recoveryStep} sx={{ mb: 3 }}>
              <Step>
                <StepLabel>1. Identificación</StepLabel>
              </Step>
              <Step>
                <StepLabel>2. Nueva Clave</StepLabel>
              </Step>
            </Stepper>

            {recoveryStep === 0 ? (
              <Box component="form" onSubmit={handleRequestToken}>
                <Typography variant="body2" sx={{ color: "#475569", mb: 2 }}>
                  Ingresa tu nombre de usuario o dirección de correo institucional. El sistema generará
                  un token seguro de restablecimiento válido por 60 minutos.
                </Typography>

                <TextField
                  fullWidth
                  label="Usuario o Correo Institucional"
                  value={recoveryIdentifier}
                  onChange={(e) => setRecoveryIdentifier(e.target.value)}
                  required
                  placeholder="ej. admin@smartauditoria.co o admin"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: "#64748B" }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: "10px" },
                  }}
                  sx={{ mb: 2 }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isRecovering}
                  sx={{
                    py: 1.2,
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #1D3867 0%, #2A4F8A 100%)",
                    fontWeight: 600,
                    "&:hover": {
                      background: "#122443",
                    },
                  }}
                >
                  {isRecovering ? (
                    <CircularProgress size={22} sx={{ color: "#FFFFFF" }} />
                  ) : (
                    "Solicitar Token de Recuperación"
                  )}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleResetPassword}>
                {recoverySuccessData && (
                  <Alert
                    severity="success"
                    sx={{
                      mb: 2.5,
                      borderRadius: "10px",
                      fontSize: "0.85rem",
                    }}
                  >
                    Token generado para <strong>{recoverySuccessData.username}</strong> ({recoverySuccessData.email}).
                    Código de verificación: <strong>{recoverySuccessData.reset_code}</strong>.
                  </Alert>
                )}

                <TextField
                  fullWidth
                  label="Token de Recuperación"
                  value={recoveryToken}
                  onChange={(e) => setRecoveryToken(e.target.value)}
                  required
                  size="small"
                  helperText="Token JWT firmado automáticamente precargado"
                  InputProps={{
                    sx: { borderRadius: "10px", fontFamily: "monospace", fontSize: "0.8rem" },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(recoveryToken);
                            toast.success("Token copiado al portapapeles");
                          }}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Nueva Contraseña"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Mínimo 8 caracteres"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: "#64748B" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                          size="small"
                        >
                          {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { borderRadius: "10px" },
                  }}
                  sx={{ mb: 1 }}
                />

                {/* Barra de fortaleza */}
                {newPassword && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: "#64748B" }}>
                        Seguridad de la clave:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color:
                            strength <= 25 ? "#DC2626" : strength <= 50 ? "#D97706" : "#16A34A",
                        }}
                      >
                        {strength <= 25 ? "Débil" : strength <= 50 ? "Media" : "Robusta"}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={strength}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "#E2E8F0",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor:
                            strength <= 25 ? "#DC2626" : strength <= 50 ? "#D97706" : "#16A34A",
                        },
                      }}
                    />
                  </Box>
                )}

                <TextField
                  fullWidth
                  label="Confirmar Nueva Contraseña"
                  type={showNewPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  error={Boolean(confirmPassword && newPassword !== confirmPassword)}
                  helperText={
                    confirmPassword && newPassword !== confirmPassword
                      ? "Las contraseñas no coinciden"
                      : ""
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: "#64748B" }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: "10px" },
                  }}
                  sx={{ mb: 2.5 }}
                />

                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setRecoveryStep(0)}
                    startIcon={<ArrowBackIcon />}
                    sx={{ borderRadius: "10px", textTransform: "none" }}
                  >
                    Atrás
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isRecovering || newPassword !== confirmPassword || newPassword.length < 8}
                    startIcon={!isRecovering && <CheckCircleIcon />}
                    sx={{
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                      fontWeight: 600,
                      textTransform: "none",
                    }}
                  >
                    {isRecovering ? (
                      <CircularProgress size={22} sx={{ color: "#FFFFFF" }} />
                    ) : (
                      "Confirmar y Restablecer"
                    )}
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setOpenRecoveryDialog(false)}
              disabled={isRecovering}
              sx={{ color: "#64748B" }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
};

export default Login;
