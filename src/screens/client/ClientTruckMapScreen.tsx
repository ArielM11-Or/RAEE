import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { RaeeLogo } from '../../components/RaeeLogo';
import { useAuth } from '../../context/AuthContext';
import { PickupItem } from '../../data/mockPickups';
import { pickupService } from '../../services/pickupService';

interface ClientTruckMapScreenProps {
  focusedPickup?: PickupItem | null;
}

export const ClientTruckMapScreen: React.FC<ClientTruckMapScreenProps> = ({ focusedPickup }) => {
  const { user } = useAuth();
  const [pickups, setPickups] = useState<PickupItem[]>([]);
  const [etaStats, setEtaStats] = useState<{ distanceKm: number; durationMin: number } | null>(null);

  // Posición en tiempo real simulada del Camión Recolector
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

  const clientItem =
    focusedPickup ||
    pickups.find((p) => !user || p.clienteId === user.uid || p.clienteId.startsWith('client-mock')) ||
    pickups[0];

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { width: 100%; height: 100%; background: #070d1e; }
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
        }
        .truck-pin svg { width: 24px; height: 24px; fill: #ffffff; }
        .home-pin {
          width: 38px;
          height: 38px;
          background: #10b981;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .home-icon {
          transform: rotate(45deg);
          color: #ffffff;
          font-weight: 800;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        var centerLat = ${clientItem ? clientItem.lat : truckPos.lat};
        var centerLng = ${clientItem ? clientItem.lng : truckPos.lng};
        var map = L.map('map', { zoomControl: false }).setView([centerLat, centerLng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        // Camión
        var truckSvg = '<svg viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>';
        var truckIcon = L.divIcon({
          className: 'truck-pin-wrap',
          html: '<div class="truck-pin">' + truckSvg + '</div>',
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });
        L.marker([${truckPos.lat}, ${truckPos.lng}], { icon: truckIcon })
          .bindPopup('<b>Camión Recolector #${truckPos.placa}</b><br/>En ruta por Oruro')
          .addTo(map);

        ${clientItem
      ? `
          var homeIcon = L.divIcon({
            className: 'home-pin-wrap',
            html: '<div class="home-pin"><span class="home-icon">🏠</span></div>',
            iconSize: [38, 38],
            iconAnchor: [19, 38]
          });
          L.marker([${clientItem.lat}, ${clientItem.lng}], { icon: homeIcon })
            .bindPopup('<b>Tu Domicilio</b><br/>${clientItem.categoriaLabel}<br/>Estado: ${clientItem.estado}')
            .openPopup()
            .addTo(map);

          // Línea inicial de guía
          var truckRouteLine = L.polyline([[${truckPos.lat}, ${truckPos.lng}], [${clientItem.lat}, ${clientItem.lng}]], {
            color: '#10b981',
            weight: 3,
            opacity: 0.5,
            dashArray: '5, 8'
          }).addTo(map);

          // Cargar trayecto vehicular real en calles de Oruro mediante OSRM
          var osrmUrl = 'https://router.project-osrm.org/route/v1/driving/${truckPos.lng},${truckPos.lat};${clientItem.lng},${clientItem.lat}?overview=full&geometries=geojson';
          fetch(osrmUrl)
            .then(function(res) { return res.json(); })
            .then(function(data) {
              if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
                var route = data.routes[0];
                var realCoords = route.geometry.coordinates.map(function(c) {
                  return [c[1], c[0]];
                });
                truckRouteLine.setLatLngs(realCoords);
                truckRouteLine.setStyle({
                  color: '#059669',
                  weight: 5,
                  opacity: 0.9,
                  dashArray: null
                });

                // Línea interior brillante
                L.polyline(realCoords, {
                  color: '#34d399',
                  weight: 3,
                  opacity: 0.95
                }).addTo(map);

                map.fitBounds(truckRouteLine.getBounds(), { padding: [50, 50] });

                var distKm = Math.round((route.distance / 1000) * 10) / 10;
                var durMin = Math.round(route.duration / 60);
                var msg = JSON.stringify({
                  type: 'ETA_STATS',
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
              console.warn('Fallback a línea recta:', err);
            });
        `
      : ''
    }
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.type === 'ETA_STATS') {
        setEtaStats({
          distanceKm: data.distanceKm,
          durationMin: data.durationMin,
        });
      }
    } catch (e) {
      console.warn('Error en mensaje ETA:', e);
    }
  };

  const WebViewComponent = WebView as any;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeftGroup}>
          <RaeeLogo width={90} withCardBackground style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.title}>Camión en Vivo</Text>
            <Text style={styles.subtitle}>
              Placa: {truckPos.placa} • Oruro
            </Text>
          </View>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveText}>EN RUTA</Text>
        </View>
      </View>

      <View style={styles.mapWrap}>
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={mapHtml}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Client Truck Map"
          />
        ) : (
          <WebViewComponent
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            onMessage={handleMessage}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
          />
        )}
      </View>

      {clientItem && (
        <View style={styles.bottomInfoCard}>
          <Ionicons name="shield-checkmark" size={24} color="#10b981" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.infoTitle}>
              {etaStats
                ? `A ${etaStats.distanceKm} km • Llegada en ~${etaStats.durationMin} min (por calles)`
                : 'Calculando trayecto por calles de Oruro...'}
            </Text>
            <Text style={styles.infoDesc}>
              {clientItem.categoriaLabel} • Estado: {clientItem.estado} ({clientItem.franjaHoraria})
            </Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
  },
  liveText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '800',
  },
  mapWrap: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#070d1e',
  },
  bottomInfoCard: {
    position: 'absolute',
    bottom: 95,
    left: 16,
    right: 16,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  infoTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  infoDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
});
