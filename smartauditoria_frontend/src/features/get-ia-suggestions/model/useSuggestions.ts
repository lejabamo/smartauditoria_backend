import { useState, useCallback } from 'react';
import { evaluacionApi, type SuggestionParams } from '@/entities/evaluacion/api/evaluacionApi';

interface UseSuggestionsReturn {
  suggestions: any[];
  isLoading: boolean;
  error: string | null;
  fetchSuggestions: (params: SuggestionParams) => Promise<void>;
  motorIaDisponibilidad: boolean;
}

/**
 * Hook para gestionar sugerencias del Motor RAG.
 */
export const useSuggestions = (): UseSuggestionsReturn => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [motorIaDisponibilidad, setMotorIaDisponibilidad] = useState(true);

  const fetchSuggestions = useCallback(async (params: SuggestionParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await evaluacionApi.getSuggestions(params);
      setSuggestions(response.sugerencias || []);
      setMotorIaDisponibilidad(response.motor_ia_disponibilidad ?? true);
    } catch (err: any) {
      setError(err.message || 'Error al obtener sugerencias del Motor IA');
      console.error('Error fetching suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    motorIaDisponibilidad,
  };
};
