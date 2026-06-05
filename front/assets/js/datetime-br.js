/**
 * Datas e horários no fuso de negócio (alinhado ao PHP: America/Sao_Paulo).
 */
const BUSINESS_TZ = 'America/Sao_Paulo';

function dateTimePartsInBusinessTz(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

/** Data de hoje (YYYY-MM-DD) no fuso de Brasília. */
function todayIsoInBusinessTz(ref = new Date()) {
  const parts = dateTimePartsInBusinessTz(ref);
  if (!parts) return '';
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Parte YYYY-MM-DD de um instante ISO, no fuso de Brasília. */
function isoDateInBusinessTz(iso) {
  const parts = dateTimePartsInBusinessTz(iso);
  if (!parts) return '';
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function isBusinessToday(iso) {
  if (!iso) return false;
  return isoDateInBusinessTz(iso) === todayIsoInBusinessTz();
}

function formatTimeBr(iso) {
  if (!iso) return '--:--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BUSINESS_TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function formatDateLongBr(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BUSINESS_TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

function formatWorkoutMeta(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BUSINESS_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** Linha compacta para tabelas: YYYY-MM-DD HH:mm (Brasília). */
function formatDateTimeLine(iso) {
  if (!iso) return '';
  const parts = dateTimePartsInBusinessTz(iso);
  if (!parts) return String(iso);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}
