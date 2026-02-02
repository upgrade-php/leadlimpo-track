# Agent: Geração de Código de Integração

## Objetivo

Gerar código de integração personalizado para diferentes plataformas e cenários de uso da biblioteca `leadlimpo-track`.

## Responsabilidades

1. **Gerar snippets de instalação**
   - HTML básico
   - WordPress
   - Next.js / React
   - Vue.js
   - Typebot (blocos Code)

2. **Gerar código de tracking customizado**
   - Eventos específicos por plataforma
   - Integrações com CRMs
   - Webhooks personalizados
   - A/B testing

3. **Criar helpers e utilitários**
   - Funções wrapper para frameworks
   - Hooks React/Vue
   - Middleware para rotas

4. **Documentar padrões de uso**
   - Best practices por plataforma
   - Exemplos de código
   - Troubleshooting específico

## Templates de Integração

### 1. HTML Básico (Landing Page)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Minha Landing Page</title>
  
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
  
  <!-- Meta Pixel -->
  <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', 'SEU_PIXEL_ID');
    fbq('track', 'PageView');
  </script>
  
  <!-- leadlimpo-track -->
  <script>
    (function (w, d, s, src, id) {
      if (!w || !d) return;
      if (d.getElementById(id)) return;

      var js = d.createElement(s);
      var fjs = d.getElementsByTagName(s)[0];

      js.id = id;
      js.async = true;
      js.src = src;
      js.setAttribute("data-leadlimpo-debug", "true"); // Remove em produção

      js.onload = function () {
        if (!w.leadlimpoTrack) return;
        try {
          w.leadlimpoTrack.init();
          w.leadlimpoTrack.setContext({
            flowId: "landing-page-produto"
          });
          w.leadlimpoTrack.trackViewContent();
        } catch (e) {
          console.error("[leadlimpo-track] Erro:", e);
        }
      };

      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      } else if (d.head) {
        d.head.appendChild(js);
      }
    })(window, document, "script", 
       "https://cdn.jsdelivr.net/gh/upgrade-php/leadlimpo-track@main/leadlimpo-track.js", 
       "leadlimpo-track-sdk");
  </script>
</head>
<body>
  <!-- Seu conteúdo aqui -->
  
  <!-- Exemplo: Botão de CTA -->
  <button onclick="trackCTA()">Solicitar Cotação</button>
  
  <script>
    function trackCTA() {
      if (window.leadlimpoTrack) {
        window.leadlimpoTrack.trackStarted({ stepId: "cta_clicked" });
      }
    }
  </script>
</body>
</html>
```

### 2. Next.js (React)

```javascript
// pages/_app.js ou app/layout.js
import { useEffect } from 'react';
import Script from 'next/script';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Configuração após o script carregar
    if (window.leadlimpoTrack) {
      window.leadlimpoTrack.setContext({
        flowId: 'nextjs-funnel'
      });
    }
  }, []);

  return (
    <>
      {/* Google Tag Manager */}
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-XXXXXXX');`}
      </Script>

      {/* Meta Pixel */}
      <Script id="fb-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', 'SEU_PIXEL_ID');
        fbq('track', 'PageView');`}
      </Script>

      {/* leadlimpo-track */}
      <Script
        id="leadlimpo-track"
        src="https://cdn.jsdelivr.net/gh/upgrade-php/leadlimpo-track@main/leadlimpo-track.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.leadlimpoTrack) {
            window.leadlimpoTrack.init();
            window.leadlimpoTrack.trackViewContent();
          }
        }}
      />

      <Component {...pageProps} />
    </>
  );
}

// Hook customizado para usar no app
// hooks/useLeadlimpoTrack.js
import { useEffect } from 'react';

export function useLeadlimpoTrack() {
  useEffect(() => {
    // Helper para garantir que a lib está carregada
    const checkLib = setInterval(() => {
      if (window.leadlimpoTrack) {
        clearInterval(checkLib);
      }
    }, 100);

    return () => clearInterval(checkLib);
  }, []);

  return {
    trackStep: (stepId, answer, meta) => {
      if (window.leadlimpoTrack) {
        window.leadlimpoTrack.trackStepAnswered({ stepId, answer, meta });
      }
    },
    trackLead: (phone, email, meta) => {
      if (window.leadlimpoTrack) {
        window.leadlimpoTrack.saveLeadContact({ phone, email });
        window.leadlimpoTrack.trackLead({ phone, email, meta });
      }
    },
    setContext: (context) => {
      if (window.leadlimpoTrack) {
        window.leadlimpoTrack.setContext(context);
      }
    }
  };
}

// Uso no componente
// pages/formulario.js
import { useLeadlimpoTrack } from '../hooks/useLeadlimpoTrack';

export default function Formulario() {
  const { trackStep, trackLead } = useLeadlimpoTrack();

  const handleSubmit = (e) => {
    e.preventDefault();
    const phone = e.target.phone.value;
    const email = e.target.email.value;
    
    trackLead(phone, email, {
      origem: 'formulario-nextjs'
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Seu formulário aqui */}
    </form>
  );
}
```

### 3. WordPress

```php
<?php
// functions.php

// Adicionar leadlimpo-track no footer
function add_leadlimpo_track() {
    ?>
    <script>
    (function (w, d, s, src, id) {
      if (!w || !d) return;
      if (d.getElementById(id)) return;

      var js = d.createElement(s);
      var fjs = d.getElementsByTagName(s)[0];

      js.id = id;
      js.async = true;
      js.src = src;
      <?php if (WP_DEBUG): ?>
      js.setAttribute("data-leadlimpo-debug", "true");
      <?php endif; ?>

      js.onload = function () {
        if (!w.leadlimpoTrack) return;
        try {
          w.leadlimpoTrack.init();
          w.leadlimpoTrack.setContext({
            flowId: "<?php echo get_post_slug(); ?>"
          });
          w.leadlimpoTrack.trackViewContent();
        } catch (e) {
          console.error("[leadlimpo-track] Erro:", e);
        }
      };

      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      } else if (d.head) {
        d.head.appendChild(js);
      }
    })(window, document, "script", 
       "https://cdn.jsdelivr.net/gh/upgrade-php/leadlimpo-track@main/leadlimpo-track.js", 
       "leadlimpo-track-sdk");
    </script>
    <?php
}
add_action('wp_footer', 'add_leadlimpo_track');

// Integração com formulário de contato (Contact Form 7)
function track_cf7_submission($contact_form) {
    $submission = WPCF7_Submission::get_instance();
    if ($submission) {
        $posted_data = $submission->get_posted_data();
        $phone = isset($posted_data['telefone']) ? $posted_data['telefone'] : '';
        $email = isset($posted_data['email']) ? $posted_data['email'] : '';
        
        ?>
        <script>
        if (window.leadlimpoTrack) {
          window.leadlimpoTrack.saveLeadContact({
            phone: "<?php echo esc_js($phone); ?>",
            email: "<?php echo esc_js($email); ?>"
          });
          window.leadlimpoTrack.trackLead({
            phone: "<?php echo esc_js($phone); ?>",
            email: "<?php echo esc_js($email); ?>",
            meta: {
              origem: "contact-form-7",
              form_id: "<?php echo $contact_form->id(); ?>"
            }
          });
        }
        </script>
        <?php
    }
}
add_action('wpcf7_mail_sent', 'track_cf7_submission');
?>
```

### 4. Typebot (Blocos Code)

Ver `TYPEBOT_TRACKING_BLOCKS.md` para a implementação completa com helper functions.

## Gerador de Código Personalizado

### Parâmetros de Entrada

- **Plataforma**: HTML, WordPress, Next.js, Vue, Typebot
- **Flow ID**: Identificador do funil
- **Debug**: Ativar/desativar debug
- **Eventos customizados**: Lista de eventos específicos
- **Integrações**: CRM, Webhook, etc.

### Exemplo de Uso do Agent

```
Input: 
- Plataforma: Next.js
- Flow ID: cotacao-plano-saude
- Debug: true
- Eventos: [step_interesse, step_valor, lead_conversion]

Output:
- Código completo de integração
- Hook React customizado
- Exemplos de uso
```

## Checklist de Integração

### Antes de Integrar
- [ ] GTM configurado e funcionando
- [ ] Meta Pixel instalado e testado
- [ ] CDN do leadlimpo-track acessível
- [ ] Debug ativado para testes

### Durante Integração
- [ ] Script carregando sem erros
- [ ] `window.leadlimpoTrack` disponível
- [ ] Contexto sendo setado corretamente
- [ ] Eventos aparecendo no dataLayer
- [ ] Eventos aparecendo no Meta Pixel

### Após Integração
- [ ] Testar fluxo completo
- [ ] Verificar deduplicação
- [ ] Validar Enhanced Matching
- [ ] Desativar debug em produção
- [ ] Documentar customizações

## Troubleshooting por Plataforma

### Next.js
- **Problema**: Script não carrega
- **Solução**: Usar `strategy="afterInteractive"` no Script component

### WordPress
- **Problema**: Conflito com outros plugins
- **Solução**: Adicionar prioridade no hook, verificar namespace

### Typebot
- **Problema**: Helper functions não disponíveis
- **Solução**: Verificar se script carregou antes dos blocos Code executarem
