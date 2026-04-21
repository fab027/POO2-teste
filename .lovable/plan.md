

## Correções de extração de dados (Atletas + Ao Vivo)

Todas as falhas têm a mesma raiz: a chamada `scrapeExtract` (Firecrawl nativo `extract`) "alucina" números (idade, camisa) e mistura status (jogo encerrado vira "ao vivo") porque o conteúdo do SofaScore/placardefutebol é renderizado por JS. A correção que já funcionou para "Próximas/Últimas partidas" — baixar **markdown** e estruturar via **Lovable AI Gemini** com regras estritas — será aplicada também ao elenco do time e aos jogos ao vivo.

### 1. Elenco do time (`team_players`) — idade e camisa corretas

- Substituir `scrapeExtract(teamPageUrl, ...)` pela função `scrapeMarkdownThenAI` na URL `<sofascore_team>/squad` (página dedicada ao elenco, mais densa e estável).
- Ampliar o prompt: exigir que **idade venha do texto da página** (ex: "25 yrs", "21 anos") e que **camisa seja o número à esquerda do nome**; se algum dos dois não for legível, retornar `null` (proibir adivinhação).
- Adicionar validação no servidor:
  - `age` deve estar entre 15 e 50; valores fora disso → `null`.
  - `shirtNumber` entre 1 e 99; fora disso → `null`.
  - Descartar jogadores cujo nome bata com regex de placeholder (`player 1`, `unknown`, `n/a`, etc.).
- Logar `players raw -> filtered` para depuração.

### 2. Coerência entre "Por Equipe" e "Buscar por Nome"

- Hoje a busca por nome usa `site:sofascore.com/player`. Vou adicionar fallback para `site:sofascore.com` (sem `/player`) e re-filtrar URLs no servidor — isso aumenta a recuperação quando o Google não indexa a página `/player/...` exata.
- No componente `AthletesPage`, quando o usuário clica em um jogador da lista do elenco, em vez de re-buscar pelo nome (que pode falhar e trazer outro Pedro/Lucas), passar diretamente a `playerUrl` do SofaScore extraída do elenco. Para isso o `team_players` vai começar a devolver também o link `url` do jogador (extraído do markdown `[Nome](https://www.sofascore.com/player/...)`).

### 3. "Ao Vivo Agora" mostrando jogos passados

- Trocar `scrapeExtract` por `scrapeMarkdownThenAI` apontando para `https://www.placardefutebol.com.br/` (home do site), que tem uma seção fixa "AO VIVO" no topo.
- Prompt restrito: "extraia somente partidas que apareçam dentro do bloco AO VIVO/Em andamento e que contenham minuto corrente (ex.: 32', HT, 2T) — se a partida tiver hora de início futura ou indicação de Encerrado/FT, IGNORE".
- Filtro de servidor: descartar item se `minute` estiver vazio, ou se `status` casar com `/encerr|finish|ft|hoje\s+\d{2}:\d{2}/i`.
- Reduzir TTL do cache `live_all` de 30 s para 20 s.

### 4. Verificação geral do site

Após aplicar 1–3, vou revisar uma vez cada página e ajustar pontas soltas óbvias:

- **Dashboard** — confirmar que classificação, próximas/últimas partidas e bloco "ao vivo" usam os mesmos dados corrigidos.
- **Equipes** — sem mudança, já estava ok (usa `standings`).
- **Atletas** — mudanças acima.
- **Partidas** — confirmar que abas Liga/Hoje/Ao Vivo respeitam os mesmos filtros.
- **Previsões ML** — confirmar que odds reais continuam sendo lidas (sem alterações).
- **Favoritos** — sem mudança (lê do localStorage filtrado pelo esporte do perfil).
- **Agregador** — sem mudança.
- Bumpar chaves de cache locais para `v6_` em `useSofaScoreData` para descartar qualquer dado ruim já cacheado no navegador.

### Arquivos afetados

```text
EDITADOS:
- supabase/functions/sports-data/index.ts
    • team_players: troca para scrapeMarkdownThenAI + validações de idade/camisa + extrai url do jogador
    • live: troca para scrapeMarkdownThenAI + filtros estritos por minuto/status
    • player_search: adiciona fallback de busca

- src/services/sofaScoreService.ts
    • TeamPlayer ganha campo `url?: string`

- src/hooks/useSofaScoreData.ts
    • bump de chaves de cache para v6_ + TTL de live para 20 s

- src/pages/AthletesPage.tsx
    • ao clicar num jogador do elenco, usar player.url se existir
      (fallback para a busca por nome atual)
```

### Detalhes técnicos

- `scrapeMarkdownThenAI` já existe e aceita `(url, prompt, schema)` retornando JSON parseado pelo Gemini 2.5 Flash com `response_format: json_object` — basta reusar.
- Validação numérica feita no servidor antes de devolver, garantindo que mesmo se o LLM "errar", o cliente nunca vê valores absurdos.
- Regex de placeholder centralizada em uma constante reutilizada por `team_players`, `matches_*` e `live`.

