# Manual do Usuário - SharePoint Reporter

## 1. Introdução
O **SharePoint Reporter** é um sistema corporativo avançado desenvolvido para consolidar, monitorar e exportar dados gerenciais provenientes das listas do Microsoft SharePoint. A plataforma oferece à equipe de suporte e gestão uma visão centralizada para o acompanhamento de chamados técnicos e o gerenciamento de apontamentos de horas.

## 2. Acesso e Segurança (Autenticação)
Visando os mais altos padrões de segurança corporativa, o acesso ao sistema é estritamente protegido.
1. Acesse o portal da aplicação (ex: *https://geradorrelatorios-bgsti.netlify.app*).
2. Na tela inicial, selecione **Entrar com Microsoft**.
3. Insira suas credenciais corporativas padrão. 
4. A autorização é controlada pelo Microsoft Entra ID (Azure AD), garantindo que apenas usuários com permissões no *tenant* institucional acessem os dados sensíveis.

## 3. Visão Geral: Painel de Controle (Dashboard)
Após a autenticação bem-sucedida, você será direcionado ao **Centro de Operações** (Dashboard), que exibe os indicadores de desempenho essenciais em tempo real:
*   **Métricas de Chamados:** Exibição quantitativa para o mês vigente, categorizada por status (Abertos, Em andamento, Finalizados e Total).
*   **Métricas de Apontamentos:** Soma total (em horas e minutos) do tempo produtivo registrado pela equipe técnica no período.
*   **Navegação Rápida:** Botões de atalho para acessar a listagem completa ("Ver Relatórios") ou a presente documentação ("Documentação").

## 4. Relatório de Chamados
Módulo dedicado à análise e auditoria das requisições de atendimento da equipe de suporte.
*   **Acesso:** Escolha a opção **Relatório de Chamados** localizada no menu lateral.
*   **Filtros de Busca:** Utilize o painel superior para isolar dados específicos. É possível filtrar as informações de forma combinada por:
    *   *Cliente* (busca textual)
    *   *Status* (Aberto, Em andamento, Finalizado)
    *   *Período* (Data Inicial e Data Final)
*   **Exportação de Dados:** Diferentes instâncias exigem diferentes formatos. O sistema permite extrair a matriz visualizada clicando nos botões **PDF** (layout otimizado para leitura em paisagem) ou **Excel** (planilha pronta para consolidação de dados ou cruzamentos de informações).

## 5. Relatório de Apontamentos
Módulo focado no acompanhamento cronológico da alocação da equipe.
*   **Acesso:** Selecione a aba **Relatório de Apontamentos** através do menu de navegação.
*   **Tratamento de Dados:** As horas computadas são automaticamente convertidas de formatos decimais para leituras usuais (horas e minutos). O cálculo respeita o fuso horário (America/Sao_Paulo).
*   **Visualização:** O painel informa quem realizou a tarefa, o título do apontamento, hora de início/início, duração e a descrição exata das ações prestadas.
*   **Exportação:** Em conformidade estrutural com o módulo de chamados, todas as informações resultantes da filtragem podem ser exportadas nos padrões `.pdf` e `.xlsx`.

## 6. Boas Práticas e Resolução de Problemas
Como uma plataforma robusta projetada sob as melhores práticas de infraestrutura (DevOps) e arquitetura de back-end:
*   **Latência e Sincronização:** Todas as consultas demandam a API do Microsoft Graph. Em casos de bases de dados vastas, aguarde a finalização da barra de carregamento.
*   **Loops de Acesso:** Caso o sistema retorne frequentemente para a tela de autenticação, o comportamento pode indicar ausência de tokens temporários válidos ou disparidade na URI configurada. Emita o alerta à equipe de desenvolvimento / DevSecOps responsável.
*   **Sigilo Exportado:** Manipule os arquivos PDF e Excel gerados com a mesma prudência exigida para o manuseio dos dados originais da plataforma SharePoint.

---
*Documentação gerada automaticamente visando governança, clareza e manutenção contínua.*
