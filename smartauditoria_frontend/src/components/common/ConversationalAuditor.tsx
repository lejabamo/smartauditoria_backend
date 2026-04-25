import React from 'react';
import { Box, Typography, Paper, Fade, Avatar as MuiAvatar } from '@mui/material';
import { SmartToy, Warning, Security, CheckCircle } from '@mui/icons-material';

interface ConversationalAuditorProps {
    message: string;
    isTyping: boolean;
    sentiment?: 'neutral' | 'warning' | 'critical' | 'success';
}

const ConversationalAuditor: React.FC<ConversationalAuditorProps> = ({ message, isTyping, sentiment = 'neutral' }) => {
    
    const getSentimentConfig = () => {
        switch (sentiment) {
            case 'warning': return { color: '#F59E0B', icon: <Warning /> };
            case 'critical': return { color: '#EF4444', icon: <Warning /> };
            case 'success': return { color: '#10B981', icon: <CheckCircle /> };
            default: return { color: '#3B82F6', icon: <SmartToy /> };
        }
    };

    const config = getSentimentConfig();

    return (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'start', p: 3, mb: 4, position: 'relative' }}>
            {/* Avatar Holografico Animado */}
            <Box sx={{ position: 'relative' }}>
                <MuiAvatar 
                    sx={{ 
                        width: 100, 
                        height: 100, 
                        bgcolor: config.color,
                        boxShadow: `0 0 25px ${config.color}80`,
                        border: '4px solid white',
                        transition: 'all 0.5s ease',
                        animation: isTyping ? 'pulse 1.5s infinite' : 'none'
                    }}
                >
                    {React.cloneElement(config.icon as any, { sx: { fontSize: 50, color: 'white' } } as any)}
                </MuiAvatar>
                {/* Glow effect circular */}
                <Box sx={{
                    position: 'absolute',
                    top: -10,
                    left: -10,
                    right: -10,
                    bottom: -10,
                    borderRadius: '50%',
                    border: `2px solid ${config.color}`,
                    animation: 'spin 8s linear infinite',
                    opacity: 0.4
                }} />
            </Box>

            {/* Globo de Dialogo Conversacional */}
            <Fade in={true} timeout={1500}>
                <Paper 
                    elevation={6}
                    sx={{ 
                        p: 3, 
                        borderRadius: '0px 24px 24px 24px',
                        maxWidth: '75%',
                        bgcolor: 'white',
                        borderLeft: `8px solid ${config.color}`,
                        position: 'relative',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: -18,
                            top: 20,
                            borderStyle: 'solid',
                            borderWidth: '12px 18px 12px 0',
                            borderColor: `transparent white transparent transparent`
                        }
                    }}
                >
                    <Typography variant="overline" sx={{ color: config.color, fontWeight: 800, letterSpacing: 1.5, mb: 1, display: 'block' }}>
                        SMARTAUDITOR IA - PROTOCOLO ISO 27001
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#2F3E46', fontStyle: 'italic', fontWeight: 500, fontSize: '1.1rem', lineHeight: 1.6 }}>
                        {isTyping ? "Sincronizando con base vectorial..." : `"${message}"`}
                    </Typography>
                </Paper>
            </Fade>

            <style>
                {`
                    @keyframes pulse {
                        0% { transform: scale(1); opacity: 0.9; }
                        50% { transform: scale(1.05); opacity: 1; }
                        100% { transform: scale(1); opacity: 0.9; }
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </Box>
    );
};

export default ConversationalAuditor;
