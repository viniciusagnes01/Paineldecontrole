import 'dotenv/config';
import fs from 'node:fs';

const required = ['COMMUNICATION_BASE_ESPACO_MASTER', 'COMMUNICATION_BASE_ST1_INTERNET'];
const missing = required.filter((key) => !process.env[key]);

const hasInline = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const hasFile = credentialPath && fs.existsSync(credentialPath);

console.log('V4 Command Center - checagem de configuracao');
console.log(`PORT=${process.env.PORT || 5174}`);
console.log(`CORS_ORIGIN=${process.env.CORS_ORIGIN || '*'}`);
console.log(`Credenciais Google: ${hasInline ? 'GOOGLE_SERVICE_ACCOUNT_JSON' : hasFile ? credentialPath : 'nao encontradas'}`);

if (missing.length) {
  console.error(`Variaveis ausentes: ${missing.join(', ')}`);
  process.exitCode = 1;
}

if (!hasInline && !hasFile) {
  console.error('Configure GOOGLE_APPLICATION_CREDENTIALS ou GOOGLE_SERVICE_ACCOUNT_JSON antes de rodar endpoints reais.');
  process.exitCode = 1;
}

if (!process.exitCode) console.log('Configuracao basica OK.');
