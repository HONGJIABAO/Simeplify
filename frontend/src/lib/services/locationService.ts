/**
 * Location Service: Cross-platform real GPS & Reverse Geocoding.
 * Supports Web (navigator.geolocation) and Mobile (expo-location).
 * Uses OpenStreetMap Nominatim with BigDataCloud fallback.
 * Strictly adheres to Nominatim usage policy:
 * - Includes identifying User-Agent & Referer
 * - Throttled to max 1 request per second
 * - Zero API keys or secrets exposed
 */

import { Platform } from 'react-native';
import * as Location from 'expo-location';

export interface DetectedLocation {
  latitude: number;
  longitude: number;
  countryCode: string;
  isMalaysia: boolean;
  state: string | null;
  rawState: string | null;
  city: string;
  street: string;
}

export type LocationErrorReason =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'NOT_MALAYSIA'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class LocationServiceError extends Error {
  reason: LocationErrorReason;
  detectedLocation?: DetectedLocation;

  constructor(reason: LocationErrorReason, message: string, detectedLocation?: DetectedLocation) {
    super(message);
    this.name = 'LocationServiceError';
    this.reason = reason;
    this.detectedLocation = detectedLocation;
  }
}

/**
 * Normalizes raw reverse geocoded state names to the official 14 Malaysian states
 * matching the sign-up dropdown list.
 */
export function normalizeMalaysianState(rawState?: string | null): string | null {
  if (!rawState) return null;
  const clean = rawState.trim().toLowerCase();

  if (clean.includes('kuala lumpur') || clean === 'kl' || clean.includes('wilayah persekutuan kuala lumpur')) {
    return 'Kuala Lumpur';
  }
  if (clean.includes('putrajaya')) {
    return 'Kuala Lumpur'; // Grouped with federal territory
  }
  if (clean.includes('selangor')) return 'Selangor';
  if (clean.includes('penang') || clean.includes('pinang')) return 'Penang';
  if (clean.includes('johor')) return 'Johor';
  if (clean.includes('perak')) return 'Perak';
  if (clean.includes('melaka') || clean.includes('malacca')) return 'Melaka';
  if (clean.includes('negeri sembilan') || clean.includes('sembilan')) return 'Negeri Sembilan';
  if (clean.includes('pahang')) return 'Pahang';
  if (clean.includes('kedah')) return 'Kedah';
  if (clean.includes('kelantan')) return 'Kelantan';
  if (clean.includes('terengganu')) return 'Terengganu';
  if (clean.includes('perlis')) return 'Perlis';
  if (clean.includes('sabah') || clean.includes('labuan')) return 'Sabah';
  if (clean.includes('sarawak')) return 'Sarawak';

  return null;
}

// Nominatim requires max 1 request/sec rate limit
let lastNominatimTimestamp = 0;

async function throttleNominatim(): Promise<void> {
  const now = Date.now();
  const diff = now - lastNominatimTimestamp;
  if (diff < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - diff));
  }
  lastNominatimTimestamp = Date.now();
}

/**
 * Reverse geocode coordinates via OpenStreetMap Nominatim.
 * Falls back to BigDataCloud free client reverse geocoder on error.
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<DetectedLocation> {
  // 1. Try OpenStreetMap Nominatim
  try {
    await throttleNominatim();

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    const response = await fetch(nominatimUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en',
        'User-Agent': 'Simeplify-EcoTwin/1.0 (Hackathon Sustainability Platform; contact@simeplify.app)',
        'Referer': 'https://simeplify.app',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const countryCode = (addr.country_code || '').toLowerCase();
      const isMalaysia = countryCode === 'my' || (addr.country || '').toLowerCase().includes('malaysia');

      const rawState = addr.state || addr.province || addr.region || null;
      const normalizedState = normalizeMalaysianState(rawState);

      // Best effort city: city -> town -> municipality -> suburb -> city_district -> county
      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.suburb ||
        addr.city_district ||
        addr.county ||
        '';

      // Best effort street
      const streetParts: string[] = [];
      if (addr.house_number) streetParts.push(addr.house_number);
      if (addr.road) streetParts.push(addr.road);
      if (addr.neighbourhood || addr.suburb) {
        const sub = addr.neighbourhood || addr.suburb;
        if (!streetParts.includes(sub)) streetParts.push(sub);
      }
      const street = streetParts.join(', ');

      return {
        latitude,
        longitude,
        countryCode: countryCode || (isMalaysia ? 'my' : 'unknown'),
        isMalaysia,
        state: normalizedState,
        rawState,
        city,
        street,
      };
    }
  } catch (nominatimErr) {
    console.warn('Nominatim reverse geocoding failed, trying fallback:', nominatimErr);
  }

  // 2. Fallback: BigDataCloud Free Client Reverse Geocoding API (no key required)
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const response = await fetch(bdcUrl);
    if (response.ok) {
      const data = await response.json();
      const countryCode = (data.countryCode || '').toLowerCase();
      const isMalaysia = countryCode === 'my' || (data.countryName || '').toLowerCase().includes('malaysia');

      const rawState = data.principalSubdivision || null;
      const normalizedState = normalizeMalaysianState(rawState);
      const city = data.city || data.locality || '';
      const street = data.localityInfo?.administrative?.[3]?.name || '';

      return {
        latitude,
        longitude,
        countryCode: countryCode || (isMalaysia ? 'my' : 'unknown'),
        isMalaysia,
        state: normalizedState,
        rawState,
        city,
        street,
      };
    }
  } catch (fallbackErr) {
    console.warn('BigDataCloud fallback failed:', fallbackErr);
  }

  throw new LocationServiceError(
    'NETWORK_ERROR',
    'Failed to convert coordinates into an address. Please enter your address manually.'
  );
}

/**
 * Cross-platform location detector:
 * 1. Requests permission & gets real device coordinates.
 * 2. Reverse geocodes into Malaysian state, city, and street address.
 */
export async function detectRealLocation(): Promise<DetectedLocation> {
  let latitude: number;
  let longitude: number;

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      throw new LocationServiceError(
        'POSITION_UNAVAILABLE',
        'Geolocation is not supported by your browser. Please type your address manually.'
      );
    }

    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          if (error.code === 1) {
            reject(
              new LocationServiceError(
                'PERMISSION_DENIED',
                'Location permission was denied. Please select your state and city manually.'
              )
            );
          } else if (error.code === 2) {
            reject(
              new LocationServiceError(
                'POSITION_UNAVAILABLE',
                'Location position is unavailable. Please check your device location settings.'
              )
            );
          } else if (error.code === 3) {
            reject(
              new LocationServiceError(
                'TIMEOUT',
                'Location request timed out. Please enter your address manually.'
              )
            );
          } else {
            reject(
              new LocationServiceError('UNKNOWN', error.message || 'Failed to detect location.')
            );
          }
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
      );
    });

    latitude = pos.coords.latitude;
    longitude = pos.coords.longitude;
  } else {
    // Native (Expo Go / iOS / Android)
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new LocationServiceError(
        'PERMISSION_DENIED',
        'Location permission was denied. Please allow location access or type your address manually.'
      );
    }

    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    } catch {
      throw new LocationServiceError(
        'POSITION_UNAVAILABLE',
        'Unable to retrieve GPS coordinates from your device. Please type your address manually.'
      );
    }
  }

  const detected = await reverseGeocodeCoordinates(latitude, longitude);

  if (!detected.isMalaysia) {
    throw new LocationServiceError(
      'NOT_MALAYSIA',
      'Your detected location is outside Malaysia. Please select your Malaysian state manually.',
      detected
    );
  }

  return detected;
}
