export const CLIENTS = Object.freeze({
  'espaco-master': {
    id: 'espaco-master',
    name: 'Espaco Master',
    communicationBaseFileIdEnv: 'COMMUNICATION_BASE_ESPACO_MASTER',
    fallbackFileId: '1GU8tVEzA9sSMToJDlhnzp0rTQqWQb_1E',
    driveFolderId: '1tQgluKulSRjbMB6p0iZbUQ4x6UsDeiCC',
    groupJid: '120363424198629431@g.us',
    approvalKey: 'ESPACOMASTER'
  },
  'st1-internet': {
    id: 'st1-internet',
    name: 'ST1 Internet',
    communicationBaseFileIdEnv: 'COMMUNICATION_BASE_ST1_INTERNET',
    fallbackFileId: '1b2WIFOrC5cCP0npwqAXynnyt8Zd9zDxp',
    driveFolderId: '1IOElrGUmuVZ37Rqr443lGHdKiJIuVMxw',
    groupJid: '120363403300629023@g.us',
    approvalKey: 'ST1INTERNET'
  }
});

export function getClientOrThrow(clientId) {
  const client = CLIENTS[String(clientId || '').trim()];
  if (!client) {
    const supported = Object.keys(CLIENTS).join(', ');
    const error = new Error(`Cliente nao suportado: ${clientId}. Suportados: ${supported}`);
    error.statusCode = 404;
    throw error;
  }
  return client;
}

export function resolveCommunicationFileId(client) {
  return process.env[client.communicationBaseFileIdEnv] || client.fallbackFileId;
}
