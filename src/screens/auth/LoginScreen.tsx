import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { RaeeLogo } from '../../components/RaeeLogo';

interface LoginScreenProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, onClose }) => {
  const { loginWithGoogleMock, loginAsDriverMock, switchRole, role, user, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogleMock('cliente');
      if (onSuccess) onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const handleDriverLogin = async () => {
    setLoading(true);
    try {
      await loginAsDriverMock();
      if (onSuccess) onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#94a3b8" />
          </TouchableOpacity>
        )}

        <View style={styles.header}>
          <RaeeLogo size="hero" withCardBackground style={styles.logoBadge} />
          <Text style={styles.title}>Recicla RAEE Oruro</Text>
          <Text style={styles.subtitle}>
            Plataforma de Recolección de Residuos Electrónicos y Línea Blanca
          </Text>
        </View>

        {user && (
          <View style={styles.currentSessionBox}>
            <Ionicons name="person-circle" size={28} color="#10b981" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.sessionName}>{user.displayName}</Text>
              <Text style={styles.sessionRole}>
                Rol actual:{' '}
                <Text style={{ fontWeight: '700', color: role === 'cliente' ? '#34d399' : '#fbbf24' }}>
                  {role.toUpperCase()}
                </Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.roleToggleBtn} onPress={switchRole}>
              <Ionicons name="swap-horizontal" size={16} color="#ffffff" />
              <Text style={styles.roleToggleText}>Alternar</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Acceso Rápido Simulado</Text>
          <Text style={styles.sectionSubtitle}>
            Prueba inmediata sin credenciales reales para validación técnica.
          </Text>

          {/* Botón Google Mock (Cliente) */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#ea4335" style={{ marginRight: 10 }} />
                <Text style={styles.googleButtonText}>Continuar con Google (Cliente)</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Acceso Conductor Mock */}
          <TouchableOpacity
            style={styles.driverButton}
            onPress={handleDriverLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="bus-outline" size={20} color="#ffffff" style={{ marginRight: 10 }} />
            <Text style={styles.driverButtonText}>Ingresar como Conductor / Recolector</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O inicia con correo</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Formulario clásico con TODO para Firebase Auth */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.emailButton}
            onPress={() => handleGoogleLogin()}
            disabled={loading}
          >
            <Ionicons name="log-in-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.emailButtonText}>Ingresar con Credenciales</Text>
          </TouchableOpacity>

          {user && (
            <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
              <Ionicons name="log-out-outline" size={16} color="#ef4444" style={{ marginRight: 6 }} />
              <Text style={styles.logoutText}>Cerrar Sesión Activa</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.footerNote}>
          Oruro Limpia • Gestión Ambiental y Reciclaje de RAEE
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1329',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    right: 24,
    padding: 8,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 290,
    lineHeight: 18,
  },
  currentSessionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  sessionName: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
  },
  sessionRole: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  roleToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  roleToggleText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#111c38',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 18,
    marginTop: 4,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 12,
  },
  googleButtonText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  driverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d97706',
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 16,
  },
  driverButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1e293b',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#64748b',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b1329',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 14,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 6,
  },
  emailButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  footerNote: {
    color: '#475569',
    fontSize: 11,
    marginTop: 24,
    textAlign: 'center',
  },
});
