import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

interface OSMLocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (coords: { lat: number; lng: number }) => void;
}

export const OSMLocationPicker: React.FC<OSMLocationPickerProps> = ({
  initialLat = -17.9647,
  initialLng = -67.1105,
  onLocationChange,
}) => {
  const [currentLat, setCurrentLat] = useState(initialLat);
  const [currentLng, setCurrentLng] = useState(initialLng);
  const [locating, setLocating] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Manejar GPS del dispositivo
  const handleGetDeviceLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Se requieren permisos de ubicación para detectar el GPS.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const newLat = loc.coords.latitude;
      const newLng = loc.coords.longitude;
      setCurrentLat(newLat);
      setCurrentLng(newLng);
      onLocationChange({ lat: newLat, lng: newLng });

      // Enviar evento al Leaflet dentro de WebView
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `if (window.setMarkerLocation) { window.setMarkerLocation(${newLat}, ${newLng}); } true;`
        );
      }
    } catch (e) {
      console.warn('Error obteniendo GPS:', e);
      alert('No se pudo obtener la ubicación GPS actual.');
    } finally {
      setLocating(false);
    }
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { width: 100%; height: 100%; background: #0b1329; }
        .custom-pin {
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          background: #10b981;
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -20px 0 0 -20px;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .custom-pin::after {
          content: '';
          width: 12px;
          height: 12px;
          background: #ffffff;
          border-radius: 50%;
          transform: rotate(45deg);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        var lat = ${currentLat};
        var lng = ${currentLng};

        var map = L.map('map', { zoomControl: false }).setView([lat, lng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        var pinIcon = L.divIcon({
          className: 'custom-pin-wrap',
          html: '<div class="custom-pin"></div>',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        var marker = L.marker([lat, lng], { draggable: true, icon: pinIcon }).addTo(map);

        function sendCoords(l, g) {
          var payload = JSON.stringify({ lat: l, lng: g });
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(payload);
          } else if (window.parent && window.parent.postMessage) {
            window.parent.postMessage(payload, '*');
          }
        }

        marker.on('dragend', function(e) {
          var pos = e.target.getLatLng();
          sendCoords(pos.lat, pos.lng);
        });

        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
          sendCoords(e.latlng.lat, e.latlng.lng);
        });

        window.setMarkerLocation = function(newLat, newLng) {
          marker.setLatLng([newLat, newLng]);
          map.panTo([newLat, newLng]);
        };
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
        setCurrentLat(data.lat);
        setCurrentLng(data.lng);
        onLocationChange({ lat: data.lat, lng: data.lng });
      }
    } catch (e) {
      console.warn('Error parseando mensaje de OSM:', e);
    }
  };

  const WebViewComponent = WebView as any;

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={mapHtml}
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: 14 }}
            title="OpenStreetMap Selector"
          />
        ) : (
          <WebViewComponent
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            onMessage={handleMessage}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
          />
        )}

        <TouchableOpacity
          style={styles.gpsButton}
          onPress={handleGetDeviceLocation}
          disabled={locating}
          activeOpacity={0.8}
        >
          {locating ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="locate" size={20} color="#ffffff" />
          )}
          <Text style={styles.gpsButtonText}>
            {locating ? 'Obteniendo GPS...' : 'Mi Ubicación Actual'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.coordsBadge}>
        <Ionicons name="navigate-circle-outline" size={16} color="#10b981" />
        <Text style={styles.coordsText}>
          Punto fijado: {currentLat.toFixed(5)}, {currentLng.toFixed(5)} (Oruro)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  mapWrapper: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#334155',
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  gpsButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    gap: 6,
  },
  gpsButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
    paddingHorizontal: 4,
  },
  coordsText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
});
