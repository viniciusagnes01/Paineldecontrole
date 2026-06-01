# V4 Command Center - RBAC Matrix

Documento operacional da Sprint 1 para permissões, squads, módulos e ações sensíveis.

## Regra central

Cargo define acesso. Acesso define painel. Painel define ação permitida.

O front-end pode ocultar menus e botões, mas toda ação sensível também precisa passar por `requirePermission(action, context)`.

## Arquivos base

- `src/data/roles.js`: matriz de perfis, módulos, ações e bloqueios.
- `src/data/squads.js`: squads iniciais, heads e escopo de clientes.
- `src/core/auth.js`: usuário atual mockado/preparado para `/api/me`.
- `src/core/permissions.js`: helpers `can`, `canAccessClient`, `canAccessModule`, `requirePermission` e `filterTabs`.
- `src/core/audit-log.js`: trilha local de ações, negações e eventos sensíveis.
- `src/services/rbac-runtime-bridge.js`: ponte de runtime para esconder abas e proteger ações sem reescrever o app.

## Perfis base

| Perfil | Escopo | Uso |
| --- | --- | --- |
| SUPER_ADMIN | all | Acesso total ao painel, dados, configuração e operação. |
| DIRETOR_OPERACAO | all | Visão executiva, governança, clientes críticos, FCA e financeiro. |
| HEAD_GROWTH | squad_clients | Gestão de squads, clientes da equipe, FCA e operação. |
| GP_ACCOUNT | assigned_clients | Check-in, follow-up, plano de ação, CRM, tarefas e FCA. |
| GESTOR_TRAFEGO | assigned_clients | Mídia, pacing, campanhas, criativos e relatórios. |
| COPY_CRIATIVO | assigned_clients | Criativos, LPs, backlog e tarefas. |
| CRM_COMERCIAL | assigned_clients | Funil, campos obrigatórios, perdas, owner e auditoria CRM. |
| FINANCEIRO | assigned_clients | G4 Finance, DRE, DFC, BP, unit economics e forecast. |
| CLIENTE_SPONSOR | own_client | Resultado, metas, pendências e aprovações do próprio cliente. |
| CLIENTE_OPERACIONAL | own_client | Visão operacional restrita do próprio cliente. |

## Ações sensíveis protegidas no runtime

| Ação de UI | Permissão exigida |
| --- | --- |
| `sync-all-clients` | `sync_all` |
| `sync-performance-client` | `sync_media` |
| `sync-crm-client` | `sync_crm` |
| `delete-client` | `client:delete` |
| `reset-system` | `system:reset` |
| `edit-endpoint` | `endpoint:edit` |
| `export-all` | `export:all` |

## Critérios de aceite

- `SUPER_ADMIN` vê todos os módulos.
- Perfis restritos só veem abas permitidas.
- Ação sensível sem permissão gera erro amigável.
- `audit-log` registra negação de acesso.
- Nenhum token deve ser salvo no front-end.
- A `STORAGE_KEY` principal não pode ser apagada pelo bootloader.

## Próximos passos

Sprint 2 deve criar `src/core/constants.js`, `src/core/state.js`, `src/core/source-health.js`, documentação de arquitetura e começar a mover responsabilidades do `app.js` de forma compatível.
