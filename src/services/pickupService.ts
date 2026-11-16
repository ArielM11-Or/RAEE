import { PickupItem, INITIAL_MOCK_PICKUPS, ORURO_DEPOT } from '../data/mockPickups';
import { haversineKm } from '../lib/haversine';

/**
 * Servicio de Gestión de Recolecciones (RAEE / Línea Blanca)
 * Actualmente opera con estado reactivo en memoria / mock data para desarrollo y pruebas.
 *
 * TODO: Conectar Firebase Firestore + Cloudinary en la siguiente fase de backend.
 */

// Estado simulado en memoria
let pickupsMemory: PickupItem[] = [...INITIAL_MOCK_PICKUPS];
type Listener = (pickups: PickupItem[]) => void;
const listeners: Set<Listener> = new Set();

const notifyListeners = () => {
  const snapshot = [...pickupsMemory];
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (e) {
      console.warn('Error en listener de pickupService:', e);
    }
  });
};

export const pickupService = {
  /**
   * Suscribe un listener reactivo a los cambios en las solicitudes
   */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    listener([...pickupsMemory]);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Obtiene todas las solicitudes del sistema
   * // TODO: Conectar Firebase Firestore (collection: 'solicitudesRecojo')
   */
  async getAllPickups(): Promise<PickupItem[]> {
    return [...pickupsMemory];
  },

  /**
   * Obtiene las solicitudes de un cliente específico
   * // TODO: Conectar Firebase Firestore (query where 'clienteId' == uid)
   */
  async getPickupsByClient(clienteId: string): Promise<PickupItem[]> {
    return pickupsMemory.filter((p) => p.clienteId === clienteId || p.clienteId.startsWith('client-mock'));
  },

  /**
   * Obtiene las solicitudes activas de la jornada para el conductor
   * // TODO: Conectar Firebase Firestore (query where 'fecha' == fechaHoy)
   */
  async getDailyPickups(): Promise<PickupItem[]> {
    return [...pickupsMemory];
  },

  /**
   * Registra una nueva solicitud de recojo de línea blanca
   * // TODO: Conectar Firebase Firestore (addDoc en 'solicitudesRecojo')
   * // TODO: Conectar Cloudinary para subir fotoUri y obtener URL pública permanente
   */
  async createPickup(data: Omit<PickupItem, 'id' | 'fechaCreacion' | 'estado'>): Promise<PickupItem> {
    const newPickup: PickupItem = {
      ...data,
      id: `pick-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      fechaCreacion: new Date().toISOString(),
      estado: 'Pendiente',
      ordenRuta: pickupsMemory.length + 1,
    };

    // // TODO: Subir imagen local a Cloudinary:
    // const cloudinaryUrl = await uploadToCloudinary(data.fotoUri);
    // newPickup.fotoUri = cloudinaryUrl;

    // // TODO: Guardar en Firestore:
    // await setDoc(doc(db, 'solicitudesRecojo', newPickup.id), newPickup);

    pickupsMemory = [newPickup, ...pickupsMemory];
    notifyListeners();
    return newPickup;
  },

  /**
   * Actualiza el estado de una solicitud (ej. marcar como 'Recolectado', 'En camino')
   * // TODO: Conectar Firebase Firestore (updateDoc en 'solicitudesRecojo')
   */
  async updatePickupStatus(
    id: string,
    estado: 'Pendiente' | 'Programado' | 'En camino' | 'Recolectado'
  ): Promise<PickupItem | null> {
    const index = pickupsMemory.findIndex((p) => p.id === id);
    if (index === -1) return null;

    pickupsMemory[index] = {
      ...pickupsMemory[index],
      estado,
    };

    // // TODO: Actualizar estado en Firestore:
    // await updateDoc(doc(db, 'solicitudesRecojo', id), { estado, updatedAt: serverTimestamp() });

    notifyListeners();
    return pickupsMemory[index];
  },

  /**
   * Optimiza el orden de paradas del día usando la heurística del Vecino Más Cercano (Nearest Neighbor)
   * calculando distancias geoespaciales con la fórmula de Haversine.
   *
   * @param originLat Latitud actual del camión recolector o centro de acopio
   * @param originLng Longitud actual del camión recolector o centro de acopio
   * // TODO: Conectar Firebase Firestore (batch write para actualizar ordenRuta de cada parada)
   */
  async optimizeDailyRoute(
    originLat: number = ORURO_DEPOT.lat,
    originLng: number = ORURO_DEPOT.lng
  ): Promise<PickupItem[]> {
    // Paradas pendientes o en camino
    const pending = pickupsMemory.filter((p) => p.estado !== 'Recolectado');
    const collected = pickupsMemory.filter((p) => p.estado === 'Recolectado');

    const ordered: PickupItem[] = [];
    let currentLat = originLat;
    let currentLng = originLng;
    const remaining = [...pending];

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const dist = haversineKm(currentLat, currentLng, remaining[i].lat, remaining[i].lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIndex = i;
        }
      }

      const [nextStop] = remaining.splice(nearestIndex, 1);
      ordered.push({
        ...nextStop,
        ordenRuta: ordered.length + 1,
      });
      currentLat = nextStop.lat;
      currentLng = nextStop.lng;
    }

    // Reasignar orden a las completadas al final
    const finalCollected = collected.map((item, idx) => ({
      ...item,
      ordenRuta: ordered.length + idx + 1,
    }));

    pickupsMemory = [...ordered, ...finalCollected];
    notifyListeners();

    // // TODO: Guardar nuevo ordenRuta en Firestore por lote:
    // const batch = writeBatch(db);
    // ordered.forEach((item) => {
    //   batch.update(doc(db, 'solicitudesRecojo', item.id), { ordenRuta: item.ordenRuta });
    // });
    // await batch.commit();

    return [...pickupsMemory];
  },

  /**
   * Restablece los datos de prueba a los 5 puntos originales de Oruro
   */
  resetToMock(): void {
    pickupsMemory = [...INITIAL_MOCK_PICKUPS];
    notifyListeners();
  },
};
