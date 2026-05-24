// ===== STATE =====
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;
let selectedTime = null;
let pendingBooking = null;

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const TIME_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();
  renderAppointments();
  setupNavbar();
  setupHamburger();
  setupForm();
});

// ===== NAVBAR =====
function setupNavbar() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
  });
}

function setupHamburger() {
  const btn = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  btn.addEventListener('click', () => {
    links.classList.toggle('active');
  });
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('active'));
  });
}

function scrollToBooking() {
  document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
}

// ===== CALENDAR =====
function renderCalendar() {
  const title = document.getElementById('calendarTitle');
  const container = document.getElementById('calendarDays');
  title.textContent = `${MONTHS_TR[currentMonth]} ${currentYear}`;

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();
  // Monday-based: convert Sunday(0) to 7
  const startOffset = (firstDay === 0 ? 7 : firstDay) - 1;

  let html = '';
  for (let i = 0; i < startOffset; i++) {
    html += '<button class="calendar-day empty" disabled></button>';
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(currentYear, currentMonth, d);
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isToday = date.toDateString() === today.toDateString();
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
    let cls = 'calendar-day';
    if (isPast) cls += ' disabled';
    if (isToday) cls += ' today';
    if (isSelected) cls += ' selected';
    html += `<button class="${cls}" ${isPast ? 'disabled' : ''} onclick="pickDate(${currentYear},${currentMonth},${d})">${d}</button>`;
  }
  container.innerHTML = html;

  document.getElementById('prevMonth').onclick = () => { changeMonth(-1); };
  document.getElementById('nextMonth').onclick = () => { changeMonth(1); };
}

function changeMonth(dir) {
  currentMonth += dir;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
}

function pickDate(y, m, d) {
  selectedDate = new Date(y, m, d);
  selectedTime = null;
  renderCalendar();
  showTimeSlots();
  updateSelectedInfo();
  updateSubmitBtn();
}

// ===== TIME SLOTS =====
function showTimeSlots() {
  const container = document.getElementById('timeSlotsContainer');
  const slotsDiv = document.getElementById('timeSlots');
  const titleEl = document.getElementById('timeSlotsTitle');
  container.style.display = 'block';
  titleEl.textContent = `${selectedDate.getDate()} ${MONTHS_TR[selectedDate.getMonth()]} — Müsait Saatler`;

  const booked = getBookedSlots(selectedDate);
  let html = '';
  TIME_SLOTS.forEach(slot => {
    const isBooked = booked.includes(slot);
    const isSel = selectedTime === slot;
    let cls = 'time-slot';
    if (isBooked) cls += ' disabled';
    if (isSel) cls += ' selected';
    html += `<button class="${cls}" ${isBooked ? 'disabled' : ''} onclick="pickTime('${slot}')">${slot}</button>`;
  });
  slotsDiv.innerHTML = html;
}

function pickTime(time) {
  selectedTime = time;
  showTimeSlots();
  updateSelectedInfo();
  updateSubmitBtn();
}

function getBookedSlots(date) {
  const appointments = getAppointments();
  const dateStr = date.toISOString().split('T')[0];
  return appointments.filter(a => a.date === dateStr).map(a => a.time);
}

// ===== SELECTED INFO =====
function updateSelectedInfo() {
  const el = document.getElementById('selectedInfo');
  if (selectedDate && selectedTime) {
    el.textContent = `📅 ${selectedDate.getDate()} ${MONTHS_TR[selectedDate.getMonth()]} ${selectedDate.getFullYear()} — 🕐 ${selectedTime}`;
    el.classList.add('visible');
  } else if (selectedDate) {
    el.textContent = `📅 ${selectedDate.getDate()} ${MONTHS_TR[selectedDate.getMonth()]} ${selectedDate.getFullYear()} — Saat seçin`;
    el.classList.add('visible');
  } else {
    el.classList.remove('visible');
  }
}

// ===== FORM =====
function setupForm() {
  document.getElementById('bookingForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      showToast('Lütfen tarih ve saat seçin.', true);
      return;
    }
    const data = {
      id: Date.now().toString(36),
      service: document.getElementById('service').value,
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim(),
      notes: document.getElementById('notes').value.trim(),
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    pendingBooking = data;
    document.getElementById('confirmText').textContent =
      `${data.firstName} ${data.lastName} — ${data.service}\n${data.date} saat ${data.time}\nRandevuyu onaylıyor musunuz?`;
    document.getElementById('confirmModal').classList.add('active');
  });
}

function confirmBooking() {
  if (!pendingBooking) return;
  const appointments = getAppointments();
  appointments.push(pendingBooking);
  localStorage.setItem('appointments', JSON.stringify(appointments));
  showToast('Randevunuz başarıyla oluşturuldu! ✅');
  closeModal();
  pendingBooking = null;
  // Reset
  document.getElementById('bookingForm').reset();
  selectedDate = null;
  selectedTime = null;
  document.getElementById('timeSlotsContainer').style.display = 'none';
  document.getElementById('selectedInfo').classList.remove('visible');
  updateSubmitBtn();
  renderCalendar();
  renderAppointments();
}

function closeModal() {
  document.getElementById('confirmModal').classList.remove('active');
}

function updateSubmitBtn() {
  const btn = document.getElementById('submitBtn');
  btn.disabled = !(selectedDate && selectedTime);
}

function selectService(name) {
  document.getElementById('service').value = name;
  scrollToBooking();
}

// ===== APPOINTMENTS =====
function getAppointments() {
  try { return JSON.parse(localStorage.getItem('appointments')) || []; }
  catch { return []; }
}

function renderAppointments() {
  const list = document.getElementById('appointmentList');
  const appointments = getAppointments();
  if (appointments.length === 0) {
    list.innerHTML = '<div class="empty-state">Henüz randevunuz bulunmamaktadır.</div>';
    return;
  }
  // Sort by date desc
  appointments.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
  let html = '';
  appointments.forEach(a => {
    const d = new Date(a.date);
    const dateStr = `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;
    const isPast = new Date(a.date + 'T' + a.time) < new Date();
    html += `
      <div class="appointment-item">
        <div class="appointment-info">
          <span class="name">${a.firstName} ${a.lastName}</span>
          <span class="details">${a.service} — ${dateStr}, ${a.time}</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.6rem">
          <span class="appointment-status ${isPast ? 'status-pending' : 'status-confirmed'}">${isPast ? 'Geçmiş' : 'Onaylandı'}</span>
          ${!isPast ? `<button class="btn-cancel" onclick="cancelAppointment('${a.id}')">İptal</button>` : ''}
        </div>
      </div>`;
  });
  list.innerHTML = html;
}

function cancelAppointment(id) {
  let appointments = getAppointments().filter(a => a.id !== id);
  localStorage.setItem('appointments', JSON.stringify(appointments));
  renderAppointments();
  renderCalendar();
  if (selectedDate) showTimeSlots();
  showToast('Randevu iptal edildi.');
}

// ===== TOAST =====
function showToast(msg, isError = false) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast' + (isError ? ' error' : '');
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
