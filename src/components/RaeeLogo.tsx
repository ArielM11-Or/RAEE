import React from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';

const LOGO_SOURCE = require('../../assets/images/RAEE.png');

// Relación de aspecto nativa de RAEE.png (2620 x 1632)
export const RAEE_LOGO_ASPECT_RATIO = 2620 / 1632; // ~1.605

export type RaeeLogoSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero';

interface RaeeLogoProps {
  size?: RaeeLogoSize;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  withCardBackground?: boolean;
}

const PRESET_SIZES: Record<RaeeLogoSize, { width: number; height: number; borderRadius: number }> = {
  sm: { width: 68, height: 42, borderRadius: 8 },
  md: { width: 96, height: 60, borderRadius: 10 },
  lg: { width: 150, height: 93, borderRadius: 14 },
  xl: { width: 230, height: 143, borderRadius: 18 },
  hero: { width: 280, height: 174, borderRadius: 22 },
};

export const RaeeLogo: React.FC<RaeeLogoProps> = ({
  size = 'md',
  width,
  height,
  style,
  imageStyle,
  withCardBackground = false,
}) => {
  let targetWidth = PRESET_SIZES[size].width;
  let targetHeight = PRESET_SIZES[size].height;
  let borderRadius = PRESET_SIZES[size].borderRadius;

  if (width && !height) {
    targetWidth = width;
    targetHeight = Math.round(width / RAEE_LOGO_ASPECT_RATIO);
  } else if (height && !width) {
    targetHeight = height;
    targetWidth = Math.round(height * RAEE_LOGO_ASPECT_RATIO);
  } else if (width && height) {
    targetWidth = width;
    targetHeight = height;
  }

  const containerBorderRadius = borderRadius + 4;

  if (withCardBackground) {
    return (
      <View
        style={[
          styles.cardContainer,
          {
            width: targetWidth + 14,
            height: targetHeight + 14,
            borderRadius: containerBorderRadius,
          },
          style,
        ]}
      >
        <Image
          source={LOGO_SOURCE}
          style={[
            styles.image,
            {
              width: targetWidth,
              height: targetHeight,
              borderRadius,
            },
            imageStyle,
          ]}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={[styles.simpleContainer, style]}>
      <Image
        source={LOGO_SOURCE}
        style={[
          styles.image,
          {
            width: targetWidth,
            height: targetHeight,
            borderRadius,
          },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  simpleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  image: {
    backgroundColor: 'transparent',
  },
});
