function setTenantId(req, res, next) {
  // If request is authenticated as admin, tenant is the admin's company
  if (req.admin && req.admin.company_id) {
    req.tenantId = req.admin.company_id;
    return next();
  }

  // Otherwise, for public routes, tenant must be provided in headers
  const tenantIdHeader = req.headers['x-tenant-id'];
  
  if (tenantIdHeader) {
    req.tenantId = tenantIdHeader;
    return next();
  }

  return res.status(400).json({ error: 'Identificação da empresa (Tenant ID) não fornecida na requisição.' });
}

module.exports = { setTenantId };
