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
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #0F172A 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          {/* Logo Section */}
          <Box sx={{ textAlign: "center" }}>
            <Box
              sx={{
                width: 76,
                height: 76,
                borderRadius: "20px",
                background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 30px rgba(59, 130, 246, 0.4)",
                mb: 2,
                mx: "auto",
                border: "2px solid rgba(255,255,255,0.15)",
              }}
            >
              <ShieldIcon sx={{ color: "#FFFFFF", fontSize: 42 }} />
            </Box>
            <Typography
              variant="h4"
              sx={{
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: { xs: "2rem", sm: "2.3rem" },
                mb: 0.5,
                letterSpacing: "-0.02em",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              SmartAuditorIA
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: "#93C5FD",
                fontWeight: 500,
                fontSize: "1rem",
                mb: 0.5,
              }}
            >
              Gobernanza y Auditoría de Seguridad TI (SGSI)
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#94A3B8",
                fontSize: "0.85rem",
              }}
            >
              ISO/IEC 27001 • MIPG / DAFP V7 • Control de Acceso RBAC
            </Typography>
          </Box>
        </Box>

        <Card
          sx={{
            maxWidth: 480,
            mx: "auto",
            borderRadius: "20px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(16px)",
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  color: "#0F172A",
                  fontWeight: 700,
                  fontFamily: "'Poppins', sans-serif",
                  mb: 0.5,
                }}
              >
                Iniciar Sesión
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#64748B",
                  fontSize: "0.9rem",
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
                  borderRadius: "12px",
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
                        <PersonIcon sx={{ color: "#64748B" }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: "12px" },
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
                        <LockIcon sx={{ color: "#64748B" }} />
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
                    sx: { borderRadius: "12px" },
                  }}
                />

                {/* Enlace de recuperación de contraseña */}
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<KeyIcon sx={{ fontSize: "1rem" }} />}
                    onClick={handleOpenRecovery}
                    sx={{
                      color: "#2563EB",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      p: 0,
                      "&:hover": {
                        backgroundColor: "transparent",
                        textDecoration: "underline",
                      },
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  disabled={isLoading}
                  startIcon={!isLoading && <LoginIcon />}
                  sx={{
                    background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)",
                    color: "#FFFFFF",
                    py: 1.5,
                    borderRadius: "12px",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "1rem",
                    boxShadow: "0 4px 14px rgba(30, 58, 138, 0.35)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)",
                      transform: "translateY(-1px)",
                      boxShadow: "0 6px 18px rgba(30, 58, 138, 0.45)",
                    },
                    "&:disabled": {
                      background: "#94A3B8",
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
                    background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)",
                    fontWeight: 600,
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

        {/* Footer */}
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography
            variant="caption"
            sx={{
              color: "#94A3B8",
              fontSize: "0.85rem",
            }}
          >
            © 2026 SmartAuditorIA | Maestría en Computación | Universidad del Valle
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
