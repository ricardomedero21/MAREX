import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

// Entrada escalonada (fade + slide-up). El detalle "premium" de carga.
export function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: 520,
      delay,
      useNativeDriver: true,
    }).start();
  }, [a, delay]);
  return (
    <Animated.View
      style={[
        {
          opacity: a,
          transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
