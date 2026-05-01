exports.sanitizePhone = (req, _res, next) => {
  if (req.body.phone) {
    req.body.phone = req.body.phone.replace(/[^0-9+]/g, '').slice(0, 15);
  }
  next();
};
