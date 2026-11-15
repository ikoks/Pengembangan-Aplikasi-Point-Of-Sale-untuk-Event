import { getApiBaseUrl } from '../services/api/apiClient';

export function extractCleanBranchName(input: any): string {
  if (!input) return 'Cabang Utama Admin';
  let str = typeof input === 'string' ? input.trim() : String(input);

  // If input contains JSON or is a JSON string
  if (str.includes('{') || str.includes('}')) {
    try {
      const jsonStart = str.indexOf('{');
      const jsonEnd = str.lastIndexOf('}') + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonStr = str.substring(jsonStart, jsonEnd);
        const json = JSON.parse(jsonStr);

        const obj = json.data || json.cabang || json.result || json;
        const extracted =
          obj.nama_cabang ||
          obj.NAMA_CABANG ||
          obj.namaCabang ||
          obj.branch ||
          obj.branchName ||
          obj.name ||
          obj.storeName ||
          obj.location ||
          json.nama_cabang ||
          json.NAMA_CABANG;

        if (extracted) {
          str = String(extracted);
        } else {
          const match =
            str.match(/["']?nama_cabang["']?\s*:\s*["']([^"']+)["']/i) ||
            str.match(/["']?NAMA_CABANG["']?\s*:\s*["']([^"']+)["']/i) ||
            str.match(/["']?branch["']?\s*:\s*["']([^"']+)["']/i);
          if (match && match[1]) {
            str = match[1];
          }
        }
      }
    } catch (_) {
      const match =
        str.match(/["']?nama_cabang["']?\s*:\s*["']([^"']+)["']/i) ||
        str.match(/["']?NAMA_CABANG["']?\s*:\s*["']([^"']+)["']/i) ||
        str.match(/["']?branch["']?\s*:\s*["']([^"']+)["']/i);
      if (match && match[1]) {
        str = match[1];
      }
    }
  }

  // Replace unicode escape sequences like \u2013 to clean dash -
  str = str
    .replace(/\\u2013/g, '–')
    .replace(/\\u2014/g, '—')
    .replace(/\\u[0-9a-fA-F]{4}/g, '')
    .replace(/["{}']/g, '')
    .trim();

  // Clean leftover key names if string starts with "id_cabang" or "nama_cabang"
  if (str.toLowerCase().startsWith('id_cabang') || str.toLowerCase().startsWith('nama_cabang')) {
    const parts = str.split(':');
    if (parts.length > 1) {
      str = parts[1].trim();
    }
  }

  return str || 'Cabang Utama Admin';
}

export function generateShortOrderUrl(branchInput: string = ''): string {
  try {
    return getApiBaseUrl();
  } catch (_) {
    return 'http://10.0.2.2:8000';
  }
}
