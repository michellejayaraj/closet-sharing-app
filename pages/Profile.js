import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  Animated,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import * as FileSystemLegacy from 'expo-file-system/legacy'
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { decode } from 'base64-arraybuffer'
import Feather from '@expo/vector-icons/Feather'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { colors, spacing, radii, typography } from '../lib/theme'

const SETTINGS_ICON_WIDTH = 22

export function Profile({ isGuest = false, onExitGuest }) {
  const insets = useSafeAreaInsets()
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [findFriendsOpen, setFindFriendsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // TODO: wire borrowed, lent, and groups counts when profile stats are loaded
  const closetStats = { borrowed: 0, lent: 0, groups: 0 }

  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarOriginalUrl, setAvatarOriginalUrl] = useState(null)
  const [avatarCacheBust, setAvatarCacheBust] = useState(Date.now())

  const [friendQuery, setFriendQuery] = useState('')
  const [searchingFriends, setSearchingFriends] = useState(false)
  const [friendResults, setFriendResults] = useState([])

  const [cropEditorVisible, setCropEditorVisible] = useState(false)
  const [cropImageUri, setCropImageUri] = useState(null)
  const [cropImageSize, setCropImageSize] = useState(null)

  const window = Dimensions.get('window')
  const cropCircleSize = Math.min(window.width, window.height) * 0.6

  const scale = useRef(new Animated.Value(1)).current
  const translateX = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(0)).current
  const lastScale = useRef(1)
  const lastTranslate = useRef({ x: 0, y: 0 })

  const panRef = useRef(null)
  const pinchRef = useRef(null)

  useEffect(() => {
    if (!isGuest) loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoadingProfile(true)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('Failed to get user:', userError)
        Alert.alert('Error', 'Could not load your profile.')
        setLoadingProfile(false)
        return
      }

      setUserId(user.id)
      setUserEmail(user.email || '')

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, avatar_original_url')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Failed to load profile:', profileError)
      } else if (profile) {
        setDisplayName(profile.display_name || '')
        setAvatarUrl(profile.avatar_url || null)
        setAvatarOriginalUrl(profile.avatar_original_url || null)
        setAvatarCacheBust(Date.now())
      }
    } catch (err) {
      console.error('Unexpected error loading profile:', err)
      Alert.alert('Error', 'Something went wrong while loading your profile.')
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!userId) return

    try {
      setSavingProfile(true)

      const updates = {
        id: userId,
        display_name: displayName?.trim() || null,
        avatar_url: avatarUrl || null,
        avatar_original_url: avatarOriginalUrl || null,
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) {
        console.error('Failed to save profile:', error)
        Alert.alert('Error', 'Could not save your changes.')
        return
      }
    } catch (err) {
      console.error('Unexpected error saving profile:', err)
      Alert.alert('Error', 'Something went wrong while saving your profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Error signing out:', err)
      Alert.alert('Error', 'Could not sign you out. Please try again.')
    }
  }

  const resetCropTransforms = () => {
    lastScale.current = 1
    lastTranslate.current = { x: 0, y: 0 }
    scale.setValue(1)
    translateX.setValue(0)
    translateX.setOffset(0)
    translateY.setValue(0)
    translateY.setOffset(0)
  }

  const openCropEditor = (uri) => {
    if (!uri) return
    resetCropTransforms()
    setCropImageUri(uri)
    setCropEditorVisible(true)

    Image.getSize(
      uri,
      (width, height) => {
        setCropImageSize({ width, height })
      },
      (error) => {
        console.error('Failed to get image size for crop editor:', error)
        setCropImageSize(null)
      }
    )
  }

  const closeCropEditor = () => {
    setCropEditorVisible(false)
    setCropImageUri(null)
  }

  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale } }],
    { useNativeDriver: true }
  )

  const onPinchStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const newScale = lastScale.current * event.nativeEvent.scale
      lastScale.current = Math.max(1, Math.min(newScale, 4))
      scale.setValue(lastScale.current)
    }
  }

  const onPanEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: true }
  )

  const onPanStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX, translationY } = event.nativeEvent
      lastTranslate.current = {
        x: lastTranslate.current.x + translationX,
        y: lastTranslate.current.y + translationY,
      }
      translateX.setOffset(lastTranslate.current.x)
      translateX.setValue(0)
      translateY.setOffset(lastTranslate.current.y)
      translateY.setValue(0)
    }
  }

  const downloadAvatarToLocal = async (url) => {
    try {
      const cacheDir = FileSystemLegacy.cacheDirectory + 'avatars/'
      const dirInfo = await FileSystemLegacy.getInfoAsync(cacheDir)
      if (!dirInfo.exists) {
        await FileSystemLegacy.makeDirectoryAsync(cacheDir, { intermediates: true })
      }
      const localUri = cacheDir + 'current_avatar.jpg'
      const { uri } = await FileSystemLegacy.downloadAsync(url, localUri)
      return uri
    } catch (error) {
      console.error('Failed to download avatar for editing:', error)
      Alert.alert('Error', 'Could not load your current photo for editing.')
      return null
    }
  }

  const uploadOriginalFromUri = async (uri) => {
    if (!userId || !uri) return null

    try {
      const base64 = await FileSystemLegacy.readAsStringAsync(uri, {
        encoding: FileSystemLegacy.EncodingType.Base64,
      })

      const filePath = `${userId}/avatar_original.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64), {
          upsert: true,
          contentType: 'image/jpeg',
        })

      if (uploadError) {
        console.error('Avatar original upload error:', uploadError)
        Alert.alert('Error', 'Could not upload your original photo.')
        return null
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      setAvatarOriginalUrl(publicUrl)
      return publicUrl
    } catch (error) {
      console.error('Unexpected error uploading original avatar:', error)
      Alert.alert('Error', 'Something went wrong while uploading your original photo.')
      return null
    }
  }

  const handleAvatarPress = async () => {
    if (!userId) return

    try {
      setUploadingAvatar(true)

      if (avatarOriginalUrl) {
        const localUri = await downloadAvatarToLocal(avatarOriginalUrl)
        if (localUri) {
          openCropEditor(localUri)
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'We need access to your photos to set an avatar.')
          setUploadingAvatar(false)
          return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.9,
        })

        if (result.canceled) {
          setUploadingAvatar(false)
          return
        }

        const asset = result.assets?.[0]
        if (!asset?.uri) {
          setUploadingAvatar(false)
          Alert.alert('Error', 'Could not read the selected image.')
          return
        }

        // Start editing immediately from local file
        openCropEditor(asset.uri)
        // Upload full original in the background so it can be re-cropped later
        uploadOriginalFromUri(asset.uri)
      }
    } catch (err) {
      console.error('Unexpected error preparing avatar for editing:', err)
      Alert.alert('Error', 'Something went wrong while preparing your profile photo.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSearchFriends = async () => {
    if (!friendQuery.trim()) {
      setFriendResults([])
      return
    }

    try {
      setSearchingFriends(true)

      const query = friendQuery.trim()
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url')
        .or(
          `email.ilike.%${query}%,display_name.ilike.%${query}%`
        )

      if (error) {
        console.error('Friend search error:', error)
        Alert.alert('Error', 'Could not search for friends.')
        setSearchingFriends(false)
        return
      }

      const filtered = (data || []).filter((p) => p.id !== userId)
      setFriendResults(filtered)
    } catch (err) {
      console.error('Unexpected error searching friends:', err)
      Alert.alert('Error', 'Something went wrong while searching.')
    } finally {
      setSearchingFriends(false)
    }
  }

  const handleUploadNewPhotoInEditor = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to set an avatar.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
      })

      if (result.canceled) {
        return
      }

      const asset = result.assets?.[0]
      if (!asset?.uri) {
        Alert.alert('Error', 'Could not read the selected image.')
        return
      }

      resetCropTransforms()
      setCropImageUri(asset.uri)

      Image.getSize(
        asset.uri,
        (width, height) => {
          setCropImageSize({ width, height })
        },
        (error) => {
          console.error('Failed to get image size for crop editor:', error)
          setCropImageSize(null)
        }
      )
      uploadOriginalFromUri(asset.uri)
    } catch (error) {
      console.error('Error picking new photo in editor:', error)
      Alert.alert('Error', 'Something went wrong while selecting a new photo.')
    }
  }

  const handleCropAndSave = async () => {
    if (!userId || !cropImageUri) return

    try {
      setUploadingAvatar(true)

      let width = 0
      let height = 0

      if (cropImageSize?.width && cropImageSize?.height) {
        width = cropImageSize.width
        height = cropImageSize.height
      } else {
        await new Promise((resolve, reject) => {
          Image.getSize(
            cropImageUri,
            (w, h) => {
              width = w
              height = h
              resolve()
            },
            (error) => {
              console.error('Failed to get image size during crop:', error)
              reject(error)
            }
          )
        })
      }

      const displaySize = window.width
      const imageScale = lastScale.current
      const scaleRatio = width / displaySize
      const cropSizeInImage = (cropCircleSize / imageScale) * scaleRatio
      const panXInImage = (-lastTranslate.current.x / imageScale) * scaleRatio
      const panYInImage = (-lastTranslate.current.y / imageScale) * scaleRatio
      const centerX = width / 2 + panXInImage
      const centerY = height / 2 + panYInImage
      const originX = Math.max(0, centerX - cropSizeInImage / 2)
      const originY = Math.max(0, centerY - cropSizeInImage / 2)
      const cropSize = Math.max(1, Math.min(cropSizeInImage, width - originX, height - originY))

      const result = await ImageManipulator.manipulateAsync(
        cropImageUri,
        [
          { crop: { originX, originY, width: Math.round(cropSize), height: Math.round(cropSize) } },
          { resize: { width: 400, height: 400 } },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      )

      if (!result.base64) {
        Alert.alert('Error', 'Could not process your photo.')
        return
      }

      const filePath = `${userId}/avatar.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(result.base64), {
          upsert: true,
          contentType: 'image/jpeg',
        })

      if (uploadError) {
        console.error('Avatar upload error:', uploadError)
        Alert.alert('Error', 'Could not upload your avatar.')
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      setAvatarCacheBust(Date.now())

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        display_name: displayName?.trim() || null,
        avatar_url: publicUrl,
        avatar_original_url: avatarOriginalUrl || null,
      })

      if (profileError) {
        console.error('Failed to save avatar URL:', profileError)
      }

      closeCropEditor()
    } catch (error) {
      console.error('Unexpected error saving cropped avatar:', error)
      Alert.alert('Error', 'Something went wrong while saving your photo.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const renderFriendItem = ({ item }) => {
    return (
      <View style={styles.friendRow}>
        <View style={styles.friendAvatarWrapper}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.friendAvatar} />
          ) : (
            <View style={styles.friendAvatarPlaceholder}>
              <Text style={styles.friendAvatarInitial}>
                {(item.display_name || item.email || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>
            {item.display_name || item.email?.split('@')[0] || 'Friend'}
          </Text>
          <Text style={styles.friendEmail}>{item.email}</Text>
        </View>
        <TouchableOpacity
          style={styles.addFriendButton}
          onPress={() => Alert.alert('Coming soon', 'Friend requests are coming soon!')}
        >
          <Text style={styles.addFriendButtonText}>Add Friend</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (isGuest) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Profile" />
        <View style={styles.guestContent}>
          <Text style={styles.guestHeading}>Guest Mode</Text>
          <Text style={styles.guestMessage}>
            Create an account to save your closet, upload photos, join groups, and share items with friends.
          </Text>
          <Button
            onPress={() => onExitGuest?.('signup')}
            style={styles.guestCta}
          >
            Create Account
          </Button>
          <TouchableOpacity
            onPress={() => onExitGuest?.('login')}
            style={styles.guestLoginLink}
          >
            <Text style={styles.guestLoginText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (loadingProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  const renderSettingsRow = ({
    icon,
    label,
    onPress,
    destructive = false,
    showChevron = true,
    isLast = false,
  }) => (
    <>
      <TouchableOpacity
        style={styles.settingsRow}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.settingsRowLeft}>
          <View style={styles.settingsRowIconCol}>
            {icon ? (
              <Feather
                name={icon}
                size={18}
                color={destructive ? '#C94C4C' : colors.text}
              />
            ) : null}
          </View>
          <Text style={[styles.settingsRowLabel, destructive && styles.settingsRowDestructive]}>
            {label}
          </Text>
        </View>
        {showChevron && !destructive ? (
          <Feather name="chevron-right" size={18} color={colors.muted} />
        ) : null}
      </TouchableOpacity>
      {!isLast ? <View style={styles.settingsRowDivider} /> : null}
    </>
  )

  const renderModalHeader = (title, onClose, closeLabel = 'Cancel') => (
    <View style={[styles.modalHeader, { paddingTop: insets.top + spacing.sm }]}>
      <TouchableOpacity onPress={onClose} style={styles.modalClose}>
        <Text style={styles.modalCloseText}>{closeLabel}</Text>
      </TouchableOpacity>
      <Text style={styles.modalTitle}>{title}</Text>
      <View style={styles.modalHeaderSpacer} />
    </View>
  )

  const renderSettingsHeader = () => (
    <View style={[styles.settingsModalHeader, { paddingTop: insets.top + spacing.sm }]}>
      <TouchableOpacity
        onPress={() => setSettingsOpen(false)}
        style={styles.settingsBackBtn}
        activeOpacity={0.7}
      >
        <Feather name="chevron-left" size={20} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.settingsModalTitle}>Settings</Text>
      <View style={styles.modalHeaderSpacer} />
    </View>
  )

  return (
    <>
      {/* ── Main Profile overview ───────────────────────────────────────── */}
      <View style={styles.container}>
        <ScreenHeader
          title="Profile"
          action={
            <TouchableOpacity
              onPress={() => setSettingsOpen(true)}
              style={styles.settingsGearBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="settings" size={20} color={colors.text} />
            </TouchableOpacity>
          }
        />

        <KeyboardAwareScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar + name + email */}
          <View style={styles.profileHero}>
            <TouchableOpacity
              onPress={handleAvatarPress}
              activeOpacity={0.8}
              disabled={uploadingAvatar}
              style={styles.avatarTouchable}
            >
              <View style={styles.avatarContainer}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: `${avatarUrl}?t=${avatarCacheBust}` }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {(displayName || userEmail || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                {uploadingAvatar && (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
              </View>
              <Text style={styles.changePhotoText}>Tap to change photo</Text>
            </TouchableOpacity>
            {userEmail ? (
              <Text style={styles.profileEmail}>{userEmail}</Text>
            ) : null}

            <View style={styles.profileEditBlock}>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Add a display name..."
                placeholderTextColor={colors.muted}
                style={styles.profileEditInput}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <Button
                variant="primary"
                onPress={handleSaveProfile}
                loading={savingProfile}
                style={styles.profileSaveButton}
              >
                Save Changes
              </Button>
            </View>
          </View>

          {/* Closet stats */}
          <View style={styles.statsSection}>
            <Text style={styles.statsSectionTitle}>Closet Stats</Text>
            <View style={styles.statsRow}>
              {[
                { label: 'Borrowed', value: closetStats.borrowed },
                { label: 'Lent', value: closetStats.lent },
                { label: 'Groups', value: closetStats.groups },
              ].map((stat) => (
                <View key={stat.label} style={styles.statTile}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>

      {/* ── Find Friends modal ──────────────────────────────────────────── */}
      <Modal
        visible={findFriendsOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setFindFriendsOpen(false)}
      >
        <View style={styles.modalScreen}>
          {renderModalHeader('Find Friends', () => setFindFriendsOpen(false))}

          <KeyboardAwareScrollView
            contentContainerStyle={styles.modalContentContainer}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true}
            extraScrollHeight={20}
          >
            <View style={styles.sectionCard}>
              <Text style={styles.helperText}>
                Search by email or display name.
              </Text>
              <View style={styles.searchRow}>
                <TextInput
                  value={friendQuery}
                  onChangeText={setFriendQuery}
                  onSubmitEditing={handleSearchFriends}
                  placeholder="Search friends..."
                  placeholderTextColor={colors.muted}
                  style={[styles.input, styles.searchInput]}
                  autoCapitalize="none"
                />
                <Button
                  variant="secondary"
                  onPress={handleSearchFriends}
                  loading={searchingFriends}
                  disabled={!friendQuery.trim()}
                  style={styles.searchButton}
                >
                  Search
                </Button>
              </View>

              {friendResults.length === 0 && friendQuery.trim().length > 0 && !searchingFriends ? (
                <Text style={styles.emptyResultsText}>No results found.</Text>
              ) : null}

              {friendResults.map((item) => (
                <View key={item.id} style={styles.friendRowWrapper}>
                  {renderFriendItem({ item })}
                </View>
              ))}
            </View>
          </KeyboardAwareScrollView>
        </View>
      </Modal>

      {/* ── Settings modal ──────────────────────────────────────────────── */}
      <Modal
        visible={settingsOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSettingsOpen(false)}
      >
        <View style={[styles.modalScreen, styles.settingsContainer]}>
          {renderSettingsHeader()}

          <KeyboardAwareScrollView contentContainerStyle={styles.settingsContentContainer}>
            <Text style={[styles.settingsSectionHeader, styles.settingsSectionHeaderFirst]}>
              Social
            </Text>
            <View style={styles.settingsCard}>
              {renderSettingsRow({
                icon: 'search',
                label: 'Find Friends',
                onPress: () => {
                  setSettingsOpen(false)
                  setFindFriendsOpen(true)
                },
                isLast: true,
              })}
            </View>

            <Text style={styles.settingsSectionHeader}>App</Text>
            <View style={styles.settingsCard}>
              {renderSettingsRow({
                icon: 'bell',
                label: 'Notifications',
                onPress: () =>
                  Alert.alert('Coming soon', 'Notification preferences are on the way.'),
                isLast: false,
              })}
              {renderSettingsRow({
                icon: 'info',
                label: 'About Clueless Closet',
                onPress: () =>
                  Alert.alert('Clueless Closet', 'A chic shared closet app.'),
                isLast: true,
              })}
            </View>

            <Text style={styles.settingsSectionHeader}>Account</Text>
            <View style={styles.settingsCard}>
              {renderSettingsRow({
                icon: 'log-out',
                label: 'Sign Out',
                onPress: () => {
                  setSettingsOpen(false)
                  handleSignOut()
                },
                destructive: true,
                showChevron: false,
                isLast: true,
              })}
            </View>
          </KeyboardAwareScrollView>
        </View>
      </Modal>

      {/* ── Crop editor (full-screen, unchanged) ───────────────────────── */}
      <Modal
        visible={cropEditorVisible && !!cropImageUri}
        animationType="slide"
        transparent={false}
        onRequestClose={closeCropEditor}
      >
        <SafeAreaView style={styles.cropModalContainer}>
          <View style={[styles.cropHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={closeCropEditor} style={styles.cropCloseButton}>
              <Text style={styles.cropCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cropCenter}>
            {cropImageUri && (
              <View style={styles.cropImageOuter}>
                <PinchGestureHandler
                  ref={pinchRef}
                  simultaneousHandlers={panRef}
                  onGestureEvent={onPinchEvent}
                  onHandlerStateChange={onPinchStateChange}
                >
                  <Animated.View style={styles.cropGestureWrapper}>
                    <PanGestureHandler
                      ref={panRef}
                      simultaneousHandlers={pinchRef}
                      onGestureEvent={onPanEvent}
                      onHandlerStateChange={onPanStateChange}
                    >
                      <Animated.Image
                        source={{ uri: cropImageUri }}
                        style={[
                          styles.cropImage,
                          {
                            transform: [
                              { scale },
                              { translateX },
                              { translateY },
                            ],
                          },
                        ]}
                        resizeMode="cover"
                      />
                    </PanGestureHandler>
                    <View
                      pointerEvents="none"
                      style={[
                        styles.cropCircleOverlay,
                        {
                          width: cropCircleSize,
                          height: cropCircleSize,
                          borderRadius: cropCircleSize / 2,
                        },
                      ]}
                    />
                  </Animated.View>
                </PinchGestureHandler>
              </View>
            )}
          </View>

          <View style={styles.cropFooter}>
            <TouchableOpacity
              style={[styles.cropButton, styles.cropSecondaryButton]}
              onPress={handleUploadNewPhotoInEditor}
              activeOpacity={0.8}
            >
              <Text style={styles.cropSecondaryButtonText}>Upload New Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cropButton, styles.cropPrimaryButton]}
              onPress={handleCropAndSave}
              activeOpacity={0.8}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.cropPrimaryButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsGearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.xl,
  },
  modalScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalClose: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    minWidth: 52,
  },
  modalCloseText: {
    fontSize: 14,
    color: colors.muted,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalHeaderSpacer: {
    minWidth: 52,
  },
  modalContentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  statsSection: {
    paddingTop: spacing.sm,
  },
  statsSectionTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.3,
  },
  statLabel: {
    marginTop: 4,
    fontSize: typography.caption.fontSize,
    color: colors.muted,
  },
  profileEditBlock: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  profileEditInput: {
    fontSize: 15,
    color: colors.text,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  profileSaveButton: {
    alignSelf: 'stretch',
  },
  settingsContainer: {
    backgroundColor: colors.background,
  },
  settingsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm + 2,
    backgroundColor: colors.background,
  },
  settingsBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  settingsModalTitle: {
    fontSize: typography.screenTitle.fontSize,
    fontWeight: typography.screenTitle.fontWeight,
    letterSpacing: typography.screenTitle.letterSpacing,
    color: colors.text,
  },
  settingsContentContainer: {
    paddingBottom: spacing.xl,
  },
  settingsSectionHeader: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.md + 4,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  settingsSectionHeaderFirst: {
    marginTop: spacing.sm,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: spacing.sm,
  },
  settingsRowIconCol: {
    width: SETTINGS_ICON_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  settingsRowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md + SETTINGS_ICON_WIDTH + spacing.sm + 2,
  },
  settingsRowLabel: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    flexShrink: 1,
  },
  settingsRowDestructive: {
    color: '#C94C4C',
  },
  profileHero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
  avatarTouchable: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: colors.pop,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.pop,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.surface,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEmail: {
    marginTop: spacing.sm,
    fontSize: typography.caption.fontSize,
    color: colors.muted,
    textAlign: 'center',
  },
  changePhotoText: {
    marginTop: spacing.sm,
    fontSize: typography.caption.fontSize,
    color: colors.muted,
    letterSpacing: 0.2,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm + 4,
    marginBottom: spacing.sm + 4,
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 11,
    paddingVertical: 8,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  helperText: {
    fontSize: typography.caption.fontSize,
    color: colors.muted,
    marginBottom: spacing.sm,
    lineHeight: 17,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginRight: spacing.sm,
  },
  searchButton: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 7,
  },
  emptyResultsText: {
    fontSize: 13,
    color: colors.muted,
  },
  friendRowWrapper: {
    marginTop: spacing.sm,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  friendAvatarWrapper: {
    marginRight: 12,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  friendAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.muted,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  friendEmail: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  addFriendButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.text,
  },
  addFriendButtonText: {
    fontSize: typography.buttonLabelSm.fontSize,
    fontWeight: typography.buttonLabelSm.fontWeight,
    letterSpacing: typography.buttonLabelSm.letterSpacing,
    lineHeight: typography.buttonLabelSm.lineHeight,
    color: colors.surface,
  },
  signOutContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  signOutButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    color: '#ef4444',
  },
  cropModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cropHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cropCloseButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  cropCloseButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  cropCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropImageOuter: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropGestureWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropImage: {
    width: '100%',
    aspectRatio: 1,
  },
  cropCircleOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  cropFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#000',
  },
  cropButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropSecondaryButton: {
    marginRight: 8,
    backgroundColor: '#fff',
  },
  cropSecondaryButtonText: {
    fontSize: typography.buttonLabel.fontSize,
    fontWeight: typography.buttonLabel.fontWeight,
    letterSpacing: typography.buttonLabel.letterSpacing,
    lineHeight: typography.buttonLabel.lineHeight,
    color: '#111827',
  },
  cropPrimaryButton: {
    marginLeft: 8,
    backgroundColor: '#111827',
  },
  cropPrimaryButtonText: {
    fontSize: typography.buttonLabel.fontSize,
    fontWeight: typography.buttonLabel.fontWeight,
    letterSpacing: typography.buttonLabel.letterSpacing,
    lineHeight: typography.buttonLabel.lineHeight,
    color: '#fff',
  },
  guestContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  guestHeading: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  guestMessage: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  guestCta: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  guestLoginLink: {
    paddingVertical: 8,
  },
  guestLoginText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
})

