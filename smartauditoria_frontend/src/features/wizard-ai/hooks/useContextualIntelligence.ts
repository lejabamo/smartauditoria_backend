/**
 * Hook: useContextualIntelligence
 * 
 * Gestiona el ciclo de vida de la inteligencia contextual.
 * Reacciona cuando el usuario selecciona un activo diferente.
 */

import { useState, useEffect, useCallback } from 'react';
import type { SimilarAsset, ContextualIntelligenceData } from '../domain/types';
import { ContextualIntelligenceService, type IContextualIntelligenceService } from '../services/ContextualIntelligenceService';

interface UseContextualIntelligenceProps {
  assetId: string;
  assetType: string;
  assetName: string;
  service?: IContextualIntelligenceService;
}

export const useContextualIntelligence = ({
  assetId,
  assetType,
  assetName,
  service = new ContextualIntelligenceService()
}: UseContextualIntelligenceProps): ContextualIntelligenceData => {
  const [data, setData] = useState<SimilarAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadSimilarAssets = useCallback(async () => {
    if (!assetId) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const assets = await service.fetchSimilarAssets(assetId, assetType, assetName);
      setData(assets);
    } catch (err: any) {
      setError(err.message || 'Error al cargar inteligencia contextual');
    } finally {
      setLoading(false);
    }
  }, [assetId, assetType, assetName, service]);

  useEffect(() => {
    loadSimilarAssets();
  }, [loadSimilarAssets]);

  return {
    twinAssets: data,
    loading,
    error
  };
};
