// oos-middleware.js - enrich premium scan responses with real OOS table
module.exports = (app) => {
  const { attachOOS } = require('./oos-honesty.js');
  app.use((req, res, next) => {
    if (req.path === '/tools/market/premium/scan') {
      const orig = res.json.bind(res);
      res.json = (body) => {
        try {
          if (body && body.pair && !body.oos) body = attachOOS(body, body.pair);
        } catch (e) { /* never break the paid path */ }
        return orig(body);
      };
    }
    next();
  });
};
