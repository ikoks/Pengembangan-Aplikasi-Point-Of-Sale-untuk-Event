// Utility helper to safely parse & sanitize Branch Name from JSON, URL, or string

export const SINGLE_OFFICIAL_ORDER_URL = 'https://ntsc-suits-overall-mortgage.trycloudflare.com';

export function extractCleanBranchName(input: any): string {
  if (!input) return 'Cabang Utama Admin';
  let str = typeof input === 'string' ? input.trim() : String(input);

  // If input is a JSON string (e.g. {"NAMA_CABANG": "Cabang Pusat ..."})
  if (str.startsWith('{')) {
    try {
      const json = JSON.parse(str);
      const extracted =
        json.nama_cabang ||
        json.NAMA_CABANG ||
        json.branch ||
        json.branchName ||
        json.namaCabang ||
        json.name ||
        json.storeName ||
        json.location;
      if (extracted) {
        str = String(extracted);
      }
    } catch (_) {}
  }

  // Replace unicode escape sequences like \u2013 to clean dash -
  str = str
    .replace(/\\u2013/g, '–')
    .replace(/\\u2014/g, '—')
    .replace(/\\u[0-9a-fA-F]{4}/g, '')
    .replace(/["{}']/g, '')
    .trim();

  // If after cleaning it's still a JSON fragment, fallback safely
  if (str.startsWith('ID_CABANG') || str.startsWith('NAMA_CABANG') || str.includes('URL_BACKEND')) {
    const match = str.match(/NAMA_CABANG[:=]\s*([^,;]+)/i) || str.match(/nama_cabang[:=]\s*([^,;]+)/i);
    if (match && match[1]) {
      str = match[1].trim();
    } else {
      str = 'Cabang Utama Admin';
    }
  }

  return str || 'Cabang Utama Admin';
}

export function generateShortOrderUrl(branchInput: string = ''): string {
  // 1 SINGLE UNIFIED PUBLIC & UNIVERSAL INTERNET DOMAIN LINK (Cloudflare Direct zero-prompt)
  return SINGLE_OFFICIAL_ORDER_URL;
}
