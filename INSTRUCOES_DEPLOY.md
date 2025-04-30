# Instruções de Implantação - Aplicação de Controle de Compras Gal Hotel Bar

Este documento descreve os passos para implantar a aplicação web de controle de compras do Gal Hotel Bar em um ambiente de produção. A aplicação foi desenvolvida com Next.js e utiliza um banco de dados compatível com SQLite (como o D1 do Cloudflare ou Turso).

## Pré-requisitos

1.  **Node.js e pnpm:** Certifique-se de ter o Node.js (versão 20 ou superior) e o pnpm instalados no seu ambiente de implantação ou no seu sistema de CI/CD.
2.  **Conta em Serviço de Hospedagem:** Uma conta em um serviço de hospedagem que suporte aplicações Next.js (ex: Vercel, Netlify, Cloudflare Pages).
3.  **Banco de Dados:** Um banco de dados compatível com SQLite (recomendado: Cloudflare D1 ou Turso) configurado e acessível pelo serviço de hospedagem.

## Passos de Implantação

1.  **Descompactar o Projeto:** Extraia o conteúdo do arquivo `gal_hotel_compras_app.zip` para um diretório no seu sistema ou repositório Git.

2.  **Configurar Variáveis de Ambiente:**
    *   Crie um arquivo `.env.local` na raiz do projeto (ou configure as variáveis de ambiente diretamente no seu serviço de hospedagem).
    *   Defina as seguintes variáveis:
        *   `NEXTAUTH_URL`: A URL completa da sua aplicação implantada (ex: `https://compras.galhotelbar.com`).
        *   `NEXTAUTH_SECRET`: Uma chave secreta forte para o NextAuth. Você pode gerar uma usando `openssl rand -base64 32`.
        *   `DATABASE_URL`: (Opcional, dependendo do seu provedor de DB) A URL de conexão do seu banco de dados.
        *   `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `D1_DATABASE_ID`: (Se estiver usando Cloudflare D1) As credenciais da sua conta Cloudflare e o ID do banco de dados D1.

3.  **Configurar Banco de Dados (Cloudflare D1 - Exemplo):**
    *   Se estiver usando Cloudflare D1, crie um banco de dados D1 no seu painel Cloudflare.
    *   Atualize o arquivo `wrangler.toml` com o `database_id` correto do seu banco D1 de produção (remova a seção `[[d1_databases]]` local se existir ou comente-a).
    *   Execute as migrações no banco de dados de produção usando o Wrangler CLI:
        ```bash
        npx wrangler d1 migrations apply <NOME_DO_SEU_BINDING_D1> --remote
        ```
        (Substitua `<NOME_DO_SEU_BINDING_D1>` pelo nome do binding definido no `wrangler.toml`, geralmente "DB").
    *   **Importante:** Execute o script para criar o usuário administrador no banco de dados de produção (adapte o comando do script `seed-admin.mjs` para usar `--remote`):
        ```bash
        # Obtenha o comando SQL do script
        node scripts/seed-admin.mjs
        # Execute o comando wrangler com --remote
        wrangler d1 execute <NOME_DO_SEU_BINDING_D1> --remote --command="<SQL_GERADO_PELO_SCRIPT>"
        ```

4.  **Instalar Dependências:**
    *   Navegue até o diretório raiz do projeto no terminal.
    *   Execute o comando:
        ```bash
        pnpm install
        ```

5.  **Build da Aplicação:**
    *   Execute o comando para gerar a versão otimizada para produção:
        ```bash
        pnpm run build
        ```

6.  **Implantar no Serviço de Hospedagem:**
    *   Siga as instruções do seu serviço de hospedagem (Vercel, Netlify, Cloudflare Pages) para implantar uma aplicação Next.js.
    *   Geralmente, isso envolve conectar seu repositório Git ou fazer upload do diretório do projeto.
    *   Certifique-se de que as variáveis de ambiente configuradas no passo 2 estejam definidas no ambiente de produção do serviço de hospedagem.
    *   Configure o comando de build como `pnpm run build` e o diretório de saída (se necessário, geralmente `.next`).

7.  **Acessar a Aplicação:** Após a implantação bem-sucedida, acesse a URL fornecida pelo seu serviço de hospedagem.

## Pós-Implantação

*   **Alterar Senha Admin:** Faça login com o usuário administrador (`admin@galhotelbar.com` / `senhaforte123`) e altere a senha imediatamente através da interface (funcionalidade a ser adicionada na seção de configurações, se necessário) ou diretamente no banco de dados.
*   **Cadastrar Outros Usuários:** Cadastre os usuários para cada praça com as permissões corretas (`atendimento`, `cozinha`, `bar`).
*   **Cadastrar Produtos e Fornecedores:** Utilize a interface (ou importe dados diretamente no banco) para cadastrar todos os produtos, seus estoques mínimos e os fornecedores.

Se encontrar problemas durante a implantação, consulte a documentação do seu serviço de hospedagem e do Next.js.

