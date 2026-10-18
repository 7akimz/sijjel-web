import type { Locale } from '#lib/api/types.js';
import { m } from '#lib/paraglide/messages.js';

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
	readonly status: number;
	readonly code: string;
	readonly fields: FieldErrors;
	readonly extra: Record<string, unknown>;

	constructor(
		status: number,
		code: string,
		fields: FieldErrors = {},
		extra: Record<string, unknown> = {}
	) {
		super(code);
		this.name = 'ApiError';
		this.status = status;
		this.code = code;
		this.fields = fields;
		this.extra = extra;
	}
}

const PROBLEM_KEYS = new Set(['type', 'title', 'status', 'code', 'errors']);

export async function apiErrorFrom(response: Response): Promise<ApiError> {
	const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
	const code = typeof body?.code === 'string' ? body.code : 'internal_error';
	const fields =
		body?.errors && typeof body.errors === 'object' ? (body.errors as FieldErrors) : {};
	const extra = Object.fromEntries(
		Object.entries(body ?? {}).filter(([key]) => !PROBLEM_KEYS.has(key))
	);
	return new ApiError(response.status, code, fields, extra);
}

type MessageFn = (inputs: object, options: { locale?: Locale }) => string;
const messages = m as unknown as Record<string, MessageFn | undefined>;

export function errorText(code: string, locale?: Locale): string {
	const message = messages[`error_${code}`] ?? messages.error_internal_error!;
	return message({}, { locale });
}

export function fieldText(fields: FieldErrors, field: string): string | undefined {
	const code = fields[field]?.[0];
	return code ? errorText(code) : undefined;
}
