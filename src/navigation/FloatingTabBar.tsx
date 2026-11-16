import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../context/AuthContext';

export type ClientTab = 'agendar' | 'solicitudes' | 'mapa_camion';
export type DriverTab = 'ruta' | 'mapa_operativo';
export type ActiveTab = ClientTab | DriverTab;

interface FloatingTabBarProps {
  role: UserRole;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onSwitchRole: () => void;
}

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  role,
  activeTab,
  onSelectTab,
  onSwitchRole,
}) => {
  const isClient = role === 'cliente';

  const clientTabs: { id: ClientTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'agendar', label: 'Agendar', icon: 'add-circle-outline' },
    { id: 'solicitudes', label: 'Mis Solicitudes', icon: 'receipt-outline' },
    { id: 'mapa_camion', label: 'Mapa Camión', icon: 'map-outline' },
  ];

  const driverTabs: { id: DriverTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'ruta', label: 'Ruta del Día', icon: 'trail-sign-outline' },
    { id: 'mapa_operativo', label: 'Mapa Operativo', icon: 'navigate-outline' },
  ];

  const tabs = isClient ? clientTabs : driverTabs;

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      {/* Botón flotante superior de cambio rápido de Rol para pruebas */}
      <View style={styles.roleSwitcherContainer}>
        <TouchableOpacity
          style={[styles.roleSwitchButton, isClient ? styles.roleSwitchClient : styles.roleSwitchDriver]}
          onPress={onSwitchRole}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isClient ? 'person-circle-outline' : 'bus-outline'}
            size={16}
            color="#ffffff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.roleSwitchText}>
            Rol: <Text style={styles.roleBold}>{isClient ? 'Cliente' : 'Conductor'}</Text>
          </Text>
          <View style={styles.switchPill}>
            <Ionicons name="swap-horizontal" size={13} color="#ffffff" />
            <Text style={styles.switchPillText}>Cambiar</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Snap Bar / Floating Tab Bar */}
      <View style={styles.floatingBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => onSelectTab(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={22}
                color={isActive ? '#10b981' : '#94a3b8'}
              />
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 24 : 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  roleSwitcherContainer: {
    marginBottom: 8,
    alignItems: 'center',
  },
  roleSwitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
      },
    }),
  },
  roleSwitchClient: {
    backgroundColor: '#047857',
  },
  roleSwitchDriver: {
    backgroundColor: '#b45309',
  },
  roleSwitchText: {
    color: '#e2e8f0',
    fontSize: 12,
  },
  roleBold: {
    fontWeight: '700',
    color: '#ffffff',
  },
  switchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginLeft: 8,
    gap: 3,
  },
  switchPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '92%',
    maxWidth: 460,
    backgroundColor: '#0f172ae8',
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(12px)',
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  activeTabButton: {
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 3,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#10b981',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#10b981',
  },
});
