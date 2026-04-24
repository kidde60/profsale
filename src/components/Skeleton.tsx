// components/Skeleton.tsx - Skeleton loading component
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  style?: any;
}

const { width: screenWidth } = Dimensions.get('window');

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  style,
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width:
            typeof width === 'number'
              ? width
              : (screenWidth * parseFloat(width)) / 100,
          height,
        },
        style,
      ]}
    />
  );
};

export const SkeletonText: React.FC<{
  lines?: number;
  width?: string;
  style?: any;
}> = ({ lines = 3, width = '100%', style }) => {
  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '60%' : width}
          height={16}
          style={index > 0 ? styles.textLine : undefined}
        />
      ))}
    </View>
  );
};

export const SkeletonCard: React.FC<{ style?: any }> = ({ style }) => {
  return (
    <View style={[styles.card, style]}>
      <Skeleton width={60} height={60} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <SkeletonText lines={2} width="80%" />
        <Skeleton width="40%" height={14} style={styles.cardPrice} />
      </View>
    </View>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
};

export const SkeletonScreen: React.FC = () => {
  return (
    <View style={styles.screen}>
      <Skeleton width="40%" height={32} style={styles.header} />
      <Skeleton width="100%" height={120} style={styles.banner} />
      <SkeletonText lines={2} width="30%" style={styles.sectionTitle} />
      <SkeletonList count={3} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  textContainer: {
    gap: 8,
  },
  textLine: {
    marginTop: 4,
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
  },
  cardImage: {
    borderRadius: 8,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  cardPrice: {
    marginTop: 8,
  },
  listItem: {
    marginBottom: 8,
  },
  screen: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  header: {
    marginBottom: 16,
  },
  banner: {
    marginBottom: 24,
    borderRadius: 8,
  },
  sectionTitle: {
    marginBottom: 12,
  },
});

export default Skeleton;
