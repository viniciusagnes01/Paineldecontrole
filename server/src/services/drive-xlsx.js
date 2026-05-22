import XLSX from 'xlsx';
import NodeCache from 'node-cache';
import { getDriveClient } from './google-auth.js';

const ttl = Number(process.env.CACHE_TTL_SECONDS || 120);
const cache = new NodeCache({ stdTTL: ttl, checkperiod: Math.max(30, Math.round(ttl / 2)) });

function bufferFromArrayBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (value?.data instanceof ArrayBuffer) return Buffer.from(value.data);
  return Buffer.from(value || '');
}

function worksheetToRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
}

function workbookToObject(workbook) {
  const result = {};
  for (const sheetName of workbook.SheetNames) {
    result[sheetName] = worksheetToRows(workbook, sheetName);
  }
  return result;
}

export async function downloadDriveFileBuffer(fileId) {
  const cached = cache.get(`drive-file:${fileId}`);
  if (cached) return cached;

  const drive = await getDriveClient();
  const response = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'arraybuffer' }
  );
  const buffer = bufferFromArrayBuffer(response.data);
  cache.set(`drive-file:${fileId}`, buffer);
  return buffer;
}

export async function readXlsxFromDrive(fileId) {
  const cached = cache.get(`xlsx:${fileId}`);
  if (cached) return cached;

  const buffer = await downloadDriveFileBuffer(fileId);
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const parsed = {
    fileId,
    sheetNames: workbook.SheetNames,
    sheets: workbookToObject(workbook),
    loadedAt: new Date().toISOString(),
    source: 'google-drive-xlsx'
  };
  cache.set(`xlsx:${fileId}`, parsed);
  return parsed;
}

export function clearXlsxCache(fileId) {
  if (fileId) {
    cache.del(`drive-file:${fileId}`);
    cache.del(`xlsx:${fileId}`);
  } else {
    cache.flushAll();
  }
}
