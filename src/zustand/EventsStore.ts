// src/store/eventsStore.ts
import { create } from 'zustand';
import {
  getDocs,
  query,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  onSnapshot,
  Unsubscribe,
  where,
} from 'firebase/firestore';
import { db } from '../services/firebase';

export interface Inscricao {
  id?: string;
  eventoId: string;
  nomeEvento: string;
  userId: string;
  userName: string;
  telefone: string;
  cpf: string;
  userEmail: string;
  statusPagamento: 'pendente' | 'confirmada' | 'cancelada';
  dataInscricao: Date;
  valor: string;
}

export interface Evento {
  id: string;
  dtEvento: string;
  endereco: string;
  nomeSeminario: string;
  status: boolean;
  userCriador: string;
  vagas: number;
  taxaInscricao: string;
}

export interface EventosStore {
  eventos: Evento[];
  inscricoes: Inscricao[];
  loading: boolean;
  unsubscribe?: Unsubscribe;
  unsubscribeInscricoes?: Unsubscribe;

  fetchEventos: () => Promise<void>;
  createEvento: (data: Omit<Evento, 'id'>) => Promise<void>;
  updateEvento: (id: string, data: Partial<Omit<Evento, 'id'>>) => Promise<void>;
  deleteEvento: (id: string) => Promise<void>;
  unsubscribeEvents: () => void;

  createInscricao: (data: Omit<Inscricao, 'id'>) => Promise<Inscricao>;
  fetchInscricoes: (userId: string) => Promise<void>;
  fetchInscricoesEvento: (eventoId: string) => Promise<Inscricao[]>;
  unsubscribeInscricoesFn: () => void;
  cancelInscricao: (eventoId: string, inscricaoId: string) => Promise<void>;
  updateInscricaoStatus: (eventoId: string, inscricaoId: string, status: 'pendente' | 'confirmada' | 'cancelada') => Promise<void>
}

export const useEventosStore = create<EventosStore>((set, get) => ({
  eventos: [],
  inscricoes: [],
  loading: false,
  unsubscribe: undefined,
  unsubscribeInscricoes: undefined,

  /**
   * Busca eventos em tempo real do Firestore
   */
  fetchEventos: async () => {
    set({ loading: true });
    try {
      get().unsubscribeEvents();

      const q = query(collection(db, 'eventos'), orderBy('dtEvento', 'desc'));

      const unsubscribe = onSnapshot(q,
        (snap) => {
          const data = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Evento, 'id'>)
          }));
          set({ eventos: data, loading: false });
        },
        (error) => {
          console.error('Erro no listener de eventos:', error);
          set({ loading: false });
        }
      );

      set({ unsubscribe });

    } catch (error) {
      console.error('Erro ao configurar listener de eventos:', error);
      set({ loading: false });
    }
  },

  /**
   * Busca inscrições do usuário em TODOS os eventos
   * Como estamos usando subcoleções, precisamos buscar em cada evento
   */
  fetchInscricoes: async (userId: string) => {
    set({ loading: true });
    try {
      get().unsubscribeInscricoesFn();

      // Primeiro buscamos todos os eventos
      const eventos = get().eventos;
      let todasInscricoes: Inscricao[] = [];

      console.log(`Buscando inscrições para usuário: ${userId}`);
      console.log(`Total de eventos: ${eventos.length}`);

      // Para cada evento, buscamos as inscrições do usuário
      for (const evento of eventos) {
        try {
          console.log(`Buscando inscrições no evento: ${evento.id}`);

          const q = query(
            collection(db, `eventos/${evento.id}/inscritos`),
            where('userId', '==', userId)
          );

          const querySnapshot = await getDocs(q);
          console.log(`Encontradas ${querySnapshot.docs.length} inscrições no evento ${evento.id}`);

          const inscricoesEvento = querySnapshot.docs.map((d) => ({
            id: d.id,
            eventoId: evento.id,
            ...(d.data() as Omit<Inscricao, 'id' | 'eventoId'>)
          }));

          todasInscricoes = [...todasInscricoes, ...inscricoesEvento];
        } catch (error) {
          console.error(`Erro ao buscar inscrições do evento ${evento.id}:`, error);
        }
      }

      console.log('Total de inscrições encontradas:', todasInscricoes.length);
      console.log('Inscrições:', todasInscricoes);

      set({ inscricoes: todasInscricoes, loading: false });

    } catch (error) {
      console.error('Erro ao buscar inscrições:', error);
      set({ loading: false });
    }
  },

  /**
   * Busca TODAS as inscrições de um evento específico
   */
  fetchInscricoesEvento: async (eventoId: string) => {
    set({ loading: true });
    try {
      const q = query(
        collection(db, `eventos/${eventoId}/inscritos`),
        orderBy('dataInscricao', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const inscricoes = querySnapshot.docs.map((d) => ({
        id: d.id,
        eventoId: eventoId,
        ...(d.data() as Omit<Inscricao, 'id' | 'eventoId'>)
      }));

      set({ loading: false });
      return inscricoes;
    } catch (error) {
      console.error('Erro ao buscar inscrições do evento:', error);
      set({ loading: false });
      throw error;
    }
  },

  /**
   * Cria uma nova inscrição na subcoleção do evento
   */
  createInscricao: async (inscricaoData) => {
    set({ loading: true });
    try {
      const docRef = await addDoc(
        collection(db, `eventos/${inscricaoData.eventoId}/inscritos`),
        {
          ...inscricaoData,
          dataInscricao: new Date()
        }
      );

      const novaInscricao: Inscricao = {
        id: docRef.id,
        ...inscricaoData
      };
      return novaInscricao;

    } catch (error) {
      console.error('Erro ao criar inscrição:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Cancela uma inscrição existente
   */
  cancelInscricao: async (eventoId: string, inscricaoId: string) => {
    set({ loading: true });
    try {
      const docRef = doc(db, `eventos/${eventoId}/inscritos`, inscricaoId);

      // Use deleteDoc para remover completamente o documento
      await deleteDoc(docRef);

      console.log(`✅ Inscrição ${inscricaoId} removida completamente`);

    } catch (error) {
      console.error('Erro ao remover inscrição:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  //Atualização de Status de Inscrição
  updateInscricaoStatus: async (eventoId: string, inscricaoId: string, status: 'pendente' | 'confirmada' | 'cancelada') => {
    set({ loading: true });
    try {
      const docRef = doc(db, `eventos/${eventoId}/inscritos`, inscricaoId);
      await updateDoc(docRef, {
        statusPagamento: status,
        dataConfirmacao: status === 'confirmada' ? new Date() : null
      });

      console.log(`✅ Status da inscrição ${inscricaoId} atualizado para: ${status}`);

      // Atualizar o estado local das inscrições
      const { inscricoes } = get();
      const updatedInscricoes = inscricoes.map(inscricao =>
        inscricao.id === inscricaoId
          ? { ...inscricao, statusPagamento: status }
          : inscricao
      );

      set({ inscricoes: updatedInscricoes });

    } catch (error) {
      console.error('Erro ao atualizar status da inscrição:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },


  /**
   * Remove listener de eventos
   */
  unsubscribeEvents: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: undefined });
    }
  },

  /**
   * Remove listener de inscrições
   */
  unsubscribeInscricoesFn: () => {
    const { unsubscribeInscricoes } = get();
    if (unsubscribeInscricoes) {
      unsubscribeInscricoes();
      set({ unsubscribeInscricoes: undefined });
    }
  },

  /**
   * Atualiza dados de um evento
   */
  updateEvento: async (id, updateData) => {
    set({ loading: true });
    try {
      const docRef = doc(db, 'eventos', id);
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Cria um novo evento
   */
  createEvento: async (eventoData) => {
    set({ loading: true });
    try {
      await addDoc(collection(db, 'eventos'), eventoData);
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Exclui um evento (e todas suas inscrições serão excluídas automaticamente)
   */
  deleteEvento: async (id) => {
    set({ loading: true });
    try {
      const docRef = doc(db, 'eventos', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
    } finally {
      set({ loading: false });
    }
  }
}));