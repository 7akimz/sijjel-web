import { describe, expect, it, vi } from 'vitest';
import { detectState, forgetDevice, isAndroid, keyBytes } from './device';

const iphone =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const android =
	'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const env = (extra: Partial<Parameters<typeof detectState>[0]> = {}) => ({
	userAgent: android,
	standalone: false,
	hasPush: true,
	permission: 'default' as NotificationPermission,
	subscribed: false,
	...extra
});

describe('detectState', () => {
	it('asks an iPhone in the browser to add sijjel to the home screen first', () => {
		expect(detectState(env({ userAgent: iphone, hasPush: true }))).toBe('ios_install');
	});

	it('offers to turn on from the iPhone home screen', () => {
		expect(detectState(env({ userAgent: iphone, standalone: true }))).toBe('off');
	});

	it('says blocked when notifications were refused', () => {
		expect(detectState(env({ permission: 'denied' }))).toBe('blocked');
	});

	it('says unsupported without push', () => {
		expect(detectState(env({ hasPush: false }))).toBe('unsupported');
	});

	it('says on for a subscribed device', () => {
		expect(detectState(env({ permission: 'granted', subscribed: true }))).toBe('on');
	});
});

describe('isAndroid', () => {
	it('tells Android from iPhone', () => {
		expect(isAndroid(android)).toBe(true);
		expect(isAndroid(iphone)).toBe(false);
	});
});

describe('keyBytes', () => {
	it('decodes a base64url VAPID key', () => {
		expect([...keyBytes('AQID_-8')]).toEqual([1, 2, 3, 255, 239]);
	});
});

describe('forgetDevice', () => {
	it('drops the subscription even when the server cannot be told', async () => {
		const unsubscribe = vi.fn(async () => true);
		const tell = vi.fn(async () => {
			throw new Error('offline');
		});
		await expect(
			forgetDevice(async () => ({ endpoint: 'https://push.example/x', unsubscribe }), tell)
		).resolves.toBeUndefined();
		expect(tell).toHaveBeenCalledWith('https://push.example/x');
		expect(unsubscribe).toHaveBeenCalled();
	});

	it('does nothing without a subscription', async () => {
		const tell = vi.fn();
		await forgetDevice(async () => null, tell);
		expect(tell).not.toHaveBeenCalled();
	});
});
