import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Image } from 'react-native';
import { theme } from '../theme';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Chargement...' }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/images/logo.webp')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={theme.colors.primary} style={styles.spinner} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  spinner: {
    marginBottom: 16,
  },
  text: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});
