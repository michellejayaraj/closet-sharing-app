import { registerRootComponent } from 'expo'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Layout } from './components/layout/Layout'
import { MyCloset } from './pages/MyCloset'
import { FriendsCloset } from './pages/FriendsCloset'
import { BorrowedItems } from './pages/BorrowedItems'
import {Auth} from './pages/Auth'
import { ClosetProvider } from './hooks/useCloset'
import { supabase } from './lib/supabase'

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('session:', session)  // add this
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <View style={{ flex: 1, backgroundColor: '#fff' }} />

  console.log('Auth screen component is:', Auth)

  return (
    <SafeAreaProvider>
      <ClosetProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {session ? (
              <>
                <Stack.Screen name="MyCloset" component={withLayout(MyCloset)} />
                <Stack.Screen name="FriendsCloset" component={withLayout(FriendsCloset)} />
                <Stack.Screen name="Borrowed" component={withLayout(BorrowedItems)} />
              </>
            ) : (
              <Stack.Screen name="Auth" component={Auth} />
            )}
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </ClosetProvider>
    </SafeAreaProvider>
  )
}

registerRootComponent(App)