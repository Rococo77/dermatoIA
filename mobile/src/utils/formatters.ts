import { SeverityLevel } from '../types';

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
      return '#D32F2F';
    case 'high':
      return '#F57C00';
    case 'medium':
      return '#FFA000';
    case 'low':
      return '#388E3C';
    default:
      return '#757575';
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
