const rawViteIsDev = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ISDEV) || '';
const viteIsDev = String(rawViteIsDev).replace(/^['"]|['"]$/g, '');
const isDev = viteIsDev === 'dev';

export const logger = {
  error: (err, ctx) => {
    try {
      if (isDev) {
        console.error("DEBUG:", err, ctx);
      } else {
        // Não mostrar em producao
      }
    } catch (e) {
    }
  },
  warn: (msg, ctx) => { try { if (isDev) console.warn(msg, ctx); } catch (e) {} },
  info: (msg, ctx) => { try { if (isDev) console.info(msg, ctx); } catch (e) {} }
};

export default logger;
