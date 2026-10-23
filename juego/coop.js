// Math World — modo cooperativo con Supabase Realtime (protocolo Phoenix 1.0.0, sin librerías).
// Un canal por mundo y grupo: "mw-7-u1-g3". Presencia para saber quién está y
// mensajes "broadcast" para movimientos, recursos compartidos y el jefe.
(function (global) {
  'use strict';
  const cfg = global.MW_CONFIG || {};
  const disponible = Boolean(cfg.supabaseUrl && cfg.supabaseKey && global.WebSocket);
  const ESPERAS = [1000, 2000, 5000, 10000];

  class Canal {
    constructor(nombre, clave, meta) {
      this.topic = `realtime:${nombre}`;
      this.clave = clave;
      this.meta = meta;
      this.handlers = {};
      this.presencia = {};          // clave -> meta
      this.alCambiarPresencia = null;
      this.alEstado = null;         // 'conectando' | 'ok' | 'error'
      this.ref = 0; this.joinRef = null;
      this.intentos = 0; this.cerrado = false;
      this.conectar();
    }
    on(evento, fn) { (this.handlers[evento] = this.handlers[evento] || []).push(fn); return this; }
    estado(e) { this.est = e; if (this.alEstado) this.alEstado(e); }
    conectar() {
      if (this.cerrado) return;
      this.estado('conectando');
      const url = `${cfg.supabaseUrl.replace(/^http/, 'ws')}/realtime/v1/websocket?apikey=${encodeURIComponent(cfg.supabaseKey)}&vsn=1.0.0`;
      let ws;
      try { ws = new WebSocket(url); } catch (e) { this.reintentar(); return; }
      this.ws = ws;
      ws.onopen = () => {
        this.joinRef = String(++this.ref);
        this.enviarCrudo({
          topic: this.topic, event: 'phx_join', ref: this.joinRef, join_ref: this.joinRef,
          payload: { config: { broadcast: { self: false, ack: false }, presence: { enabled: true, key: this.clave }, private: false } },
        });
        clearInterval(this.latido);
        this.latido = setInterval(() => this.enviarCrudo({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++this.ref) }), 25000);
      };
      ws.onmessage = (m) => { let d; try { d = JSON.parse(m.data); } catch (e) { return; } this.recibir(d); };
      ws.onclose = () => { clearInterval(this.latido); if (!this.cerrado) { this.estado('conectando'); this.reintentar(); } };
      ws.onerror = () => { /* onclose se encarga */ };
    }
    reintentar() {
      clearTimeout(this.esperaT);
      const t = ESPERAS[Math.min(this.intentos++, ESPERAS.length - 1)];
      this.esperaT = setTimeout(() => this.conectar(), t);
    }
    recibir(d) {
      if (d.topic !== this.topic) return;
      if (d.event === 'phx_reply' && d.ref === this.joinRef) {
        if (d.payload && d.payload.status === 'ok') {
          this.intentos = 0;
          this.enviar('presence', { type: 'presence', event: 'track', payload: this.meta });
          this.estado('ok');
        } else { this.estado('error'); }
        return;
      }
      if (d.event === 'presence_state') {
        this.presencia = {};
        for (const [k, v] of Object.entries(d.payload || {})) if (v.metas && v.metas[0]) this.presencia[k] = v.metas[0];
        this.avisarPresencia();
      } else if (d.event === 'presence_diff') {
        const p = d.payload || {};
        for (const k of Object.keys(p.leaves || {})) delete this.presencia[k];
        for (const [k, v] of Object.entries(p.joins || {})) if (v.metas && v.metas[0]) this.presencia[k] = v.metas[0];
        this.avisarPresencia();
      } else if (d.event === 'broadcast' && d.payload) {
        (this.handlers[d.payload.event] || []).forEach((fn) => { try { fn(d.payload.payload || {}); } catch (e) { console.error(e); } });
      } else if (d.event === 'phx_error' || d.event === 'phx_close') {
        if (!this.cerrado) { try { this.ws.close(); } catch (e) { /* */ } }
      }
    }
    avisarPresencia() { if (this.alCambiarPresencia) this.alCambiarPresencia(this.presencia); }
    enviarCrudo(obj) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(obj)); }
    enviar(event, payload) { this.enviarCrudo({ topic: this.topic, event, payload, ref: String(++this.ref), join_ref: this.joinRef }); }
    emitir(evento, datos) { if (this.est === 'ok') this.enviar('broadcast', { type: 'broadcast', event: evento, payload: datos }); }
    salir() {
      this.cerrado = true;
      clearInterval(this.latido); clearTimeout(this.esperaT);
      try { this.enviar('phx_leave', {}); this.ws.close(); } catch (e) { /* */ }
    }
  }

  global.Coop = { disponible, Canal };
})(window);
