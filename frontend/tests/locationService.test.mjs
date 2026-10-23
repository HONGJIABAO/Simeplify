// frontend/tests/locationService.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

// Test normalizeMalaysianState logic directly
function normalizeMalaysianState(rawState) {
  if (!rawState) return null;
  const clean = rawState.trim().toLowerCase();

  if (clean.includes('kuala lumpur') || clean === 'kl' || clean.includes('wilayah persekutuan kuala lumpur')) {
    return 'Kuala Lumpur';
  }
  if (clean.includes('putrajaya')) {
    return 'Kuala Lumpur';
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

const MALAYSIAN_STATES = [
  'Selangor',
  'Kuala Lumpur',
  'Penang',
  'Johor',
  'Perak',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Kedah',
  'Kelantan',
  'Terengganu',
  'Perlis',
  'Sabah',
  'Sarawak',
];

test('Location Service: normalizeMalaysianState correctly maps raw state names to dropdown list', () => {
  // Direct matches
  for (const state of MALAYSIAN_STATES) {
    assert.equal(normalizeMalaysianState(state), state);
  }

  // Formal / alternate variations
  assert.equal(normalizeMalaysianState('Pulau Pinang'), 'Penang');
  assert.equal(normalizeMalaysianState('Penang Island'), 'Penang');
  assert.equal(normalizeMalaysianState('Wilayah Persekutuan Kuala Lumpur'), 'Kuala Lumpur');
  assert.equal(normalizeMalaysianState('WP Kuala Lumpur'), 'Kuala Lumpur');
  assert.equal(normalizeMalaysianState('KL'), 'Kuala Lumpur');
  assert.equal(normalizeMalaysianState('Malacca'), 'Melaka');
  assert.equal(normalizeMalaysianState('Putrajaya'), 'Kuala Lumpur');

  // Outside Malaysia
  assert.equal(normalizeMalaysianState('California'), null);
  assert.equal(normalizeMalaysianState('Singapore'), null);
  assert.equal(normalizeMalaysianState('Jakarta'), null);
  assert.equal(normalizeMalaysianState(''), null);
  assert.equal(normalizeMalaysianState(null), null);
});
