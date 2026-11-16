import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { FloatingTabBar, ActiveTab } from '@/navigation/FloatingTabBar';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { SchedulePickupScreen } from '@/screens/client/SchedulePickupScreen';
import { MyPickupsScreen } from '@/screens/client/MyPickupsScreen';
import { ClientTruckMapScreen } from '@/screens/client/ClientTruckMapScreen';
import { DailyRouteScreen } from '@/screens/driver/DailyRouteScreen';
import { DriverMapScreen } from '@/screens/driver/DriverMapScreen';
import { PickupItem } from '@/data/mockPickups';

export default function MainAppScreen() {
  const { user, role, switchRole } = useAuth();

  // Pestaña activa según el rol
  const [clientTab, setClientTab] = useState<'agendar' | 'solicitudes' | 'mapa_camion'>('agendar');
  const [driverTab, setDriverTab] = useState<'ruta' | 'mapa_operativo'>('ruta');
  const [focusedPickup, setFocusedPickup] = useState<PickupItem | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Si no hay usuario activo, renderiza la pantalla de Login con accesos simulados
  if (!user) {
    return <LoginScreen onSuccess={() => setShowAuthModal(false)} />;
  }

  const activeTab: ActiveTab = role === 'cliente' ? clientTab : driverTab;

  const handleSelectTab = (tab: ActiveTab) => {
    if (role === 'cliente') {
      setClientTab(tab as any);
    } else {
      setDriverTab(tab as any);
    }
  };

  const handleSwitchRole = () => {
    switchRole();
    setFocusedPickup(null);
  };

  // Navegar de Mis Solicitudes al Mapa del Camión
  const handleClientGoToMap = (pickup?: PickupItem) => {
    if (pickup) setFocusedPickup(pickup);
    setClientTab('mapa_camion');
  };

  // Navegar de la Lista del Conductor al Mapa Operativo
  const handleDriverOpenMap = (pickup?: PickupItem) => {
    if (pickup) setFocusedPickup(pickup);
    setDriverTab('mapa_operativo');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Contenido principal según rol y pestaña */}
      <View style={styles.screenArea}>
        {role === 'cliente' ? (
          <>
            {clientTab === 'agendar' && (
              <SchedulePickupScreen onSuccess={() => setClientTab('solicitudes')} />
            )}
            {clientTab === 'solicitudes' && (
              <MyPickupsScreen
                onGoToMap={handleClientGoToMap}
                onNewPickup={() => setClientTab('agendar')}
              />
            )}
            {clientTab === 'mapa_camion' && (
              <ClientTruckMapScreen focusedPickup={focusedPickup} />
            )}
          </>
        ) : (
          <>
            {driverTab === 'ruta' && (
              <DailyRouteScreen onOpenMap={handleDriverOpenMap} />
            )}
            {driverTab === 'mapa_operativo' && (
              <DriverMapScreen
                selectedPickup={focusedPickup}
                onClearSelectedPickup={() => setFocusedPickup(null)}
              />
            )}
          </>
        )}
      </View>

      {/* Snap Bar / Barra de Navegación Flotante */}
      <FloatingTabBar
        role={role}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onSwitchRole={handleSwitchRole}
      />

      {/* Modal de perfil / autenticación */}
      <Modal visible={showAuthModal} animationType="slide">
        <LoginScreen onClose={() => setShowAuthModal(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070d1e',
  },
  screenArea: {
    flex: 1,
  },
});
