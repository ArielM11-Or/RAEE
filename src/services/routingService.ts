/**
 * Servicio de Enrutamiento sobre Calles Reales (OSRM / OpenStreetMap)
 * Calcula la ruta vehicular exacta a través de las calles de Oruro sin requerir API keys de pago.
 */

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface RouteGeometryResult {
  coordinates: [number, number][]; // [lat, lng] listos para Leaflet
  distanceMeters: number;
  durationSeconds: number;
}

// Caché en memoria para evitar llamadas redundantes a la API de enrutamiento
const routeCache = new Map<string, RouteGeometryResult>();

export const routingService = {
  /**
   * Obtiene la polilínea exacta que sigue las calles entre una serie de puntos
   * @param waypoints Array ordenado de paradas [{ lat, lng }]
   */
  async getRouteGeometry(waypoints: LatLngPoint[]): Promise<RouteGeometryResult> {
    if (!waypoints || waypoints.length < 2) {
      return { coordinates: [], distanceMeters: 0, durationSeconds: 0 };
    }

    // Generar clave de caché
    const cacheKey = waypoints
      .map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`)
      .join(';');

    if (routeCache.has(cacheKey)) {
      return routeCache.get(cacheKey)!;
    }

    try {
      // OSRM espera coordenadas en formato lon,lat separados por ';'
      const coordsQuery = waypoints
        .map((p) => `${p.lng},${p.lat}`)
        .join(';');

      const url = `https://router.project-osrm.org/route/v1/driving/${coordsQuery}?overview=full&geometries=geojson`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`OSRM HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // Convertir GeoJSON [lon, lat] a Leaflet [lat, lon]
        const leafletCoords: [number, number][] = route.geometry.coordinates.map(
          ([lon, lat]: [number, number]) => [lat, lon]
        );

        const result: RouteGeometryResult = {
          coordinates: leafletCoords,
          distanceMeters: route.distance || 0,
          durationSeconds: route.duration || 0,
        };

        routeCache.set(cacheKey, result);
        return result;
      }

      throw new Error(`OSRM code: ${data.code}`);
    } catch (e) {
      console.warn('Fallo al obtener ruta OSRM sobre calles, aplicando fallback recto:', e);
      // Fallback a línea recta si la red falla
      const fallbackCoords: [number, number][] = waypoints.map((p) => [p.lat, p.lng]);
      return {
        coordinates: fallbackCoords,
        distanceMeters: 0,
        durationSeconds: 0,
      };
    }
  },
};
