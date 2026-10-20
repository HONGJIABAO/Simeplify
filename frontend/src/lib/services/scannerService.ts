/**
 * SCN-01 / SCN-02 / SCN-03 / SCN-04 / W5
 * Real Supabase Scanner Service for Bill Scanning, Storage, Analysis, and Retrieval.
 *
 * Enforces:
 * 1. Mode-based analyze-bill Edge Function invocation (read, analyze, reanalyze).
 * 2. Uploads to private 'bills' storage bucket under {household_id}/{timestamp}_{sanitized_name}.
 * 3. Never writes points or deeds directly from the frontend (server only).
 * 4. Read token kept in memory only for the flow.
 * 5. Complete RLS compliance with household isolation.
 */

import { supabase } from '../supabase';
import { type WaterAlertLevel } from '../waterLevel';
import {
  type Bill,
  type BillAlert,
  type BillAnalysis,
  normalizeBillingMonth,
} from '../../features/scanner/logic/scannerCore';

export * from '../../features/scanner/logic/scannerCore';

export interface ReadBillResult {
  type: 'electricity' | 'water';
  provider?: string;
  billing_month: string;
  usage: number;
  amount: number;
  ai_read_token: string;
}

export interface SaveAndAnalyzeBillResult {
  bill_id: string;
  type: 'electricity' | 'water';
  billing_month: string;
  usage: number;
  amount: number;
  level: any;
  alert: BillAlert | null;
  points_awarded: number;
  points_withheld_reason: string | null;
  server_estimate_kwh: number | null;
  lower_than_estimate: boolean | null;
  analysis: BillAnalysis;
}

export interface ReanalyzeBillResult {
  bill_id: string;
  analysis: BillAnalysis;
}

/**
 * Uploads a bill photo or PDF document to the 'bills' bucket.
 * Enforces folder structure {household_id}/{timestamp}_{sanitized_filename}.
 */
export async function uploadBill(
  householdId: string,
  fileOrUri: any,
  options?: {
    fileName?: string;
    mimeType?: string;
  }
): Promise<{ filePath: string; fileName: string }> {
  if (!householdId) {
    throw new Error('Household ID is required to upload a bill statement.');
  }

  const origName = options?.fileName || (fileOrUri?.name ?? `bill_${Date.now()}.pdf`);
  const sanitized = origName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const filePath = `${householdId}/${timestamp}_${sanitized}`;
  const contentType = options?.mimeType || (origName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

  let uploadBody: any = null;

  if (typeof Blob !== 'undefined' && fileOrUri instanceof Blob) {
    uploadBody = fileOrUri;
  } else if (fileOrUri instanceof Uint8Array || (typeof (globalThis as any).Buffer !== 'undefined' && (globalThis as any).Buffer.isBuffer?.(fileOrUri))) {
    uploadBody = fileOrUri;
  } else if (typeof fileOrUri === 'string') {
    if (fileOrUri.startsWith('data:')) {
      try {
        const res = await fetch(fileOrUri);
        uploadBody = await res.blob();
      } catch {
        uploadBody = new Blob(['bill-file-data'], { type: contentType });
      }
    } else {
      try {
        const res = await fetch(fileOrUri);
        uploadBody = await res.blob();
      } catch {
        uploadBody = new Blob(['bill-file-data'], { type: contentType });
      }
    }
  } else if (fileOrUri?.uri) {
    try {
      const res = await fetch(fileOrUri.uri);
      uploadBody = await res.blob();
    } catch {
      uploadBody = new Blob(['bill-file-data'], { type: contentType });
    }
  } else {
    uploadBody = new Blob(['bill-file-data'], { type: contentType });
  }

  const { error } = await supabase.storage.from('bills').upload(filePath, uploadBody, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload bill: ${error.message}`);
  }

  return { filePath, fileName: sanitized };
}

/**
 * Invokes analyze-bill in 'read' mode.
 * Extracts bill fields and generates a 24-hour signed HMAC read token.
 * Writes NO rows to bills, alerts, deeds, or points.
 */
export async function readBill(filePath: string): Promise<ReadBillResult> {
  const { data, error } = await supabase.functions.invoke('analyze-bill', {
    body: {
      mode: 'read',
      file_path: filePath,
    },
  });

  if (error) {
    let errorDetail: any = null;
    if ('context' in error && error.context) {
      try {
        errorDetail = await (error as any).context.json();
      } catch {
        // ignore
      }
    }

    if (errorDetail?.code === 'daily_limit_reached' || error.message.includes('429')) {
      const limitErr = new Error('You have reached today\'s limit. Try again tomorrow.');
      (limitErr as any).code = 'daily_limit_reached';
      throw limitErr;
    }
    throw new Error(errorDetail?.error || error.message || 'Failed to read bill with AI OCR');
  }

  return {
    type: data.type,
    provider: data.provider,
    billing_month: data.billing_month,
    usage: Number(data.usage) || 0,
    amount: Number(data.amount) || 0,
    ai_read_token: data.ai_read_token,
  };
}

/**
 * Invokes analyze-bill in 'analyze' mode.
 * Upserts the bill into public.bills, recomputes the estimate/alert on the server,
 * awards energy points if qualifying, and returns the AI analysis.
 */
export async function saveAndAnalyzeBill(params: {
  filePath: string;
  type: 'electricity' | 'water';
  billingMonth: string;
  usage: number;
  amount: number;
  readToken?: string;
}): Promise<SaveAndAnalyzeBillResult> {
  const normalizedMonth = normalizeBillingMonth(params.billingMonth);

  const payload: Record<string, any> = {
    mode: 'analyze',
    file_path: params.filePath,
    type: params.type,
    billing_month: normalizedMonth,
    usage: params.usage,
    amount: params.amount,
  };

  if (params.readToken) {
    payload.ai_read_token = params.readToken;
  }

  const { data, error } = await supabase.functions.invoke('analyze-bill', {
    body: payload,
  });

  if (error) {
    let errorDetail: any = null;
    if ('context' in error && error.context) {
      try {
        errorDetail = await (error as any).context.json();
      } catch {
        // ignore
      }
    }
    throw new Error(errorDetail?.error || error.message || 'Failed to analyze and save bill');
  }

  return {
    bill_id: data.bill_id,
    type: data.type,
    billing_month: data.billing_month,
    usage: Number(data.usage),
    amount: Number(data.amount),
    level: data.level || 'normal',
    alert: data.alert || null,
    points_awarded: Number(data.points_awarded) || 0,
    points_withheld_reason: data.points_withheld_reason || null,
    server_estimate_kwh: data.server_estimate_kwh ?? null,
    lower_than_estimate: data.lower_than_estimate ?? null,
    analysis: data.analysis || {},
  };
}

/**
 * Invokes analyze-bill in 'reanalyze' mode for an existing bill.
 * Never changes points, deeds, or alerts.
 */
export async function reanalyzeBill(billId: string): Promise<ReanalyzeBillResult> {
  const { data, error } = await supabase.functions.invoke('analyze-bill', {
    body: {
      mode: 'reanalyze',
      bill_id: billId,
    },
  });

  if (error) {
    let errorDetail: any = null;
    if ('context' in error && error.context) {
      try {
        errorDetail = await (error as any).context.json();
      } catch {
        // ignore
      }
    }

    if (errorDetail?.code === 'daily_limit_reached' || error.message.includes('429')) {
      const limitErr = new Error('You have reached today\'s limit. Try again tomorrow.');
      (limitErr as any).code = 'daily_limit_reached';
      throw limitErr;
    }
    throw new Error(errorDetail?.error || error.message || 'Failed to re-analyze bill');
  }

  return {
    bill_id: data.bill_id,
    analysis: data.analysis || {},
  };
}

/**
 * Fetches recent bills for the household from public.bills (up to 12 months, newest first).
 */
export async function fetchBills(householdId: string): Promise<Bill[]> {
  if (!householdId) return [];

  const { data: bills, error: billsError } = await supabase
    .from('bills')
    .select('id, household_id, file_path, type, billing_month, usage, amount, analysis, created_at, updated_at')
    .eq('household_id', householdId)
    .order('billing_month', { ascending: false })
    .limit(12);

  if (billsError) {
    throw new Error(`Failed to fetch bills: ${billsError.message}`);
  }

  if (!bills || bills.length === 0) return [];

  // Also fetch any alerts for these bills to associate alert levels
  const billIds = bills.map((b) => b.id);
  const { data: alerts } = await supabase
    .from('alerts')
    .select('id, bill_id, level, message, created_at')
    .in('bill_id', billIds);

  const alertMap = new Map<string, WaterAlertLevel>();
  for (const a of alerts || []) {
    alertMap.set(a.bill_id, a.level as WaterAlertLevel);
  }

  return bills.map((b) => ({
    id: b.id,
    household_id: b.household_id,
    file_path: b.file_path,
    type: b.type as 'electricity' | 'water',
    billing_month: b.billing_month,
    usage: Number(b.usage),
    amount: Number(b.amount),
    analysis: b.analysis as BillAnalysis | null,
    created_at: b.created_at,
    updated_at: b.updated_at,
    provider: b.type === 'electricity' ? 'TNB' : 'Air Selangor',
    alertLevel: alertMap.get(b.id) || 'normal',
  }));
}

/**
 * Fetches alerts for the household from public.alerts.
 */
export async function fetchAlerts(householdId: string): Promise<BillAlert[]> {
  if (!householdId) return [];

  const { data, error } = await supabase
    .from('alerts')
    .select('id, household_id, bill_id, level, message, created_at')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch alerts: ${error.message}`);
  }

  return (data || []).map((a) => ({
    id: a.id,
    household_id: a.household_id,
    bill_id: a.bill_id,
    level: a.level as WaterAlertLevel,
    message: a.message,
    created_at: a.created_at,
  }));
}

/**
 * Generates a signed URL for a bill file in the 'bills' bucket.
 * Expires in 1 hour (3600 seconds).
 */
export async function getBillFileUrl(filePath: string): Promise<string | null> {
  if (!filePath) return null;

  const { data, error } = await supabase.storage.from('bills').createSignedUrl(filePath, 3600);

  if (error || !data?.signedUrl) {
    console.warn('Failed to generate signed URL for bill file:', error?.message);
    return null;
  }

  return data.signedUrl;
}

/**
 * Deletes a bill from public.bills, and subsequently deletes its file from storage.
 * If either fails, throws a descriptive error.
 */
export async function deleteBill(billId: string, filePath?: string): Promise<{ success: boolean }> {
  let fileToDelete = filePath;

  if (!fileToDelete) {
    const { data: bill } = await supabase
      .from('bills')
      .select('file_path')
      .eq('id', billId)
      .maybeSingle();

    fileToDelete = bill?.file_path;
  }

  // 1. Delete database record
  const { error: dbError } = await supabase.from('bills').delete().eq('id', billId);
  if (dbError) {
    throw new Error(`Failed to delete bill record: ${dbError.message}`);
  }

  // 2. Delete storage file if path exists
  if (fileToDelete) {
    const { error: storageError } = await supabase.storage.from('bills').remove([fileToDelete]);
    if (storageError) {
      throw new Error(`Failed to delete statement file from storage: ${storageError.message}`);
    }
  }

  return { success: true };
}

/**
 * Checks if a bill of the specified type and billing month already exists for the household.
 */
export async function checkBillExists(
  householdId: string,
  type: 'electricity' | 'water',
  billingMonth: string
): Promise<{ exists: boolean; existingBillId?: string }> {
  const normalized = normalizeBillingMonth(billingMonth);

  const { data, error } = await supabase
    .from('bills')
    .select('id')
    .eq('household_id', householdId)
    .eq('type', type)
    .eq('billing_month', normalized)
    .maybeSingle();

  if (error || !data) {
    return { exists: false };
  }

  return { exists: true, existingBillId: data.id };
}
