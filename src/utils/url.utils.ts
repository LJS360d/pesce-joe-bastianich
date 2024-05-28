function extractUrlInfo(url: string): { domain?: string; extension?: string } {
	const extension = getUrlExtension(url);
	const domain = getUrlDomain(url);
	return { domain, extension };
}

export function getUrlExtension(url: string) {
	try {
		return new URL(url).pathname.match(/\.[^./?]+(?=\?|$| )/)?.[0];
	} catch (error) {
		// Invalid URL
		return undefined;
	}
}

export function getUrlDomain(url: string) {
	try {
		return new URL(url).hostname;
	} catch (error) {
		// Invalid URL
		return undefined;
	}
}

export function isImageUrl(url: string) {
	const { domain, extension } = extractUrlInfo(url);
	const supportedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
	const supportedDomains = ['imgur.com'];
	if (domain && extension)
		return (
			supportedExtensions.includes(extension) ||
			supportedDomains.includes(domain)
		);
	return false;
}
