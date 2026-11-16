import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PickupItem, CATEGORIAS_ELECTRO } from '../../data/mockPickups';
import { pickupService } from '../../services/pickupService';
import { useAuth } from '../../context/AuthContext';
import { RaeeLogo } from '../../components/RaeeLogo';

interface MyPickupsScreenProps {
  onGoToMap?: (pickup?: PickupItem) => void;
  onNewPickup?: () => void;
}

export const MyPickupsScreen: React.FC<MyPickupsScreenProps> = ({ onGoToMap, onNewPickup }) => {
  const { user } = useAuth();
  const [pickups, setPickups] = useState<PickupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Suscribirse a cambios en el estado reactivo del servicio
    const unsubscribe = pickupService.subscribe((list) => {
      // Filtrar solicitudes del cliente o datos de prueba
      const clientItems = list.filter(
        (p) => !user || p.clienteId === user.uid || p.clienteId.startsWith('client-mock')
      );
      setPickups(clientItems);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    const list = await pickupService.getAllPickups();
    const clientItems = list.filter(
      (p) => !user || p.clienteId === user.uid || p.clienteId.startsWith('client-mock')
    );
    setPickups(clientItems);
    setRefreshing(false);
  };

  const getStatusBadge = (estado: PickupItem['estado']) => {
    switch (estado) {
      case 'Pendiente':
        return {
          bg: '#78350f',
          color: '#fef08a',
          icon: 'time-outline' as const,
        };
      case 'Programado':
        return {
          bg: '#1e3a8a',
          color: '#bfdbfe',
          icon: 'calendar-outline' as const,
        };
      case 'En camino':
        return {
          bg: '#065f46',
          color: '#a7f3d0',
          icon: 'bicycle-outline' as const,
        };
      case 'Recolectado':
        return {
          bg: '#14532d',
          color: '#86efac',
          icon: 'checkmark-done-circle-outline' as const,
        };
      default:
        return {
          bg: '#334155',
          color: '#cbd5e1',
          icon: 'information-circle-outline' as const,
        };
    }
  };

  const renderItem = ({ item }: { item: PickupItem }) => {
    const badge = getStatusBadge(item.estado);
    const catMeta = CATEGORIAS_ELECTRO[item.categoria];

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: item.fotoUri }} style={styles.thumbnail} />
          <View style={styles.cardInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.categoryTitle}>{item.categoriaLabel || catMeta?.label}</Text>
            </View>
            <Text style={styles.addressText} numberOfLines={1}>
              <Ionicons name="location-sharp" size={13} color="#10b981" /> {item.direccion}
            </Text>
            <Text style={styles.refText} numberOfLines={2}>
              Ref: {item.referencia}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={12} color="#94a3b8" />
              <Text style={styles.metaText}>{item.franjaHoraria}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.metaText}>Vol: {item.volumen} pts</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Ionicons name={badge.icon} size={14} color={badge.color} />
            <Text style={[styles.statusText, { color: badge.color }]}>{item.estado}</Text>
          </View>

          {item.estado === 'En camino' || item.estado === 'Programado' ? (
            <TouchableOpacity
              style={styles.trackButton}
              onPress={() => onGoToMap && onGoToMap(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate-circle-outline" size={16} color="#ffffff" />
              <Text style={styles.trackButtonText}>Ver Camión</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.dateLabel}>ID: #{item.id.substring(0, 8)}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <RaeeLogo width={95} withCardBackground style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.headerTitle}>Mis Solicitudes</Text>
            <Text style={styles.headerSubtitle}>
              RAEE y Línea Blanca • Oruro
            </Text>
          </View>
        </View>
        {onNewPickup && (
          <TouchableOpacity style={styles.addHeaderBtn} onPress={onNewPickup}>
            <Ionicons name="add" size={22} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Cargando solicitudes...</Text>
        </View>
      ) : (
        <FlatList
          data={pickups}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <RaeeLogo size="xl" withCardBackground style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>No tienes solicitudes activas</Text>
              <Text style={styles.emptySubtitle}>
                Agenda el retiro de tu refrigerador, televisor, lavadora u otro electrodoméstico.
              </Text>
              {onNewPickup && (
                <TouchableOpacity style={styles.emptyActionBtn} onPress={onNewPickup}>
                  <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
                  <Text style={styles.emptyActionBtnText}>Agendar Primer Recojo</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <View style={{ height: 100 }} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 16,
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
  addHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 10,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeader: {
    flexDirection: 'row',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  addressText: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 3,
  },
  refText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  dot: {
    color: '#64748b',
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 5,
  },
  trackButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  dateLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
