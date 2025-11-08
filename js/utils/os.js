/**
 * Utilitário para detectar o sistema operacional
 */
export function detectOS() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('windows')) return 'Windows';
    if (userAgent.includes('mac os x')) return 'macOS';
    if (userAgent.includes('android')) return 'Android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'iOS';
    if (userAgent.includes('linux')) return 'Linux';
    return 'Unknown';
}

