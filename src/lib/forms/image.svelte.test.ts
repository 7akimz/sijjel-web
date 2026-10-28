import { describe, expect, it } from 'vitest';
import { imagePixels, loadImage, resizeImage } from './image';

async function canvasBlob(width: number, height: number, type: string, transparent = false) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d')!;
	context.fillStyle = '#29344F';
	context.fillRect(0, 0, width, height);
	if (transparent) context.clearRect(0, 0, 1, 1);
	return new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob!), type, 0.9));
}

async function sizeOf(blob: Blob) {
	const bitmap = await createImageBitmap(blob);
	return { width: bitmap.width, height: bitmap.height };
}

describe('resizeImage', () => {
	it('fits a large cover photo within 1600 as a JPEG', async () => {
		const source = await loadImage(await canvasBlob(4000, 3000, 'image/jpeg'));

		const blob = await resizeImage(source, 1600, 'cover');

		expect(blob.type).toBe('image/jpeg');
		expect(await sizeOf(blob)).toEqual({ width: 1600, height: 1200 });
	});

	it('keeps a small opaque logo at its size and sends it as a JPEG', async () => {
		const source = await loadImage(await canvasBlob(200, 100, 'image/png'));

		const blob = await resizeImage(source, 512, 'logo');

		expect(blob.type).toBe('image/jpeg');
		expect(await sizeOf(blob)).toEqual({ width: 200, height: 100 });
	});

	it('keeps a logo with transparency as a PNG', async () => {
		const source = await loadImage(await canvasBlob(64, 64, 'image/png', true));

		const blob = await resizeImage(source, 512, 'logo');

		expect(blob.type).toBe('image/png');
	});
});

describe('loadImage', () => {
	it('rejects a file the browser cannot read as an image', async () => {
		const error = await loadImage(new Blob(['%PDF-1.4'], { type: 'image/png' })).catch((e) => e);

		expect(error).toMatchObject({ code: 'image_invalid' });
	});
});

describe('imagePixels', () => {
	it('returns downscaled RGBA bytes', async () => {
		const source = await loadImage(await canvasBlob(400, 200, 'image/png'));

		const pixels = imagePixels(source, 128);

		expect(pixels.length).toBe(128 * 64 * 4);
		expect([pixels[0], pixels[1], pixels[2], pixels[3]]).toEqual([41, 52, 79, 255]);
	});
});
