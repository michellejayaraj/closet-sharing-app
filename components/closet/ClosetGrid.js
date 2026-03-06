import { FlatList } from 'react-native'

export function ClosetGrid({ data, renderItem, refreshControl }) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      numColumns={2}
      columnWrapperStyle={{ marginBottom: 16, gap: 16 }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 24,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    />
  )
}
