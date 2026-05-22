import { readXlsxFromDrive, clearXlsxCache } from './drive-xlsx.js';
import { getClientOrThrow, resolveCommunicationFileId } from '../config/clients.js';

const SHEET_NAMES = {
  readme: 'README',
  dashboard: 'Dashboard',
  config: 'config',
  clientes: 'clientes',
  stakeholders: 'stakeholders',
  mensagens: 'mensagens',
  aprovacoes: 'aprovacoes',
  pendencias: 'pendencias',
  promessas: 'promessas',
  riscos: 'riscos',
  resumosIa: 'resumos_ia',
  contextoCliente: 'contexto_cliente',
  ekyteConfig: 'ekyte_config',
  socialMediaHistorico: 'social_media_historico',
  listas: 'listas'
};

function firstNonEmpty(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '') || '';
}

function normalizeKeyValue(rows, keyField = 'chave', valueField = 'valor') {
  return Object.fromEntries((rows || [])
    .map((row) => [row[keyField] || row.campo || row.Campo, row[valueField] || row.valor || row.Valor])
    .filter(([key]) => key !== undefined && key !== null && String(key).trim() !== '')
    .map(([key, value]) => [String(key).trim(), value]));
}

function rowCount(rows) {
  return Array.isArray(rows) ? rows.filter((row) => Object.values(row).some((value) => String(value || '').trim() !== '')).length : 0;
}

function countByStatus(rows, statusField) {
  const counts = {};
  for (const row of rows || []) {
    const status = String(row[statusField] || row.status || 'sem_status').trim() || 'sem_status';
    counts[status] = (counts[status] || 0) + 1;
  }
  return counts;
}

function normalizeSocialRows(rows) {
  return (rows || []).filter((row) => {
    const month = firstNonEmpty(row.mes, row.Mes, row['Mês referência']);
    return month && month !== 'Sem historico encontrado' && month !== 'Sem histórico encontrado';
  }).map((row) => ({
    mes: firstNonEmpty(row.mes, row.Mes, row['Mês referência']),
    cliente: firstNonEmpty(row.Cliente, row.cliente_origem),
    accountSubiuDemanda: row['Account subiu demanda?'] || '',
    prePauta: row['Pre-pauta'] || row['Pré-pauta'] || '',
    aprovacao1: row['Aprovacao account e cliente 1'] || row['Aprovação account e cliente 1'] || '',
    pauta: row.Pauta || '',
    aprovacao2: row['Aprovacao account e cliente 2'] || row['Aprovação account e cliente 2'] || '',
    designer: row.Designer || '',
    linkDemanda: row['Link demanda'] || '',
    situacao: row['Situacao'] || row['Situação'] || '',
    proximaDataPostagemSemCriativoPronto: row['Proxima data de postagem sem criativo pronto'] || row['Próxima data de postagem sem criativo pronto'] || ''
  }));
}

function tableStatus(rows, status = 'com_dados') {
  const count = rowCount(rows);
  return { rows: count, status: count ? status : 'somente_cabecalho' };
}

function buildSnapshot(client, fileId, parsed) {
  const sheets = parsed.sheets || {};
  const config = normalizeKeyValue(sheets[SHEET_NAMES.config] || []);
  const contexto = normalizeKeyValue(sheets[SHEET_NAMES.contextoCliente] || [], 'campo', 'valor');
  const ekyte = normalizeKeyValue(sheets[SHEET_NAMES.ekyteConfig] || [], 'campo', 'valor');
  const socialRows = normalizeSocialRows(sheets[SHEET_NAMES.socialMediaHistorico] || []);

  const mensagens = sheets[SHEET_NAMES.mensagens] || [];
  const aprovacoes = sheets[SHEET_NAMES.aprovacoes] || [];
  const pendencias = sheets[SHEET_NAMES.pendencias] || [];
  const promessas = sheets[SHEET_NAMES.promessas] || [];
  const riscos = sheets[SHEET_NAMES.riscos] || [];
  const resumosIa = sheets[SHEET_NAMES.resumosIa] || [];

  const fileName = client.id === 'espaco-master'
    ? 'BASE_COMUNICACAO_Espaco_Master.xlsx'
    : 'BASE_COMUNICACAO_ST1_Internet.xlsx';

  return {
    ok: true,
    clientId: client.id,
    clientName: client.name,
    fileId,
    source: {
      kind: parsed.source || 'google-drive-xlsx',
      driveFileId: fileId,
      fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      loadedAt: parsed.loadedAt
    },
    loadedAt: parsed.loadedAt,
    sheetNames: parsed.sheetNames,
    config: {
      cliente: firstNonEmpty(config.cliente, contexto.cliente, client.name),
      approvalKey: firstNonEmpty(config.approval_key, client.approvalKey),
      grupoWhatsappId: config.grupo_whatsapp_id || '',
      grupoWhatsappJid: firstNonEmpty(config.grupo_whatsapp_jid, contexto.grupo_whatsapp_id, client.groupJid),
      nicho: firstNonEmpty(config.nicho, contexto.nicho),
      palavrasChaveDrive: firstNonEmpty(config.palavras_chave_drive, contexto.palavras_chave_drive),
      pastaDriveId: firstNonEmpty(config.pasta_drive_id, client.driveFolderId),
      pastaDriveUrl: firstNonEmpty(config.pasta_drive_url, contexto.pasta_drive_url),
      statusAutomacao: config.status_automacao || '',
      geradoEm: config.gerado_em || ''
    },
    contextoCliente: {
      tomDeVoz: contexto.tom_de_voz || '',
      regraEnvioCliente: contexto.regra_envio_cliente || '',
      regraAprovacao: contexto.regra_aprovacao || '',
      observacoesOperacionais: contexto.observacoes_operacionais || ''
    },
    ekyte: {
      idWorkspaceEkyte: firstNonEmpty(config.idWorkspaceEkyte, ekyte.idWorkspaceEkyte),
      idProjetoEkyte: firstNonEmpty(config.idProjetoEkyte, ekyte.idProjetoEkyte),
      idTipoTarefaEkyte: firstNonEmpty(config.idTipoTarefaEkyte, ekyte.idTipoTarefaEkyte),
      idTaskModeloEkyte: firstNonEmpty(config.idTaskModeloEkyte, ekyte.idTaskModeloEkyte),
      executorIdEkyte: firstNonEmpty(config.executorIdEkyte, ekyte.executorIdEkyte),
      linkTaskModelo: ekyte.link_task_modelo || ''
    },
    stakeholders: (sheets[SHEET_NAMES.stakeholders] || []).slice(0, 100),
    communication: {
      mensagens: mensagens.slice(0, 100),
      aprovacoes: aprovacoes.slice(0, 100),
      pendencias: pendencias.slice(0, 100),
      promessas: promessas.slice(0, 100),
      riscos: riscos.slice(0, 100),
      resumosIa: resumosIa.slice(0, 100)
    },
    socialMediaHistorico: socialRows,
    tableStatus: {
      mensagens: tableStatus(mensagens),
      aprovacoes: tableStatus(aprovacoes),
      pendencias: tableStatus(pendencias),
      promessas: tableStatus(promessas),
      riscos: tableStatus(riscos),
      resumosIa: tableStatus(resumosIa),
      socialMediaHistorico: { rows: socialRows.length, status: socialRows.length ? 'com_dados' : 'sem_historico_encontrado' }
    },
    dashboard: {
      mensagensRegistradas: rowCount(mensagens),
      alertasPendentes: mensagens.filter((row) => String(row.status_alerta || '').toLowerCase().includes('pend')).length,
      aprovacoesAguardando: aprovacoes.filter((row) => String(row.status_aprovacao || '').toLowerCase().includes('aguard')).length,
      pendenciasAbertas: pendencias.filter((row) => !String(row.status || '').toLowerCase().includes('concl')).length,
      promessasEmAberto: promessas.filter((row) => !String(row.status || '').toLowerCase().includes('cumpr')).length,
      riscosAtivos: riscos.filter((row) => !String(row.status || '').toLowerCase().includes('fech')).length,
      prioridadeMedia: 0,
      ultimaMensagem: mensagens[0]?.data_hora || '',
      socialDemandas: socialRows.length,
      statusAprovacoes: countByStatus(aprovacoes, 'status_aprovacao'),
      statusPendencias: countByStatus(pendencias, 'status')
    },
    rawSheets: sheets
  };
}

export async function loadCommunicationBase(clientId, options = {}) {
  const client = getClientOrThrow(clientId);
  const fileId = resolveCommunicationFileId(client);
  if (options.force) clearXlsxCache(fileId);
  const parsed = await readXlsxFromDrive(fileId);
  return buildSnapshot(client, fileId, parsed);
}
