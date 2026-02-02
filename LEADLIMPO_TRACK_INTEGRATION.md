# Integração da biblioteca `leadlimpo-track`

Este guia mostra **como usar** a lib `leadlimpo-track` em qualquer funil/chat de geração de leads (incluindo Typebot), e como configurar o **Google Tag Manager** para consumir os eventos.

---

## 1. Como carregar a biblioteca

### 1.1. Em qualquer site/página

Basta servir o arquivo `leadlimpo-track.js` (por exemplo, a partir do seu próprio domínio) e incluir o script:

```html
<script src="https://seu-dominio.com/leadlimpo-track.js"></script>
```

Requisitos:

- O script deve ser carregado **depois** do GTM (para conseguir ler `event_id` do `dataLayer`, quando existir).
- O Meta Pixel (`fbq`) pode ser instalado diretamente na página ou via GTM.

### 1.2. Dentro de um Typebot (via embed / página externa)

Se você usa o Typebot embarcado em uma página sua (Next.js, landing estática etc.):

- Inclua o script da mesma forma:

```html
<script src="/leadlimpo-track.js"></script>
```

O embed do Typebot (iframe, web-component ou `@typebot.io/react`) continua igual – a lib fica **fora**, na sua página, observando o comportamento do funil e disparando os eventos.

---

## 2. API principal resumida

Objeto global exposto:

```javascript
window.leadlimpoTrack = {
  // contexto & UTM
  init(),
  setContext({ sessionId, flowId, stepId }),
  getContext(),
  getUTMs(),
  saveLeadContact({ phone, email }),

  // eventos de funil
  trackViewContent(extraParams?),
  trackStarted({ stepId }?),
  trackStepAnswered({ stepId, answer, meta } = {}),
  trackLead({ phone, email, value, currency, meta } = {}),
  trackCompleteRegistration({ status, meta } = {}),

  // baixo nível
  trackMetaCustom(eventName, params),
  pushToDataLayer(data)
};
```

Observações:

- `init()` é chamado automaticamente quando o script carrega:
  - Carrega contexto salvo (session/flow/step).
  - Captura UTMs da URL e salva no `sessionStorage`.
- Você pode chamar `setContext` a qualquer momento para definir/atualizar sessão/fluxo/passo atual.

---

## 3. Integração em um funil de chat genérico

### 3.1. Definir contexto do funil

Logo após saber qual fluxo/chat está rodando (por exemplo, na página da cotação):

```javascript
// Exemplo: página de cotação de plano de saúde
leadlimpoTrack.setContext({
  sessionId: "sessao_" + Date.now(),       // se sua ferramenta de chat não tiver um ID próprio
  flowId: "cotacao-plano-saude"           // nome lógico do funil
});
```

Se sua ferramenta já fornece um `sessionId` (ou `conversationId`), use ele diretamente.

### 3.2. ViewContent (quando o funil é exibido)

Ao carregar a página/experiência do chat:

```javascript
// Assim que o funil estiver visível
leadlimpoTrack.trackViewContent();
```

Você pode passar infos extras:

```javascript
leadlimpoTrack.trackViewContent({
  page_type: "cotacao_plano_saude",
  variant: "landing_a"                    // útil para A/B test
});
```

### 3.3. Started (primeira interação)

Quando o usuário clica no primeiro botão “Iniciar”, “Começar agora” etc.:

```javascript
leadlimpoTrack.trackStarted({
  stepId: "inicio"
});
```

Isso atualiza `step_id` no contexto e dispara:

- Evento custom Meta: `LeadlimpoStarted`.
- Evento GTM: `leadlimpo_started`.

### 3.4. Step Answered (respostas importantes)

Sempre que o usuário responde a um passo relevante:

```javascript
// Exemplo: pergunta sobre interesse
leadlimpoTrack.trackStepAnswered({
  stepId: "interesse",
  answer: "Plano para a família",
  meta: {
    categoria_interesse: "familia"
  }
});
```

Outro exemplo (faixa de valor):

```javascript
leadlimpoTrack.trackStepAnswered({
  stepId: "faixa_valor",
  answer: "Entre R$ 300 e R$ 600"
});
```

### 3.5. Lead (quando coleta contato)

Quando o usuário informa WhatsApp/email (ex.: último passo do chat):

```javascript
// 1) Salva contato (para Enhanced Matching + uso posterior)
leadlimpoTrack.saveLeadContact({
  phone: "+55 11 99999-0000",
  email: "cliente@example.com"
});

// 2) Dispara o evento de lead
leadlimpoTrack.trackLead({
  // phone/email opcionais aqui, pois já foram salvos antes
  value: 0,                   // opcional – valor do lead
  currency: "BRL",
  meta: {
    origem_formulario: "chat_cotacao_sp"
  }
});
```

A lib:

- Envia `Lead` para o Meta Pixel, com UTMs + Enhanced Matching (`em`, `ph`).
- Envia `leadlimpo_lead` para o GTM, com todos os campos de contexto.

### 3.6. Complete Registration (opcional – pós‑sucesso)

Se você tem uma **página de sucesso** após o envio:

```javascript
// Na página de sucesso
leadlimpoTrack.trackCompleteRegistration({
  status: true,
  meta: {
    origem: "pagina_sucesso_cotacao"
  }
});
```

---

## 4. Exemplo de uso dentro de Typebot (conceitual)

> Importante: a lib não depende do Typebot; aqui é apenas um exemplo de como você pode chamá-la a partir de blocos JavaScript/integração.

### 4.1. Contexto e início

Ao carregar a página que contém o Typebot embarcado, você pode:

```javascript
// Ao montar o componente / iframe do Typebot
leadlimpoTrack.setContext({
  // Se você conseguir obter esses dados do Typebot, melhor ainda:
  sessionId: "{{session_id_do_typebot}}",    // variável do Typebot
  flowId: "cotacao-plano-saude"
});

// Assim que o bot ficar visível
leadlimpoTrack.trackViewContent();
```

Quando o usuário clica no botão inicial do bot:

```javascript
// Ex: num bloco JavaScript do Typebot, amarrado ao botão "INICIAR COTAÇÃO"
leadlimpoTrack.trackStarted({
  stepId: "inicio"
});
```

### 4.2. Respostas de passo → mapeando para stepId

Suponha os principais passos do fluxo (como no seu bot de cotação):

- Interesse → `stepId: "interesse"`
- Número de pessoas → `stepId: "numero_vidas"`
- Faixa de valor → `stepId: "faixa_valor"`
- Urgência/momento de compra → `stepId: "momento_compra"`
- Nome → `stepId: "nome"`
- WhatsApp → evento de lead.

Em cada resposta (por exemplo, num bloco de script após o input), você chama:

```javascript
// Interesse
leadlimpoTrack.trackStepAnswered({
  stepId: "interesse",
  answer: "{{interesse}}"
});

// Número de vidas
leadlimpoTrack.trackStepAnswered({
  stepId: "numero_vidas",
  answer: "{{numero_vidas}}"
});

// Faixa de valor
leadlimpoTrack.trackStepAnswered({
  stepId: "faixa_valor",
  answer: "{{faixa_valor}}"
});
```

### 4.3. Lead no Typebot

No bloco onde você coleta o WhatsApp/email:

```javascript
// Salva o contato
leadlimpoTrack.saveLeadContact({
  phone: "{{whatsapp}}",
  email: "{{email}}"        // se existir no fluxo
});

// Marca o passo como respondido (opcional)
leadlimpoTrack.trackStepAnswered({
  stepId: "contato",
  answer: "{{whatsapp}}"
});

// Dispara o lead (conversão principal)
leadlimpoTrack.trackLead({
  meta: {
    origem_funil: "typebot_cotacao_plano_saude"
  }
});
```

---

## 5. Configuração no Google Tag Manager

### 5.1. Eventos que a lib dispara

Os principais `event` que vão aparecer no `dataLayer`:

- `leadlimpo_viewcontent`
- `leadlimpo_started`
- `leadlimpo_step_answered`
- `leadlimpo_lead`
- `leadlimpo_complete_registration` (se você usar)

Todos os eventos vêm com:

- `session_id`
- `flow_id`
- `step_id` (quando fizer sentido)
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- Campos específicos do evento (ex.: `answer`, `phone`, `email`, `value`, etc.)

### 5.2. Variáveis no GTM

Crie variáveis de **Data Layer Variable** para os principais campos:

- `dlv_session_id` → `session_id`
- `dlv_flow_id` → `flow_id`
- `dlv_step_id` → `step_id`
- `dlv_answer` → `answer`
- `dlv_phone` → `phone`
- `dlv_email` → `email`
- `dlv_utm_source` → `utm_source`
- `dlv_utm_medium` → `utm_medium`
- `dlv_utm_campaign` → `utm_campaign`
- `dlv_utm_content` → `utm_content`
- `dlv_utm_term` → `utm_term`

### 5.3. Triggers

Exemplos de triggers:

1. **ViewContent**

   - Tipo: `Custom Event`.
   - Nome do evento: `leadlimpo_viewcontent`.
   - Usado para:
     - GA4 event `view_content`.
     - Outras tags de visualização.

2. **Started**

   - Tipo: `Custom Event`.
   - Nome do evento: `leadlimpo_started`.

3. **Step Answered**

   - Tipo: `Custom Event`.
   - Nome do evento: `leadlimpo_step_answered`.
   - Opcionalmente, adicionar condições:
     - `step_id` igual a `"interesse"` → tag específica.
     - `step_id` igual a `"faixa_valor"` → outra tag, etc.

4. **Lead**

   - Tipo: `Custom Event`.
   - Nome do evento: `leadlimpo_lead`.
   - Este é o evento mais importante para conversão.

5. **Complete Registration**

   - Tipo: `Custom Event`.
   - Nome do evento: `leadlimpo_complete_registration`.

### 5.4. Exemplo de Tag GA4 para Lead

- Tipo: `GA4 Event`.
- Event name: `lead`.
- Trigger: `leadlimpo_lead`.
- Parâmetros do evento:
  - `session_id` → `dlv_session_id`.
  - `flow_id` → `dlv_flow_id`.
  - `phone` → `dlv_phone` (cuidado com privacidade).
  - `utm_source` → `dlv_utm_source`.
  - `utm_medium` → `dlv_utm_medium`.
  - `utm_campaign` → `dlv_utm_campaign`.

---

## 6. Boas práticas

- **Consistência de nomes**:
  - Mantenha uma convenção clara de `flowId` e `stepId` (ex.: `cotacao-plano-saude` / `interesse`, `numero_vidas`, etc.).
- **Privacidade**:
  - Evite enviar dados pessoais não necessários para ferramentas como GA4.
  - Se usar email/telefone em tags adicionais, considere hash/anonimização quando possível.
- **Testes**:
  - Use o **Preview** do GTM para validar os eventos `leadlimpo_*`.
  - Use o **debug do Meta Pixel** (Events Manager) para confirmar `ViewContent`, `Lead` e outros.

Com essa estrutura, `leadlimpo-track` vira sua **camada padrão de tracking** para qualquer funil de leads baseado em chat, com integração completa a Meta e GTM, pronta para escalar e até ser oferecida como bônus/produto. 

