import { registerRootComponent } from 'expo'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { colors } from './lib/theme'
import { Layout } from './components/layout/Layout'
import { MyCloset } from './pages/MyCloset'
import { BorrowedItems } from './pages/BorrowedItems'
import {Auth} from './pages/Auth'
import { ClosetProvider } from './hooks/useCloset'
import { Groups } from './pages/Groups'
import { GroupDetail } from './pages/GroupDetail'
import { supabase } from './lib/supabase'
import { Profile } from './pages/Profile'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const Stack = createNativeStackNavigator()

function withLayout(Component) {
  return function ScreenWithLayout(props) {
    return (
      <Layout>
        <Component {...props} />
      </Layout>
    )
  }
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [authInitialMode, setAuthInitialMode] = useState('landing')

  const handleExitGuest = (mode = 'landing') => {
    setAuthInitialMode(mode)
    setIsGuest(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
      }
      if (event === 'SIGNED_OUT') {
        setPasswordRecovery(false)
        setIsGuest(false)
        setAuthInitialMode('landing')
      }
      if (event === 'USER_UPDATED') {
        setPasswordRecovery(false)
      }
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.background }} />

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClosetProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
              {((session && !passwordRecovery) || isGuest) ? (
                <>
                  <Stack.Screen name="MyCloset" component={withLayout(MyCloset)} />
                  <Stack.Screen name="Borrowed" component={withLayout(BorrowedItems)} />
                  <Stack.Screen name="Groups" component={withLayout(Groups)} />
                  <Stack.Screen name="GroupDetail" component={withLayout(GroupDetail)} />
                  <Stack.Screen name="Profile">
                    {(props) => (
                      <Layout>
                        <Profile {...props} isGuest={isGuest} onExitGuest={handleExitGuest} />
                      </Layout>
                    )}
                  </Stack.Screen>
                </>
              ) : (
                <Stack.Screen name="Auth">
                  {() => <Auth initialRecovery={passwordRecovery} onGuest={() => setIsGuest(true)} initialMode={authInitialMode} />}
                </Stack.Screen>
              )}
            </Stack.Navigator>
            <StatusBar style="auto" />
          </NavigationContainer>
        </ClosetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

registerRootComponent(App)