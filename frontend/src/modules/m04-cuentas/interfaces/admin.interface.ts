export type EstadoSolicitudEmpresa = 'pendiente' | 'aprobada' | 'rechazada';

export interface SolicitudEmpresa {
  id_solicitud: string;
  id_usuario: number;
  nombre_empresa: string;
  nombre_representante: string;
  correo_empresarial: string;
  telefono: string;
  nit: string;
  estado: EstadoSolicitudEmpresa;
  motivo_rechazo?: string | null;
  tipo_solicitud: 'registro' | 'ascenso_particular';
  fecha_solicitud: string;
  fecha_revision?: string | null;
  id_admin_revisor?: number | null;
}

export interface DictamenSolicitudPayload {
  decision: 'aprobar' | 'rechazar';
  motivoRechazo?: string | null;
}
