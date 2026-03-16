export const logValidationErrors = ({ scope, errors, req }) => {
  try {
    const fields = Object.keys(errors || {});
    const payload = {
      type: 'validation_error',
      scope: scope || 'unknown',
      path: req?.originalUrl || req?.url,
      method: req?.method,
      ip: req?.ip,
      fields,
      time: new Date().toISOString()
    };
    console.warn(JSON.stringify(payload));
  } catch {
    void 0;
  }
};

