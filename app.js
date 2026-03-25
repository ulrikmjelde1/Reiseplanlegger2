const STORAGE_KEY = 'reiseplanlegger.v1';
const LIMITS = {
  flights: 2,
  hotels: 5,
  participants: 15,
};

const state = {
  trips: [],
  currentSection: 'future',
  search: {
    future: '',
    past: '',
  },
};

const els = {
  todayDisplay: document.getElementById('todayDisplay'),
  futureTrips: document.getElementById('futureTrips'),
  pastTrips: document.getElementById('pastTrips'),
  futureSearch: document.getElementById('futureSearch'),
  pastSearch: document.getElementById('pastSearch'),
  tripForm: document.getElementById('tripForm'),
  tripId: document.getElementById('tripId'),
  flightsContainer: document.getElementById('flightsContainer'),
  hotelsContainer: document.getElementById('hotelsContainer'),
  participantsContainer: document.getElementById('participantsContainer'),
  addFlightBtn: document.getElementById('addFlightBtn'),
  addHotelBtn: document.getElementById('addHotelBtn'),
  addParticipantBtn: document.getElementById('addParticipantBtn'),
  resetFormBtn: document.getElementById('resetFormBtn'),
  statsSummary: document.getElementById('statsSummary'),
  categoryBreakdown: document.getElementById('categoryBreakdown'),
  destinationBreakdown: document.getElementById('destinationBreakdown'),
  participantBreakdown: document.getElementById('participantBreakdown'),
  exportBtn: document.getElementById('exportBtn'),
  importFileInput: document.getElementById('importFileInput'),
  importReplaceBtn: document.getElementById('importReplaceBtn'),
  importMergeBtn: document.getElementById('importMergeBtn'),
  clearAllBtn: document.getElementById('clearAllBtn'),
  toast: document.getElementById('toast'),
  navCards: document.querySelectorAll('[data-section-target]'),
  sections: document.querySelectorAll('.app-section'),
  jumpButtons: document.querySelectorAll('[data-jump-to]'),
  flightTemplate: document.getElementById('flightTemplate'),
  hotelTemplate: document.getElementById('hotelTemplate'),
  participantTemplate: document.getElementById('participantTemplate'),
};

const fieldIds = [
  'destination',
  'category',
  'region',
  'currency',
  'startDate',
  'endDate',
  'flightTotalPrice',
  'hotelTotalPrice',
  'tags',
  'notes',
];

class TravelStorage {
  static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeTrip).filter(Boolean);
    } catch (error) {
      console.error('Kunne ikke laste lagret data', error);
      return [];
    }
  }

  static save(trips) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  }

  static clear() {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function normalizeTrip(trip) {
  if (!trip || typeof trip !== 'object') return null;

  return {
    id: String(trip.id || crypto.randomUUID()),
    destination: String(trip.destination || '').trim(),
    category: String(trip.category || '').trim(),
    region: String(trip.region || '').trim(),
    currency: String(trip.currency || 'NOK').trim() || 'NOK',
    startDate: String(trip.startDate || ''),
    endDate: String(trip.endDate || ''),
    flightTotalPrice: toNumberOrNull(trip.flightTotalPrice),
    hotelTotalPrice: toNumberOrNull(trip.hotelTotalPrice),
    flights: Array.isArray(trip.flights) ? trip.flights.slice(0, LIMITS.flights).map(normalizeFlight) : [],
    hotels: Array.isArray(trip.hotels) ? trip.hotels.slice(0, LIMITS.hotels).map(normalizeHotel) : [],
    participants: Array.isArray(trip.participants)
      ? trip.participants.slice(0, LIMITS.participants).map(normalizeParticipant)
      : [],
    tags: Array.isArray(trip.tags)
      ? trip.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : splitTags(String(trip.tags || '')),
    notes: String(trip.notes || '').trim(),
    createdAt: trip.createdAt || new Date().toISOString(),
    updatedAt: trip.updatedAt || new Date().toISOString(),
  };
}

function normalizeFlight(flight) {
  return {
    flightNumber: String(flight?.flightNumber || '').trim(),
    depAirport: String(flight?.depAirport || '').trim().toUpperCase(),
    arrAirport: String(flight?.arrAirport || '').trim().toUpperCase(),
    airline: String(flight?.airline || '').trim(),
    durationMinutes: toNumberOrNull(flight?.durationMinutes),
  };
}

function normalizeHotel(hotel) {
  return {
    name: String(hotel?.name || '').trim(),
    totalPrice: toNumberOrNull(hotel?.totalPrice),
  };
}

function normalizeParticipant(participant) {
  if (typeof participant === 'string') {
    return { name: participant.trim() };
  }

  return {
    name: String(participant?.name || '').trim(),
  };
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function splitTags(raw) {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return '–';
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return dateString;
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('nb-NO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatCurrency(value, currency = 'NOK') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '–';
  try {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: currency || 'NOK',
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${Number(value).toFixed(0)} ${currency || 'NOK'}`;
  }
}

function formatDurationMinutes(minutes) {
  if (!minutes || minutes <= 0) return '–';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} t ${m} min`;
}

function daysBetween(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = Math.round((end - start) / 86400000);
  return diff >= 0 ? diff + 1 : 0;
}

function countNights(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = Math.round((end - start) / 86400000);
  return diff > 0 ? diff : 0;
}

function getTripTemporalState(trip, today = getLocalDateString()) {
  return trip.endDate >= today ? 'future' : 'past';
}

function init() {
  state.trips = TravelStorage.load();
  bindEvents();
  els.todayDisplay.textContent = formatDate(getLocalDateString());

  seedEmptyForm();

  renderAll();
}

function bindEvents() {
  els.navCards.forEach((button) => {
    button.addEventListener('click', () => setActiveSection(button.dataset.sectionTarget));
  });

  els.jumpButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveSection(button.dataset.jumpTo));
  });

  els.addFlightBtn.addEventListener('click', () => addNestedItem('flight'));
  els.addHotelBtn.addEventListener('click', () => addNestedItem('hotel'));
  els.addParticipantBtn.addEventListener('click', () => addNestedItem('participant'));
  els.resetFormBtn.addEventListener('click', resetForm);

  els.tripForm.addEventListener('submit', handleTripSubmit);
  els.futureSearch.addEventListener('input', (event) => {
    state.search.future = event.target.value.trim().toLowerCase();
    renderTripSection('future');
  });
  els.pastSearch.addEventListener('input', (event) => {
    state.search.past = event.target.value.trim().toLowerCase();
    renderTripSection('past');
  });

  els.exportBtn.addEventListener('click', exportTrips);
  els.importReplaceBtn.addEventListener('click', () => importTrips('replace'));
  els.importMergeBtn.addEventListener('click', () => importTrips('merge'));
  els.clearAllBtn.addEventListener('click', clearAllTrips);

  [els.flightsContainer, els.hotelsContainer, els.participantsContainer].forEach((container) => {
    container.addEventListener('click', handleNestedContainerClick);
  });

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      state.trips = TravelStorage.load();
      renderAll();
      showToast('Data oppdatert fra en annen fane.');
    }
  });
}

function seedEmptyForm() {
  if (!els.flightsContainer.children.length) addNestedItem('flight');
  if (!els.hotelsContainer.children.length) addNestedItem('hotel');
  if (!els.participantsContainer.children.length) addNestedItem('participant');
}

function setActiveSection(sectionId) {
  state.currentSection = sectionId;

  els.sections.forEach((section) => {
    section.classList.toggle('active', section.id === sectionId);
  });

  els.navCards.forEach((button) => {
    button.classList.toggle('active', button.dataset.sectionTarget === sectionId);
  });
}

function persistTrips(showFeedback = false) {
  TravelStorage.save(state.trips);
  if (showFeedback) {
    showToast('Reisedata lagret lokalt i nettleseren.');
  }
}

function renderAll() {
  renderTripSection('future');
  renderTripSection('past');
  renderStats();
  updateAddButtons();
}

function renderTripSection(sectionType) {
  const container = sectionType === 'future' ? els.futureTrips : els.pastTrips;
  const searchTerm = state.search[sectionType];
  const today = getLocalDateString();

  const trips = state.trips
    .filter((trip) => getTripTemporalState(trip, today) === sectionType)
    .filter((trip) => {
      if (!searchTerm) return true;
      const haystack = [
        trip.destination,
        trip.category,
        trip.region,
        trip.notes,
        ...trip.tags,
        ...trip.participants.map((participant) => participant.name),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchTerm);
    })
    .sort((a, b) => {
      if (sectionType === 'future') {
        return a.startDate.localeCompare(b.startDate);
      }
      return b.endDate.localeCompare(a.endDate);
    });

  container.innerHTML = '';

  if (trips.length === 0) {
    container.appendChild(
      createEmptyState(
        sectionType === 'future' ? 'Ingen fremtidige reiser enda' : 'Ingen tidligere reiser enda',
        sectionType === 'future'
          ? 'Når du lagrer en reise med slutt-dato i dag eller senere, dukker den opp her.'
          : 'Når en reise har slutt-dato før i dag, flyttes den automatisk hit.'
      )
    );
    return;
  }

  trips.forEach((trip) => {
    container.appendChild(createTripCard(trip, sectionType));
  });
}

function createEmptyState(title, description) {
  const wrapper = document.createElement('article');
  wrapper.className = 'empty-state';
  wrapper.innerHTML = `<h3>${title}</h3><p>${description}</p>`;
  return wrapper;
}

function createTripCard(trip, sectionType) {
  const article = document.createElement('article');
  article.className = 'trip-card';

  const tripLengthDays = daysBetween(trip.startDate, trip.endDate);
  const totalFlightMinutes = trip.flights.reduce((sum, flight) => sum + (flight.durationMinutes || 0), 0);

  const hotelsMarkup = trip.hotels.length
    ? trip.hotels
        .filter((hotel) => hotel.name || hotel.totalPrice !== null)
        .map(
          (hotel) => `
          <div class="detail-line">
            <span>${escapeHtml(hotel.name || 'Uten navn')}</span>
            <strong>${formatCurrency(hotel.totalPrice, trip.currency)}</strong>
          </div>`
        )
        .join('')
    : '<p class="muted">Ingen hotell registrert.</p>';

  const flightsMarkup = trip.flights.length
    ? trip.flights
        .filter((flight) => flight.flightNumber || flight.depAirport || flight.arrAirport || flight.airline || flight.durationMinutes)
        .map((flight) => {
          const route = [flight.depAirport, flight.arrAirport].filter(Boolean).join(' → ');
          return `
            <div class="detail-line">
              <span>${escapeHtml(flight.flightNumber || flight.airline || 'Flysegment')}</span>
              <strong>${escapeHtml(route || formatDurationMinutes(flight.durationMinutes))}</strong>
            </div>`;
        })
        .join('')
    : '<p class="muted">Ingen flyvninger registrert.</p>';

  const participantsMarkup = trip.participants.length
    ? trip.participants
        .filter((participant) => participant.name)
        .map((participant) => `<span class="chip">👤 ${escapeHtml(participant.name)}</span>`)
        .join('')
    : '<span class="muted">Ingen deltakere registrert.</span>';

  const tagsMarkup = trip.tags.length ? trip.tags.map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join('') : '';

  article.innerHTML = `
    <div class="trip-card-header">
      <div>
        <p class="eyebrow">${sectionType === 'future' ? 'Kommende reise' : 'Arkivert reise'}</p>
        <h3>${escapeHtml(trip.destination || 'Uten destinasjon')}</h3>
        <p class="trip-meta">${formatDate(trip.startDate)} – ${formatDate(trip.endDate)} · ${tripLengthDays} dager</p>
      </div>
      <div class="trip-chip-row">
        <span class="chip ${sectionType === 'future' ? 'chip-warning' : 'chip-success'}">${sectionType === 'future' ? 'Fremtidig' : 'Tidligere'}</span>
        ${trip.category ? `<span class="chip">${escapeHtml(trip.category)}</span>` : ''}
      </div>
    </div>

    <div class="detail-stack">
      <div class="detail-block">
        <h4>Økonomi</h4>
        <div class="detail-line"><span>Fly totalt</span><strong>${formatCurrency(trip.flightTotalPrice, trip.currency)}</strong></div>
        <div class="detail-line"><span>Hotell totalt</span><strong>${formatCurrency(trip.hotelTotalPrice, trip.currency)}</strong></div>
      </div>

      <div class="detail-block">
        <h4>Fly</h4>
        ${flightsMarkup}
        <div class="detail-line"><span>Total flytid</span><strong>${formatDurationMinutes(totalFlightMinutes)}</strong></div>
      </div>

      <div class="detail-block">
        <h4>Hotell</h4>
        ${hotelsMarkup}
      </div>

      <div class="detail-block">
        <h4>Deltakere</h4>
        <div class="tag-row">${participantsMarkup}</div>
      </div>

      ${trip.region || trip.notes || tagsMarkup
        ? `
        <div class="detail-block">
          <h4>Ekstra</h4>
          ${trip.region ? `<div class="detail-line"><span>Land / region</span><strong>${escapeHtml(trip.region)}</strong></div>` : ''}
          ${trip.notes ? `<p class="trip-meta">${escapeHtml(trip.notes)}</p>` : ''}
          ${tagsMarkup ? `<div class="tag-row">${tagsMarkup}</div>` : ''}
        </div>`
        : ''}
    </div>

    <div class="trip-card-footer">
      <small class="trip-meta">Oppdatert ${new Intl.DateTimeFormat('nb-NO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(trip.updatedAt))}</small>
      <div class="trip-actions">
        <button class="button button-secondary" data-action="duplicate" data-trip-id="${trip.id}">Dupliser</button>
        <button class="button button-secondary" data-action="edit" data-trip-id="${trip.id}">Rediger</button>
        <button class="button button-danger" data-action="delete" data-trip-id="${trip.id}">Slett</button>
      </div>
    </div>
  `;

  article.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const tripId = button.dataset.tripId;
      const action = button.dataset.action;
      if (action === 'edit') editTrip(tripId);
      if (action === 'delete') deleteTrip(tripId);
      if (action === 'duplicate') duplicateTrip(tripId);
    });
  });

  return article;
}

function addNestedItem(type, existingData = null) {
  const config = {
    flight: {
      container: els.flightsContainer,
      template: els.flightTemplate,
      limit: LIMITS.flights,
    },
    hotel: {
      container: els.hotelsContainer,
      template: els.hotelTemplate,
      limit: LIMITS.hotels,
    },
    participant: {
      container: els.participantsContainer,
      template: els.participantTemplate,
      limit: LIMITS.participants,
    },
  }[type];

  if (!config) return;
  if (config.container.children.length >= config.limit) {
    showToast(`Maks antall ${type === 'flight' ? 'flyvninger' : type === 'hotel' ? 'hotell' : 'deltakere'} er nådd.`);
    return;
  }

  const fragment = config.template.content.cloneNode(true);
  const card = fragment.querySelector('.nested-card');

  if (existingData && typeof existingData === 'object') {
    card.querySelectorAll('[data-field]').forEach((input) => {
      const field = input.dataset.field;
      input.value = existingData[field] ?? '';
    });
  }

  config.container.appendChild(fragment);
  reindexNestedCards(config.container);
  updateAddButtons();
}

function handleNestedContainerClick(event) {
  const removeButton = event.target.closest('.remove-item-btn');
  if (!removeButton) return;

  const card = removeButton.closest('.nested-card');
  const container = card.parentElement;
  card.remove();
  reindexNestedCards(container);
  updateAddButtons();
}

function reindexNestedCards(container) {
  Array.from(container.children).forEach((card, index) => {
    const numberElement = card.querySelector('.item-number');
    if (numberElement) numberElement.textContent = index + 1;
  });
}

function updateAddButtons() {
  els.addFlightBtn.disabled = els.flightsContainer.children.length >= LIMITS.flights;
  els.addHotelBtn.disabled = els.hotelsContainer.children.length >= LIMITS.hotels;
  els.addParticipantBtn.disabled = els.participantsContainer.children.length >= LIMITS.participants;
}

function collectNestedItems(container) {
  return Array.from(container.children)
    .map((card) => {
      const item = {};
      card.querySelectorAll('[data-field]').forEach((input) => {
        item[input.dataset.field] = input.value;
      });
      return item;
    })
    .filter((item) => Object.values(item).some((value) => String(value).trim() !== ''));
}

function handleTripSubmit(event) {
  event.preventDefault();

  const trip = {
    id: els.tripId.value || crypto.randomUUID(),
    destination: valueOf('destination'),
    category: valueOf('category'),
    region: valueOf('region'),
    currency: valueOf('currency') || 'NOK',
    startDate: valueOf('startDate'),
    endDate: valueOf('endDate'),
    flightTotalPrice: toNumberOrNull(valueOf('flightTotalPrice')),
    hotelTotalPrice: toNumberOrNull(valueOf('hotelTotalPrice')),
    flights: collectNestedItems(els.flightsContainer).map(normalizeFlight),
    hotels: collectNestedItems(els.hotelsContainer).map(normalizeHotel),
    participants: collectNestedItems(els.participantsContainer).map(normalizeParticipant),
    tags: splitTags(valueOf('tags')),
    notes: valueOf('notes'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!trip.destination || !trip.startDate || !trip.endDate) {
    showToast('Destinasjon, start-dato og slutt-dato er påkrevd.');
    return;
  }

  if (trip.endDate < trip.startDate) {
    showToast('Slutt-dato kan ikke være før start-dato.');
    return;
  }

  const existingIndex = state.trips.findIndex((item) => item.id === trip.id);
  if (existingIndex >= 0) {
    trip.createdAt = state.trips[existingIndex].createdAt;
    state.trips[existingIndex] = normalizeTrip(trip);
    showToast('Reisen ble oppdatert.');
  } else {
    state.trips.push(normalizeTrip(trip));
    showToast('Ny reise lagret.');
  }

  persistTrips();
  renderAll();
  resetForm();
  setActiveSection(getTripTemporalState(trip));
}

function valueOf(id) {
  return document.getElementById(id).value.trim();
}

function resetForm() {
  els.tripForm.reset();
  els.tripId.value = '';
  els.flightsContainer.innerHTML = '';
  els.hotelsContainer.innerHTML = '';
  els.participantsContainer.innerHTML = '';
  seedEmptyForm();
  updateAddButtons();
}

function editTrip(tripId) {
  const trip = state.trips.find((item) => item.id === tripId);
  if (!trip) return;

  els.tripId.value = trip.id;
  fieldIds.forEach((id) => {
    const field = document.getElementById(id);
    if (!field) return;

    if (id === 'tags') {
      field.value = trip.tags.join(', ');
      return;
    }

    field.value = trip[id] ?? '';
  });

  els.flightsContainer.innerHTML = '';
  els.hotelsContainer.innerHTML = '';
  els.participantsContainer.innerHTML = '';

  if (trip.flights.length) trip.flights.forEach((flight) => addNestedItem('flight', flight));
  if (trip.hotels.length) trip.hotels.forEach((hotel) => addNestedItem('hotel', hotel));
  if (trip.participants.length) trip.participants.forEach((participant) => addNestedItem('participant', participant));

  seedEmptyForm();
  updateAddButtons();
  setActiveSection('form');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast(`Redigerer ${trip.destination}.`);
}

function deleteTrip(tripId) {
  const trip = state.trips.find((item) => item.id === tripId);
  if (!trip) return;
  const confirmed = window.confirm(`Slette reisen til ${trip.destination}?`);
  if (!confirmed) return;

  state.trips = state.trips.filter((item) => item.id !== tripId);
  persistTrips();
  renderAll();
  showToast('Reisen ble slettet.');
}

function duplicateTrip(tripId) {
  const trip = state.trips.find((item) => item.id === tripId);
  if (!trip) return;

  const clone = normalizeTrip({
    ...trip,
    id: crypto.randomUUID(),
    destination: `${trip.destination} (kopi)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  state.trips.push(clone);
  persistTrips();
  renderAll();
  showToast('Reisen ble duplisert.');
}

function buildStatDefinitions(trips) {
  return [
    {
      label: 'Antall reiser',
      value: trips.length,
    },
    {
      label: 'Fremtidige reiser',
      value: trips.filter((trip) => getTripTemporalState(trip) === 'future').length,
    },
    {
      label: 'Tidligere reiser',
      value: trips.filter((trip) => getTripTemporalState(trip) === 'past').length,
    },
    {
      label: 'Unike destinasjoner',
      value: uniqueValues(trips.map((trip) => trip.destination)).length,
    },
    {
      label: 'Unike reisepartnere',
      value: uniqueValues(trips.flatMap((trip) => trip.participants.map((participant) => participant.name))).length,
    },
    {
      label: 'Totale netter',
      value: trips.reduce((sum, trip) => sum + countNights(trip.startDate, trip.endDate), 0),
    },
    {
      label: 'Flysegmenter',
      value: trips.reduce((sum, trip) => sum + trip.flights.length, 0),
    },
    {
      label: 'Total flytid',
      value: formatDurationMinutes(trips.reduce((sum, trip) => sum + trip.flights.reduce((acc, flight) => acc + (flight.durationMinutes || 0), 0), 0)),
    },
    {
      label: 'Registrert flykost',
      value: formatCurrency(trips.reduce((sum, trip) => sum + (trip.flightTotalPrice || 0), 0), 'NOK'),
    },
    {
      label: 'Registrert hotellkost',
      value: formatCurrency(trips.reduce((sum, trip) => sum + (trip.hotelTotalPrice || 0), 0), 'NOK'),
    },
    {
      label: 'Snittlengde',
      value:
        trips.length > 0
          ? `${(trips.reduce((sum, trip) => sum + daysBetween(trip.startDate, trip.endDate), 0) / trips.length).toFixed(1)} dager`
          : '0 dager',
    },
  ];
}

function renderStats() {
  const stats = buildStatDefinitions(state.trips);
  els.statsSummary.innerHTML = stats
    .map(
      (stat) => `
      <article class="stat-card">
        <h3>${escapeHtml(stat.label)}</h3>
        <p>${escapeHtml(String(stat.value))}</p>
      </article>`
    )
    .join('');

  renderRankedList(
    els.categoryBreakdown,
    countValues(state.trips.map((trip) => trip.category).filter(Boolean)),
    'Ingen kategorier enda.'
  );
  renderRankedList(
    els.destinationBreakdown,
    countValues(state.trips.map((trip) => trip.destination).filter(Boolean)),
    'Ingen destinasjoner enda.'
  );
  renderRankedList(
    els.participantBreakdown,
    countValues(state.trips.flatMap((trip) => trip.participants.map((participant) => participant.name)).filter(Boolean)),
    'Ingen reisepartnere enda.'
  );
}

function renderRankedList(container, items, emptyText) {
  container.innerHTML = '';

  if (!items.length) {
    container.appendChild(createEmptyState('Tomt foreløpig', emptyText));
    return;
  }

  items.slice(0, 8).forEach(([label, count]) => {
    const row = document.createElement('div');
    row.className = 'ranked-item';
    row.innerHTML = `<span>${escapeHtml(label)}</span><strong>${count}</strong>`;
    container.appendChild(row);
  });
}

function countValues(values) {
  const map = new Map();
  values.forEach((value) => {
    map.set(value, (map.get(value) || 0) + 1);
  });
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'nb'));
}

function uniqueValues(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function exportTrips() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'reiseplanlegger',
    version: 1,
    trips: state.trips,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reiseplanlegger-export-${getLocalDateString()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('JSON-eksport lastet ned.');
}

async function importTrips(mode) {
  const file = els.importFileInput.files?.[0];
  if (!file) {
    showToast('Velg en JSON-fil først.');
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const incomingTrips = Array.isArray(parsed) ? parsed : parsed.trips;

    if (!Array.isArray(incomingTrips)) {
      throw new Error('Filen inneholder ikke en gyldig liste med reiser.');
    }

    const normalizedIncoming = incomingTrips.map(normalizeTrip).filter(Boolean);

    if (mode === 'replace') {
      const confirmed = window.confirm('Dette erstatter alle lokale reiser. Fortsette?');
      if (!confirmed) return;
      state.trips = normalizedIncoming;
    } else {
      const existing = new Map(state.trips.map((trip) => [trip.id, trip]));
      normalizedIncoming.forEach((trip) => existing.set(trip.id, trip));
      state.trips = Array.from(existing.values());
    }

    persistTrips();
    renderAll();
    resetForm();
    showToast(mode === 'replace' ? 'Data importert og erstattet.' : 'Data importert og slått sammen.');
  } catch (error) {
    console.error(error);
    showToast(`Import feilet: ${error.message}`);
  }
}

function clearAllTrips() {
  const confirmed = window.confirm('Er du sikker på at du vil slette alle reiser lokalt?');
  if (!confirmed) return;

  state.trips = [];
  TravelStorage.clear();
  renderAll();
  resetForm();
  showToast('Alle lokale reiser er slettet.');
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('visible');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    els.toast.classList.remove('visible');
  }, 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

init();
