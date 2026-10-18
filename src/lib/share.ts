// whatsappLink opens WhatsApp with the message and link ready to send, to the given number when
// there is one, otherwise letting the sender pick the chat.
export function whatsappLink(url: string, message: string, phoneDigits?: string | null): string {
	const text = encodeURIComponent(`${message} ${url}`);
	return `https://wa.me/${phoneDigits ?? ''}?text=${text}`;
}

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;
const ARABIC_ZERO = 0x0660;
const PERSIAN_ZERO = 0x06f0;

const asciiDigit = (c: string) => {
	const code = c.charCodeAt(0);
	return String(code - (code >= PERSIAN_ZERO ? PERSIAN_ZERO : ARABIC_ZERO));
};

// phoneDigits turns a typed number into the international digits WhatsApp links need, using
// the academy's calling code for local numbers that start with 0.
export function phoneDigits(raw: string, callingCode: string): string | null {
	let digits = raw
		.trim()
		.replace(ARABIC_DIGITS, asciiDigit)
		.replace(/[\s()-]/g, '');
	if (digits.startsWith('+')) digits = digits.slice(1);
	else if (digits.startsWith('00')) digits = digits.slice(2);
	else if (digits.startsWith('0')) digits = callingCode + digits.slice(1);
	return /^[0-9]{8,15}$/.test(digits) ? digits : null;
}
