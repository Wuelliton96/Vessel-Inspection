# SGVN - Sistema de Gerenciamento de Vistorias Náuticas

Guia de instalação e execução do ambiente de desenvolvimento do projeto SGVN.

## Pré-requisitos

Antes de começar, garanta que você tem as seguintes ferramentas instaladas:
- **Node.js** (versão 20.x ou superior)
- **Git**
- **PostgreSQL**: Uma instância rodando (pode ser localmente ou em um serviço na nuvem como o Supabase).
- **Quasar CLI**: A interface de linha de comando do Quasar. Se não tiver, instale globalmente com:
  ```bash
  npm install -g @quasar/cli
  ```

## ⚙️ Configuração do Backend

1.  **Navegue até a pasta do backend:**
    ```bash
    cd backend
    ```

2.  **Crie o arquivo de ambiente:**
    Copie o arquivo de exemplo `.env.example` para um novo arquivo chamado `.env`.
    ```bash
    # Se estiver no Windows (CMD ou PowerShell)
    copy .env.example .env

    # Se estiver no Linux ou macOS
    cp .env.example .env
    ```
    Depois, abra o arquivo `.env` e preencha as variáveis com suas credenciais do banco de dados e do Clerk.

3.  **Instale as dependências:**
    ```bash
    npm install
    ```

## 🚀 Configuração do Frontend

1.  **Navegue até a pasta do frontend:**
    ```bash
    # A partir da raiz do projeto
    cd frontend
    ```
2.  **Crie o arquivo de ambiente:**
    Crie um arquivo chamado `.env` na raiz da pasta `frontend` e adicione sua chave publicável do Clerk:
    ```env
    # frontend/.env
    VITE_CLERK_PUBLISHABLE_KEY=pk_test_SUA_CHAVE_PUBLISHAVEL_AQUI
    ```
    *Lembre-se de obter essa chave no seu dashboard do Clerk, na seção "API Keys".*

3.  **Instale as dependências:**
    ```bash
    npm install
    ```

## ▶️ Executando o Projeto

Para rodar a aplicação completa, você precisará de **dois terminais abertos**.

**Terminal 1 - Rodando o Backend:**
```bash
# A partir da raiz do projeto
cd backend
npm run dev
```
*O servidor do backend estará rodando em `http://localhost:3001`.*

**Terminal 2 - Rodando o Frontend:**
```bash
# A partir da raiz do projeto
cd frontend
quasar dev
```
*O servidor do frontend estará rodando em `http://localhost:9000` (ou outra porta indicada pelo Quasar).*

Após iniciar ambos os servidores, acesse o endereço do frontend no seu navegador para usar a aplicação.