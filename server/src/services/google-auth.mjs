import fs from 'node:fs';
import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly'
];

function parseServiceAccountFromEnv() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) return null;
  try {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } catch (error) {
    throw new Error(`GOOGLE_SERVICE_ACCOUNT_JSON invalido: ${error.message}`);
  }
}

function loadCredentials() {
  const inlineJson = parseServiceAccountFromEnv();
  if (inlineJson) return inlineJson;

  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialPath) {
    throw new Error('Configure GOOGLE_APPLICATION_CREDENTIALS ou GOOGLE_SERVICE_ACCOUNT_JSON no ambiente.');
  }
  if (!fs.existsSync(credentialPath)) {
    throw new Error(`Arquivo de credenciais nao encontrado: ${credentialPath}`);
  }
  return JSON.parse(fs.readFileSync(credentialPath, 'utf8'));
}

export function getGoogleAuth() {
  const credentials = loadCredentials();
  return new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
}

export async function getDriveClient() {
  const auth = getGoogleAuth();
  return google.drive({ version: 'v3', auth });
}

export async function getSheetsClient() {
  const auth = getGoogleAuth();
  return google.sheets({ version: 'v4', auth });
}
