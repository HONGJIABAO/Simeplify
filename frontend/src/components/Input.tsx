import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Eye, EyeOff, AlertCircle } from 'lucide-react-native';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helper?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function Input({
  label,
  helper,
  error,
  leftIcon,
  rightIcon,
  isPassword = false,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  secureTextEntry,
  accessibilityLabel,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isActuallySecure = isPassword ? !showPassword : secureTextEntry;

  const handleFocus: TextInputProps['onFocus'] = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur: TextInputProps['onBlur'] = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const hasError = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputWrapper,
          hasError
            ? styles.wrapperError
            : isFocused
            ? styles.wrapperFocused
            : styles.wrapperDefault,
        ]}
      >
        {leftIcon ? <View style={styles.leftIconContainer}>{leftIcon}</View> : null}

        <TextInput
          accessibilityLabel={accessibilityLabel || label}
          placeholderTextColor="#a8a29e" // stone-400
          secureTextEntry={isActuallySecure}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            isPassword || rightIcon ? styles.inputWithRightIcon : null,
            inputStyle,
          ]}
          {...rest}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            style={styles.rightIconButton}
          >
            {showPassword ? (
              <EyeOff size={20} color="#57534e" strokeWidth={1.5} />
            ) : (
              <Eye size={20} color="#57534e" strokeWidth={1.5} />
            )}
          </Pressable>
        ) : rightIcon ? (
          <View style={styles.rightIconContainer}>{rightIcon}</View>
        ) : null}
      </View>

      {hasError ? (
        <View style={styles.errorRow}>
          <AlertCircle size={14} color="#a8442f" strokeWidth={1.5} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 4,
  },
  label: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#57534e', // stone-600
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff', // paper
    borderRadius: 9999, // rounded-full
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  wrapperDefault: {
    borderColor: '#e7e5e4', // stone-200
  },
  wrapperFocused: {
    borderColor: '#a8a29e', // stone-400
    // Simulate ring-2 stone-200
    shadowColor: '#e7e5e4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  wrapperError: {
    borderColor: '#a8442f', // terracotta error
    backgroundColor: '#fffcfb',
  },
  input: {
    flex: 1,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#292524', // stone-800
    paddingVertical: 12,
    minHeight: 48,
  },
  inputWithLeftIcon: {
    marginLeft: 8,
  },
  inputWithRightIcon: {
    marginRight: 8,
  },
  leftIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#a8442f', // terracotta
  },
  helperText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#a8a29e', // stone-400
    marginTop: 6,
    marginLeft: 4,
  },
});
