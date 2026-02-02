# Regras de Negócio de Tracking – `leadlimpo-track`

## Visão geral

`leadlimpo-track` é uma biblioteca JavaScript standalone pensada para **funis de geração de leads** (chats, formulários, Typebot, etc.), que:

- Captura e persiste **UTMs** da sessão.
- Mantém um **contexto de fluxo** (`sessionId`, `flowId`, `stepId`).
- Dispara eventos padronizados para:
  - **Meta Pixel (fbq)**.
  - **Google Tag Manager (dataLayer)**.
- Implementa **deduplicação** de eventos para evitar inflar métricas.

Não há dependência direta de Typebot: os nomes são genéricos (leadlimpo, session, flow, step).

---

## Contexto e chaves padrão

### Contexto de fluxo

- `session_id`: identificador da sessão do funil/chat.
- `flow_id`: identificador lógico do funil (ex.: `cotacao-plano-saude`).
- `step_id`: identificador do passo / pergunta atual.

Esses valores podem ser definidos/atualizados via:

- `leadlimpoTrack.setContext({ sessionId, flowId, stepId })`.

Internamente, a lib:

- Persiste `sessionId`, `flowId`, `stepId` em `sessionStorage`:
  - `leadlimpo_session_id`
  - `leadlimpo_flow_id`
  - `leadlimpo_step_id`

### UTMs

- Captura UTMs da URL atual:
  - `utm_source`
  - `utm_medium`
  - `utm_campaign`
  - `utm_content`
  - `utm_term`
- Persiste em `sessionStorage` com a chave:
  - `utm_params` (compatível com outros scripts de UTM).
- Combina UTMs da URL + storage a cada evento.

### Lead (contato)

- `phone`: telefone/WhatsApp do lead.
- `email`: email do lead.

Persistência:

- `leadlimpo_phone` (sessionStorage).
- `leadlimpo_email` (sessionStorage).

Esses dados alimentam:

- Eventos de **Lead**.
- **Enhanced Matching** do Meta (hash de email/telefone).

---

## Eventos de negócio

### 1. ViewContent

**Quando:** a experiência do funil é visualizada (carregamento inicial da página/chat ou logo após iniciar o fluxo).

- **Método da lib:**
  - `leadlimpoTrack.trackViewContent(extraParams?)`

#### Meta Pixel

- `fbq('track', 'ViewContent', params, { eventID })`
- `params` padrão:
  - `content_name`: `"Leadlimpo ViewContent"`
  - `content_category`: `"Lead Generation"`
  - `session_id`
  - `flow_id`
  - UTMs:
    - `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`

#### GTM (`dataLayer`)

- `event`: `leadlimpo_viewcontent`
- Campos enviados:
  - `timestamp`: `Date.now()`
  - `session_id`, `flow_id`, `step_id`
  - UTMs completos
  - Qualquer `extraParams` passado ao método.

---

### 2. Started

**Quando:** o usuário **inicia** o funil (primeira interação relevante, ex.: clique em “Iniciar”).

- **Método:**
  - `leadlimpoTrack.trackStarted({ stepId? })`

Se `stepId` for enviado, passa a ser o `step_id` atual do contexto.

#### Meta Pixel

- Evento custom:
  - `fbq('trackCustom', 'LeadlimpoStarted', params, { eventID })`
- `params`:
  - `session_id`
  - `flow_id`
  - `step_id`
  - UTMs.

#### GTM

- `event`: `leadlimpo_started`
- Campos:
  - `timestamp`
  - `session_id`, `flow_id`, `step_id`
  - UTMs.

---

### 3. Step Answered (micro‑conversões)

**Quando:** o usuário responde um **passo relevante** do funil (interesse, número de pessoas, valor, urgência, etc.).

- **Método:**
  - `leadlimpoTrack.trackStepAnswered({ stepId, answer, meta })`

Parâmetros:

- `stepId`: identificador lógico do passo (ex.: `"interesse"`, `"numero_vidas"`, `"faixa_valor"`).
- `answer`: valor da resposta (texto/label/numérico).
- `meta`: objeto opcional com campos adicionais (ex.: `{ interesse: "plano individual" }`).

Se `stepId` for passado, atualiza o contexto `step_id`.

#### Meta Pixel

- Evento custom:
  - `fbq('trackCustom', 'LeadlimpoStepAnswered', params, { eventID })`
- `params`:
  - `session_id`, `flow_id`, `step_id`
  - `answer`
  - UTMs.

#### GTM

- `event`: `leadlimpo_step_answered`
- Campos:
  - `timestamp`
  - `session_id`, `flow_id`, `step_id`
  - `answer`
  - UTMs
  - Todos os campos extra de `meta`.

---

### 4. Lead (conversão principal)

**Quando:** o usuário fornece contato (WhatsApp/email) e aceita o atendimento → **lead gerado**.

- **Métodos recomendados:**
  1. Salvar contato:
     - `leadlimpoTrack.saveLeadContact({ phone, email })`
  2. Disparar conversão:
     - `leadlimpoTrack.trackLead({ phone?, email?, value?, currency?, meta? })`

Se `phone`/`email` não forem passados em `trackLead`, a lib usa os valores salvos em `saveLeadContact`.

#### Meta Pixel

- Evento nativo:
  - `fbq('track', 'Lead', params, { eventID })`
- `params`:
  - `content_name`: `"Lead Gerado"`
  - `content_category`: `"Lead Generation"`
  - `value` (opcional – valor do lead)
  - `currency` (padrão `"BRL"` se `value` existir)
  - `session_id`, `flow_id`
  - UTMs
  - **Enhanced Matching:**
    - `em`: SHA‑256 do `email` normalizado (lowercase, sem espaços).
    - `ph`: SHA‑256 do telefone normalizado (apenas dígitos).

#### GTM

- `event`: `leadlimpo_lead`
- Campos:
  - `timestamp`
  - `session_id`, `flow_id`
  - `phone`, `email`
  - `value`, `currency` (se informados)
  - UTMs
  - Todos os campos extra vindos de `meta`.

#### Deduplicação GTM para Lead

- Dedupe baseado em:
  - `leadlimpo_lead_${session_id || 'no-session'}_${flow_id || 'no-flow'}`.
- Janela:
  - 5 segundos (eventos repetidos dentro desse intervalo são ignorados).

---

### 5. Complete Registration (opcional / fase 2)

**Quando:** etapa final de confirmação do diagnóstico/cadastro é concluída.

- **Método:**
  - `leadlimpoTrack.trackCompleteRegistration({ status?, meta? })`

Parâmetros:

- `status`: boolean (default `true`).
- `meta`: extras de negócio (ex.: `plano_escolhido`, `valor_mensal`).

#### Meta Pixel

- Evento nativo:
  - `fbq('track', 'CompleteRegistration', params, { eventID })`
- `params`:
  - `content_name`: `"Leadlimpo Complete Registration"`
  - `status`: `true`/`false`
  - `session_id`, `flow_id`
  - UTMs.

#### GTM

- `event`: `leadlimpo_complete_registration`
- Campos:
  - `timestamp`
  - `session_id`, `flow_id`
  - `status`
  - UTMs
  - Campos extras de `meta`.

---

## Regras técnicas de Meta Pixel

### Ambiente

- A lib só executa `fbq(...)` quando:
  - Está no **browser**.
  - Hostname **não** é `localhost`, `127.*` nem termina com `.local`.
- Em ambiente de desenvolvimento:
  - Não dispara requisições reais.
  - Apenas faz `console.log` com os dados do evento.

### Disponibilidade de `fbq`

- Antes de disparar qualquer evento:
  - Verifica se `window.fbq` é uma função.
  - Caso não seja, agenda um retry em **1 segundo**.

### `event_id` para dedupe client/server

- A lib tenta:
  1. Ler `leadlimpo_event_id` do `sessionStorage`.
  2. Procurar o `event_id` mais recente no `window.dataLayer`.
  3. Se encontrar, salva em `sessionStorage` para reutilização.
- Esse `event_id` (quando existe) é passado como quarto parâmetro do `fbq`:
  - `{ eventID: eventId }`.

### Deduplicação client-side de eventos Meta

- Chave:

```text
cacheKey = eventName + "_" + (session_id || "no-session") + "_" + (flow_id || "no-flow")
```

- Janela: **30 segundos**.
- Eventos Meta repetidos com a mesma chave dentro dessa janela são ignorados.

---

## Regras técnicas de GTM (dataLayer)

### Garantia de `dataLayer`

- A lib garante que `window.dataLayer` exista como array antes de qualquer `push`.

### Estrutura padrão do payload

Para todos os eventos disparados por `leadlimpoTrack`:

- Inclui sempre:
  - `event`
  - `timestamp`
  - `session_id`, `flow_id`, `step_id`
  - UTMs
  - Demais campos de negócio específicos do evento.

### Deduplicação GTM (evento de Lead)

- Implementada apenas para `leadlimpo_lead`.
- Usa `localStorage` (`leadlimpo_event_cache`) com mapa:

```json
{
  "leadlimpo_lead_no-session_meu-flow": 1710000000000,
  "leadlimpo_lead_session123_flowABC": 1710000005000
}
```

- Antes de enviar:
  - Se `Date.now() - lastTimestamp < 5000`, o evento é ignorado.
- Eventos antigos (> 60s) são limpos automaticamente.

---

## API de baixo nível

Além dos eventos de alto nível, há duas funções para uso avançado:

### `trackMetaCustom(eventName, params)`

- Envia um evento custom no Meta Pixel com:
  - `eventName` passado.
  - `params` mesclados com o contexto padrão (`session_id`, `flow_id`, UTMs).
- Útil para cenários em que você quer um nome de evento específico além dos padrão.

### `pushToDataLayer(data)`

- Faz `dataLayer.push` de forma segura, sempre incluindo:
  - Contexto (`session_id`, `flow_id`, `step_id`, UTMs).
  - `event` (default: `leadlimpo_custom`).
  - `timestamp` (se não for informado).
- Útil para criar eventos GTM customizados mantendo o padrão `leadlimpo`.

---

## Resumo para negócios

- **Sempre que o funil aparecer** → `ViewContent` + `leadlimpo_viewcontent`.
- **Sempre que alguém começar a responder** → `LeadlimpoStarted` + `leadlimpo_started`.
- **Cada resposta importante** → `LeadlimpoStepAnswered` + `leadlimpo_step_answered`.
- **Quando o contato for enviado** → `Lead` + `leadlimpo_lead` (principal métrica de performance).
- **(Opcional) quando o diagnóstico/cadastro for concluído** → `CompleteRegistration` + `leadlimpo_complete_registration`.

Com isso, você consegue:

- Usar o **GTM** como hub central (criar tags para GA4, Meta, etc.).
- Manter uma **camada de negócio de tracking** estável, mesmo trocando a ferramenta de chat.

