# API de Gerenciamento de Reservas de Presentes

-----

## 🚀 Visão Geral do Projeto

Este é um **backend de API em NestJS** para gerenciar **reservas de presentes**, autenticação de usuários, notificações por e-mail e caching. A aplicação foi construída com uma arquitetura modular, garantindo uma clara separação de responsabilidades.

-----

## 🔧 Principais Funcionalidades

  * **Autenticação e Autorização**: Sistema de login e acesso protegido por tokens JWT.
  * **Gerenciamento de Presentes**: Funcionalidades completas (CRUD) para presentes, incluindo a capacidade de reservar.
  * **Notificações por E-mail**: Envio de e-mails transacionais (via Nodemailer) para eventos como a confirmação de uma reserva.
  * **Camada de Caching**: Implementação de cache para otimizar o desempenho e reduzir a carga no banco de dados.
  * **Validação de Dados**: Uso de DTOs (Data Transfer Objects) com TypeScript para garantir a integridade dos dados de entrada e saída.
  * **Estrutura Modular**: Organização do código em módulos coesos, facilitando a escalabilidade e a manutenção.
  * **Documentação Automática**: Geração automática da documentação da API com o **Swagger**, permitindo fácil visualização e teste dos endpoints.

-----

## 📁 Estrutura do Projeto

```
src/
├── auth/           # Módulo de Autenticação (login, JWT, guards)
│   ├── dto/
│   ├── guards/
│   ├── strategies/
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
│
├── cache/          # Módulo de Caching (Redis ou em memória)
│   ├── cache.module.ts
│   └── cache.service.ts
│
├── gifts/          # Módulo de Gerenciamento de Presentes
│   ├── dto/
│   ├── gifts.controller.ts
│   ├── gifts.module.ts
│   └── gifts.service.ts
│
├── mail/           # Módulo de Envio de E-mails
│   ├── mail.module.ts
│   └── mail.service.ts
│
├── shared/         # Utilitários e tipos compartilhados
│   ├── exceptions/
│   └── types/
│
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts

```

-----

## ⚙️ Configuração e Execução

### Pré-requisitos

Certifique-se de ter o [Node.js](https://nodejs.org/) e o [NestJS CLI](https://docs.nestjs.com/cli/overview) instalados.

### Passos

1.  **Instale as dependências:**

    ```bash
    npm install
    ```

2.  **Crie e configure o arquivo `.env`:**

    ```
    PORT=3000
    JWT_SECRET=sua_chave_secreta_jwt
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587
    EMAIL_USER=seu-email@gmail.com
    EMAIL_PASS=sua-senha-de-aplicativo
    REDIS_URL=redis://localhost:6379
    ```

    > **Atenção**: Nunca exponha chaves secretas e senhas em um repositório público. Use variáveis de ambiente para gerenciar essas informações de forma segura.

3.  **Inicie a aplicação:**

      * **Modo de desenvolvimento (com hot reload):**
        ```bash
        npm run start:dev
        ```
      * **Modo de produção (build otimizado):**
        ```bash
        npm run start:prod
        ```

-----

## 📚 Recursos e Documentação

  * [Documentação Oficial do NestJS](https://docs.nestjs.com/)
  * [NestJS DevTools](https://www.google.com/search?q=https://github.com/nestjs/devtools) - Visualize a estrutura da sua aplicação.
  * [Comunidade no Discord](https://discord.gg/G7Qnnhy) - Obtenha ajuda e compartilhe ideias.

-----

## 💬 Contato e Suporte

Se precisar de suporte ou tiver dúvidas, sinta-se à vontade para entrar em contato:

  * **Autor**: João (Joaoof)
  * **GitHub**: [João GitHub Profile](https://github.com/Joaoof)
  * **Email**: joaodeus400@gmail.com

-----

## 📄 Licença

Este projeto está licenciado sob a Licença MIT.
