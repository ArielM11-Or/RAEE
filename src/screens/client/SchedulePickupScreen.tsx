import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CATEGORIAS_ELECTRO, PickupItem } from '../../data/mockPickups';
import { pickupService } from '../../services/pickupService';
import { useAuth } from '../../context/AuthContext';
import { OSMLocationPicker } from '../../components/OSMLocationPicker';
import { RaeeLogo } from '../../components/RaeeLogo';

interface SchedulePickupScreenProps {
  onSuccess?: () => void;
}

export const SchedulePickupScreen: React.FC<SchedulePickupScreenProps> = ({ onSuccess }) => {
  const { user } = useAuth();

  // Estados del Formulario
  const [categoria, setCategoria] = useState<PickupItem['categoria']>('refrigerador');
  const [direccion, setDireccion] = useState('');
  const [referencia, setReferencia] = useState('');
  const [telefono, setTelefono] = useState('+591 7');
  const [franjaHoraria, setFranjaHoraria] = useState<'Mañana 08:00 - 12:00' | 'Tarde 14:00 - 18:00'>(
    'Mañana 08:00 - 12:00'
  );
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: -17.9647,
    lng: -67.1105, // Oruro Centro
  });
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSuccess, setConfirmationSuccess] = useState(false);

  const selectedCategoryMeta = CATEGORIAS_ELECTRO[categoria];

  // Captura de imagen desde la cámara
  const handleTakeImage = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso Requerido', 'Necesitas otorgar permiso para acceder a la cámara.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFotoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Error al abrir la cámara:', e);
      Alert.alert('Error', 'No se pudo abrir la cámara.');
    }
  };

  // Selección de imagen desde la galería
  const handlePickGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso Requerido', 'Necesitas otorgar permiso para acceder a la galería.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFotoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Error al abrir la galería:', e);
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  // Envío y almacenamiento de la solicitud
  const handleSubmit = async () => {
    if (!referencia.trim()) {
      Alert.alert('Dato requerido', 'Por favor describe una referencia para ubicar tu domicilio en Oruro.');
      return;
    }

    try {
      setSubmitting(true);

      // // TODO: Conectar Firebase Firestore + Cloudinary
      // En la fase de producción:
      // 1. Subir `fotoUri` a Cloudinary usando formData multipart
      // 2. Guardar el objeto con la URL final de Cloudinary en `solicitudesRecojo` de Firestore

      const fallbackImage =
        fotoUri ||
        'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80';

      await pickupService.createPickup({
        clienteId: user?.uid || 'usr-anon',
        clienteNombre: user?.displayName || 'Ciudadano Oruro',
        telefono: telefono.trim() || '+591 70000000',
        categoria,
        categoriaLabel: selectedCategoryMeta.label,
        volumen: selectedCategoryMeta.volumen,
        lat: coords.lat,
        lng: coords.lng,
        direccion: direccion.trim() || 'Dirección fijada en mapa de Oruro',
        referencia: referencia.trim(),
        franjaHoraria,
        fecha: new Date().toISOString().split('T')[0],
        fotoUri: fallbackImage,
      });

      setConfirmationSuccess(true);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1600);
      }
    } catch (e) {
      console.error('Error al agendar recojo:', e);
      Alert.alert('Error', 'No se pudo guardar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmationSuccess) {
    return (
      <View style={styles.successScreen}>
        <RaeeLogo size="xl" withCardBackground style={styles.successCircle} />
        <Text style={styles.successTitle}>¡Recojo Agendado con Éxito!</Text>
        <Text style={styles.successText}>
          Tu solicitud para el retiro de <Text style={{ color: '#10b981', fontWeight: '700' }}>{selectedCategoryMeta.label}</Text> en Oruro ha sido registrada.
        </Text>
        <Text style={styles.successSubtext}>
          El camión recolector incluirá tu parada en la programación de la franja: {franjaHoraria}.
        </Text>
        <TouchableOpacity
          style={styles.successButton}
          onPress={() => {
            setConfirmationSuccess(false);
            if (onSuccess) onSuccess();
          }}
        >
          <Ionicons name="list-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.successButtonText}>Ver en Mis Solicitudes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Cabecera */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerBadge}>
            <Ionicons name="calendar-outline" size={18} color="#10b981" />
            <Text style={styles.headerBadgeText}>Agendamiento Ciudadano</Text>
          </View>
          <RaeeLogo width={110} withCardBackground />
        </View>
        <Text style={styles.title}>Solicitar Recojo de RAEE</Text>
        <Text style={styles.subtitle}>
          Recolección gratuita de electrodomésticos y chatarra electrónica a domicilio en Oruro.
        </Text>
      </View>

      {/* 1. Selector de Categoría con Ionicons y cálculo de volumen */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="apps-outline" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>1. Tipo de Electrodoméstico</Text>
        </View>
        <Text style={styles.sectionHint}>
          Selecciona la categoría para calcular la capacidad del camión:
        </Text>

        <View style={styles.categoriesGrid}>
          {(Object.keys(CATEGORIAS_ELECTRO) as (keyof typeof CATEGORIAS_ELECTRO)[]).map((key) => {
            const item = CATEGORIAS_ELECTRO[key];
            const isSelected = categoria === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                onPress={() => setCategoria(key)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.categoryIconWrap,
                    isSelected ? styles.categoryIconWrapSelected : null,
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={28}
                    color={isSelected ? '#ffffff' : '#38bdf8'}
                  />
                </View>
                <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
                  {item.label}
                </Text>
                <View style={[styles.volumenBadge, isSelected && styles.volumenBadgeSelected]}>
                  <Text style={styles.volumenBadgeText}>Volumen: {item.volumen} pts</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.volumenSummary}>
          <Ionicons name="speedometer-outline" size={18} color="#f59e0b" />
          <Text style={styles.volumenSummaryText}>
            Impacto en carga del camión:{' '}
            <Text style={{ fontWeight: '800', color: '#f59e0b' }}>
              {selectedCategoryMeta.volumen} / 4 puntos
            </Text>{' '}
            ({selectedCategoryMeta.description})
          </Text>
        </View>
      </View>

      {/* 2. Selector de Ubicación en OpenStreetMap */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="location-outline" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>2. Ubicación en Mapa (OpenStreetMap)</Text>
        </View>
        <Text style={styles.sectionHint}>
          Arrastra o toca el mapa para indicar el punto exacto de recojo en la ciudad de Oruro:
        </Text>

        <OSMLocationPicker
          initialLat={coords.lat}
          initialLng={coords.lng}
          onLocationChange={(newCoords) => setCoords(newCoords)}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.inputLabel}>Dirección / Calle:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej. Calle Bolívar y La Plata"
            placeholderTextColor="#64748b"
            value={direccion}
            onChangeText={setDireccion}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.inputLabel}>Referencia visual del domicilio (requerida):</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Ej. Portón azul, pared blanca, frente a plazuela..."
            placeholderTextColor="#64748b"
            value={referencia}
            onChangeText={setReferencia}
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.inputLabel}>Teléfono de contacto:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="+591 7XXXXXXX"
            placeholderTextColor="#64748b"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* 3. Captura de Foto con expo-image-picker */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="camera-outline" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>3. Foto de Referencia del Equipo</Text>
        </View>
        <Text style={styles.sectionHint}>
          Toma una foto o elígela de la galería para que el conductor reconozca el electrodoméstico:
        </Text>

        {fotoUri ? (
          <View style={styles.imagePreviewWrap}>
            <Image source={{ uri: fotoUri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => setFotoUri(null)}
            >
              <Ionicons name="trash" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoButtonsRow}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleTakeImage}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={24} color="#10b981" />
              <Text style={styles.photoButtonText}>Tomar Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoButton}
              onPress={handlePickGallery}
              activeOpacity={0.8}
            >
              <Ionicons name="images" size={24} color="#38bdf8" />
              <Text style={styles.photoButtonText}>Abrir Galería</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 4. Selector de Franja Horaria */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="time-outline" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>4. Franja Horaria de Preferencia</Text>
        </View>

        <View style={styles.timeSlotsRow}>
          <TouchableOpacity
            style={[
              styles.timeSlotBtn,
              franjaHoraria === 'Mañana 08:00 - 12:00' && styles.timeSlotBtnSelected,
            ]}
            onPress={() => setFranjaHoraria('Mañana 08:00 - 12:00')}
          >
            <Ionicons
              name="sunny-outline"
              size={20}
              color={franjaHoraria === 'Mañana 08:00 - 12:00' ? '#ffffff' : '#f59e0b'}
            />
            <Text
              style={[
                styles.timeSlotText,
                franjaHoraria === 'Mañana 08:00 - 12:00' && styles.timeSlotTextSelected,
              ]}
            >
              Mañana 08:00 - 12:00
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.timeSlotBtn,
              franjaHoraria === 'Tarde 14:00 - 18:00' && styles.timeSlotBtnSelected,
            ]}
            onPress={() => setFranjaHoraria('Tarde 14:00 - 18:00')}
          >
            <Ionicons
              name="partly-sunny-outline"
              size={20}
              color={franjaHoraria === 'Tarde 14:00 - 18:00' ? '#ffffff' : '#fb923c'}
            />
            <Text
              style={[
                styles.timeSlotText,
                franjaHoraria === 'Tarde 14:00 - 18:00' && styles.timeSlotTextSelected,
              ]}
            >
              Tarde 14:00 - 18:00
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botón de Confirmación */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={submitting}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.submitButtonText}>Confirmar y Agendar Recojo</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 110 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070d1e',
  },
  content: {
    padding: 18,
    paddingTop: 36,
  },
  header: {
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 8,
    gap: 6,
  },
  headerBadgeText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  sectionHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  categoryIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconWrapSelected: {
    backgroundColor: '#10b981',
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  volumenBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  volumenBadgeSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  volumenBadgeText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  volumenSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: 10,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  volumenSummaryText: {
    fontSize: 12,
    color: '#fef3c7',
    flex: 1,
  },
  fieldGroup: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#070d1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  photoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  photoButtonText: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
  },
  imagePreviewWrap: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    height: 180,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    borderRadius: 20,
    padding: 8,
  },
  timeSlotsRow: {
    flexDirection: 'column',
    gap: 10,
  },
  timeSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 12,
  },
  timeSlotBtnSelected: {
    backgroundColor: '#047857',
    borderColor: '#10b981',
  },
  timeSlotText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  timeSlotTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#10b981',
        shadowOpacity: 0.4,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  successScreen: {
    flex: 1,
    backgroundColor: '#070d1e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  successCircle: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  successText: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
  },
  successButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
