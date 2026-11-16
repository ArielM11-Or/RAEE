import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { PickupItem, ORURO_DEPOT } from '../../data/mockPickups';
import { pickupService } from '../../services/pickupService';
import { RaeeLogo } from '../../components/RaeeLogo';

interface DriverMapScreenProps {
  selectedPickup?: PickupItem | null;
  onClearSelectedPickup?: () => void;
}

export const DriverMapScreen: React.FC<DriverMapScreenProps> = ({
  selectedPickup: initialSelected,
  onClearSelectedPickup,
}) => {
  const [pickups, setPickups] = useState<PickupItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PickupItem | null>(null);
  const [routeStats, setRouteStats] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const webViewRef = useRef<WebView>(null);

  // Posición simulada del Camión Recolector recorriendo Oruro
  const truckPos = {
    lat: -17.9620,
    lng: -67.1060,
    placa: '3849-TXL',
  };

  useEffect(() => {
    const unsubscribe = pickupService.subscribe((list) => {
      setPickups(list);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initialSelected && webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `if (window.centerOnStop) { window.centerOnStop('${initialSelected.id}'); } true;`
      );
    }
  }, [initialSelected]);

  const activeSelection = selectedItem ?? initialSelected ?? null;

  const handleOpenExternalNav = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir la aplicación de mapas externa.');
    });
  };

  const handleOpenWaze = (lat: number, lng: number) => {
    const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    Linking.openURL(url).catch(() => {
      handleOpenExternalNav(lat, lng);
    });
  };

  // Generación de HTML dinámico de Leaflet con OpenStreetMap
  const generateMapHtml = () => {
    const stopsJson = JSON.stringify(
      pickups.map((p, idx) => ({
        id: p.id,
        order: p.ordenRuta || idx + 1,
        lat: p.lat,
        lng: p.lng,
        clienteNombre: p.clienteNombre,
        categoriaLabel: p.categoriaLabel,
        estado: p.estado,
        isCollected: p.estado === 'Recolectado',
      }))
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body, #map { width: 100%; height: 100%; background: #070d1e; }
          
          /* Pin numerado del cliente */
          .stop-marker-pin {
            width: 34px;
            height: 34px;
            border-radius: 50% 50% 50% 0;
            background: #2563eb;
            position: absolute;
            transform: rotate(-45deg);
            left: 50%;
            top: 50%;
            margin: -20px 0 0 -20px;
            border: 2.5px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
          .stop-marker-pin.collected {
            background: #10b981;
          }
          .stop-marker-number {
            transform: rotate(45deg);
            color: #ffffff;
            font-size: 13px;
            font-weight: 800;
            font-family: sans-serif;
          }
          
          /* Camión Recolector */
          .truck-pin {
            width: 44px;
            height: 44px;
            background: #f59e0b;
            border-radius: 50%;
            border: 3px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 16px rgba(245, 158, 11, 0.8);
            cursor: pointer;
          }
          .truck-pin svg {
            width: 24px;
            height: 24px;
            fill: #ffffff;
          }

          /* Centro de Acopio / Depósito */
          .depot-pin {
            width: 32px;
            height: 32px;
            background: #8b5cf6;
            border-radius: 8px;
            border: 2px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5);
          }
          .depot-pin span {
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          var map = L.map('map', { zoomControl: false }).setView([${truckPos.lat}, ${truckPos.lng}], 14);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          var stops = ${stopsJson};
          var markersById = {};

          function notifyStopClick(id) {
            var msg = JSON.stringify({ type: 'PIN_CLICK', id: id });
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(msg);
            } else if (window.parent && window.parent.postMessage) {
              window.parent.postMessage(msg, '*');
            }
          }

          // Marcador de Centro de Acopio Base
          var depotIcon = L.divIcon({
            className: 'depot-pin-wrap',
            html: '<div class="depot-pin"><span>BASE</span></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });
          L.marker([${ORURO_DEPOT.lat}, ${ORURO_DEPOT.lng}], { icon: depotIcon })
            .bindPopup('<b>${ORURO_DEPOT.nombre}</b><br/>Maestranza y Acopio RAEE')
            .addTo(map);

          // Marcador del Camión
          var truckSvg = '<svg viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>';
          var truckIcon = L.divIcon({
            className: 'truck-pin-wrap',
            html: '<div class="truck-pin">' + truckSvg + '</div>',
            iconSize: [44, 44],
            iconAnchor: [22, 22]
          });
          var truckMarker = L.marker([${truckPos.lat}, ${truckPos.lng}], { icon: truckIcon })
            .bindPopup('<b>Camión Recolector #${truckPos.placa}</b><br/>En ruta operativa')
            .addTo(map);

          // Ordenar paradas para el itinerario del día
          var sortedStops = stops.slice().sort(function(a, b) {
            return (a.order || 0) - (b.order || 0);
          });

          // Marcadores de paradas de clientes
          sortedStops.forEach(function(s) {
            var pinClass = s.isCollected ? 'stop-marker-pin collected' : 'stop-marker-pin';
            var html = '<div class="' + pinClass + '"><div class="stop-marker-number">' + s.order + '</div></div>';
            var icon = L.divIcon({
              className: 'custom-stop-pin',
              html: html,
              iconSize: [34, 34],
              iconAnchor: [17, 34]
            });

            var m = L.marker([s.lat, s.lng], { icon: icon }).addTo(map);
            m.on('click', function() {
              notifyStopClick(s.id);
            });
            markersById[s.id] = m;
          });

          // Línea inicial de fallback
          var directCoords = [[${ORURO_DEPOT.lat}, ${ORURO_DEPOT.lng}]];
          sortedStops.forEach(function(s) { directCoords.push([s.lat, s.lng]); });

          var routePolyline = L.polyline(directCoords, {
            color: '#38bdf8',
            weight: 3,
            opacity: 0.5,
            dashArray: '6, 8'
          }).addTo(map);

          // Cargar trayecto real sobre las calles de Oruro mediante OSRM
          var osrmWaypoints = ['${ORURO_DEPOT.lng},${ORURO_DEPOT.lat}'];
          sortedStops.forEach(function(s) {
            osrmWaypoints.push(s.lng + ',' + s.lat);
          });

          if (osrmWaypoints.length > 1) {
            var osrmUrl = 'https://router.project-osrm.org/route/v1/driving/' + osrmWaypoints.join(';') + '?overview=full&geometries=geojson';
            fetch(osrmUrl)
              .then(function(res) { return res.json(); })
              .then(function(data) {
                if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
                  var route = data.routes[0];
                  // Convertir GeoJSON [lng, lat] a Leaflet [lat, lng]
                  var realStreetCoords = route.geometry.coordinates.map(function(c) {
                    return [c[1], c[0]];
                  });
                  // Actualizar la polilínea con el trazado exacto de las calles
                  routePolyline.setLatLngs(realStreetCoords);
                  routePolyline.setStyle({
                    color: '#0284c7',
                    weight: 5,
                    opacity: 0.9,
                    dashArray: null
                  });

                  // Añadir una línea interior brillante estilo neón vial
                  L.polyline(realStreetCoords, {
                    color: '#38bdf8',
                    weight: 3,
                    opacity: 0.95
                  }).addTo(map);

                  // Ajustar vista para encuadrar todo el recorrido
                  map.fitBounds(routePolyline.getBounds(), { padding: [40, 40] });

                  // Notificar estadísticas reales de ruta
                  var distKm = Math.round((route.distance / 1000) * 10) / 10;
                  var durMin = Math.round(route.duration / 60);
                  var msg = JSON.stringify({
                    type: 'ROUTE_STATS',
                    distanceKm: distKm,
                    durationMin: durMin
                  });
                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(msg);
                  } else if (window.parent && window.parent.postMessage) {
                    window.parent.postMessage(msg, '*');
                  }
                }
              })
              .catch(function(err) {
                console.warn('No se pudo cargar ruta OSRM en calles:', err);
              });
          }

          window.centerOnStop = function(id) {
            var target = stops.find(function(item) { return item.id === id; });
            if (target) {
              map.setView([target.lat, target.lng], 16, { animate: true });
            }
          };
        </script>
      </body>
      </html>
    `;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.type === 'PIN_CLICK' && data.id) {
        const found = pickups.find((p) => p.id === data.id);
        if (found) {
          setSelectedItem(found);
        }
      } else if (data && data.type === 'ROUTE_STATS') {
        setRouteStats({
          distanceKm: data.distanceKm,
          durationMin: data.durationMin,
        });
      }
    } catch (e) {
      console.warn('Error en mensaje de mapa:', e);
    }
  };

  const WebViewComponent = WebView as any;

  return (
    <View style={styles.container}>
      {/* Barra de cabecera flotante */}
      <View style={styles.topBar}>
        <View style={styles.topInfo}>
          <View style={styles.topTitleRow}>
            <RaeeLogo width={76} withCardBackground style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.topTitle}>Mapa Operativo de Ruta</Text>
              <Text style={styles.topSubtitle}>
                {pickups.filter((p) => p.estado !== 'Recolectado').length} pendientes
                {routeStats ? ` • ${routeStats.distanceKm} km (~${routeStats.durationMin} min en calles)` : ' • Trazando calles...'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Camión</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
            <Text style={styles.legendText}>Pendiente</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Listo</Text>
          </View>
        </View>
      </View>

      {/* Mapa OSM con Leaflet */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={generateMapHtml()}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Driver OSM Map"
          />
        ) : (
          <WebViewComponent
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: generateMapHtml() }}
            onMessage={handleMessage}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
          />
        )}
      </View>

      {/* Panel Inferior Flotante al Seleccionar un Pin */}
      {activeSelection && (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetBadgeRow}>
              <View style={styles.orderPill}>
                <Text style={styles.orderPillText}>#{activeSelection.ordenRuta || 1}</Text>
              </View>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {activeSelection.clienteNombre}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={() => {
                setSelectedItem(null);
                if (onClearSelectedPickup) onClearSelectedPickup();
              }}
            >
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetBody}>
            <Image source={{ uri: activeSelection.fotoUri }} style={styles.sheetPhoto} />

            <View style={styles.sheetDetails}>
              <Text style={styles.sheetCategory}>
                {activeSelection.categoriaLabel} ({activeSelection.volumen} pts)
              </Text>
              <Text style={styles.sheetAddress} numberOfLines={2}>
                <Ionicons name="location-outline" size={13} color="#38bdf8" /> {activeSelection.direccion}
              </Text>
              <Text style={styles.sheetRef} numberOfLines={2}>
                Ref: {activeSelection.referencia}
              </Text>
              <Text style={styles.sheetPhone}>
                <Ionicons name="call-outline" size={12} color="#10b981" /> {activeSelection.telefono}
              </Text>
            </View>
          </View>

          {/* Botones de Navegación Externa */}
          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={styles.gmapsButton}
              onPress={() => handleOpenExternalNav(activeSelection.lat, activeSelection.lng)}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.gmapsButtonText}>Google Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.wazeButton}
              onPress={() => handleOpenWaze(activeSelection.lat, activeSelection.lng)}
              activeOpacity={0.8}
            >
              <Ionicons name="compass-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.wazeButtonText}>Waze</Text>
            </TouchableOpacity>

            {activeSelection.estado !== 'Recolectado' && (
              <TouchableOpacity
                style={styles.quickCollectBtn}
                onPress={async () => {
                  await pickupService.updatePickupStatus(activeSelection.id, 'Recolectado');
                  setSelectedItem((prev) => (prev ? { ...prev, estado: 'Recolectado' } : null));
                }}
              >
                <Ionicons name="checkmark" size={18} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070d1e',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 28,
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
      },
    }),
  },
  topInfo: {
    flex: 1,
  },
  topTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
  },
  topSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  mapContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#070d1e',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 95,
    left: 16,
    right: 16,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
      },
    }),
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sheetBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderPill: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  orderPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  sheetTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetBody: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  sheetPhoto: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  sheetDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  sheetCategory: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  sheetAddress: {
    color: '#e2e8f0',
    fontSize: 11,
    marginTop: 2,
  },
  sheetRef: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  sheetPhone: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  gmapsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 12,
  },
  gmapsButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  wazeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 12,
  },
  wazeButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  quickCollectBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
