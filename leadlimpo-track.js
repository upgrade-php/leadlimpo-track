/**
 * leadlimpo-track.js
 *
 * Biblioteca standalone de tracking para geração de leads.
 * - Envia eventos padronizados para Meta Pixel (fbq) e Google Tag Manager (dataLayer)
 * - Não depende de frameworks nem de uma ferramenta específica de chat
 * - Expõe uma API global: window.leadlimpoTrack
 */

(function () {
  "use strict";

  // ============================================================
  // CONFIGURAÇÃO E ESTADO
  // ============================================================

  var CONFIG = {
    STORAGE_KEYS: {
      UTMS: "utm_params", // reutiliza chave comum para compatibilidade
      SESSION_ID: "leadlimpo_session_id",
      FLOW_ID: "leadlimpo_flow_id",
      STEP_ID: "leadlimpo_step_id",
      PHONE: "leadlimpo_phone",
      EMAIL: "leadlimpo_email",
      META_EVENT_ID: "leadlimpo_event_id",
      GTM_EVENT_CACHE: "leadlimpo_event_cache",
    },
    DEDUP_WINDOW_MS: {
      META_PIXEL: 30000, // 30s
      GTM: 5000, // 5s
    },
  };

  var context = {
    sessionId: undefined,
    flowId: undefined,
    stepId: undefined,
  };

  // Flag interno de debug que pode ser ligado em produção.
  // Pode ser controlado via:
  // - Atributo data no script (ex.: data-leadlimpo-debug="true")
  // - leadlimpoTrack.setDebug(true) (API pública)
  // - (Opcionalmente, para power users) window.LEADLIMPO_DEBUG = true
  var debugEnabled = false;

  // Cache em memória para dedupe de eventos Meta
  var metaEventCache = {};

  // ============================================================
  // UTILITÁRIOS GERAIS
  // ============================================================

  function isBrowser() {
    return typeof window !== "undefined" && typeof document !== "undefined";
  }

  function isProduction() {
    if (!isBrowser()) return false;
    var host = window.location.hostname || "";

    if (
      host === "localhost" ||
      host.indexOf("127.") === 0 ||
      host.endsWith(".local")
    ) {
      return false;
    }
    return true;
  }

  function isDebugEnabled() {
    if (!isBrowser()) return false;

    // Prioridade 1: flag setado via API pública
    if (debugEnabled) return true;

    // Prioridade 2: flag global para facilitar debug em produção
    // (uso avançado, não recomendado para a maioria das integrações)
    // Aceita true / "true" / 1 / "1"
    try {
      var globalFlag =
        typeof window !== "undefined" ? window.LEADLIMPO_DEBUG : undefined;
      if (
        globalFlag === true ||
        globalFlag === "true" ||
        globalFlag === 1 ||
        globalFlag === "1"
      ) {
        return true;
      }
    } catch (e) {
      // ignora erros de acesso ao window
    }

    // Comportamento padrão: debug só em ambientes não‑produtivos
    return !isProduction();
  }

  function devLog() {
    if (isDebugEnabled() && typeof console !== "undefined" && console.log) {
      // eslint-disable-next-line prefer-rest-params
      console.log.apply(console, arguments);
    }
  }

  function safeGetSessionStorage(key) {
    if (!isBrowser()) return undefined;
    try {
      return window.sessionStorage.getItem(key);
    } catch (e) {
      return undefined;
    }
  }

  function safeSetSessionStorage(key, value) {
    if (!isBrowser()) return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      // ignora
    }
  }

  function safeGetLocalStorage(key) {
    if (!isBrowser()) return undefined;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return undefined;
    }
  }

  function safeSetLocalStorage(key, value) {
    if (!isBrowser()) return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      // ignora
    }
  }

  // ============================================================
  // UTM TRACKING
  // ============================================================

  function getUTMParamsFromUrl() {
    if (!isBrowser()) return {};

    var params = {};
    var search = window.location.search || "";
    if (!search) return params;

    var urlParams = new URLSearchParams(search);
    var utmKeys = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ];

    utmKeys.forEach(function (key) {
      var value = urlParams.get(key);
      if (value) params[key] = value;
    });

    // captura qualquer outro parâmetro que comece com utm_
    urlParams.forEach(function (value, key) {
      if (key.indexOf("utm_") === 0 && params[key] == null && value) {
        params[key] = value;
      }
    });

    return params;
  }

  function getUTMsFromStorage() {
    var raw = safeGetSessionStorage(CONFIG.STORAGE_KEYS.UTMS);
    if (!raw) return {};
    try {
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveUTMsToStorage(utms) {
    if (!utms || typeof utms !== "object") return;
    var existing = getUTMsFromStorage();
    var merged = {};

    // merge preservando valores existentes se não forem sobrescritos
    Object.keys(existing).forEach(function (k) {
      merged[k] = existing[k];
    });
    Object.keys(utms).forEach(function (k) {
      if (utms[k]) {
        merged[k] = utms[k];
      }
    });

    // remove chaves vazias
    Object.keys(merged).forEach(function (k) {
      if (merged[k] == null || merged[k] === "") {
        delete merged[k];
      }
    });

    try {
      safeSetSessionStorage(CONFIG.STORAGE_KEYS.UTMS, JSON.stringify(merged));
    } catch (e) {
      // ignora
    }
  }

  function getCombinedUTMs() {
    var fromStorage = getUTMsFromStorage();
    var fromUrl = getUTMParamsFromUrl();
    var merged = {};

    Object.keys(fromStorage).forEach(function (k) {
      merged[k] = fromStorage[k];
    });
    Object.keys(fromUrl).forEach(function (k) {
      var value = fromUrl[k];
      if (value) {
        merged[k] = value;
      }
    });

    return merged;
  }

  // ============================================================
  // META PIXEL (fbq)
  // ============================================================

  function isFbqAvailable() {
    return isBrowser() && typeof window.fbq === "function";
  }

  function normalizePhone(phone) {
    if (!phone) return "";
    return String(phone).replace(/\D/g, "");
  }

  function sha256Hash(text) {
    if (!isBrowser() || !window.crypto || !window.crypto.subtle) {
      // se não houver suporte, retorna string vazia para não quebrar
      return Promise.resolve("");
    }

    var normalized = String(text || "").trim().toLowerCase();
    var encoder = new TextEncoder();
    var data = encoder.encode(normalized);

    return window.crypto.subtle.digest("SHA-256", data).then(function (buf) {
      var hashArray = Array.from(new Uint8Array(buf));
      return hashArray
        .map(function (b) {
          return b.toString(16).padStart(2, "0");
        })
        .join("");
    });
  }

  function getMetaEventId() {
    if (!isBrowser()) return undefined;

    // tenta sessionStorage primeiro
    var stored = safeGetSessionStorage(CONFIG.STORAGE_KEYS.META_EVENT_ID);
    if (stored) return stored;

    // tenta dataLayer do GTM
    var dataLayer = window.dataLayer || [];
    var eventId;

    try {
      for (var i = dataLayer.length - 1; i >= 0; i--) {
        var item = dataLayer[i];
        if (item && item.event_id) {
          eventId = item.event_id;
          break;
        }
      }
    } catch (e) {
      // ignora
    }

    if (eventId) {
      safeSetSessionStorage(CONFIG.STORAGE_KEYS.META_EVENT_ID, String(eventId));
    }

    return eventId;
  }

  function getMetaCacheKey(eventName, sessionId, flowId) {
    return (
      String(eventName || "event") +
      "_" +
      String(sessionId || "no-session") +
      "_" +
      String(flowId || "no-flow")
    );
  }

  function isMetaDuplicate(cacheKey) {
    if (!metaEventCache[cacheKey]) return false;
    var now = Date.now();
    var diff = now - metaEventCache[cacheKey];
    return diff < CONFIG.DEDUP_WINDOW_MS.META_PIXEL;
  }

  function registerMetaEvent(cacheKey) {
    metaEventCache[cacheKey] = Date.now();
  }

  function prepareMetaParams(baseParams, email, phone) {
    var params = {};
    Object.keys(baseParams || {}).forEach(function (k) {
      if (baseParams[k] !== undefined) {
        params[k] = baseParams[k];
      }
    });

    var eventId = getMetaEventId();

    // Enhanced Matching
    var emPromise = email
      ? sha256Hash(email).then(function (hash) {
          if (hash) params.em = hash;
        })
      : Promise.resolve();

    var phPromise = phone
      ? sha256Hash(normalizePhone(phone)).then(function (hash) {
          if (hash) params.ph = hash;
        })
      : Promise.resolve();

    return Promise.all([emPromise, phPromise]).then(function () {
      return { eventParams: params, eventId: eventId };
    });
  }

  function trackMetaEvent(eventType, eventName, params, email, phone) {
    if (!isBrowser()) return;

    if (!isProduction()) {
      devLog("[leadlimpo-track][DEV] Meta Pixel:", eventType, eventName, params);
      return;
    }

    if (!isFbqAvailable()) {
      // tenta novamente após um pequeno delay
      setTimeout(function () {
        if (isFbqAvailable()) {
          trackMetaEvent(eventType, eventName, params, email, phone);
        }
      }, 1000);
      return;
    }

    var cacheKey = getMetaCacheKey(
      eventName,
      params && params.session_id,
      params && params.flow_id
    );

    if (isMetaDuplicate(cacheKey)) {
      devLog(
        "[leadlimpo-track] Evento Meta duplicado bloqueado:",
        eventName,
        params
      );
      return;
    }

    registerMetaEvent(cacheKey);

    prepareMetaParams(params || {}, email, phone)
      .then(function (prepared) {
        var eventParams = prepared.eventParams || {};
        var eventId = prepared.eventId;
        var options = eventId ? { eventID: eventId } : undefined;

        try {
          if (eventType === "trackCustom") {
            if (options) {
              window.fbq("trackCustom", eventName, eventParams, options);
            } else {
              window.fbq("trackCustom", eventName, eventParams);
            }
          } else {
            if (options) {
              window.fbq("track", eventName, eventParams, options);
            } else {
              window.fbq("track", eventName, eventParams);
            }
          }
        } catch (e) {
          devLog(
            "[leadlimpo-track] Erro ao chamar fbq para",
            eventName,
            e
          );
        }
      })
      .catch(function (err) {
        devLog("[leadlimpo-track] Erro ao preparar params Meta:", err);
      });
  }

  // ============================================================
  // GOOGLE TAG MANAGER (dataLayer)
  // ============================================================

  function ensureDataLayer() {
    if (!isBrowser()) return;
    if (!window.dataLayer) {
      window.dataLayer = [];
    }
  }

  function pushToDataLayer(data) {
    if (!isBrowser()) return;
    ensureDataLayer();
    try {
      window.dataLayer.push(data);
      devLog("[leadlimpo-track] dataLayer.push:", data);
    } catch (e) {
      devLog("[leadlimpo-track] Erro ao fazer dataLayer.push:", e);
    }
  }

  function getGtmCache() {
    var raw = safeGetLocalStorage(CONFIG.STORAGE_KEYS.GTM_EVENT_CACHE);
    if (!raw) return {};
    try {
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveGtmCache(cache) {
    try {
      safeSetLocalStorage(
        CONFIG.STORAGE_KEYS.GTM_EVENT_CACHE,
        JSON.stringify(cache)
      );
    } catch (e) {
      // ignora
    }
  }

  function isGtmDuplicate(eventId) {
    if (!eventId) return false;
    var cache = getGtmCache();
    var last = cache[eventId];
    if (!last) return false;
    var diff = Date.now() - last;
    return diff < CONFIG.DEDUP_WINDOW_MS.GTM;
  }

  function registerGtmEvent(eventId) {
    if (!eventId) return;
    var cache = getGtmCache();
    cache[eventId] = Date.now();

    // limpa registros antigos (> 1min)
    var now = Date.now();
    Object.keys(cache).forEach(function (key) {
      if (now - cache[key] > 60000) {
        delete cache[key];
      }
    });

    saveGtmCache(cache);
  }

  // ============================================================
  // CONTEXTO E HELPERS PÚBLICOS
  // ============================================================

  function loadContextFromStorage() {
    var sessionId = safeGetSessionStorage(CONFIG.STORAGE_KEYS.SESSION_ID);
    var flowId = safeGetSessionStorage(CONFIG.STORAGE_KEYS.FLOW_ID);
    var stepId = safeGetSessionStorage(CONFIG.STORAGE_KEYS.STEP_ID);

    if (sessionId) context.sessionId = sessionId;
    if (flowId) context.flowId = flowId;
    if (stepId) context.stepId = stepId;
  }

  function persistContextToStorage() {
    if (context.sessionId) {
      safeSetSessionStorage(
        CONFIG.STORAGE_KEYS.SESSION_ID,
        String(context.sessionId)
      );
    }
    if (context.flowId) {
      safeSetSessionStorage(
        CONFIG.STORAGE_KEYS.FLOW_ID,
        String(context.flowId)
      );
    }
    if (context.stepId) {
      safeSetSessionStorage(
        CONFIG.STORAGE_KEYS.STEP_ID,
        String(context.stepId)
      );
    }
  }

  function setContext(partial) {
    if (!partial || typeof partial !== "object") return;

    if (partial.sessionId != null) {
      context.sessionId = String(partial.sessionId);
    }
    if (partial.flowId != null) {
      context.flowId = String(partial.flowId);
    }
    if (partial.stepId != null) {
      context.stepId = String(partial.stepId);
    }

    persistContextToStorage();
  }

  function setDebug(flag) {
    debugEnabled = !!flag;
    devLog("[leadlimpo-track] Debug mode atualizado:", debugEnabled);
  }

  function applyDebugFromScriptTag() {
    if (!isBrowser()) return;

    try {
      var doc = document;
      var script =
        doc.currentScript || doc.getElementById("leadlimpo-track-sdk");

      if (!script) {
        var scripts = doc.getElementsByTagName("script");
        for (var i = 0; i < scripts.length; i++) {
          var s = scripts[i];
          if (
            s &&
            typeof s.src === "string" &&
            s.src.indexOf("leadlimpo-track.js") !== -1
          ) {
            script = s;
            break;
          }
        }
      }

      if (!script) return;

      var attr = script.getAttribute("data-leadlimpo-debug");
      if (attr == null) return;

      var normalized = String(attr).toLowerCase();
      var shouldDebug =
        normalized === "" ||
        normalized === "true" ||
        normalized === "1" ||
        normalized === "yes";

      if (shouldDebug) {
        setDebug(true);
      }
    } catch (e) {
      // ignora qualquer erro de detecção de script
    }
  }

  function getContext() {
    return {
      sessionId: context.sessionId,
      flowId: context.flowId,
      stepId: context.stepId,
      utms: getCombinedUTMs(),
    };
  }

  function saveLeadContact(payload) {
    if (!payload || typeof payload !== "object") return;
    var phone = payload.phone;
    var email = payload.email;

    if (phone != null) {
      safeSetSessionStorage(CONFIG.STORAGE_KEYS.PHONE, String(phone));
    }
    if (email != null) {
      safeSetSessionStorage(CONFIG.STORAGE_KEYS.EMAIL, String(email));
    }
  }

  function getStoredLeadContact() {
    var phone = safeGetSessionStorage(CONFIG.STORAGE_KEYS.PHONE) || undefined;
    var email = safeGetSessionStorage(CONFIG.STORAGE_KEYS.EMAIL) || undefined;
    return { phone: phone, email: email };
  }

  // ============================================================
  // EVENTOS DE FUNIL DE ALTO NÍVEL
  // ============================================================

  function buildBasePayload(extra) {
    var utms = getCombinedUTMs();
    var payload = {
      session_id: context.sessionId,
      flow_id: context.flowId,
      step_id: context.stepId,
      utm_source: utms.utm_source,
      utm_medium: utms.utm_medium,
      utm_campaign: utms.utm_campaign,
      utm_content: utms.utm_content,
      utm_term: utms.utm_term,
    };

    if (extra && typeof extra === "object") {
      Object.keys(extra).forEach(function (k) {
        if (extra[k] !== undefined) {
          payload[k] = extra[k];
        }
      });
    }

    return payload;
  }

  function trackViewContent(extraParams) {
    var basePayload = buildBasePayload(extraParams);

    // Meta Pixel - ViewContent
    trackMetaEvent(
      "track",
      "ViewContent",
      {
        content_name: "Leadlimpo ViewContent",
        content_category: "Lead Generation",
        session_id: basePayload.session_id,
        flow_id: basePayload.flow_id,
        utm_source: basePayload.utm_source,
        utm_medium: basePayload.utm_medium,
        utm_campaign: basePayload.utm_campaign,
        utm_content: basePayload.utm_content,
        utm_term: basePayload.utm_term,
      },
      undefined,
      undefined
    );

    // GTM - leadlimpo_viewcontent
    var gtmData = buildBasePayload(extraParams);
    gtmData.event = "leadlimpo_viewcontent";
    gtmData.timestamp = Date.now();
    pushToDataLayer(gtmData);
  }

  var startedTracked = false;

  function trackStarted(options) {
    if (options && options.stepId != null) {
      context.stepId = String(options.stepId);
      persistContextToStorage();
    }

    if (!startedTracked) {
      startedTracked = true;
    }

    var basePayload = buildBasePayload();

    // Meta Pixel - custom LeadlimpoStarted
    trackMetaEvent(
      "trackCustom",
      "LeadlimpoStarted",
      {
        session_id: basePayload.session_id,
        flow_id: basePayload.flow_id,
        step_id: basePayload.step_id,
        utm_source: basePayload.utm_source,
        utm_medium: basePayload.utm_medium,
        utm_campaign: basePayload.utm_campaign,
        utm_content: basePayload.utm_content,
        utm_term: basePayload.utm_term,
      },
      undefined,
      undefined
    );

    // GTM
    var gtmData = buildBasePayload();
    gtmData.event = "leadlimpo_started";
    gtmData.timestamp = Date.now();
    pushToDataLayer(gtmData);
  }

  function trackStepAnswered(payload) {
    if (!payload || typeof payload !== "object") payload = {};

    if (payload.stepId != null) {
      context.stepId = String(payload.stepId);
      persistContextToStorage();
    }

    var answer = payload.answer;
    var meta =
      payload.meta && typeof payload.meta === "object" ? payload.meta : {};

    var basePayload = buildBasePayload({
      step_id: context.stepId,
      answer: answer,
    });

    Object.keys(meta).forEach(function (k) {
      if (meta[k] !== undefined) {
        basePayload[k] = meta[k];
      }
    });

    // Meta Pixel - generic custom event
    trackMetaEvent(
      "trackCustom",
      "LeadlimpoStepAnswered",
      {
        session_id: basePayload.session_id,
        flow_id: basePayload.flow_id,
        step_id: basePayload.step_id,
        answer: basePayload.answer,
        utm_source: basePayload.utm_source,
        utm_medium: basePayload.utm_medium,
        utm_campaign: basePayload.utm_campaign,
        utm_content: basePayload.utm_content,
        utm_term: basePayload.utm_term,
      },
      undefined,
      undefined
    );

    // GTM
    var gtmData = {};
    Object.keys(basePayload).forEach(function (k) {
      gtmData[k] = basePayload[k];
    });
    gtmData.event = "leadlimpo_step_answered";
    gtmData.timestamp = Date.now();
    pushToDataLayer(gtmData);
  }

  function trackLead(payload) {
    if (!payload || typeof payload !== "object") payload = {};

    // atualiza contato salvo
    saveLeadContact({
      phone: payload.phone,
      email: payload.email,
    });

    var storedContact = getStoredLeadContact();
    var phone = payload.phone || storedContact.phone;
    var email = payload.email || storedContact.email;

    var basePayload = buildBasePayload();
    var value =
      typeof payload.value === "number" ? payload.value : undefined;
    var currency = payload.currency || (value != null ? "BRL" : undefined);

    var metaExtra =
      payload.meta && typeof payload.meta === "object" ? payload.meta : {};

    // Meta Pixel - Lead
    trackMetaEvent(
      "track",
      "Lead",
      {
        content_name: "Lead Gerado",
        content_category: "Lead Generation",
        value: value,
        currency: currency,
        session_id: basePayload.session_id,
        flow_id: basePayload.flow_id,
        utm_source: basePayload.utm_source,
        utm_medium: basePayload.utm_medium,
        utm_campaign: basePayload.utm_campaign,
        utm_content: basePayload.utm_content,
        utm_term: basePayload.utm_term,
      },
      email,
      phone
    );

    // GTM - dedupe
    var gtmLeadId =
      "leadlimpo_lead_" +
      String(basePayload.session_id || "no-session") +
      "_" +
      String(basePayload.flow_id || "no-flow");

    if (isGtmDuplicate(gtmLeadId)) {
      devLog(
        "[leadlimpo-track] Evento leadlimpo_lead duplicado bloqueado:",
        gtmLeadId
      );
      return;
    }

    registerGtmEvent(gtmLeadId);

    var gtmData = buildBasePayload({
      phone: phone,
      email: email,
    });

    Object.keys(metaExtra).forEach(function (k) {
      if (metaExtra[k] !== undefined) {
        gtmData[k] = metaExtra[k];
      }
    });

    if (value != null) gtmData.value = value;
    if (currency) gtmData.currency = currency;

    gtmData.event = "leadlimpo_lead";
    gtmData.timestamp = Date.now();

    pushToDataLayer(gtmData);
  }

  function trackCompleteRegistration(payload) {
    if (!payload || typeof payload !== "object") payload = {};
    var status =
      typeof payload.status === "boolean" ? payload.status : true;
    var metaExtra =
      payload.meta && typeof payload.meta === "object" ? payload.meta : {};

    var basePayload = buildBasePayload();

    // Meta Pixel - CompleteRegistration
    trackMetaEvent(
      "track",
      "CompleteRegistration",
      {
        content_name: "Leadlimpo Complete Registration",
        status: status,
        session_id: basePayload.session_id,
        flow_id: basePayload.flow_id,
        utm_source: basePayload.utm_source,
        utm_medium: basePayload.utm_medium,
        utm_campaign: basePayload.utm_campaign,
        utm_content: basePayload.utm_content,
        utm_term: basePayload.utm_term,
      },
      undefined,
      undefined
    );

    // GTM
    var gtmData = buildBasePayload({ status: status });
    Object.keys(metaExtra).forEach(function (k) {
      if (metaExtra[k] !== undefined) {
        gtmData[k] = metaExtra[k];
      }
    });
    gtmData.event = "leadlimpo_complete_registration";
    gtmData.timestamp = Date.now();

    pushToDataLayer(gtmData);
  }

  // ============================================================
  // API DE BAIXO NÍVEL
  // ============================================================

  function trackMetaCustom(eventName, params) {
    var basePayload = buildBasePayload();
    var merged = {};

    Object.keys(basePayload).forEach(function (k) {
      merged[k] = basePayload[k];
    });
    if (params && typeof params === "object") {
      Object.keys(params).forEach(function (k) {
        if (params[k] !== undefined) {
          merged[k] = params[k];
        }
      });
    }

    trackMetaEvent("trackCustom", String(eventName || "LeadlimpoCustom"), merged);
  }

  function pushToDataLayerWithContext(data) {
    var basePayload = buildBasePayload();
    var merged = {};

    Object.keys(basePayload).forEach(function (k) {
      merged[k] = basePayload[k];
    });

    if (data && typeof data === "object") {
      Object.keys(data).forEach(function (k) {
        if (data[k] !== undefined) {
          merged[k] = data[k];
        }
      });
    }

    if (!merged.event) {
      merged.event = "leadlimpo_custom";
    }
    if (!merged.timestamp) {
      merged.timestamp = Date.now();
    }

    pushToDataLayer(merged);
  }

  // ============================================================
  // INICIALIZAÇÃO
  // ============================================================

  // Integração best-effort com Typebot em modo hospedado (link direto)
  var typebotHostedIntegrationInitialized = false;

  function setupTypebotHostedIntegration() {
    if (!isBrowser()) return;
    if (typebotHostedIntegrationInitialized) return;

    typebotHostedIntegrationInitialized = true;

    function handleTypebotMessage(event) {
      var data = event && event.data;
      if (!data) return;

      // Tenta parsear se vier como string JSON
      if (typeof data === "string") {
        try {
          var parsed = JSON.parse(data);
          if (parsed && typeof parsed === "object") {
            data = parsed;
          }
        } catch (e) {
          // ignora strings não‑JSON
        }
      }

      if (!data || typeof data !== "object") return;

      // Heurísticas para identificar mensagens vindas do Typebot
      var fromTypebot =
        data.source === "typebot" ||
        data.from === "typebot" ||
        (typeof data.type === "string" &&
          data.type.toLowerCase().indexOf("typebot") === 0) ||
        (typeof data.event === "string" &&
          data.event.toLowerCase().indexOf("typebot") === 0);

      if (!fromTypebot) return;

      devLog("[leadlimpo-track] Mensagem potencial do Typebot:", data);

      var eventType =
        (data.type && String(data.type).toLowerCase()) ||
        (data.event && String(data.event).toLowerCase()) ||
        "";

      // View / started
      if (eventType === "typebot_started" || eventType === "typebot.start") {
        // primeira interação
        trackStarted({ stepId: "inicio" });
        return;
      }

      // Respostas de passos
      if (
        eventType === "typebot_answer" ||
        eventType === "typebot.message" ||
        eventType === "typebot_block_answered"
      ) {
        var stepId =
          data.blockId ||
          data.stepId ||
          data.block_id ||
          data.questionId ||
          "unknown_step";
        var answer =
          data.answer ||
          data.message ||
          data.value ||
          (data.payload && data.payload.answer);

        // Atualiza contexto e registra micro‑conversão
        trackStepAnswered({
          stepId: stepId,
          answer: answer,
        });

        // Heurística para identificar bloco de contato/WhatsApp
        var stepIdLower = String(stepId || "").toLowerCase();
        if (
          stepIdLower.indexOf("whatsapp") !== -1 ||
          stepIdLower.indexOf("contato") !== -1 ||
          stepIdLower.indexOf("telefone") !== -1
        ) {
          if (answer) {
            saveLeadContact({ phone: answer });
            trackLead({});
          }
        }

        return;
      }

      // Conclusão do fluxo
      if (
        eventType === "typebot_completed" ||
        eventType === "typebot.end" ||
        eventType === "typebot_finished"
      ) {
        trackCompleteRegistration({ status: true });
        return;
      }
    }

    window.addEventListener("message", handleTypebotMessage);
  }

  function init() {
    if (!isBrowser()) return;

    // aplica flag de debug caso o script tenha sido marcado com data-leadlimpo-debug
    applyDebugFromScriptTag();

    // carrega contexto salvo, se existir
    loadContextFromStorage();

    // define flowId padrão baseado na URL, se ainda não existir
    if (!context.flowId) {
      try {
        var path = window.location && window.location.pathname;
        if (path) {
          var slug = String(path).replace(/^\/+/, "") || "default_flow";
          setContext({ flowId: slug });
        }
      } catch (e) {
        // ignora
      }
    }

    // captura UTMs da URL e salva
    var utmsFromUrl = getUTMParamsFromUrl();
    if (Object.keys(utmsFromUrl).length > 0) {
      saveUTMsToStorage(utmsFromUrl);
    }

    // tenta integrar automaticamente com Typebot hospedado (link direto)
    setupTypebotHostedIntegration();

    devLog("[leadlimpo-track] inicializado", getContext());
  }

  // ============================================================
  // EXPOSIÇÃO GLOBAL
  // ============================================================

  var api = {
    // contexto & utm
    init: init,
    setContext: setContext,
    getContext: getContext,
    getUTMs: getCombinedUTMs,
    saveLeadContact: saveLeadContact,
    setDebug: setDebug,

    // eventos de funil
    trackViewContent: trackViewContent,
    trackStarted: trackStarted,
    trackStepAnswered: trackStepAnswered,
    trackLead: trackLead,
    trackCompleteRegistration: trackCompleteRegistration,

    // baixo nível
    trackMetaCustom: trackMetaCustom,
    pushToDataLayer: pushToDataLayerWithContext,
  };

  if (isBrowser()) {
    // evita sobrescrever se já existir (possível em ambientes com múltiplos scripts)
    if (!window.leadlimpoTrack) {
      window.leadlimpoTrack = api;
    }

    // A partir daqui, a inicialização passa a ser responsabilidade
    // explícita de quem integra, via leadlimpoTrack.init(), normalmente
    // feita no snippet (ver README).
  }
})();

