import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevated = true,
}) => {
  return (
    <View style={[styles.card, elevated && SHADOWS.md, style]}>{children}</View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
});
