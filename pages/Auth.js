import { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native'
import * as Linking from 'expo-linking'
import Constants from 'expo-constants'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { colors, spacing, typography, radii } from '../lib/theme'

// mode: 'landing' | 'login' | 'signup' | 'recovery'
export function Auth({ initialRecovery = false, onGuest, initialMode = 'landing' }) {
  const insets = useSafeAreaInsets()

  const [mode, setMode] = useState(initialRecovery ? 'recovery' : initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const redirectTo = useMemo(() => {
    if (Platform.OS === 'web') {
      return 'https://cluelesscloset.expo.app/reset-password'
    }
    if (Constants.appOwnership === 'expo') {
      return Linking.createURL('reset-password')
    }
    return 'clueless-closet://reset-password'
  }, [])

  useEffect(() => {
    if (initialRecovery) setMode('recovery')
  }, [initialRecovery])

  const extractParamsFromUrl = (url) => {
    if (!url) return {}
    const hashIndex = url.indexOf('#')
    const queryIndex = url.indexOf('?')
    const hash = hashIndex >= 0 ? url.slice(hashIndex + 1) : ''
    const query = queryIndex >= 0
      ? url.slice(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined)
      : ''
    const all = [query, hash].filter(Boolean).join('&')
    if (!all) return {}
    return all.split('&').reduce((acc, part) => {
      const [rawKey, rawVal] = part.split('=')
      if (!rawKey) return acc
      acc[decodeURIComponent(rawKey)] = decodeURIComponent(rawVal || '')
      return acc
    }, {})
  }

  const handleIncomingUrl = async (url) => {
    const params = extractParamsFromUrl(url)
    if (params.type === 'recovery') setMode('recovery')
    if (params.access_token && params.refresh_token) {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      })
      if (setSessionError) {
        console.error('Failed to set recovery session:', setSessionError)
        setError('That reset link is invalid or expired. Please request a new one.')
      }
    }
  }

  useEffect(() => {
    let isMounted = true

    Linking.getInitialURL()
      .then((url) => { if (!isMounted || !url) return; handleIncomingUrl(url) })
      .catch((e) => console.error('getInitialURL error:', e))

    const sub = Linking.addEventListener('url', ({ url }) => handleIncomingUrl(url))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('recovery')
    })

    return () => {
      isMounted = false
      sub?.remove?.()
      subscription?.unsubscribe?.()
    }
  }, [])

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) {
      setError(error.message)
    } else {
      Alert.alert('Success', 'Check your email for the reset link!')
    }
    setLoading(false)
  }

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    Alert.alert('Success', 'Your password has been updated. Please log in.')
    setMode('login')
    setPassword('')
    setNewPassword('')
    setConfirmPassword('')
    await supabase.auth.signOut()
    setLoading(false)
  }

  // ─── Landing screen ───────────────────────────────────────────────────────────
  if (mode === 'landing') {
    return (
      <View style={styles.landingContainer}>
        <View style={[styles.landingHero, { paddingTop: insets.top + 32 }]}>
          <Text style={styles.wordmark}>Clueless Closet</Text>
          <Text style={styles.headline}>{'Keep track of what\u2019s yours,\nwhat\u2019s borrowed, and what\u2019s next.'}</Text>
        </View>

        <View style={[styles.landingActions, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
          <Button onPress={() => setMode('login')} style={styles.landingCta}>
            Log In
          </Button>
          <Button variant="secondary" onPress={() => setMode('signup')} style={styles.landingCta}>
            Sign Up
          </Button>
          {onGuest && (
            <TouchableOpacity onPress={onGuest} style={styles.guestLink}>
              <Text style={styles.guestText}>Continue as Guest  →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  // ─── Login / Signup / Recovery form ──────────────────────────────────────────
  return (
    <View style={styles.formContainer}>
      {mode !== 'recovery' && (
        <TouchableOpacity
          onPress={() => { setError(null); setMode('landing') }}
          style={[styles.backButton, { top: insets.top + 16 }]}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.formTitle}>
        {mode === 'recovery' ? 'Reset password' : mode === 'login' ? 'Log in' : 'Sign up'}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {mode === 'recovery' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
          />
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {mode === 'login' && (
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotRow}
            >
              <Text style={[styles.toggle, { textAlign: 'right' }]}>Forgot password?</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <Button
        onPress={mode === 'recovery' ? handleUpdatePassword : handleSubmit}
        loading={loading}
        style={styles.ctaButton}
      >
        {mode === 'recovery' ? 'Update password' : mode === 'login' ? 'Log in' : 'Sign up'}
      </Button>

      {mode === 'recovery' ? (
        <TouchableOpacity
          onPress={() => {
            setMode('login')
            setNewPassword('')
            setConfirmPassword('')
            setError(null)
          }}
        >
          <Text style={styles.toggle}>Back to login</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          <Text style={styles.toggle}>
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  // ─── Landing ────────────────────────────────────────────────────────────────
  landingContainer: {
    flex: 1,
    backgroundColor: colors.popPale,
  },
  landingHero: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 32,
    paddingBottom: 44,
  },
  wordmark: {
    fontSize: typography.appName.fontSize,
    fontWeight: typography.appName.fontWeight,
    letterSpacing: typography.appName.letterSpacing,
    color: colors.luxury,
    marginBottom: 14,
  },
  headline: {
    fontSize: 26,
    fontWeight: '500',
    color: colors.luxury,
    lineHeight: 34,
    letterSpacing: -0.3,
    opacity: 0.7,
  },
  landingActions: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  landingCta: {
    marginBottom: 12,
    paddingVertical: 14,
  },
  guestLink: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  guestText: {
    fontSize: 14,
    color: colors.muted,
  },

  // ─── Form ────────────────────────────────────────────────────────────────────
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.background,
  },
  backButton: {
    position: 'absolute',
    left: 24,
    padding: 8,
  },
  backText: {
    fontSize: 14,
    color: colors.muted,
  },
  formTitle: {
    fontSize: typography.screenTitle.fontSize,
    fontWeight: typography.screenTitle.fontWeight,
    letterSpacing: typography.screenTitle.letterSpacing,
    color: colors.text,
    marginBottom: spacing.lg + spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  ctaButton: {
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  toggle: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 14,
  },
  error: {
    color: '#ef4444',
    marginBottom: spacing.md,
    fontSize: typography.body.fontSize,
  },
})
