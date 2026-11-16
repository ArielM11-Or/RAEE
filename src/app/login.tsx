import React from 'react';
import { router } from 'expo-router';
import { LoginScreen as AuthLoginScreen } from '@/screens/auth/LoginScreen';

export default function LoginRoute() {
  return (
    <AuthLoginScreen
      onSuccess={() => {
        router.replace('/');
      }}
      onClose={() => {
        router.replace('/');
      }}
    />
  );
}
