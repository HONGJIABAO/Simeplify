import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Text, StyleSheet, Dimensions, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove();
  }, []);

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (reduceMotion) {
      opacity.value = withTiming(0, { duration: 200 }, () => {
        setToast(null);
      });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(
        -100,
        { duration: 300, easing: Easing.inOut(Easing.ease) },
        () => {
          setToast(null);
        }
      );
    }
  }, [opacity, translateY, reduceMotion]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message, type });

      if (reduceMotion) {
        translateY.value = insets.top + 16;
        opacity.value = withTiming(1, { duration: 200 });
      } else {
        translateY.value = -100;
        opacity.value = withTiming(1, { duration: 300 });
        translateY.value = withTiming(insets.top + 16, {
          duration: 350,
          easing: Easing.inOut(Easing.ease),
        });
      }

      timerRef.current = setTimeout(() => {
        hideToast();
      }, 3000);
    },
    [insets.top, opacity, translateY, hideToast, reduceMotion]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} color="#566549" strokeWidth={1.75} />;
      case 'error':
        return <AlertCircle size={18} color="#a8442f" strokeWidth={1.75} />;
      case 'warning':
        return <AlertTriangle size={18} color="#92600e" strokeWidth={1.75} />;
      case 'info':
      default:
        return <Info size={18} color="#57534e" strokeWidth={1.75} />;
    }
  };

  const getContainerStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return styles.successContainer;
      case 'error':
        return styles.errorContainer;
      case 'warning':
        return styles.warningContainer;
      case 'info':
      default:
        return styles.infoContainer;
    }
  };

  const getTextStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return styles.successText;
      case 'error':
        return styles.errorText;
      case 'warning':
        return styles.warningText;
      case 'info':
      default:
        return styles.infoText;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast ? (
        <Animated.View
          style={[
            styles.toastWrapper,
            getContainerStyle(toast.type),
            animatedStyle,
          ]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {getIcon(toast.type)}
          <Text style={[styles.message, getTextStyle(toast.type)]}>
            {toast.message}
          </Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    maxWidth: Math.min(SCREEN_WIDTH - 48, 400),
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999, // rounded-full
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    zIndex: 99999,
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
  },
  message: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    flexShrink: 1,
  },
  successContainer: {
    backgroundColor: '#e0e6d9', // sage-100
    borderColor: '#c5d0b9',
  },
  successText: {
    color: '#566549', // sage-600
  },
  errorContainer: {
    backgroundColor: '#fbece8',
    borderColor: '#f2c8be',
  },
  errorText: {
    color: '#a8442f', // terracotta
  },
  warningContainer: {
    backgroundColor: '#fffbeb', // amber-50
    borderColor: '#fde68a',
  },
  warningText: {
    color: '#92600e',
  },
  infoContainer: {
    backgroundColor: '#f5f5f4', // stone-100
    borderColor: '#e7e5e4',
  },
  infoText: {
    color: '#57534e', // stone-600
  },
});
