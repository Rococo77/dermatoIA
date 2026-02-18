import { create } from 'zustand';
import { Diagnosis, DiagnosisListResponse, DiagnosisStats } from '../types';
import { diagnosisApi } from '../api/diagnosis';

interface DiagnosisState {
  currentDiagnosis: Diagnosis | null;
  history: Diagnosis[];
  stats: DiagnosisStats | null;
  totalItems: number;
  currentPage: number;
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;

  analyzeSkin: (imageUri: string) => Promise<Diagnosis>;
  fetchHistory: (page?: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  getDiagnosisDetail: (id: string) => Promise<Diagnosis>;
  deleteDiagnosis: (id: string) => Promise<void>;
  clearCurrent: () => void;
  clearError: () => void;
}

export const useDiagnosisStore = create<DiagnosisState>((set) => ({
  currentDiagnosis: null,
  history: [],
  stats: null,
  totalItems: 0,
  currentPage: 1,
  isLoading: false,
  isAnalyzing: false,
  error: null,

  analyzeSkin: async (imageUri: string) => {
    set({ isAnalyzing: true, error: null });
    try {
      const diagnosis = await diagnosisApi.createDiagnosis(imageUri);
      set({ currentDiagnosis: diagnosis, isAnalyzing: false });
      return diagnosis;
    } catch (error: any) {
      const message = error.response?.data?.detail || "Erreur lors de l'analyse";
      set({ isAnalyzing: false, error: message });
      throw error;
    }
  },

  fetchHistory: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await diagnosisApi.getHistory(page);
      set({
        history: page === 1 ? response.items : [...(page > 1 ? [] : []), ...response.items],
        totalItems: response.total,
        currentPage: page,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false, error: "Erreur lors du chargement de l'historique" });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await diagnosisApi.getStats();
      set({ stats });
    } catch {
      // Silent fail for stats
    }
  },

  getDiagnosisDetail: async (id: string) => {
    const diagnosis = await diagnosisApi.getDiagnosis(id);
    set({ currentDiagnosis: diagnosis });
    return diagnosis;
  },

  deleteDiagnosis: async (id: string) => {
    await diagnosisApi.deleteDiagnosis(id);
    set((state) => ({
      history: state.history.filter((d) => d.id !== id),
      totalItems: state.totalItems - 1,
    }));
  },

  clearCurrent: () => set({ currentDiagnosis: null }),
  clearError: () => set({ error: null }),
}));
