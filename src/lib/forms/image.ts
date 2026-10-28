export class ImageError extends Error {
	constructor(readonly code: 'image_invalid') {
		super(code);
	}
}

type Canvas = OffscreenCanvas | HTMLCanvasElement;
type Context = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

const JPEG_QUALITY = 0.85;

/** Decodes a picked file, or throws image_invalid when the browser can't read it. */
export async function loadImage(file: Blob): Promise<ImageBitmap> {
	try {
		return await createImageBitmap(file);
	} catch {
		throw new ImageError('image_invalid');
	}
}

function draw(source: ImageBitmap, width: number, height: number): [Canvas, Context] {
	const canvas: Canvas =
		typeof OffscreenCanvas === 'undefined'
			? Object.assign(document.createElement('canvas'), { width, height })
			: new OffscreenCanvas(width, height);
	const context = canvas.getContext('2d', { willReadFrequently: true }) as Context | null;
	if (!context) throw new ImageError('image_invalid');
	context.drawImage(source, 0, 0, width, height);
	return [canvas, context];
}

/** Scales width and height down, never up, so the longer side is at most max. */
function fit(width: number, height: number, max: number) {
	const scale = Math.min(1, max / Math.max(width, height));
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale))
	};
}

function hasTransparency(context: Context, width: number, height: number) {
	const data = context.getImageData(0, 0, width, height).data;
	for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
	return false;
}

async function toBlob(canvas: Canvas, type: string): Promise<Blob> {
	const quality = type === 'image/jpeg' ? JPEG_QUALITY : undefined;
	if ('convertToBlob' in canvas) return canvas.convertToBlob({ type, quality });
	return new Promise((resolve, reject) =>
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new ImageError('image_invalid'))),
			type,
			quality
		)
	);
}

/** Shrinks a photo to fit within max×max: a logo stays PNG only if it has transparency. */
export async function resizeImage(
	source: ImageBitmap,
	max: number,
	kind: 'logo' | 'cover'
): Promise<Blob> {
	const { width, height } = fit(source.width, source.height, max);
	const [canvas, context] = draw(source, width, height);
	const type =
		kind === 'logo' && hasTransparency(context, width, height) ? 'image/png' : 'image/jpeg';
	return toBlob(canvas, type);
}

/** A small RGBA copy of the image, enough to find its colours. */
export function imagePixels(source: ImageBitmap, size = 128): Uint8ClampedArray {
	const { width, height } = fit(source.width, source.height, size);
	const [, context] = draw(source, width, height);
	return context.getImageData(0, 0, width, height).data;
}
