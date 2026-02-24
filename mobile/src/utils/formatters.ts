import { SeverityLevel } from '../types';
import { colors } from '../theme';

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function getSeverityColor(severity: SeverityLevel): string {
  switch (severity) {
    case 'critical':
      return colors.severity.critical;
    case 'high':
      return colors.severity.high;
    case 'medium':
      return colors.severity.medium;
    case 'low':
      return colors.severity.low;
    default:
      return colors.text.tertiary;
  }
}

export function getSeverityBgColor(severity: SeverityLevel): string {
  switch (severity) {
    case 'critical':
      return colors.severityBg.critical;
    case 'high':
      return colors.severityBg.high;
    case 'medium':
      return colors.severityBg.medium;
    case 'low':
      return colors.severityBg.low;
    default:
      return colors.borderLight;
  }
}

export function getSeverityLabel(severity: SeverityLevel): string {
  switch (severity) {
    case 'critical':
      return 'Critique';
    case 'high':
      return 'Eleve';
    case 'medium':
      return 'Modere';
    case 'low':
      return 'Faible';
    default:
      return severity;
  }
}

export function formatLesionType(type: string): string {
  const labels: Record<string, string> = {
    akiec: 'Keratose actinique',
    bcc: 'Carcinome basocellulaire',
    bkl: 'Keratose benigne',
    df: 'Dermatofibrome',
    mel: 'Melanome',
    nv: 'Naevus',
    vasc: 'Lesion vasculaire',
    melanoma: 'Melanome',
    eczema: 'Eczema',
    psoriasis: 'Psoriasis',
    acne: 'Acne',
    dermatitis: 'Dermatite',
    keratosis: 'Keratose',
    nevus: 'Naevus',
    other: 'Autre',
  };
  return labels[type] || type;
}
