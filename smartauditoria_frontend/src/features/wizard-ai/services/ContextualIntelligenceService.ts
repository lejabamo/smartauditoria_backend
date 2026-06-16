/**
 * Servicio: Inteligencia Contextual
 * 
 * Se encarga de obtener activos gemelos (Twin Assets) y evaluaciones
 * previas para guiar al auditor basado en el historial del sistema.
 */

import { apiRequest } from '../../../services/api';
import type { SimilarAsset } from '../domain/types';

export interface IContextualIntelligenceService {
  fetchSimilarAssets(assetId: string, assetType: string, assetName: string): Promise<SimilarAsset[]>;
}

export class ContextualIntelligenceService implements IContextualIntelligenceService {
  /**
   * Obtiene activos similares desde el backend.
   * Filtra por tipo y nombre para encontrar las mejores coincidencias.
   */
  async fetchSimilarAssets(
    assetId: string,
    assetType: string,
    assetName: string
  ): Promise<SimilarAsset[]> {
    if (!assetId) return [];

    try {
      const response = await apiRequest<{ success: boolean; activos: SimilarAsset[] }>(
        '/evaluacion-riesgos/activos-similares',
        {
          method: 'POST',
          body: JSON.stringify({
            activo_id: assetId,
            tipo_activo: assetType,
            nombre_activo: assetName
          })
        }
      );

      if (response.success && Array.isArray(response.activos)) {
        return response.activos;
      }

      return [];
    } catch (error) {
      console.error('Error fetching similar assets:', error);
      // Fallback a lista vacía para no bloquear la UI
      return [];
    }
  }
}
