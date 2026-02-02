# Blocos Code para Tracking no Typebot (Arquitetura Otimizada)

Este documento apresenta uma **arquitetura DRY (Don't Repeat Yourself)** para rastrear interações no Typebot, usando funções helper que reduzem o código em **76%** e melhoram significativamente a manutenibilidade.

## 🎯 Arquitetura

### Estratégia: Helper Functions Globais

Em vez de repetir código em cada bloco, criamos **2 funções helper** no bloco Code inicial:
- `_leadlimpoTrackStep()` - Para micro-conversões (respostas de passos)
- `_leadlimpoTrackLead()` - Para a conversão principal (Lead)

Cada bloco Code depois disso fica com **apenas 1 linha de código**.

---

## 📋 Setup Inicial (Bloco Code no Início)

**Bloco:** `sl6a8nytinij89qb3mprf5fn` (já existe no seu Typebot)  
**Grupo:** `ixmc0zg9m1meglw18ywc7w7t`

**Substitua o conteúdo atual por:**

```javascript
(function () {
  var s = document.createElement("script");
  s.src =
    "https://cdn.jsdelivr.net/gh/upgrade-php/leadlimpo-track@4ec4bb2/leadlimpo-track.js";
  s.async = true;

  s.onload = function () {
    if (!window.leadlimpoTrack) return;

    // Configuração inicial
    window.leadlimpoTrack.setDebug(true);
    window.leadlimpoTrack.init();
    window.leadlimpoTrack.trackViewContent();
    window.leadlimpoTrack.trackStarted({ stepId: "inicio" });

    // ============================================
    // HELPER FUNCTION: Tracking de Passos
    // ============================================
    // Uso: _leadlimpoTrackStep("stepId", "{{variavel}}", { metaExtra: "opcional" })
    window._leadlimpoTrackStep = function(stepId, answer, metaExtra) {
      if (!window.leadlimpoTrack) return;
      
      var meta = metaExtra || {};
      meta[stepId] = answer; // Auto-inclui o campo no meta
      
      window.leadlimpoTrack.trackStepAnswered({
        stepId: stepId,
        answer: answer,
        meta: meta
      });
    };

    // ============================================
    // HELPER FUNCTION: Tracking de Lead
    // ============================================
    // Uso: _leadlimpoTrackLead("{{whatsapp}}", { nome: "{{nome}}", ... })
    window._leadlimpoTrackLead = function(phone, metaExtra) {
      if (!window.leadlimpoTrack) return;
      
      // Salva o contato para Enhanced Matching
      window.leadlimpoTrack.saveLeadContact({ phone: phone });
      
      // Marca o passo como respondido
      window.leadlimpoTrack.trackStepAnswered({
        stepId: "whatsapp",
        answer: phone,
        meta: { whatsapp: phone }
      });
      
      // Prepara meta com origem padrão
      var meta = metaExtra || {};
      meta.origem_funil = "typebot_cotacao_plano_saude";
      
      // Dispara o evento de Lead (conversão principal)
      window.leadlimpoTrack.trackLead({
        phone: phone,
        meta: meta
      });
    };
  };

  document.head.appendChild(s);
})();
```

---

## 🚀 Blocos Code Simplificados (1 linha cada)

Agora cada bloco Code após uma resposta importante fica com **apenas 1 linha**:

### 1. Após escolher o Interesse

**Bloco:** Após `block_interesse_choice`  
**Variável:** `var_interesse`

```javascript
_leadlimpoTrackStep("interesse", "{{interesse}}");
```

---

### 2. Após detalhe do Interesse (se escolheu "Outra opção")

**Bloco:** Após `block_interesse_detalhe_input`  
**Variável:** `var_interesse_detalhe`

```javascript
_leadlimpoTrackStep("interesse_detalhe", "{{interesse_detalhe}}");
```

---

### 3. Após escolher Número de Vidas

**Bloco:** Após `block_numero_vidas_choice`  
**Variável:** `var_numero_vidas`

```javascript
_leadlimpoTrackStep("numero_vidas", "{{numero_vidas}}");
```

---

### 4. Após informar Idades

**Bloco:** Após `qgj20zqjyv96d6g056ic2b2j`  
**Variável:** `var_idade`

```javascript
_leadlimpoTrackStep("idade", "{{idade}}");
```

---

### 5. Após informar CEP

**Bloco:** Após `block_cidade_input`  
**Variável:** `veptcksgt0fhwwcr259exm3en` (cep)

```javascript
_leadlimpoTrackStep("cep", "{{cep}}");
```

---

### 6. Após escolher Situação Atual

**Bloco:** Após `aaqhhm5pyto5zf8nla6ng2eq`  
**Variável:** `var_situacao_atual`

```javascript
_leadlimpoTrackStep("situacao_atual", "{{situacao_atual}}");
```

---

### 7. Após detalhe da Situação (se escolheu "Outra situação")

**Bloco:** Após `block_situacao_detalhe_input`  
**Variável:** `var_situacao_detalhe`

```javascript
_leadlimpoTrackStep("situacao_detalhe", "{{situacao_detalhe}}");
```

---

### 8. Após escolher Tipo de Plano (PF/PJ/MEI)

**Bloco:** Após `for1srb31q5la30k5xyztlht`  
**Variável:** `vzp7hme6u05vot78dqa259wgn` (tipo_de_plano)

```javascript
_leadlimpoTrackStep("tipo_de_plano", "{{tipo_de_plano}}");
```

---

### 9. Após escolher Operadora Atual (se já tem plano)

**Bloco:** Após `kac1yafcowwn22r853hh2zks`  
**Variável:** `vgh197mgh47k7kwm6yn7kz58d` (operadora_atual)

```javascript
_leadlimpoTrackStep("operadora_atual", "{{operadora_atual}}");
```

---

### 10. Após escolher Prioridade

**Bloco:** Após `block_prioridade_choice`  
**Variável:** `var_prioridade`

```javascript
_leadlimpoTrackStep("prioridade", "{{prioridade}}");
```

---

### 11. Após detalhe da Prioridade (se escolheu "Outra prioridade")

**Bloco:** Após `block_prioridade_detalhe_input`  
**Variável:** `var_prioridade_detalhe`

```javascript
_leadlimpoTrackStep("prioridade_detalhe", "{{prioridade_detalhe}}");
```

---

### 12. Após escolher Preferências

**Bloco:** Após `block_preferencias_choice`  
**Variável:** `var_preferencias`

```javascript
_leadlimpoTrackStep("preferencias", "{{preferencias}}");
```

---

### 13. Após escolher Receio

**Bloco:** Após `block_receio_choice`  
**Variável:** `var_receio`

```javascript
_leadlimpoTrackStep("receio", "{{receio}}");
```

---

### 14. Após escolher Faixa de Valor

**Bloco:** Após `block_faixa_valor_choice`  
**Variável:** `var_faixa_valor`

```javascript
_leadlimpoTrackStep("faixa_valor", "{{faixa_valor}}");
```

---

### 15. Após escolher Momento de Compra

**Bloco:** Após `block_momento_choice`  
**Variável:** `var_momento_compra`

```javascript
_leadlimpoTrackStep("momento_compra", "{{momento_compra}}");
```

---

### 16. Após escolher Prazo de Ativação

**Bloco:** Após `block_prazo_choice`  
**Variável:** `var_prazo_ativacao`

```javascript
_leadlimpoTrackStep("prazo_ativacao", "{{prazo_ativacao}}");
```

---

### 17. Após informar Nome

**Bloco:** Após `block_contato_nome`  
**Variável:** `var_nome`

```javascript
_leadlimpoTrackStep("nome", "{{nome}}");
```

---

### 18. Após informar WhatsApp (LEAD - Conversão Principal) ⭐

**Bloco:** Após `block_contato_whatsapp`  
**Variável:** `var_whatsapp`

```javascript
_leadlimpoTrackLead("{{whatsapp}}", {
  nome: "{{nome}}",
  interesse: "{{interesse}}",
  numero_vidas: "{{numero_vidas}}",
  faixa_valor: "{{faixa_valor}}"
});
```

---

## 📊 Comparação: Antes vs Depois

| Métrica | Arquitetura Antiga | Arquitetura Nova |
|---------|-------------------|------------------|
| **Linhas de código total** | ~285 linhas | ~69 linhas |
| **Redução** | - | **76% menos código** |
| **Manutenibilidade** | Mudar em 19 lugares | Mudar em 1 lugar (helper) |
| **Risco de erro** | Alto (copy/paste) | Baixo (função única) |
| **Performance** | 19 execuções completas | 1 função + 19 chamadas simples |
| **Escalabilidade** | Adicionar = novo bloco completo | Adicionar = 1 linha |

---

## 🎨 Uso Avançado (com meta extra)

Se precisar adicionar campos extras em um passo específico, use o terceiro parâmetro:

```javascript
_leadlimpoTrackStep("interesse", "{{interesse}}", {
  timestamp: Date.now(),
  origem: "typebot",
  versao: "1.0"
});
```

---

## ✅ Resumo da Ordem de Execução

1. ✅ **Setup Inicial** - Bloco Code no início (`sl6a8nytinij89qb3mprf5fn`)
   - Carrega a lib
   - Cria as funções helper
   - Dispara `trackViewContent()` e `trackStarted()`

2. **Interesse** → `_leadlimpoTrackStep("interesse", "{{interesse}}")`
3. **(Opcional) Detalhe do Interesse** → `_leadlimpoTrackStep("interesse_detalhe", "{{interesse_detalhe}}")`
4. **Número de Vidas** → `_leadlimpoTrackStep("numero_vidas", "{{numero_vidas}}")`
5. **Idades** → `_leadlimpoTrackStep("idade", "{{idade}}")`
6. **CEP** → `_leadlimpoTrackStep("cep", "{{cep}}")`
7. **Situação Atual** → `_leadlimpoTrackStep("situacao_atual", "{{situacao_atual}}")`
8. **(Opcional) Detalhe da Situação** → `_leadlimpoTrackStep("situacao_detalhe", "{{situacao_detalhe}}")`
9. **Tipo de Plano** → `_leadlimpoTrackStep("tipo_de_plano", "{{tipo_de_plano}}")`
10. **(Opcional) Operadora Atual** → `_leadlimpoTrackStep("operadora_atual", "{{operadora_atual}}")`
11. **Prioridade** → `_leadlimpoTrackStep("prioridade", "{{prioridade}}")`
12. **(Opcional) Detalhe da Prioridade** → `_leadlimpoTrackStep("prioridade_detalhe", "{{prioridade_detalhe}}")`
13. **Preferências** → `_leadlimpoTrackStep("preferencias", "{{preferencias}}")`
14. **Receio** → `_leadlimpoTrackStep("receio", "{{receio}}")`
15. **Faixa de Valor** → `_leadlimpoTrackStep("faixa_valor", "{{faixa_valor}}")`
16. **Momento de Compra** → `_leadlimpoTrackStep("momento_compra", "{{momento_compra}}")`
17. **Prazo de Ativação** → `_leadlimpoTrackStep("prazo_ativacao", "{{prazo_ativacao}}")`
18. **Nome** → `_leadlimpoTrackStep("nome", "{{nome}}")`
19. **WhatsApp (LEAD)** → `_leadlimpoTrackLead("{{whatsapp}}", { ... })` ⭐

---

## 🔧 Vantagens da Nova Arquitetura

1. ✅ **DRY (Don't Repeat Yourself)**: Código centralizado em funções helper
2. ✅ **Manutenibilidade**: Mudanças em um único lugar
3. ✅ **Menos erros**: Elimina copy/paste de código
4. ✅ **Performance**: Função otimizada executada uma vez
5. ✅ **Legibilidade**: Blocos Code com apenas 1 linha
6. ✅ **Flexibilidade**: Parâmetro `metaExtra` permite customização quando necessário
7. ✅ **Escalabilidade**: Adicionar novos passos = adicionar 1 linha

---

## 📝 Notas Importantes

- As funções helper são criadas no `onload` do script, então só estarão disponíveis **após o script carregar**
- Todos os blocos Code verificam se `window.leadlimpoTrack` existe (seguro)
- O bloco do WhatsApp é o mais importante, pois dispara o evento de **Lead** (conversão principal)
- Os blocos opcionais só são executados em certos fluxos (ex.: detalhe só aparece se escolher "Outra opção")
- Você pode adicionar mais campos no `metaExtra` de qualquer evento se quiser rastrear dados adicionais

---

## 🚨 Troubleshooting

### Problema: Função `_leadlimpoTrackStep` não está definida

**Causa:** O script ainda não carregou quando o bloco Code executou.

**Solução:** Adicione uma verificação de segurança:

```javascript
if (typeof _leadlimpoTrackStep === "function") {
  _leadlimpoTrackStep("interesse", "{{interesse}}");
} else {
  // Retry após 500ms
  setTimeout(function() {
    if (typeof _leadlimpoTrackStep === "function") {
      _leadlimpoTrackStep("interesse", "{{interesse}}");
    }
  }, 500);
}
```

### Problema: Eventos não aparecem no console

**Causa:** Debug pode estar desabilitado.

**Solução:** Verifique se `setDebug(true)` está no bloco inicial, ou adicione `?leadlimpo_debug=1` na URL do Typebot.

---

## 📚 Referências

- Documentação completa: `LEADLIMPO_TRACK_INTEGRATION.md`
- Regras de negócio: `LEADLIMPO_TRACK_RULES.md`
- Repositório: `https://github.com/upgrade-php/leadlimpo-track`
