import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RaeeLogo } from '../../components/RaeeLogo';
import { CATEGORIAS_ELECTRO, ORURO_DEPOT, PickupItem } from '../../data/mockPickups';
import { pickupService } from '../../services/pickupService';

interface DailyRouteScreenProps {
  onOpenMap?: (pickup?: PickupItem) => void;
}

export const DailyRouteScreen: React.FC<DailyRouteScreenProps> = ({ onOpenMap }) => {
  const [pickups, setPickups] = useState<PickupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  // Capacidad máxima de carga del camión (en puntos de volumen)
  const MAX_TRUCK_CAPACITY = 20;

  useEffect(() => {
    const unsubscribe = pickupService.subscribe((list) => {
      setPickups(list);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Cálculo de carga acumulada
  const activePickups = pickups.filter((p) => p.estado !== 'Recolectado');
  const collectedPickups = pickups.filter((p) => p.estado === 'Recolectado');
  const currentLoad = activePickups.reduce((sum, item) => sum + (item.volumen || 1), 0);
  const loadPercentage = Math.min(100, Math.round((currentLoad / MAX_TRUCK_CAPACITY) * 100));

  // Heurística del Vecino Más Cercano (Nearest Neighbor) con Haversine
  const handleOptimizeRoute = async () => {
    try {
      setOptimizing(true);
      await pickupService.optimizeDailyRoute(ORURO_DEPOT.lat, ORURO_DEPOT.lng);
      Alert.alert(
        'Ruta Optimizada',
        'Las paradas se reordenaron minimizando la distancia en Oruro partiendo desde el Centro de Acopio.'
      );
    } catch (e) {
      console.error('Error optimizando ruta:', e);
      Alert.alert('Error', 'No se pudo calcular la ruta óptima.');
    } finally {
      setOptimizing(false);
    }
  };

  // Marcar como recolectado
  const handleMarkCollected = async (item: PickupItem) => {
    try {
      await pickupService.updatePickupStatus(item.id, 'Recolectado');
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el estado.');
    }
  };

  // Deep Link de Navegación externa
  const handleNavigateGPS = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir la aplicación de mapas.');
    });
  };

  const renderStopItem = ({ item, index }: { item: PickupItem; index: number }) => {
    const isCollected = item.estado === 'Recolectado';
    const catMeta = CATEGORIAS_ELECTRO[item.categoria];
    const orderNumber = item.ordenRuta || index + 1;

    return (
      <View style={[styles.stopCard, isCollected && styles.stopCardCollected]}>
        <View style={styles.cardTopRow}>
          {/* Badge de Orden */}
          <View style={[styles.orderBadge, isCollected && styles.orderBadgeCollected]}>
            <Text style={styles.orderNumberText}>#{orderNumber}</Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={[styles.clientName, isCollected && styles.textMuted]}>
              {item.clienteNombre}
            </Text>
            <Text style={styles.categoryName}>
              {item.categoriaLabel || catMeta?.label} • {item.volumen} pts volumen
            </Text>
          </View>

          {isCollected ? (
            <View style={styles.collectedTag}>
              <Ionicons name="checkmark-done" size={16} color="#10b981" />
              <Text style={styles.collectedTagText}>Listo</Text>
            </View>
          ) : (
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{item.estado}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <Image source={{ uri: item.fotoUri }} style={styles.equipmentPhoto} />
          <View style={styles.detailsCol}>
            <Text style={styles.addressText} numberOfLines={2}>
              <Ionicons name="location-outline" size={13} color="#38bdf8" /> {item.direccion}
            </Text>
            <View style={styles.refBox}>
              <Ionicons name="information-circle-outline" size={13} color="#f59e0b" />
              <Text style={styles.refText} numberOfLines={2}>
                {item.referencia}
              </Text>
            </View>
            <Text style={styles.phoneText}>
              <Ionicons name="call-outline" size={12} color="#94a3b8" /> {item.telefono}
            </Text>
          </View>
        </View>

        {/* Acciones de la parada */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => handleNavigateGPS(item.lat, item.lng)}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate-outline" size={16} color="#38bdf8" />
            <Text style={styles.navButtonText}>Navegar GPS</Text>
          </TouchableOpacity>

          {onOpenMap && (
            <TouchableOpacity
              style={styles.mapPinButton}
              onPress={() => onOpenMap(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="map-outline" size={16} color="#e2e8f0" />
            </TouchableOpacity>
          )}

          {!isCollected ? (
            <TouchableOpacity
              style={styles.collectButton}
              onPress={() => handleMarkCollected(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#ffffff" />
              <Text style={styles.collectButtonText}>Recolectado</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.reopenButton}
              onPress={() => pickupService.updatePickupStatus(item.id, 'Pendiente')}
            >
              <Ionicons name="arrow-undo-outline" size={14} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <RaeeLogo width={90} withCardBackground style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.headerTitle}>Ruta del Día</Text>
            <Text style={styles.headerSubtitle}>
              Camión Recolector • RAEE Oruro
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.optimizeButton}
          onPress={handleOptimizeRoute}
          disabled={optimizing}
          activeOpacity={0.8}
        >
          {optimizing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="git-compare-outline" size={16} color="#ffffff" />
              <Text style={styles.optimizeButtonText}>Optimizar Ruta</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Indicador de Capacidad de Carga del Camión */}
      <View style={styles.capacityCard}>
        <View style={styles.capacityHeader}>
          <View style={styles.capacityTitleRow}>
            <Ionicons name="bus-outline" size={20} color="#f59e0b" />
            <Text style={styles.capacityTitle}>Capacidad de Carga Acumulada</Text>
          </View>
          <Text style={styles.capacityRatio}>
            {currentLoad} / {MAX_TRUCK_CAPACITY} pts ({loadPercentage}%)
          </Text>
        </View>

        {/* Barra de progreso */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${loadPercentage}%`,
                backgroundColor:
                  loadPercentage > 85 ? '#ef4444' : loadPercentage > 60 ? '#f59e0b' : '#10b981',
              },
            ]}
          />
        </View>

        <View style={styles.capacityFooter}>
          <Text style={styles.capacityNote}>
            {activePickups.length} paradas pendientes • {collectedPickups.length} completadas
          </Text>
          <Text style={styles.depotNote}>Base: Centro de Acopio RAEE Oruro</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Cargando paradas del día...</Text>
        </View>
      ) : (
        <FlatList
          data={pickups}
          keyExtractor={(item) => item.id}
          renderItem={renderStopItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      <View style={{ height: 110 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070d1e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 14,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  optimizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  optimizeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  capacityCard: {
    backgroundColor: '#0f172a',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  capacityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  capacityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  capacityRatio: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f59e0b',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  capacityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacityNote: {
    fontSize: 11,
    color: '#94a3b8',
  },
  depotNote: {
    fontSize: 10,
    color: '#64748b',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 8,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  stopCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  stopCardCollected: {
    opacity: 0.65,
    backgroundColor: '#09101f',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  orderBadgeCollected: {
    backgroundColor: '#10b981',
  },
  orderNumberText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  headerInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  categoryName: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  textMuted: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  statusPill: {
    backgroundColor: '#1e293b',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  collectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  collectedTagText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
  },
  cardBody: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  equipmentPhoto: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  detailsCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  addressText: {
    fontSize: 12,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  refBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    padding: 6,
    borderRadius: 8,
    marginTop: 4,
    gap: 5,
  },
  refText: {
    fontSize: 11,
    color: '#cbd5e1',
    flex: 1,
  },
  phoneText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    gap: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    gap: 6,
  },
  navButtonText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  mapPinButton: {
    backgroundColor: '#1e293b',
    padding: 8,
    borderRadius: 10,
  },
  collectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  collectButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  reopenButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
});
