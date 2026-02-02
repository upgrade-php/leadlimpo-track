# Agent: Validação e Testes da Biblioteca

## Objetivo

Validar que a biblioteca `leadlimpo-track.js` está funcionando corretamente e detectar problemas comuns.

## Responsabilidades

1. **Validar estrutura da API**
   - Verificar se todos os métodos públicos estão expostos
   - Confirmar que `window.leadlimpoTrack` existe após carregamento
   - Validar tipos de retorno dos métodos

2. **Testar funcionalidades core**
   - Captura de UTMs da URL
   - Persistência em sessionStorage/localStorage
   - Envio de eventos para Meta Pixel (fbq)
   - Envio de eventos para GTM (dataLayer)
   - Deduplicação de eventos

3. **Validar integração com Typebot**
   - Verificar se helper functions são criadas corretamente
   - Testar interceptação do dataLayer
   - Validar listener de postMessage

4. **Detectar problemas comuns**
   - Script não carregando (CSP, CORS)
   - Métodos não disponíveis (versão antiga)
   - Debug não funcionando
   - Eventos duplicados

## Checklist de Validação

### Setup Inicial
- [ ] Script carrega sem erros no console
- [ ] `window.leadlimpoTrack` existe após `onload`
- [ ] `init()` executa sem erros
- [ ] `setDebug(true)` ativa logs no console

### API Pública
- [ ] `init()` - disponível e funcional
- [ ] `setContext()` - salva em sessionStorage
- [ ] `getContext()` - retorna contexto correto
- [ ] `getUTMs()` - captura UTMs da URL
- [ ] `saveLeadContact()` - persiste phone/email
- [ ] `setDebug()` - controla logs
- [ ] `trackViewContent()` - dispara eventos
- [ ] `trackStarted()` - dispara eventos
- [ ] `trackStepAnswered()` - dispara eventos
- [ ] `trackLead()` - dispara eventos + Enhanced Matching
- [ ] `trackCompleteRegistration()` - dispara eventos

### Eventos
- [ ] ViewContent aparece no dataLayer
- [ ] Started aparece no dataLayer
- [ ] StepAnswered aparece no dataLayer
- [ ] Lead aparece no dataLayer (com dedupe)
- [ ] Eventos Meta Pixel são enviados (se fbq disponível)
- [ ] Enhanced Matching funciona (hash de email/phone)

### Storage
- [ ] UTMs são salvos em sessionStorage
- [ ] Contexto (sessionId, flowId, stepId) é persistido
- [ ] Contato (phone, email) é salvo
- [ ] Cache de dedupe funciona (localStorage)

### Typebot Integration
- [ ] Helper `_leadlimpoTrackStep()` é criada
- [ ] Helper `_leadlimpoTrackLead()` é criada
- [ ] Interceptação do dataLayer funciona
- [ ] Listener de postMessage está ativo

## Comandos de Teste Manual

### Teste Básico (Console do Browser)
```javascript
// 1. Verificar se a lib carregou
console.log(window.leadlimpoTrack);

// 2. Ativar debug
window.leadlimpoTrack.setDebug(true);

// 3. Testar contexto
window.leadlimpoTrack.setContext({
  sessionId: "test-123",
  flowId: "test-flow",
  stepId: "test-step"
});
console.log(window.leadlimpoTrack.getContext());

// 4. Testar UTMs
// Acesse: ?utm_source=test&utm_medium=email
console.log(window.leadlimpoTrack.getUTMs());

// 5. Testar eventos
window.leadlimpoTrack.trackViewContent();
window.leadlimpoTrack.trackStarted({ stepId: "inicio" });
window.leadlimpoTrack.trackStepAnswered({
  stepId: "test",
  answer: "resposta teste"
});

// 6. Verificar dataLayer
console.log(window.dataLayer);
```

### Teste de Lead
```javascript
window.leadlimpoTrack.saveLeadContact({
  phone: "+5511999999999",
  email: "teste@example.com"
});

window.leadlimpoTrack.trackLead({
  value: 100,
  currency: "BRL"
});

// Verificar se Lead apareceu no dataLayer
console.log(window.dataLayer.filter(e => e.event === "leadlimpo_lead"));
```

## Problemas Comuns e Soluções

### Problema: `window.leadlimpoTrack` é undefined
**Causa:** Script não carregou ou erro no carregamento
**Solução:** Verificar console por erros, verificar CSP/CORS, verificar URL do CDN

### Problema: Métodos não existem (ex: `setDebug`)
**Causa:** Versão antiga da lib no CDN
**Solução:** Usar hash específico do commit ou fazer purge do jsDelivr

### Problema: Logs não aparecem mesmo com `setDebug(true)`
**Causa:** Debug pode estar sendo desabilitado por `isProduction()`
**Solução:** Usar `?leadlimpo_debug=1` na URL ou verificar `isDebugEnabled()`

### Problema: Eventos duplicados
**Causa:** Dedupe não está funcionando ou janela muito curta
**Solução:** Verificar cache em localStorage, verificar timestamps

## Script de Validação Automática

```javascript
// Cole no console após carregar a lib
(function() {
  var results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  function test(name, fn) {
    try {
      if (fn()) {
        results.passed++;
        console.log("✅", name);
      } else {
        results.failed++;
        results.errors.push(name);
        console.error("❌", name);
      }
    } catch (e) {
      results.failed++;
      results.errors.push(name + ": " + e.message);
      console.error("❌", name, e);
    }
  }

  // Testes
  test("window.leadlimpoTrack existe", function() {
    return typeof window.leadlimpoTrack === "object";
  });

  test("API completa disponível", function() {
    var api = window.leadlimpoTrack;
    return api.init && api.setContext && api.trackViewContent && api.trackLead;
  });

  test("setDebug funciona", function() {
    window.leadlimpoTrack.setDebug(true);
    return true; // Se não quebrou, passou
  });

  test("setContext persiste", function() {
    window.leadlimpoTrack.setContext({ flowId: "test" });
    var ctx = window.leadlimpoTrack.getContext();
    return ctx.flowId === "test";
  });

  test("dataLayer existe", function() {
    return Array.isArray(window.dataLayer);
  });

  // Resultado
  console.log("\n📊 Resultado:", results.passed + "/" + (results.passed + results.failed), "testes passaram");
  if (results.errors.length > 0) {
    console.error("❌ Erros:", results.errors);
  }
})();
```
