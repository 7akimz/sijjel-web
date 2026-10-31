// whatsappLink opens WhatsApp with the message and link ready to send, to the given number when
// there is one, otherwise letting the sender pick the chat.
export function whatsappLink(url: string, message: string, phoneDigits?: string | null): string {
	const text = encodeURIComponent(`${message} ${url}`);
	return `https://wa.me/${phoneDigits ?? ''}?text=${text}`;
}
