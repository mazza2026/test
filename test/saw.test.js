const test = require('node:test');
const assert = require('node:assert');
const SAW = require('../src/saw.js');

const criteria = [
  { name: 'Harga', weight: 5, type: SAW.COST },
  { name: 'Kualitas', weight: 5, type: SAW.BENEFIT }
];

const alternatives = [
  { name: 'A', values: [100, 80] },
  { name: 'B', values: [200, 100] }
];

test('normalizeWeights menghasilkan total bobot 1', () => {
  const weights = SAW.normalizeWeights([{ weight: 5 }, { weight: 3 }, { weight: 2 }]);
  assert.deepStrictEqual(weights, [0.5, 0.3, 0.2]);
});

test('kriteria benefit dinormalkan dengan nilai / maksimum', () => {
  const matrix = SAW.buildNormalizedMatrix(criteria, alternatives);
  assert.strictEqual(matrix[0][1], 0.8);
  assert.strictEqual(matrix[1][1], 1);
});

test('kriteria cost dinormalkan dengan minimum / nilai', () => {
  const matrix = SAW.buildNormalizedMatrix(criteria, alternatives);
  assert.strictEqual(matrix[0][0], 1);
  assert.strictEqual(matrix[1][0], 0.5);
});

test('nilai 0 pada kriteria cost dianggap paling ideal', () => {
  const matrix = SAW.buildNormalizedMatrix(
    [{ name: 'Biaya', weight: 1, type: SAW.COST }],
    [{ name: 'A', values: [0] }, { name: 'B', values: [10] }]
  );
  assert.strictEqual(matrix[0][0], 1);
  assert.strictEqual(matrix[1][0], 0);
});

test('kolom benefit yang seluruhnya bernilai 0 tidak menghasilkan NaN', () => {
  const matrix = SAW.buildNormalizedMatrix(
    [{ name: 'Nilai', weight: 1, type: SAW.BENEFIT }],
    [{ name: 'A', values: [0] }, { name: 'B', values: [0] }]
  );
  assert.strictEqual(matrix[0][0], 0);
  assert.strictEqual(matrix[1][0], 0);
});

test('calculate mengurutkan alternatif dari skor tertinggi', () => {
  const result = SAW.calculate(criteria, alternatives);
  assert.strictEqual(result.ranking[0].name, 'A');
  assert.strictEqual(result.ranking[0].rank, 1);
  assert.ok(Math.abs(result.ranking[0].score - 0.9) < 1e-9);
  assert.strictEqual(result.ranking[1].name, 'B');
  assert.ok(Math.abs(result.ranking[1].score - 0.75) < 1e-9);
});

test('skor sama diurutkan sesuai urutan masukan', () => {
  const result = SAW.calculate(
    [{ name: 'Nilai', weight: 1, type: SAW.BENEFIT }],
    [{ name: 'A', values: [10] }, { name: 'B', values: [10] }]
  );
  assert.deepStrictEqual(
    result.ranking.map((item) => item.name),
    ['A', 'B']
  );
});

test('validate mendeteksi data kosong', () => {
  assert.deepStrictEqual(SAW.validate([], []), [
    'Minimal satu kriteria harus diisi.',
    'Minimal satu alternatif harus diisi.'
  ]);
});

test('validate mendeteksi bobot, tipe, dan nilai tidak valid', () => {
  const errors = SAW.validate(
    [
      { name: '', weight: -1, type: 'lainnya' },
      { name: 'Kualitas', weight: 2, type: SAW.BENEFIT }
    ],
    [{ name: 'A', values: [10, -5] }]
  );
  assert.ok(errors.some((message) => message.includes('nama kriteria belum diisi')));
  assert.ok(errors.some((message) => message.includes('bobot harus berupa angka')));
  assert.ok(errors.some((message) => message.includes('tipe harus')));
  assert.ok(errors.some((message) => message.includes('nilai harus berupa angka')));
});

test('validate mendeteksi jumlah nilai yang tidak sesuai jumlah kriteria', () => {
  const errors = SAW.validate(criteria, [{ name: 'A', values: [10] }]);
  assert.deepStrictEqual(errors, [
    'Alternatif ke-1: jumlah nilai harus sama dengan jumlah kriteria.'
  ]);
});

test('validate menolak total bobot nol', () => {
  const errors = SAW.validate(
    [{ name: 'Harga', weight: 0, type: SAW.COST }],
    [{ name: 'A', values: [10] }]
  );
  assert.ok(errors.includes('Total bobot kriteria harus lebih besar dari 0.'));
});

test('calculate melempar error bila data tidak valid', () => {
  assert.throws(() => SAW.calculate([], []), /Minimal satu kriteria harus diisi/);
});
