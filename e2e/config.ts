export const PORT = 4173;
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'e2e-admin@sijjel.test';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'E2eAdminPassw0rd';

export const platformUrl = (path: string) => `http://localhost:${PORT}${path}`;
export const academyUrl = (slug: string, path: string) => `http://${slug}.localhost:${PORT}${path}`;
