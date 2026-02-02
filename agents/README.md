# Agents do Projeto leadlimpo-track

Esta pasta contém agents especializados para ajudar no desenvolvimento, validação e integração da biblioteca `leadlimpo-track`.

## 📋 Agents Disponíveis

### 1. Validation Agent (`validation-agent.md`)

**Propósito**: Validar e testar a biblioteca para garantir que está funcionando corretamente.

**Quando usar**:
- Após fazer mudanças no código
- Antes de fazer deploy
- Para debugar problemas reportados
- Para validar integrações

**Funcionalidades**:
- ✅ Validação da estrutura da API
- ✅ Testes de funcionalidades core
- ✅ Validação de integração com Typebot
- ✅ Detecção de problemas comuns
- ✅ Script de validação automática

**Como usar**:
1. Abra `validation-agent.md`
2. Siga o checklist de validação
3. Execute os comandos de teste manual no console
4. Use o script de validação automática para testes rápidos

---

### 2. Integration Agent (`integration-agent.md`)

**Propósito**: Gerar código de integração personalizado para diferentes plataformas.

**Quando usar**:
- Ao integrar a lib em uma nova plataforma
- Para criar snippets customizados
- Para documentar padrões de uso
- Para gerar helpers e utilitários

**Funcionalidades**:
- ✅ Templates para HTML, WordPress, Next.js, Vue, Typebot
- ✅ Hooks e utilitários para frameworks
- ✅ Exemplos de código completos
- ✅ Troubleshooting por plataforma
- ✅ Checklist de integração

**Como usar**:
1. Abra `integration-agent.md`
2. Escolha o template da sua plataforma
3. Copie e adapte o código conforme necessário
4. Siga o checklist de integração

---

## 🚀 Uso Rápido

### Validação Rápida

```javascript
// Cole no console do browser após carregar a lib
console.log("✅ Lib carregada:", !!window.leadlimpoTrack);
console.log("✅ API completa:", !!window.leadlimpoTrack?.trackLead);
window.leadlimpoTrack?.setDebug(true);
window.leadlimpoTrack?.trackViewContent();
console.log("✅ Evento enviado:", window.dataLayer?.some(e => e.event === "leadlimpo_viewcontent"));
```

### Integração Rápida (HTML)

```html
<script>
(function (w, d, s, src, id) {
  var js = d.createElement(s);
  js.src = src;
  js.async = true;
  js.onload = function () {
    if (w.leadlimpoTrack) {
      w.leadlimpoTrack.init();
      w.leadlimpoTrack.trackViewContent();
    }
  };
  d.head.appendChild(js);
})(window, document, "script", 
   "https://cdn.jsdelivr.net/gh/upgrade-php/leadlimpo-track@main/leadlimpo-track.js", 
   "leadlimpo-track-sdk");
</script>
```

---

## 📚 Documentação Relacionada

- **Biblioteca principal**: `leadlimpo-track.js`
- **Regras de negócio**: `LEADLIMPO_TRACK_RULES.md`
- **Guia de integração**: `LEADLIMPO_TRACK_INTEGRATION.md`
- **Blocos Typebot**: `TYPEBOT_TRACKING_BLOCKS.md`
- **Snippet de instalação**: `README.md`

---

## 🔧 Contribuindo

Ao criar novos agents ou melhorar os existentes:

1. Mantenha o formato markdown
2. Inclua exemplos práticos
3. Adicione troubleshooting
4. Documente casos de uso
5. Atualize este README

---

## 💡 Dicas

- Use o **Validation Agent** regularmente durante o desenvolvimento
- Use o **Integration Agent** quando precisar de código pronto para copiar
- Ambos os agents podem ser consultados pelo Cursor AI para gerar código personalizado
- Os scripts de teste podem ser salvos como bookmarks no browser para acesso rápido
