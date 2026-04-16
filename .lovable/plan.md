

The user wants three corrections for the next delivery:

1. **RF07** - More comprehensive filters across the app
2. **RF03** - Profile-based permissions: only TWO profiles allowed - "futebol" (football) and "basquete" (basketball), each restricted to their respective sport
3. **Authentication bug fix** - Need a more "ready" AI API for authentication (likely means real auth, not mocked localStorage)

Let me explore the current state to understand what needs changing.

Current state observations:
- AuthContext uses fake localStorage auth with profiles "analista" | "apostador" | "admin"
- RegisterPage offers those three profiles
- SportContext lets anyone toggle between football/basketball freely via SportSwitcher
- Pages have minimal filters (search only on most pages)

For "AI mais pronta" for auth - this likely means the user wants real authentication (Lovable Cloud / Supabase Auth) instead of the broken mock localStorage version. Not actually AI, just "pronto" = ready/proper.

Plan:

## Correções para a próxima entrega

### 1. Autenticação real (corrigir bug de autenticidade)

Substituir o mock atual (localStorage) pela autenticação nativa do **Lovable Cloud** (Supabase Auth):

- **Migration**: criar tabela `profiles` (id, user_id, nome, sport_profile) e enum `sport_profile` com valores `futebol` | `basquete`
- Trigger `handle_new_user` para criar profile automaticamente no signup
- Políticas RLS: usuário só lê/edita o próprio profile
- `AuthContext.tsx` reescrito com `supabase.auth.signUp/signInWithPassword/signOut`, `onAuthStateChange` + `getSession`
- `LoginPage` e `RegisterPage` usando email/senha real
- `RegisterPage`: dropdown de perfil reduzido a **apenas 2 opções**: "Futebol" e "Basquete"
- Auto-confirm de email habilitado para facilitar testes

### 2. RF03 - Permissões por perfil (somente futebol OU basquete)

- Remover perfis antigos (`analista`, `apostador`, `admin`)
- `SportContext` lê o `sport_profile` do usuário logado e **trava** o esporte ativo (não pode alternar)
- `SportSwitcher` removido do sidebar (ou exibido somente como label informativo do perfil)
- `LeagueSelector` filtra ligas pelo esporte do perfil
- Rotas/páginas que mostram dados do outro esporte ficam ocultas ou exibem aviso "Seu perfil é Futebol/Basquete"
- Dashboard, Equipes, Atletas, Partidas, Previsões — todos respeitam o esporte do perfil

### 3. RF07 - Filtros mais abrangentes

Adicionar barras de filtros consistentes em todas as páginas de listagem:

- **TeamsPage**: busca por nome + filtro por posição na tabela (top/meio/zona de rebaixamento) + ordenação (pontos, vitórias, gols)
- **MatchesPage**: filtro por status (Ao Vivo / Agendado / Encerrado), por data (hoje/amanhã/semana), busca por equipe
- **AthletesPage**: filtro por posição (GOL, ZAG, MEI, ATA), por nacionalidade, faixa etária; manter modos "buscar nome" e "por equipe"
- **PredictionsPage**: filtro por tipo de mercado (1X2, Over/Under, Ambas marcam) e por data
- **FavoritesPage**: filtro por tipo (Equipe/Atleta) — esporte já restrito ao perfil
- Componente reutilizável `FilterBar` com chips/selects padronizados

### Arquivos afetados

```text
NOVOS:
- supabase/migrations/<ts>_auth_profiles.sql
- src/components/FilterBar.tsx

EDITADOS:
- src/contexts/AuthContext.tsx          (Supabase Auth real)
- src/contexts/SportContext.tsx         (esporte travado pelo perfil)
- src/components/AppSidebar.tsx         (remover SportSwitcher livre)
- src/pages/LoginPage.tsx               (email/senha real)
- src/pages/RegisterPage.tsx            (perfil = futebol|basquete)
- src/pages/TeamsPage.tsx               (filtros)
- src/pages/MatchesPage.tsx             (filtros)
- src/pages/AthletesPage.tsx            (filtros)
- src/pages/PredictionsPage.tsx         (filtros)
- src/pages/FavoritesPage.tsx           (filtros)
- src/data/leagues.ts                   (helper p/ filtrar por esporte do perfil)
```

### Detalhes técnicos

- **Migration**: `CREATE TYPE sport_profile AS ENUM ('futebol','basquete')`; tabela `profiles(id uuid PK, user_id uuid REFERENCES auth.users ON DELETE CASCADE UNIQUE, nome text, sport_profile sport_profile NOT NULL, created_at timestamptz DEFAULT now())`. RLS: SELECT/UPDATE `auth.uid() = user_id`. Trigger AFTER INSERT em auth.users → INSERT em profiles usando `raw_user_meta_data->>'nome'` e `raw_user_meta_data->>'sport_profile'`.
- **Signup**: `supabase.auth.signUp({ email, password, options: { data: { nome, sport_profile }, emailRedirectTo: window.location.origin } })`
- **AuthContext**: padrão obrigatório → registrar `onAuthStateChange` ANTES de `getSession()`; nunca usar `await` dentro do callback (apenas `setTimeout(...,0)` para chamadas extras).
- **SportContext**: hidrata `sport` a partir do `profiles.sport_profile`; método `setSport` vira no-op (ou só permite a liga dentro do mesmo esporte).
- **FilterBar**: aceita props `filters: FilterDef[]` e `onChange(values)`, renderiza Selects/Inputs do shadcn.
- **Proteção de rotas**: `AppLayout` redireciona para `/login` se `!session`.

