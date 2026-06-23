import { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native'
import * as Linking from 'expo-linking'
import Constants from 'expo-constants'
import { supabase } from '../lib/supabase'

export function Auth({ initialRecovery = false }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [isRecovery, setIsRecovery] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const redirectTo = useMemo(() => {
    if (Platform.OS === 'web') {
      // EAS Web deployment (friends can click the link in email)
      return 'https://cluelesscloset.expo.app/reset-password'
    }

    // Expo Go cannot open arbitrary custom schemes like clueless-closet://
    // It *can* open exp://.../--/reset-password (via Linking.createURL).
    if (Constants.appOwnership === 'expo') {
      return Linking.createURL('reset-password')
    }

    // Dev build / standalone
    return 'clueless-closet://reset-password'
  }, [])

  useEffect(() => {
    if (initialRecovery) setIsRecovery(true)
  }, [initialRecovery])

  const extractParamsFromUrl = (url) => {
    if (!url) return {}
    const hashIndex = url.indexOf('#')
    const queryIndex = url.indexOf('?')

    const hash = hashIndex >= 0 ? url.slice(hashIndex + 1) : ''
    const query = queryIndex >= 0 ? url.slice(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined) : ''

    const all = [query, hash].filter(Boolean).join('&')
    if (!all) return {}

    return all.split('&').reduce((acc, part) => {
      const [rawKey, rawVal] = part.split('=')
      if (!rawKey) return acc
      const key = decodeURIComponent(rawKey)
      const val = decodeURIComponent(rawVal || '')
      acc[key] = val
      return acc
    }, {})
  }

  const handleIncomingUrl = async (url) => {
    const params = extractParamsFromUrl(url)
    const type = params.type
    const access_token = params.access_token
    const refresh_token = params.refresh_token

    if (type === 'recovery') {
      setIsRecovery(true)
    }

    // Supabase recovery links often include tokens in the URL fragment on web.
    // In React Native we need to set the session manually.
    if (access_token && refresh_token) {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
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
      .then((url) => {
        if (!isMounted || !url) return
        handleIncomingUrl(url)
      })
      .catch((e) => console.error('getInitialURL error:', e))

    const sub = Linking.addEventListener('url', ({ url }) => {
      handleIncomingUrl(url)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true)
      }
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

    const { error } = isLogin
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

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

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
    setIsRecovery(false)
    setPassword('')
    setNewPassword('')
    setConfirmPassword('')
    await supabase.auth.signOut()
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isRecovery ? 'Reset password' : (isLogin ? 'Welcome back' : 'Create account')}
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {isRecovery ? (
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

          {isLogin && (
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={{ alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 }}
            >
              <Text style={[styles.toggle, { textAlign: 'right' }]}>Forgot password?</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={isRecovery ? handleUpdatePassword : handleSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : (
            <Text style={styles.buttonText}>
              {isRecovery ? 'Update password' : (isLogin ? 'Log in' : 'Sign up')}
            </Text>
          )
        }
      </TouchableOpacity>

      {isRecovery ? (
        <TouchableOpacity
          onPress={() => {
            setIsRecovery(false)
            setNewPassword('')
            setConfirmPassword('')
            setError(null)
          }}
        >
          <Text style={styles.toggle}>Back to login</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.toggle}>
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </Text>
        </TouchableOpacity>
      )}

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggle: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 14,
  },
  error: {
    color: '#ef4444',
    marginBottom: 16,
    fontSize: 14,
  },
})