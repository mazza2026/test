/**
 * Antarmuka aplikasi SPK sederhana (metode SAW).
 * Seluruh isi tabel dibangun lewat DOM API (bukan innerHTML) agar aman dari XSS.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'spk-saw-data';

  var state = { criteria: [], alternatives: [] };

  var criteriaBody = document.querySelector('#criteria-table tbody');
  var alternativesHead = document.querySelector('#alternatives-table thead tr');
  var alternativesBody = document.querySelector('#alternatives-table tbody');
  var messagesBox = document.getElementById('messages');
  var resultsBox = document.getElementById('results');

  function sampleData() {
    return {
      criteria: [
        { name: 'Harga', weight: 5, type: SAW.COST },
        { name: 'Kualitas', weight: 4, type: SAW.BENEFIT },
        { name: 'Jarak', weight: 3, type: SAW.COST },
        { name: 'Pelayanan', weight: 2, type: SAW.BENEFIT }
      ],
      alternatives: [
        { name: 'Vendor A', values: [500000, 80, 12, 70] },
        { name: 'Vendor B', values: [450000, 70, 8, 85] },
        { name: 'Vendor C', values: [600000, 95, 20, 90] }
      ]
    };
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.criteria) && Array.isArray(parsed.alternatives)) {
          return sanitize(parsed);
        }
      }
    } catch (error) {
      // Abaikan data rusak / localStorage tidak tersedia.
    }
    return sampleData();
  }

  function sanitize(data) {
    var criteria = data.criteria.map(function (criterion) {
      return {
        name: String(criterion && criterion.name ? criterion.name : ''),
        weight: toNumber(criterion && criterion.weight),
        type: criterion && criterion.type === SAW.COST ? SAW.COST : SAW.BENEFIT
      };
    });
    var alternatives = data.alternatives.map(function (alternative) {
      var values = Array.isArray(alternative && alternative.values) ? alternative.values : [];
      return {
        name: String(alternative && alternative.name ? alternative.name : ''),
        values: criteria.map(function (_, index) {
          return toNumber(values[index]);
        })
      };
    });
    return { criteria: criteria, alternatives: alternatives };
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // localStorage bisa tidak tersedia (mode privat); abaikan saja.
    }
  }

  function toNumber(value) {
    var number = typeof value === 'number' ? value : parseFloat(value);
    return isFinite(number) ? number : 0;
  }

  function createElement(tag, options) {
    var element = document.createElement(tag);
    if (options && options.text !== undefined) {
      element.textContent = options.text;
    }
    if (options && options.className) {
      element.className = options.className;
    }
    return element;
  }

  function createNumberInput(value, onChange, ariaLabel) {
    var input = createElement('input');
    input.type = 'number';
    input.step = 'any';
    input.min = '0';
    input.value = String(value);
    input.setAttribute('aria-label', ariaLabel);
    input.addEventListener('input', function () {
      onChange(input.value === '' ? NaN : parseFloat(input.value));
    });
    return input;
  }

  function createTextInput(value, onChange, ariaLabel) {
    var input = createElement('input');
    input.type = 'text';
    input.value = value;
    input.setAttribute('aria-label', ariaLabel);
    input.addEventListener('input', function () {
      onChange(input.value);
    });
    return input;
  }

  function createTypeSelect(value, onChange, ariaLabel) {
    var select = createElement('select');
    select.setAttribute('aria-label', ariaLabel);
    [
      { value: SAW.BENEFIT, label: 'Benefit (makin besar makin baik)' },
      { value: SAW.COST, label: 'Cost (makin kecil makin baik)' }
    ].forEach(function (option) {
      var optionElement = createElement('option', { text: option.label });
      optionElement.value = option.value;
      if (option.value === value) {
        optionElement.selected = true;
      }
      select.appendChild(optionElement);
    });
    select.addEventListener('change', function () {
      onChange(select.value);
    });
    return select;
  }

  function createRemoveButton(label, onClick) {
    var button = createElement('button', { text: 'Hapus', className: 'btn btn-danger' });
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.addEventListener('click', onClick);
    return button;
  }

  function renderCriteria() {
    criteriaBody.textContent = '';
    state.criteria.forEach(function (criterion, index) {
      var row = createElement('tr');

      var nameCell = createElement('td');
      nameCell.appendChild(
        createTextInput(criterion.name, function (value) {
          criterion.name = value;
          save();
        }, 'Nama kriteria ke-' + (index + 1))
      );

      var weightCell = createElement('td');
      weightCell.appendChild(
        createNumberInput(criterion.weight, function (value) {
          criterion.weight = value;
          save();
        }, 'Bobot kriteria ke-' + (index + 1))
      );

      var typeCell = createElement('td');
      typeCell.appendChild(
        createTypeSelect(criterion.type, function (value) {
          criterion.type = value;
          save();
        }, 'Tipe kriteria ke-' + (index + 1))
      );

      var actionCell = createElement('td');
      actionCell.appendChild(
        createRemoveButton('Hapus kriteria ke-' + (index + 1), function () {
          removeCriterion(index);
        })
      );

      [nameCell, weightCell, typeCell, actionCell].forEach(function (cell) {
        row.appendChild(cell);
      });
      criteriaBody.appendChild(row);
    });
  }

  function renderAlternatives() {
    alternativesHead.textContent = '';
    alternativesBody.textContent = '';

    alternativesHead.appendChild(createElement('th', { text: 'Alternatif' }));
    state.criteria.forEach(function (criterion, index) {
      var label = (criterion.name || 'Kriteria ' + (index + 1)) + ' (' + criterion.type + ')';
      alternativesHead.appendChild(createElement('th', { text: label }));
    });
    alternativesHead.appendChild(createElement('th', { text: 'Aksi' }));

    state.alternatives.forEach(function (alternative, rowIndex) {
      var row = createElement('tr');

      var nameCell = createElement('td');
      nameCell.appendChild(
        createTextInput(alternative.name, function (value) {
          alternative.name = value;
          save();
        }, 'Nama alternatif ke-' + (rowIndex + 1))
      );
      row.appendChild(nameCell);

      state.criteria.forEach(function (criterion, columnIndex) {
        var valueCell = createElement('td');
        valueCell.appendChild(
          createNumberInput(alternative.values[columnIndex], function (value) {
            alternative.values[columnIndex] = value;
            save();
          }, 'Nilai alternatif ke-' + (rowIndex + 1) + ' kriteria ke-' + (columnIndex + 1))
        );
        row.appendChild(valueCell);
      });

      var actionCell = createElement('td');
      actionCell.appendChild(
        createRemoveButton('Hapus alternatif ke-' + (rowIndex + 1), function () {
          removeAlternative(rowIndex);
        })
      );
      row.appendChild(actionCell);

      alternativesBody.appendChild(row);
    });
  }

  function renderAll() {
    renderCriteria();
    renderAlternatives();
  }

  function addCriterion() {
    state.criteria.push({ name: '', weight: 1, type: SAW.BENEFIT });
    state.alternatives.forEach(function (alternative) {
      alternative.values.push(0);
    });
    save();
    renderAll();
  }

  function removeCriterion(index) {
    state.criteria.splice(index, 1);
    state.alternatives.forEach(function (alternative) {
      alternative.values.splice(index, 1);
    });
    save();
    renderAll();
    hideResults();
  }

  function addAlternative() {
    state.alternatives.push({
      name: '',
      values: state.criteria.map(function () {
        return 0;
      })
    });
    save();
    renderAlternatives();
  }

  function removeAlternative(index) {
    state.alternatives.splice(index, 1);
    save();
    renderAlternatives();
    hideResults();
  }

  function showMessages(messages, type) {
    messagesBox.textContent = '';
    messagesBox.className = 'messages' + (messages.length ? ' messages-' + type : '');
    if (messages.length === 0) {
      return;
    }
    var list = createElement('ul');
    messages.forEach(function (message) {
      list.appendChild(createElement('li', { text: message }));
    });
    messagesBox.appendChild(list);
  }

  function hideResults() {
    resultsBox.hidden = true;
  }

  function formatNumber(value) {
    return value.toFixed(4);
  }

  function renderResults(result) {
    var weightsHead = document.querySelector('#weights-table thead tr');
    var weightsRow = document.querySelector('#weights-table tbody tr');
    weightsHead.textContent = '';
    weightsRow.textContent = '';
    state.criteria.forEach(function (criterion, index) {
      weightsHead.appendChild(createElement('th', { text: criterion.name || 'Kriteria ' + (index + 1) }));
      weightsRow.appendChild(createElement('td', { text: formatNumber(result.weights[index]) }));
    });

    var matrixHead = document.querySelector('#matrix-table thead tr');
    var matrixBody = document.querySelector('#matrix-table tbody');
    matrixHead.textContent = '';
    matrixBody.textContent = '';
    matrixHead.appendChild(createElement('th', { text: 'Alternatif' }));
    state.criteria.forEach(function (criterion, index) {
      matrixHead.appendChild(createElement('th', { text: criterion.name || 'Kriteria ' + (index + 1) }));
    });
    result.matrix.forEach(function (row, rowIndex) {
      var tableRow = createElement('tr');
      tableRow.appendChild(createElement('th', { text: state.alternatives[rowIndex].name }));
      row.forEach(function (value) {
        tableRow.appendChild(createElement('td', { text: formatNumber(value) }));
      });
      matrixBody.appendChild(tableRow);
    });

    var rankingBody = document.querySelector('#ranking-table tbody');
    rankingBody.textContent = '';
    result.ranking.forEach(function (item) {
      var row = createElement('tr');
      if (item.rank === 1) {
        row.className = 'best';
      }
      row.appendChild(createElement('td', { text: String(item.rank) }));
      row.appendChild(createElement('td', { text: item.name }));
      row.appendChild(createElement('td', { text: formatNumber(item.score) }));
      rankingBody.appendChild(row);
    });

    var best = result.ranking[0];
    document.getElementById('conclusion').textContent =
      'Alternatif terbaik: ' + best.name + ' dengan nilai preferensi ' + formatNumber(best.score) + '.';

    resultsBox.hidden = false;
  }

  function calculate() {
    var errors = SAW.validate(state.criteria, state.alternatives);
    if (errors.length > 0) {
      hideResults();
      showMessages(errors, 'error');
      return;
    }
    showMessages([], 'error');
    renderResults(SAW.calculate(state.criteria, state.alternatives));
  }

  document.getElementById('add-criterion').addEventListener('click', addCriterion);
  document.getElementById('add-alternative').addEventListener('click', addAlternative);
  document.getElementById('calculate').addEventListener('click', calculate);
  document.getElementById('load-sample').addEventListener('click', function () {
    state = sampleData();
    save();
    renderAll();
    hideResults();
    showMessages([], 'error');
  });
  document.getElementById('reset').addEventListener('click', function () {
    state = { criteria: [], alternatives: [] };
    save();
    renderAll();
    hideResults();
    showMessages([], 'error');
  });

  state = load();
  renderAll();
})();
