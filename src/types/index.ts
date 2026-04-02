export interface Chamado {
    id: string; // SharePoint ID
    Title: string; // Número do chamado or Title
    Cliente: string; // Lookup or Text
    DataAbertura: string;
    Created?: string;
    CreatedFormatted?: string;
    DataFechamento?: string;
    Status: string;
    Tecnico: string; // Person or Text
    Descricao: string;
}

export interface Apontamento {
    id: string;
    Title: string;
    Tecnico: string;
    Cliente: string;
    ChamadoId?: string; // Reference to Chamado
    Data: string;
    AnoC: number;
    MesC: number;
    Hora_x0020_Inicio?: string; // Standard SP internal name for "Hora Inicio"
    Hora_x0020_Final?: string;  // Standard SP internal name for "Hora Final"
    DuracaoFormatada?: string;
    HoraInicioFormatada?: string;
    HoraFinalFormatada?: string;
    Horas: number; // Calculated field
    Descricao: string;
    Created?: string;
    CreatedFormatted?: string;
}

export interface Cliente {
    id: string;
    Nome: string;
}
