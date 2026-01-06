
export enum UserRole {
  ADMIN = 'Administrador',
  CONTRATANTE = 'Contratante',
  INTEGRANTE = 'Integrante'
}

export enum EventStatus {
  SOLICITADO = 'Solicitado',
  EM_ANALISE = 'Em análise',
  ORCAMENTO_GERADO = 'Orçamento gerado',
  ACEITO = 'Aceito',
  RECUSADO = 'Recusado',
  CANCELADO = 'Cancelado',
  CONFIRMADO = 'Confirmado',
  CONCLUIDO = 'Concluído'
}

export enum EquipmentStatus {
  OPERANDO = 'Operando',
  MANUTENCAO = 'Em manutenção'
}

export type ShowType = 'Casamento' | 'Aniversário' | 'Formatura' | 'Confraternização' | 'Outros';
export type TipoIntegrante = 'Músico' | 'Dançarina' | 'Produção';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  phoneNumber?: string;
  pixKey?: string;
  endereco?: string;
  tipoIntegrante?: TipoIntegrante;
  funcao?: string;
}

export interface HSEquipment {
  id?: string;
  displayName: string;
  statusEquipamento: EquipmentStatus;
  createdAt: string;
  photoUrlEquipamento?: string;
}

export interface HSEquipmentAllocation {
  id?: string;
  createdAt: string;
  showId: string;
  equipamentoId: string;
  valorAlocacao: number;
  note: string;
}

export interface HSEventContratacao {
  id?: string;
  createdAt: string;
  showId: string;
  integranteId: string;
  cache: number;
  confirmacao: boolean;
  statusContratacao?: 'Pago' | 'Pendente';
  note: string;
}

export interface HSEventFinance {
  id: string; // Mesmo ID do evento
  createdAt: string;
  valorEquipe: number;
  valorEquipamento: number;
  valorAlimentacao: number;
  valorTransporte: number;
  valorOutros: number;
  valorEvento: number;
  valorPago: number;
  saldoPendente: number;
  statusPagamento: 'Quitado' | 'Em aberto';
}

export interface EventPayment {
  id: string;
  amount: number;
  date: string;
  status: 'Pendente' | 'Confirmado';
  proofUrl?: string;
}

export interface HSEvent {
  id: string;
  createdAt: string;
  titulo: string;
  tipo: ShowType;
  duracao: number;
  dataEvento: string;
  horaEvento: string;
  local: string;
  enderecoEvento: string;
  publicoEstimado: number;
  somContratado: boolean;
  alimentacaoInclusa: boolean;
  cerimonialista?: string;
  localCerimonia?: string;
  observacoes: string;
  contratanteId: string;
  status: EventStatus;
  
  budget?: {
    value: number;
    details: string;
    status: 'Pendente' | 'Aceito' | 'Recusado';
  };
  integrantesIds: string[];
  confirmedIntegrantes: string[];
  payments: EventPayment[];
  contractUrl?: string;
}
