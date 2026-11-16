export interface PickupItem {
  id: string;
  clienteId: string;
  clienteNombre: string;
  telefono: string;
  categoria: 'refrigerador' | 'televisor' | 'lavadora' | 'cocina' | 'microondas_otro';
  categoriaLabel: string;
  volumen: number; // 1 a 4
  lat: number;
  lng: number;
  direccion: string;
  referencia: string;
  franjaHoraria: string;
  fecha: string;
  estado: 'Pendiente' | 'Programado' | 'En camino' | 'Recolectado';
  fotoUri: string;
  fechaCreacion: string;
  ordenRuta?: number;
}

export const CATEGORIAS_ELECTRO: Record<
  PickupItem['categoria'],
  { label: string; icon: string; volumen: number; description: string }
> = {
  refrigerador: {
    label: 'Refrigerador',
    icon: 'cube-outline',
    volumen: 4,
    description: 'Gran porte, compresor y refrigerante',
  },
  lavadora: {
    label: 'Lavadora',
    icon: 'sync-circle-outline',
    volumen: 3,
    description: 'Tambor metálico y motor eléctrico',
  },
  cocina: {
    label: 'Cocina',
    icon: 'flame-outline',
    volumen: 3,
    description: 'Cuerpo metálico y quemadores',
  },
  televisor: {
    label: 'Televisor',
    icon: 'tv-outline',
    volumen: 2,
    description: 'Pantallas CRT, LCD, LED o plasma',
  },
  microondas_otro: {
    label: 'Microondas / Otro',
    icon: 'hardware-chip-outline',
    volumen: 1,
    description: 'Pequeño electrodoméstico y microelectrónica',
  },
};

// 5 Paradas reales en distintos puntos de Oruro, Bolivia
export const INITIAL_MOCK_PICKUPS: PickupItem[] = [
  {
    id: 'pick-001',
    clienteId: 'client-mock-1',
    clienteNombre: 'Doña Rosa Choque',
    telefono: '+591 72451020',
    categoria: 'refrigerador',
    categoriaLabel: 'Refrigerador de 2 puertas',
    volumen: 4,
    lat: -17.9647,
    lng: -67.1105,
    direccion: 'Calle Bolívar N° 450, casi esq. La Plata',
    referencia: 'Frente a Plaza 10 de Febrero, edificio con zaguán de madera',
    franjaHoraria: 'Mañana 08:00 - 12:00',
    fecha: '2026-11-16',
    estado: 'Programado',
    fotoUri: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80',
    fechaCreacion: '2026-11-15T09:15:00.000Z',
    ordenRuta: 1,
  },
  {
    id: 'pick-002',
    clienteId: 'client-mock-2',
    clienteNombre: 'Ing. Carlos Mamani',
    telefono: '+591 71839210',
    categoria: 'televisor',
    categoriaLabel: '2 TVs antiguas (CRT + LED rota)',
    volumen: 2,
    lat: -17.9601,
    lng: -67.1002,
    direccion: 'Av. 6 de Agosto e/ Aroma y Villarroel',
    referencia: 'A 2 cuadras de la Terminal de Buses, portón verde alto',
    franjaHoraria: 'Mañana 08:00 - 12:00',
    fecha: '2026-11-16',
    estado: 'Programado',
    fotoUri: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=600&q=80',
    fechaCreacion: '2026-11-15T10:30:00.000Z',
    ordenRuta: 2,
  },
  {
    id: 'pick-003',
    clienteId: 'client-mock-3',
    clienteNombre: 'Sra. Beatriz Flores',
    telefono: '+591 73820194',
    categoria: 'lavadora',
    categoriaLabel: 'Lavadora automática en desuso',
    volumen: 3,
    lat: -17.9350,
    lng: -67.1180,
    direccion: 'Av. Circunvalación Norte y Tomás Barrón',
    referencia: 'Zona Casco del Minero, frente a surtidor de combustible',
    franjaHoraria: 'Tarde 14:00 - 18:00',
    fecha: '2026-11-16',
    estado: 'Pendiente',
    fotoUri: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80',
    fechaCreacion: '2026-11-15T11:45:00.000Z',
    ordenRuta: 3,
  },
  {
    id: 'pick-004',
    clienteId: 'client-mock-4',
    clienteNombre: 'Don Lucio Fernández',
    telefono: '+591 74129845',
    categoria: 'cocina',
    categoriaLabel: 'Cocina a gas de 4 hornallas',
    volumen: 3,
    lat: -17.9675,
    lng: -67.1130,
    direccion: 'Calle Pagador entre Junín y Ayacucho',
    referencia: 'Mercado Fermín López, esquina tienda de abarrotes Don Lucio',
    franjaHoraria: 'Mañana 08:00 - 12:00',
    fecha: '2026-11-16',
    estado: 'En camino',
    fotoUri: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
    fechaCreacion: '2026-11-15T12:00:00.000Z',
    ordenRuta: 4,
  },
  {
    id: 'pick-005',
    clienteId: 'client-mock-5',
    clienteNombre: 'Familia Quiroga',
    telefono: '+591 76192834',
    categoria: 'microondas_otro',
    categoriaLabel: 'Horno microondas + monitor quemado',
    volumen: 1,
    lat: -17.9710,
    lng: -67.1260,
    direccion: 'Calle Litoral s/n, Campamento Minero',
    referencia: 'Subiendo hacia la Mina San José, casa con vereda alta amarilla',
    franjaHoraria: 'Tarde 14:00 - 18:00',
    fecha: '2026-11-16',
    estado: 'Pendiente',
    fotoUri: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=600&q=80',
    fechaCreacion: '2026-11-15T14:20:00.000Z',
    ordenRuta: 5,
  },
];

// Ubicación base del Centro de Acopio / Maestranza en Oruro (Depósito Municipal)
export const ORURO_DEPOT = {
  nombre: 'Centro de Acopio RAEE Oruro',
  direccion: 'Av. 24 de Junio y Circunvalación',
  lat: -17.9725,
  lng: -67.1050,
};
