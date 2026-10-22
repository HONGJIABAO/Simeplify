/**
 * BIN-01, BIN-02, COM-02, COM-03
 * Real Supabase Bin Service for Waste Scanning and Disposal.
 * Handles:
 * 1. Storage uploads to 'waste-photos' bucket under {household_id}/...
 * 2. Invocation of 'scan-waste' Supabase Edge Function
 * 3. Querying household's waste scans, daily recycling deeds, and eco points
 */

import { supabase } from '../supabase';
import { type BinType, type ClassifyWasteResult, mockScanResults } from '../mockData';
import { LEAF_DAILY_DEED_CAP } from '../flags';

export interface WasteScanResult {
  scanId: string;
  itemName: string;
  material: string;
  binType: 'paper' | 'plastic' | 'glass_metal' | 'general';
  isRecyclable: boolean;
  confidence: number;
  tips: string;
  pointsAwarded: number;
  deedId: string | null;
  dailyLimitReached: boolean;
  imagePath: string;
  imageUrl?: string;
}

export interface WasteScanItem {
  id: string;
  householdId: string;
  imagePath: string;
  itemName: string;
  binType: 'paper' | 'plastic' | 'glass_metal' | 'general';
  isRecyclable: boolean;
  confidence: number | null;
  confirmedAt: string | null;
  createdAt: string;
  dateStr: string;
  points: number;
}

export interface BinState {
  points: number;
  itemsDiverted: number;
  deedsToday: number;
  dailyLimitReached: boolean;
  milestoneTarget: number;
  milestoneName: string;
  recentScans: WasteScanItem[];
}

export interface ConfirmDisposalResult {
  pointsAwarded: number;
  totalPoints: number;
  deedsToday: number;
  dailyLimitReached: boolean;
  alreadyConfirmed?: boolean;
  isRecyclable?: boolean;
  message?: string;
}

/**
 * Returns current date formatted as YYYY-MM-DD in Asia/Kuala_Lumpur time.
 */
export function getMalaysiaDateString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Uploads a waste photo to the 'waste-photos' bucket and invokes the 'scan-waste' Edge Function.
 *
 * @param householdId Caller's household ID
 * @param fileOrUri Blob, File, ArrayBuffer, string URI, or React Native image source
 * @param options Custom filename, MIME type, or base64 data
 */
export async function uploadAndScanWaste(
  householdId: string,
  fileOrUri: any,
  options?: {
    fileName?: string;
    mimeType?: string;
    base64Data?: string;
  }
): Promise<WasteScanResult> {
  const fileName = options?.fileName || `scan_${Date.now()}.jpg`;
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${householdId}/${Date.now()}_${sanitized}`;
  const contentType = options?.mimeType || 'image/jpeg';

  let uploadBody: any = null;
  let base64ToSend = options?.base64Data;

  // Prepare upload body
  if (typeof Blob !== 'undefined' && fileOrUri instanceof Blob) {
    uploadBody = fileOrUri;
  } else if (fileOrUri instanceof Uint8Array || (typeof (globalThis as any).Buffer !== 'undefined' && (globalThis as any).Buffer.isBuffer?.(fileOrUri))) {
    uploadBody = fileOrUri;
  } else if (typeof fileOrUri === 'string') {
    if (fileOrUri.startsWith('data:')) {
      const parts = fileOrUri.split(',');
      if (!base64ToSend && parts[1]) {
        base64ToSend = parts[1];
      }
      try {
        const res = await fetch(fileOrUri);
        uploadBody = await res.blob();
      } catch {
        uploadBody = new Blob(['waste-image-placeholder'], { type: contentType });
      }
    } else {
      try {
        const res = await fetch(fileOrUri);
        uploadBody = await res.blob();
      } catch {
        uploadBody = new Blob(['waste-image-placeholder'], { type: contentType });
      }
    }
  } else if (fileOrUri?.uri) {
    if (typeof fileOrUri.uri === 'string' && fileOrUri.uri.startsWith('data:')) {
      const parts = fileOrUri.uri.split(',');
      if (!base64ToSend && parts[1]) {
        base64ToSend = parts[1];
      }
    }
    try {
      const res = await fetch(fileOrUri.uri);
      uploadBody = await res.blob();
    } catch {
      uploadBody = new Blob(['waste-image-placeholder'], { type: contentType });
    }
  } else {
    uploadBody = new Blob(['waste-image-placeholder'], { type: contentType });
  }

  // 1. Upload to Supabase Storage: waste-photos/{householdId}/{filename}
  const { error: uploadError } = await supabase.storage
    .from('waste-photos')
    .upload(storagePath, uploadBody, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    console.warn('Storage upload error in waste-photos:', uploadError);
    throw uploadError;
  }

  // 2. Invoke scan-waste Edge Function
  const { data: funcData, error: funcError } = await supabase.functions.invoke('scan-waste', {
    body: {
      image_path: storagePath,
      ...(base64ToSend ? { image_base64: base64ToSend } : {}),
    },
  });

  if (funcError) {
    console.warn('scan-waste Edge Function returned error:', funcError);
    throw funcError;
  }

  if (funcData?.error) {
    throw new Error(funcData.error);
  }

  const binType = funcData.bin_type || funcData.binType || 'general';
  const isRecyclable = Boolean(funcData.is_recyclable ?? funcData.recyclable ?? (binType !== 'general'));
  const pointsAwarded = typeof funcData.points_awarded === 'number'
    ? funcData.points_awarded
    : (funcData.pointsAwarded ?? 0);
  const dailyLimitReached = Boolean(funcData.daily_limit_reached ?? funcData.dailyLimitReached);

  return {
    scanId: funcData.scan_id || funcData.scan?.id || `scan_${Date.now()}`,
    itemName: funcData.item_name || funcData.itemName || 'Identified Waste',
    material: funcData.material || 'Material',
    binType,
    isRecyclable,
    confidence: typeof funcData.confidence === 'number' ? funcData.confidence : 0.95,
    tips: funcData.tips || funcData.tip || 'Sort into designated bin cleanly.',
    pointsAwarded,
    deedId: funcData.deed_id || null,
    dailyLimitReached,
    imagePath: storagePath,
  };
}

/**
 * Fetches recent waste scans, today's deeds count, and total recycling points for a household.
 */
export async function fetchBinState(householdId: string): Promise<BinState> {
  const mytDate = getMalaysiaDateString();

  // 1. Fetch recent scans (last 10)
  const { data: rawScans, error: scansError } = await supabase
    .from('waste_scans')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (scansError) {
    console.warn('Failed to fetch waste scans:', scansError);
  }

  // 2. Count today's recycling deeds (Malaysia time)
  const { count: deedsToday, error: deedsError } = await supabase
    .from('deeds')
    .select('*', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .eq('deed_date', mytDate);

  if (deedsError) {
    console.warn('Failed to count today deeds:', deedsError);
  }

  // 3. Sum points awarded for recycling
  const { data: pointsRows, error: pointsError } = await supabase
    .from('points')
    .select('amount')
    .eq('household_id', householdId)
    .eq('source', 'recycling');

  if (pointsError) {
    console.warn('Failed to sum recycling points:', pointsError);
  }

  const totalPoints = pointsRows ? pointsRows.reduce((acc, row) => acc + (row.amount || 0), 0) : 0;

  // 4. Count total recyclable items diverted
  const { count: totalDiverted, error: countError } = await supabase
    .from('waste_scans')
    .select('*', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .eq('is_recyclable', true);

  if (countError) {
    console.warn('Failed to count diverted items:', countError);
  }

  const itemsDiverted = totalDiverted || 0;
  const todayCount = deedsToday || 0;
  const milestoneTarget = Math.max(200, Math.ceil((totalPoints + 1) / 200) * 200);
  const saplingNum = Math.floor(totalPoints / 200) + 1;

  const recentScans: WasteScanItem[] = (rawScans || []).map((s) => {
    const d = new Date(s.created_at);
    const dateStr = d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: 'Asia/Kuala_Lumpur',
    });

    return {
      id: s.id,
      householdId: s.household_id,
      imagePath: s.image_path,
      itemName: s.item_name,
      binType: s.bin_type as 'paper' | 'plastic' | 'glass_metal' | 'general',
      isRecyclable: s.is_recyclable,
      confidence: s.confidence !== null ? Number(s.confidence) : null,
      confirmedAt: s.confirmed_at,
      createdAt: s.created_at,
      dateStr,
      points: s.is_recyclable ? 10 : 0,
    };
  });

  return {
    points: totalPoints,
    itemsDiverted,
    deedsToday: todayCount,
    dailyLimitReached: todayCount >= LEAF_DAILY_DEED_CAP,
    milestoneTarget,
    milestoneName: `Community Sapling #${saplingNum}`,
    recentScans,
  };
}

/**
 * Confirm disposal action from client.
 */
export async function confirmDisposal(
  scanId: string,
  _binType?: BinType,
  _householdId?: string
): Promise<ConfirmDisposalResult> {
  const { data: funcData, error: funcError } = await supabase.functions.invoke('confirm-disposal', {
    body: {
      scan_id: scanId,
    },
  });

  if (funcError) {
    console.warn('confirm-disposal Edge Function error:', funcError);
    throw funcError;
  }

  if (funcData?.error) {
    throw new Error(funcData.error);
  }

  const pointsAwarded = typeof funcData.points_awarded === 'number'
    ? funcData.points_awarded
    : (funcData.pointsAwarded ?? 0);
  const dailyLimitReached = Boolean(funcData.daily_limit_reached ?? funcData.dailyLimitReached);
  const alreadyConfirmed = Boolean(funcData.already_confirmed);
  const isRecyclable = Boolean(funcData.is_recyclable);

  return {
    pointsAwarded,
    totalPoints: pointsAwarded,
    deedsToday: dailyLimitReached ? 3 : (pointsAwarded > 0 ? 1 : 0),
    dailyLimitReached,
    alreadyConfirmed,
    isRecyclable,
    message: funcData.message,
  };
}

/**
 * Backward compatibility mock wrapper
 */
export async function classifyWaste(
  _photoUri: string,
  resultType: BinType = 'paper'
): Promise<ClassifyWasteResult> {
  return { ...mockScanResults[resultType] };
}
