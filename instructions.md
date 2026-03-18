# Manual de Instalação e Configuração

## 1. Configuração do Azure AD (Microsoft Entra ID)

Para que a autenticação e o acesso ao SharePoint funcionem, você precisa registrar um aplicativo no Azure Portal.

1. Acesse [portal.azure.com](https://portal.azure.com).
2. Vá em **Microsoft Entra ID** (antigo Azure Active Directory).
3. Clique em **App registrations** > **New registration**.
4. Preencha:
   - **Name**: `SharePoint Reporter` (ou nome de sua preferência)
   - **Supported account types**: "Accounts in this organizational directory only" (Single Tenant).
   - **Redirect URI**: Web > `http://localhost:3000/api/auth/callback/azure-ad`
5. Clique em **Register**.

### Configurar Permissões (API Permissions)
1. No menu do app, vá em **API permissions**.
2. Clique em **Add a permission** > **Microsoft Graph**.
3. Escolha **Delegated permissions**.
4. Selecione:
   - `User.Read` (Padrão)
   - `Sites.Read.All` (Para ler as listas do SharePoint)
   - `offline_access` (Para manter a sessão)
5. Clique em **Add permissions**.
6. **Importante**: Clique em **Grant admin consent for [Sua Empresa]** para aprovar as permissões.

### Gerar Segredo (Client Secret)
1. Vá em **Certificates & secrets**.
2. Clique em **New client secret**.
3. Defina uma descrição e validade.
4. **Copie o Value imediatamente** (ele não será mostrado novamente). Esse será o `AZURE_AD_CLIENT_SECRET`.

### Configurar Variáveis de Ambiente
1. Renomeie o arquivo `.env.local.example` para `.env.local` na raiz do projeto.
2. Preencha os valores:
   - `AZURE_AD_CLIENT_ID`: Copie do "Application (client) ID" na tela Overview.
   - `AZURE_AD_TENANT_ID`: Copie do "Directory (tenant) ID".
   - `AZURE_AD_CLIENT_SECRET`: O valor copiado no passo anterior.
   - `SHAREPOINT_SITE_ID`: O ID do site onde estão as listas. Use o [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer) para descobrir (GET `https://graph.microsoft.com/v1.0/sites?search=NomeDoSite`).

## 2. Preparação do SharePoint

O sistema espera duas Listas no site configurado:

1. **Chamados**
   - Colunas: `Title` (Texto/Número), `Cliente` (Texto), `DataAbertura` (Data/Hora), `DataFechamento` (Data/Hora), `Status` (Escolha: Em Aberto, Fechado), `Tecnico` (Pessoa ou Texto), `Descricao` (Texto Multilinha).

2. **Apontamentos**
   - Colunas: `Title` (ID/Ref), `Tecnico` (Pessoa ou Texto), `Cliente` (Texto), `Data` (Data/Hora), `Horas` (Número), `Descricao` (Texto), `ChamadoId` (Texto/Ref).

## 3. Executando o Projeto

1. Instale as dependências (já feito):
   ```bash
   npm install
   ```
2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Acesse `http://localhost:3000`.

## 4. Deploy

Para produção (Vercel ou Servidor Node):

1. Configure as mesmas variáveis de ambiente no painel do provedor.
2. Atualize o `NEXTAUTH_URL` para o domínio final (ex: `https://meu-app.com`).
3. Adicione a URL de callback no Azure AD (`https://meu-app.com/api/auth/callback/azure-ad`).
4. Rode o build:
   ```bash
   npm run build
   npm start
   ```
