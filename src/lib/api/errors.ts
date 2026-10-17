import type { Locale } from '#lib/api/types.js';
import { m } from '#lib/paraglide/messages.js';

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
	readonly status: number;
	readonly code: string;
	readonly fields: FieldErrors;

	constructor(status: number, code: string, fields: FieldErrors = {}) {
		super(code);
		this.name = 'ApiError';
		this.status = status;
		this.code = code;
		this.fields = fields;
	}
}

export async function apiErrorFrom(response: Response): Promise<ApiError> {
	const body = (await response.json().catch(() => null)) as {
		code?: unknown;
		errors?: unknown;
	} | null;
	const code = typeof body?.code === 'string' ? body.code : 'internal_error';
	const fields =
		body?.errors && typeof body.errors === 'object' ? (body.errors as FieldErrors) : {};
	return new ApiError(response.status, code, fields);
}

type MessageFn = (inputs: object, options: { locale?: Locale }) => string;
const messages = m as unknown as Record<string, MessageFn | undefined>;

export function errorText(code: string, locale?: Locale): string {
	const message = messages[`error_${code}`] ?? messages.error_internal_error!;
	return message({}, { locale });
}
