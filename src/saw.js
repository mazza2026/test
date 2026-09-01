/**
 * Modul perhitungan SPK dengan metode SAW (Simple Additive Weighting).
 * Ditulis sebagai skrip klasik agar bisa dipakai langsung di browser
 * (tanpa server) maupun di Node.js (untuk pengujian).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.SAW = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var BENEFIT = 'benefit';
  var COST = 'cost';

  /**
   * Memeriksa kelengkapan dan kewajaran data masukan.
   * @param {Array<{name: string, weight: number, type: string}>} criteria
   * @param {Array<{name: string, values: number[]}>} alternatives
   * @returns {string[]} daftar pesan kesalahan (kosong bila valid)
   */
  function validate(criteria, alternatives) {
    var errors = [];

    if (!Array.isArray(criteria) || criteria.length === 0) {
      errors.push('Minimal satu kriteria harus diisi.');
    }
    if (!Array.isArray(alternatives) || alternatives.length === 0) {
      errors.push('Minimal satu alternatif harus diisi.');
    }
    if (errors.length > 0) {
      return errors;
    }

    var totalWeight = 0;
    criteria.forEach(function (criterion, index) {
      var label = 'Kriteria ke-' + (index + 1);
      if (!criterion.name || String(criterion.name).trim() === '') {
        errors.push(label + ': nama kriteria belum diisi.');
      }
      if (!isFiniteNumber(criterion.weight) || criterion.weight < 0) {
        errors.push(label + ': bobot harus berupa angka >= 0.');
      } else {
        totalWeight += criterion.weight;
      }
      if (criterion.type !== BENEFIT && criterion.type !== COST) {
        errors.push(label + ': tipe harus "benefit" atau "cost".');
      }
    });

    if (totalWeight <= 0) {
      errors.push('Total bobot kriteria harus lebih besar dari 0.');
    }

    alternatives.forEach(function (alternative, index) {
      var label = 'Alternatif ke-' + (index + 1);
      if (!alternative.name || String(alternative.name).trim() === '') {
        errors.push(label + ': nama alternatif belum diisi.');
      }
      if (!Array.isArray(alternative.values) || alternative.values.length !== criteria.length) {
        errors.push(label + ': jumlah nilai harus sama dengan jumlah kriteria.');
        return;
      }
      alternative.values.forEach(function (value, position) {
        if (!isFiniteNumber(value) || value < 0) {
          errors.push(label + ', kolom ke-' + (position + 1) + ': nilai harus berupa angka >= 0.');
        }
      });
    });

    return errors;
  }

  /**
   * Menormalkan bobot sehingga totalnya bernilai 1.
   * @param {Array<{weight: number}>} criteria
   * @returns {number[]}
   */
  function normalizeWeights(criteria) {
    var total = criteria.reduce(function (sum, criterion) {
      return sum + criterion.weight;
    }, 0);
    return criteria.map(function (criterion) {
      return criterion.weight / total;
    });
  }

  /**
   * Membentuk matriks keputusan ternormalisasi (matriks R).
   * Kriteria benefit dinormalkan dengan x / max, kriteria cost dengan min / x.
   * @param {Array<{type: string}>} criteria
   * @param {Array<{values: number[]}>} alternatives
   * @returns {number[][]}
   */
  function buildNormalizedMatrix(criteria, alternatives) {
    var columnStats = criteria.map(function (criterion, column) {
      var columnValues = alternatives.map(function (alternative) {
        return alternative.values[column];
      });
      return {
        min: Math.min.apply(null, columnValues),
        max: Math.max.apply(null, columnValues)
      };
    });

    return alternatives.map(function (alternative) {
      return alternative.values.map(function (value, column) {
        if (criteria[column].type === COST) {
          // Nilai 0 pada kriteria cost berarti paling ideal.
          return value === 0 ? 1 : columnStats[column].min / value;
        }
        return columnStats[column].max === 0 ? 0 : value / columnStats[column].max;
      });
    });
  }

  /**
   * Menghitung peringkat alternatif dengan metode SAW.
   * @param {Array<{name: string, weight: number, type: string}>} criteria
   * @param {Array<{name: string, values: number[]}>} alternatives
   * @returns {{weights: number[], matrix: number[][], ranking: Array<{name: string, score: number, rank: number, index: number}>}}
   * @throws {Error} bila data masukan tidak valid
   */
  function calculate(criteria, alternatives) {
    var errors = validate(criteria, alternatives);
    if (errors.length > 0) {
      throw new Error(errors.join(' '));
    }

    var weights = normalizeWeights(criteria);
    var matrix = buildNormalizedMatrix(criteria, alternatives);

    var ranking = alternatives.map(function (alternative, index) {
      var score = matrix[index].reduce(function (sum, normalized, column) {
        return sum + normalized * weights[column];
      }, 0);
      return { name: alternative.name, score: score, index: index, rank: 0 };
    });

    ranking.sort(function (a, b) {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.index - b.index;
    });
    ranking.forEach(function (item, position) {
      item.rank = position + 1;
    });

    return { weights: weights, matrix: matrix, ranking: ranking };
  }

  function isFiniteNumber(value) {
    return typeof value === 'number' && isFinite(value);
  }

  return {
    BENEFIT: BENEFIT,
    COST: COST,
    validate: validate,
    normalizeWeights: normalizeWeights,
    buildNormalizedMatrix: buildNormalizedMatrix,
    calculate: calculate
  };
});
