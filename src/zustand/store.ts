import { create } from 'zustand';

import {
    getDocs,
    query,
    collection,
} from "firebase/firestore";
import { db } from '../services/firebase';

interface evento {
    id: string;
    dtEvento: string;
    endereco: string;
    nomeSeminario: string;
    status: Boolean;
    tipoEvento: string;
    userNomeScretarioAbriu: string;
    vagas: number;
    // title: string;
    // description: string;
    // date: string;
    // time: string;
    // location: string;
    // category: string;
    // image: string;
    // registered: boolean;
}

interface eventosStore {
    eventos: evento[];
    loading: boolean;
    fetchEventos: () => Promise<void>;
}

export const useStore = create<eventosStore>()((set) => ({
    eventos: [],
    loading: false,
    fetchEventos: async () => {
        set({ loading: true });
        try {
            const querySnapshot = await getDocs(collection(db, "eventos"));
            const data: evento[] = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as evento[];
            set({ eventos: data });
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        } finally {
            set({ loading: false });
        }
    },
}));

// const [eventos, setEventos] = useState([]);

// //Informações de todos Eventos
//   async function getEventos() {
//     //Coleção de eventos
//     const listRef = collection(db, "eventos");
//     const q = query(listRef);
//     const querySnapshot = await getDocs(q);
//     const isCollectionEmpty = querySnapshot.size === 0;

//     if (!isCollectionEmpty) {
//       let lista = [];

//       querySnapshot.forEach((doc) => {
//         lista.push({
//           endereco: doc.data().endereco,
//           nomeSeminario: doc.data().nomeSeminario,
//           vagas: doc.data().vagas,
//         });
//       });
//       setEventos(lista);
//     }
//   }