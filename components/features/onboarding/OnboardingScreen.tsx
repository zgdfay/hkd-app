import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Image,
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  type ViewToken,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

const DATA = [
  {
    id: '1',
    title: 'Laporkan Masalah',
    description:
      'Laporkan masalah di sekitar Anda dengan mudah dan cepat melalui genggaman tangan.',
    image: require('../../../assets/splash-logo/splash-1.png'),
    cardBg: '#E8F5E9',
  },
  {
    id: '2',
    title: 'Pantau Status',
    description:
      'Pantau perkembangan laporan Anda secara real-time hingga selesai dikerjakan oleh petugas.',
    image: require('../../../assets/splash-logo/splash-2.png'),
    cardBg: '#F1F8E9',
  },
  {
    id: '3',
    title: 'Selesai & Beri Nilai',
    description:
      'Bantu kami meningkatkan layanan dengan memberikan penilaian setelah laporan Anda selesai.',
    image: require('../../../assets/splash-logo/splash-3.png'),
    cardBg: '#E0F2F1',
  },
];

const OnboardingItem = ({
  item,
  index,
  scrollX,
}: {
  item: (typeof DATA)[0];
  index: number;
  scrollX: SharedValue<number>;
}) => {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const animatedImageStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollX.value, inputRange, [0.7, 1, 0.7]);
    const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollX.value, inputRange, [30, 0, 30]);
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0]);
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  return (
    <View style={styles.slideContainer}>
      {/* Image Card */}
      <Animated.View
        style={[styles.imageCard, { backgroundColor: item.cardBg }, animatedImageStyle]}>
        <Image source={item.image} style={styles.image} resizeMode="contain" />
      </Animated.View>

      {/* Text */}
      <Animated.View style={[styles.textContainer, animatedTextStyle]}>
        <Animated.Text style={styles.title}>{item.title}</Animated.Text>
        <Animated.Text style={styles.description}>{item.description}</Animated.Text>
      </Animated.View>
    </View>
  );
};

const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const scrollX = useSharedValue(0);
  const isLastSlide = currentIndex === DATA.length - 1;

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/');
  };

  const handleNext = () => {
    if (currentIndex < DATA.length - 1) {
      try {
        flatListRef.current?.scrollToIndex({
          index: currentIndex + 1,
          animated: true,
        });
      } catch (error) {
        // Fallback jika scrollToIndex gagal
        const nextOffset = (currentIndex + 1) * width;
        flatListRef.current?.scrollToOffset({ offset: nextOffset, animated: true });
      }
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Carousel */}
      <View style={styles.carouselContainer}>
        <Animated.FlatList
          ref={flatListRef as any}
          data={DATA}
          renderItem={({ item, index }) => (
            <OnboardingItem item={item} index={index} scrollX={scrollX} />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          keyExtractor={(item) => item.id}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />
      </View>

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {DATA.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <View
              key={index}
              style={[styles.dot, isActive ? styles.activeDot : styles.inactiveDot]}
            />
          );
        })}
      </View>

      {/* Bottom Buttons */}
      <View style={styles.footer}>
        {isLastSlide ? (
          <TouchableOpacity onPress={handleNext} style={styles.startButton} activeOpacity={0.85}>
            <Animated.Text style={styles.startButtonText}>MULAI</Animated.Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton} activeOpacity={0.7}>
              <Animated.Text style={styles.skipText}>LEWATI</Animated.Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNext} style={styles.nextButton} activeOpacity={0.85}>
              <Animated.Text style={styles.nextButtonText}>LANJUT</Animated.Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  carouselContainer: {
    flex: 1,
  },
  slideContainer: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  imageCard: {
    width: CARD_WIDTH,
    height: height * 0.38,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: CARD_WIDTH * 0.7,
    height: height * 0.3,
  },
  textContainer: {
    marginTop: 32, // Menambah jarak sedikit agar tidak terlalu rapat
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  dot: {
    height: 7,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 22,
    backgroundColor: '#16A34A',
  },
  inactiveDot: {
    width: 7,
    backgroundColor: '#D1D5DB',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#9CA3AF',
    letterSpacing: 0.8,
  },
  nextButton: {
    backgroundColor: '#16A34A',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 32,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  startButton: {
    backgroundColor: '#16A34A',
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});

export default OnboardingScreen;
