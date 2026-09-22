import api from './api';

export interface Activo {
  ID_Activo: number;
  id?: number;
  ID?: number;
  Nombre: string;
  nombre?: string;
  nombre_Activo?: string;
  Descripcion?: string;
  descripcion?: string;
  Tipo_Activo: string;
  tipo?: string;
  Tipo?: string;
  subtipo_activo?: string;
  ID_Propietario?: number;
  ID_Custodio?: number;
  Nivel_Clasificacion_Confidencialidad: string;
  Nivel_Clasificacion_Integridad: string;
  Nivel_Clasificacion_Disponibilidad: string;
  justificacion_clasificacion_cia?: string;
  nivel_criticidad_negocio: string;
  estado_activo: string;
  fuente_datos_principal?: string;
  id_externo_glpi?: string;
  id_externo_inventario_si?: string;
  fecha_adquisicion?: string;
  version_general_activo?: string;
  requiere_backup: boolean;
  frecuencia_backup_general?: string;
  tiempo_retencion_general?: string;
  fecha_proxima_revision_sgsi?: string;
  procedimiento_eliminacion_segura_ref?: string;
  fecha_creacion_registro: string;
  fecha_ultima_actualizacion_sgsi?: string;

  // Atributos Guía Integral de Riesgos Función Pública V7 (2025)
  macroproceso?: string;
  proceso?: string;
  identificador_trd?: string;
  oficina_responsable?: string;
  serie_documental?: string;
  subserie_documental?: string;
  fecha_generacion?: string;
  fecha_ingreso_archivo?: string;
  soporte_registro?: string;
  medio_conservacion?: string;
  formato?: string;
  idioma?: string;
  es_iccn?: boolean;
  estado_publicacion?: string;
  ubicacion_consulta?: string;
  es_clasificada_reservada?: boolean;
  objeto_legitimo_excepcion?: string;
  fundamento_legal?: string;
  excepcion_alcance?: string;
}

export interface CreateActivoData {
  Nombre: string;
  Descripcion?: string;
  Tipo_Activo: string;
  subtipo_activo?: string;
  ID_Propietario?: number;
  ID_Custodio?: number;
  Nivel_Clasificacion_Confidencialidad?: string;
  Nivel_Clasificacion_Integridad?: string;
  Nivel_Clasificacion_Disponibilidad?: string;
  justificacion_clasificacion_cia?: string;
  nivel_criticidad_negocio?: string;
  estado_activo?: string;
  fuente_datos_principal?: string;
  id_externo_glpi?: string;
  id_externo_inventario_si?: string;
  fecha_adquisicion?: string;
  version_general_activo?: string;
  requiere_backup?: boolean;
  frecuencia_backup_general?: string;
  tiempo_retencion_general?: string;
  fecha_proxima_revision_sgsi?: string;
  procedimiento_eliminacion_segura_ref?: string;

  // Atributos Función Pública V7
  macroproceso?: string;
  proceso?: string;
  identificador_trd?: string;
  oficina_responsable?: string;
  serie_documental?: string;
  subserie_documental?: string;
  fecha_generacion?: string;
  fecha_ingreso_archivo?: string;
  soporte_registro?: string;
  medio_conservacion?: string;
  formato?: string;
  idioma?: string;
  es_iccn?: boolean;
  estado_publicacion?: string;
  ubicacion_consulta?: string;
  es_clasificada_reservada?: boolean;
  objeto_legitimo_excepcion?: string;
  fundamento_legal?: string;
  excepcion_alcance?: string;
}

export interface UpdateActivoData extends Partial<CreateActivoData> {}

export const activosService = {
  // Obtener todos los activos con filtros opcionales
  async getActivos(filters?: {
    tipo_activo?: string;
    estado?: string;
    nivel_criticidad?: string;
  }): Promise<Activo[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.tipo_activo) params.append('tipo_activo', filters.tipo_activo);
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.nivel_criticidad) params.append('nivel_criticidad', filters.nivel_criticidad);

      const response = await api.get(`/activos/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.warn("API fallida, usando Mock Data para Activos");
      return [
        { ID_Activo: 1, Nombre: "Servidor Producción Core", Tipo_Activo: "Hardware", Nivel_Clasificacion_Confidencialidad: "Alta", Nivel_Clasificacion_Integridad: "Alta", Nivel_Clasificacion_Disponibilidad: "Alta", nivel_criticidad_negocio: "Crítica", estado_activo: "En Producción", requiere_backup: true, fecha_creacion_registro: "2026-04-01" },
        { ID_Activo: 2, Nombre: "Base de Datos Usuarios", Tipo_Activo: "Software", Nivel_Clasificacion_Confidencialidad: "Alta", Nivel_Clasificacion_Integridad: "Muy Alta", Nivel_Clasificacion_Disponibilidad: "Alta", nivel_criticidad_negocio: "Crítica", estado_activo: "En Producción", requiere_backup: true, fecha_creacion_registro: "2026-04-02" },
        { ID_Activo: 3, Nombre: "Laptop Auditoría 01", Tipo_Activo: "Hardware", Nivel_Clasificacion_Confidencialidad: "Media", Nivel_Clasificacion_Integridad: "Media", Nivel_Clasificacion_Disponibilidad: "Media", nivel_criticidad_negocio: "Media", estado_activo: "En Producción", requiere_backup: false, fecha_creacion_registro: "2026-04-05" },
        { ID_Activo: 4, Nombre: "Repositorio GitHub Privado", Tipo_Activo: "Servicio Cloud", Nivel_Clasificacion_Confidencialidad: "Muy Alta", Nivel_Clasificacion_Integridad: "Alta", Nivel_Clasificacion_Disponibilidad: "Alta", nivel_criticidad_negocio: "Alta", estado_activo: "En Producción", requiere_backup: true, fecha_creacion_registro: "2026-04-08" }
      ];
    }
  },

  // Obtener un activo especifico
  async getActivo(id: number): Promise<Activo> {
    const response = await api.get(`/activos/${id}`);
    return response.data;
  },

  // Crear un nuevo activo
  async createActivo(data: CreateActivoData): Promise<Activo> {
    try {
      console.log('createActivo called with data:', data);
      console.log('API base URL:', api.defaults.baseURL);
      const response = await api.post('/activos/', data);
      console.log('createActivo response:', response);
      return response.data;
    } catch (error: any) {
      console.error('Error creating activo:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config
      });
      // Re-lanzar el error para que el componente pueda manejarlo
      throw error;
    }
  },

  // Actualizar un activo
  async updateActivo(id: number, data: UpdateActivoData): Promise<Activo> {
    const response = await api.put(`/activos/${id}`, data);
    return response.data;
  },

  // Eliminar un activo
  async deleteActivo(id: number): Promise<void> {
    await api.delete(`/activos/${id}`);
  },

  // Obtener tipos de activo unicos
  async getTiposActivo(): Promise<string[]> {
    const response = await api.get('/activos/tipos');
    return response.data;
  },

  // Obtener estados de activo unicos
  async getEstadosActivo(): Promise<string[]> {
    const response = await api.get('/activos/estados');
    return response.data;
  },

  // Obtener riesgos asociados a un activo
  async getRiesgosActivo(activoId: number): Promise<any[]> {
    const response = await api.get(`/activos/${activoId}/riesgos`);
    return response.data;
  },
  
  // Obtener detalle completo del activo con evaluaciones
  async getDetalleActivo(activoId: number): Promise<any> {
    const response = await api.get(`/activos/${activoId}/detalle`);
    return response.data;
  },

  // Carga masiva inteligente (con soporte Excel, CSV, JSON y Enriquecimiento Copilot IA)
  async bulkUploadActivos(params: {
    file?: File | null;
    activos?: any[];
    enriquecerConIa?: boolean;
    dryRun?: boolean;
  }): Promise<any> {
    if (params.file) {
      const formData = new FormData();
      formData.append('file', params.file);
      formData.append('enriquecer_con_ia', params.enriquecerConIa ? 'true' : 'false');
      formData.append('dry_run', params.dryRun ? 'true' : 'false');
      const response = await api.post('/activos/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } else {
      const response = await api.post('/activos/bulk-upload', {
        activos: params.activos || [],
        enriquecer_con_ia: !!params.enriquecerConIa,
        dry_run: !!params.dryRun,
      });
      return response.data;
    }
  },

  // Generador de plantilla oficial DAFP V7 en Excel (.xlsx)
  downloadActivosTemplate(): void {
    import('xlsx').then(XLSX => {
      const headers = [
        'Nombre',
        'Descripcion',
        'Tipo_Activo',
        'Subtipo_Activo',
        'Macroproceso',
        'Proceso',
        'Identificador_TRD',
        'Oficina_Responsable',
        'Serie_Documental',
        'Subserie_Documental',
        'Soporte_Registro',
        'Medio_Conservacion',
        'Formato',
        'Idioma',
        'Es_ICCN',
        'Es_Clasificada_Reservada',
        'Objeto_Legitimo_Excepcion',
        'Fundamento_Legal',
        'Confidencialidad',
        'Integridad',
        'Disponibilidad',
        'Criticidad_Negocio'
      ];

      const sampleRows = [
        [
          'Expediente de Contratación Auditoría Externa 2026',
          'Documentación precontractual, propuestas y contratos de auditoría bajo reserva legal.',
          'Documental',
          'Expediente Contractual',
          'Misional',
          'Gestión Contractual',
          'TRD-120-004',
          'Subdirección Jurídica',
          'Contratos',
          'Contratos de Consultoría',
          'Digital',
          'SGDEA Institucional / Servidor Seguro',
          'PDF/A',
          'Español',
          'SI',
          'SI',
          'Protección del secreto comercial y financiero de contratistas',
          'Ley 1712 de 2014 Art. 18 lit. b',
          'Alto',
          'Alto',
          'Medio',
          'Alto'
        ],
        [
          'Base de Datos del Sistema de Nómina y Prestaciones',
          'Repositorio MariaDB con salarios, cuentas bancarias y datos personales de funcionarios.',
          'Software',
          'Base de Datos Relacional',
          'Apoyo',
          'Gestión del Talento Humano',
          'TRD-210-002',
          'Subdirección de Gestión Humana',
          'Historias Laborales',
          'Planillas de Nómina',
          'Digital',
          'Servidor en Nube Privada',
          'SQL / MariaDB',
          'Español',
          'SI',
          'SI',
          'Datos sensibles y financieros amparados por Habeas Data',
          'Ley 1581 de 2012; Ley 1712 de 2014 Art. 18',
          'Crítico',
          'Alto',
          'Alto',
          'Crítico'
        ],
        [
          'Servidor Físico Principal de Virtualización',
          'Clúster VMware para hosting de sistemas misionales y portal web.',
          'Hardware',
          'Servidor Rackeable',
          'Apoyo',
          'Tecnología e Infraestructura',
          'TRD-500-01',
          'Área de TIC',
          'Inventario TI',
          'Servidores y Clústers',
          'Digital',
          'Data Center Institucional',
          'Físico',
          'Español',
          'SI',
          'NO',
          '',
          '',
          'Medio',
          'Alto',
          'Crítico',
          'Alto'
        ]
      ];

      const wsData = [headers, ...sampleRows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Auto-anchos de columnas
      ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 18) }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Activos DAFP V7');
      XLSX.writeFile(wb, 'Plantilla_Carga_Masiva_Activos_DAFP_V7.xlsx');
    }).catch(err => {
      console.error('Error cargando módulo xlsx para plantilla:', err);
    });
  }
};

