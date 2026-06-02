import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const SRC = {
  cyan: require('../../assets/marex-icon-cyan.png'),
  white: require('../../assets/marex-icon-white.png'),
  light: require('../../assets/marex-icon-light.png'),
};

export function MarexMark({
  size = 28,
  variant = 'cyan',
  style,
}: {
  size?: number;
  variant?: keyof typeof SRC;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={SRC[variant]}
      resizeMode="contain"
      style={[{ width: size, height: size * (170 / 184) }, style]}
    />
  );
}
