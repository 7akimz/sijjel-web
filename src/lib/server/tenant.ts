import type { AcademyTenant, Tenant } from '#lib/api/types.js';

export async function resolveTenant(load: () => Promise<Response>): Promise<Tenant> {
	let response: Response;
	try {
		response = await load();
	} catch {
		return { kind: 'unavailable' };
	}
	if (response.status === 404) return { kind: 'unknown' };
	if (!response.ok) return { kind: 'unavailable' };
	try {
		const body = (await response.json()) as { kind: string; academy: AcademyTenant | null };
		if (body.kind === 'academy' && body.academy) return { kind: 'academy', academy: body.academy };
		return { kind: 'platform' };
	} catch {
		return { kind: 'unavailable' };
	}
}
