const isDev = process.env.NODE_ENV === 'dev';

export const logger = {
  error: (err, ctx) => {
    // Em Dev mostra tudo, em Produção talvez só o erro crítico sem o contexto
    if (isDev) {
      console.error("DEBUG:", err, ctx);
    } else {
      console.error("App Error:", String(err));
    }
  },
  warn: (msg, ctx) => { if (isDev) console.warn(msg, ctx); },
  info: (msg, ctx) => { if (isDev) console.info(msg, ctx); }
};

export default logger;
