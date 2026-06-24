import { FlatList, View, useWindowDimensions } from 'react-native'

// Must match Layout.js main paddingHorizontal
const HORIZONTAL_PADDING = 16
const COLUMN_GAP = 8

export function ClosetGrid({ data, renderItem, refreshControl }) {
  const { width: screenWidth } = useWindowDimensions()
  const tileWidth = (screenWidth - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={(info) => (
        <View style={{ width: tileWidth }}>
          {renderItem(info)}
        </View>
      )}
      numColumns={2}
      columnWrapperStyle={{ marginBottom: COLUMN_GAP, gap: COLUMN_GAP }}
      contentContainerStyle={{
        paddingBottom: 24,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    />
  )
}
