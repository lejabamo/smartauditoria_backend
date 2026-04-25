export interface DocumentoAdjunto {
  id: string;
  nombre: string;
  tipo: string;
  tamano: number;
  url: string;
  fechaSubida: string;
  descripcion?: string;
}

export interface AccionPlan {
  id: string;
  titulo: string;
  descripcion: string;
  responsable: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  comentarios: string;
  documentos?: DocumentoAdjunto[];
}

export interface DocumentoAccion {
  accionId: string;
  documentos: DocumentoAdjunto[];
}

class DocumentosService {
  private baseUrl = '/api/documentos';

  async subirDocumento(archivo: File, accionId: string, descripcion?: string): Promise<DocumentoAdjunto> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('accionId', accionId);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseUrl}/subir`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al subir el documento' }));
        throw new Error(errorData.error || 'Error al subir el documento');
      }

      const result = await response.json();
      return result.documento || result;
    } catch (error) {
      console.error('Error al subir documento:', error);
      throw error;
    }
  }

  async obtenerDocumentosAccion(accionId: string): Promise<DocumentoAdjunto[]> {
    try {
      const response = await fetch(`${this.baseUrl}/accion/${accionId}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener documentos');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      return [];
    }
  }

  async descargarDocumento(documentoId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/descargar/${documentoId}`);
      
      if (!response.ok) {
        throw new Error('Error al descargar el documento');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error al descargar documento:', error);
      throw error;
    }
  }

  async eliminarDocumento(documentoId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${documentoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el documento');
      }
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      throw error;
    }
  }

  validarTipoArchivo(archivo: File): boolean {
    const tiposPermitidos = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];

    return tiposPermitidos.includes(archivo.type);
  }

  validarTamanoArchivo(archivo: File): boolean {
    const maxSize = 10 * 1024 * 1024;
    return archivo.size <= maxSize;
  }

  formatearTamano(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  obtenerIconoTipo(tipo: string): string {
    if (tipo.includes('pdf')) return 'ðŸ“„';
    if (tipo.includes('word') || tipo.includes('document')) return 'ðŸ“';
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return 'ðŸ“Š';
    if (tipo.includes('image')) return 'ðŸ–¼ï¸';
    if (tipo.includes('text')) return 'ðŸ“„';
    return 'ðŸ“Ž';
  }
}

export const documentosService = new DocumentosService();

