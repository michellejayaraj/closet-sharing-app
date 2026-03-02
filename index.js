import { registerRootComponent } from 'expo'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Layout } from './components/layout/Layout'
import { MyCloset } from './pages/MyCloset'
import { FriendsCloset } from './pages/FriendsCloset'
import { BorrowedItems } from './pages/BorrowedItems'

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
  return (
    <SafeAreaProvider>
      <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="MyCloset" component={withLayout(MyCloset)} />
        <Stack.Screen name="FriendsCloset" component={withLayout(FriendsCloset)} />
        <Stack.Screen name="Borrowed" component={withLayout(BorrowedItems)} />
      </Stack.Navigator>
      <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

registerRootComponent(App)
