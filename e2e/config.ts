export const PORT = 4173;
export const API_PORT = Number(process.env.E2E_API_PORT ?? 18080);
export const ADMIN_PHONE = '01000000000';
export const ADMIN_EMAIL = 'e2e-admin@sijjel.test';
export const ADMIN_PASSWORD = 'E2eAdminPassw0rd';

export const platformUrl = (path: string) => `http://localhost:${PORT}${path}`;
export const academyUrl = (slug: string, path: string) => `http://${slug}.localhost:${PORT}${path}`;
