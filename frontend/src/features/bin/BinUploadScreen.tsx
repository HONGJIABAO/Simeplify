/**
 * BIN-01
 * Upload waste photo screen (Gallery upload).
 * Source: docs/page_refined.md S5.1, S5.2, docs/design.md Unit 12.3
 *
 * Dedicated screen allowing user to select or upload a waste photo from device gallery.
 * Provides file selection simulation, sample waste photos, and instant AI analysis.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Upload,
  ImagePlus,
  Sparkles,
  Check,
  FileCheck,
  Recycle,
} from 'lucide-react-native';

import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { type BinType, getBinInfo } from '@/lib/mockData';

const cartonImage = require('../../../assets/images/plain_carton_box.png');
const bottleImage = require('../../../assets/images/pet_water_bottle.png');
const jarImage = require('../../../assets/images/glass_olive_jar.png');
const foodScrapImage = require('../../../assets/images/food_scrap.png');

interface SampleItem {
  id: string;
  name: string;
  fileName: string;
  fileSize: string;
  binType: BinType;
  image: any;
}

const SAMPLE_ITEMS: SampleItem[] = [
  {
    id: 'sample-carton',
    name: 'Plant-based Beverage Carton',
    fileName: 'beverage_carton.jpg',
    fileSize: '1.8 MB',
    binType: 'paper',
    image: cartonImage,
  },
  {
    id: 'sample-bottle',
    name: 'PET Water Bottle',
    fileName: 'pet_water_bottle.png',
    fileSize: '2.1 MB',
    binType: 'plastic',
    image: bottleImage,
  },
  {
    id: 'sample-jar',
    name: 'Glass Olive Jar',
    fileName: 'glass_olive_jar.jpg',
    fileSize: '3.4 MB',
    binType: 'glass_metal',
    image: jarImage,
  },
  {
    id: 'sample-food',
    name: 'Food Peel & Food Scrap',
    fileName: 'fruit_peel_scraps.jpg',
    fileSize: '1.2 MB',
    binType: 'general',
    image: foodScrapImage,
  },
];

export default function BinUploadScreen() {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<SampleItem>(SAMPLE_ITEMS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSelectSample = (item: SampleItem) => {
    setSelectedItem(item);
  };

  const handleBrowseFiles = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg,image/jpg,image/webp,image/heic';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const cleanName = file.name
              .replace(/\.[^/.]+$/, '')
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, (c: string) => c.toUpperCase());

            const lower = file.name.toLowerCase();
            let detectedBin: BinType = 'paper';
            if (lower.includes('bottle') || lower.includes('plastic') || lower.includes('pet')) {
              detectedBin = 'plastic';
            } else if (lower.includes('glass') || lower.includes('jar') || lower.includes('can') || lower.includes('metal')) {
              detectedBin = 'glass_metal';
            } else if (lower.includes('food') || lower.includes('peel') || lower.includes('scrap') || lower.includes('waste')) {
              detectedBin = 'general';
            }

            setSelectedItem({
              id: 'custom-' + Date.now(),
              name: cleanName || 'Uploaded Waste Item',
              fileName: file.name,
              fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              binType: detectedBin,
              image: { uri: dataUrl },
            });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate Gemini classification delay then navigate to result
    setTimeout(() => {
      setIsAnalyzing(false);
      const isCustomUri = selectedItem.image?.uri;
      router.push({
        pathname: '/bin/result' as any,
        params: {
          binType: selectedItem.binType,
          imageUri: isCustomUri ? selectedItem.image.uri : undefined,
          itemName: selectedItem.name,
        },
      });
    }, 1200);
  };

  const binInfo = getBinInfo(selectedItem.binType);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header
        variant="back-and-title"
        title="Upload waste photo"
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro banner */}
        <View style={styles.introBlock}>
          <Text style={styles.introTitle}>Select photo from device</Text>
          <Text style={styles.introSubtitle}>
            Upload a clear image of your waste packaging or leftovers. Gemini AI will identify the material and show you the correct sorting stream.
          </Text>
        </View>

        {/* Upload Dropzone / Picker Card */}
        <Pressable
          onPress={handleBrowseFiles}
          accessibilityLabel="Choose from photo library and browse files"
          style={({ pressed }) => [
            styles.dropzone,
            pressed && styles.dropzonePressed,
          ]}
        >
          <View style={styles.dropzoneIconCircle}>
            <ImagePlus size={32} color="#566549" strokeWidth={1.5} />
          </View>
          <Text style={styles.dropzoneTitle}>Choose from photo library</Text>
          <Text style={styles.dropzoneHint}>
            Supports JPG, PNG or HEIC (up to 10 MB)
          </Text>
          <View style={styles.browsePill}>
            <Upload size={16} color="#292524" strokeWidth={1.5} />
            <Text style={styles.browsePillText}>Browse files</Text>
          </View>
        </Pressable>

        {/* Selected Photo Card */}
        <Card style={styles.selectedCard}>
          <View style={styles.selectedHeader}>
            <View style={styles.selectedBadgeRow}>
              <FileCheck size={16} color="#566549" strokeWidth={1.75} />
              <Text style={styles.selectedBadgeText}>Selected photo</Text>
            </View>
            <Badge tone="sage">Ready to scan</Badge>
          </View>

          <View style={styles.previewRow}>
            {selectedItem.image ? (
              <Image
                source={selectedItem.image}
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.previewPlaceholder, { backgroundColor: binInfo.color + '22' }]}>
                <Recycle size={28} color={binInfo.color} strokeWidth={1.5} />
              </View>
            )}
            <View style={styles.fileDetails}>
              <Text style={styles.fileName} numberOfLines={1}>
                {selectedItem.fileName}
              </Text>
              <Text style={styles.itemTitle}>{selectedItem.name}</Text>
              <Text style={styles.fileMeta}>{selectedItem.fileSize}</Text>
            </View>
          </View>
        </Card>

        {/* Sample waste selection list */}
        <View style={styles.sampleSection}>
          <Text style={styles.sampleSectionTitle}>Or select a sample waste photo</Text>
          <View style={styles.sampleGrid}>
            {SAMPLE_ITEMS.map((item) => {
              const isSelected = selectedItem.id === item.id;
              const info = getBinInfo(item.binType);

              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelectSample(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item.name}`}
                  style={[
                    styles.sampleCard,
                    isSelected && styles.sampleCardSelected,
                  ]}
                >
                  <View style={styles.sampleCardContent}>
                    <View style={[styles.sampleIcon, { backgroundColor: info.color + '22' }]}>
                      {item.image ? (
                        <Image
                          source={item.image}
                          style={styles.sampleThumbImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Recycle size={20} color={info.color} strokeWidth={1.5} />
                      )}
                    </View>
                    <View style={styles.sampleInfo}>
                      <Text style={styles.sampleName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.sampleMeta}>
                        {info.name} • {item.fileSize}
                      </Text>
                    </View>
                  </View>
                  {isSelected ? (
                    <View style={styles.selectedCheck}>
                      <Check size={16} color="#fafaf9" strokeWidth={2} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Primary Action Button */}
        <View style={styles.actionsContainer}>
          <Button
            variant="primary"
            onPress={handleAnalyze}
            loading={isAnalyzing}
            leftIcon={<Sparkles size={18} color="#fafaf9" strokeWidth={1.5} />}
            style={styles.analyzeButton}
          >
            Analyze with Gemini AI
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f1', // cream
  },
  scrollContent: {
    paddingHorizontal: 24, // px-6
    paddingBottom: 40,
    gap: 24,
  },

  // Intro block
  introBlock: {
    paddingTop: 8,
  },
  introTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 22,
    color: '#292524',
    marginBottom: 6,
  },
  introSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#57534e',
    lineHeight: 22,
  },

  // Dropzone
  dropzone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d6d3d1', // stone-300
    borderRadius: 24,
    backgroundColor: '#fafaf9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 8,
  },
  dropzoneIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e6d9', // sage-100
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dropzoneTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 17,
    color: '#292524',
    textAlign: 'center',
  },
  dropzoneHint: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#78716c',
    textAlign: 'center',
    marginBottom: 8,
  },
  dropzonePressed: {
    backgroundColor: '#f5f5f4',
    borderColor: '#a8a29e',
  },
  browsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#faf6f1',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 9999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 6,
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  browsePillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },

  // Selected Card
  selectedCard: {
    padding: 16,
    gap: 12,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#566549',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  previewPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileDetails: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  itemTitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
  },
  fileMeta: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#a8a29e',
  },

  // Samples section
  sampleSection: {
    gap: 12,
  },
  sampleSectionTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 16,
    color: '#292524',
  },
  sampleGrid: {
    gap: 10,
  },
  sampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 16,
    padding: 12,
  },
  sampleCardSelected: {
    borderColor: '#566549',
    backgroundColor: '#f5f7f3',
  },
  sampleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sampleIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sampleThumbImage: {
    width: 44,
    height: 44,
  },
  sampleInfo: {
    flex: 1,
  },
  sampleName: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  sampleMeta: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716c',
  },
  selectedCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#566549',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Actions
  actionsContainer: {
    marginTop: 8,
  },
  analyzeButton: {
    width: '100%',
  },
});
