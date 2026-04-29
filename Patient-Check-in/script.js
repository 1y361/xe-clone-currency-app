// ============================================
// RURALHEALTH CONNECT - 3-CLICK CHECK-IN FLOW
// Click 1: Start → Click 2: Enter Details → Click 3: Submit
// ============================================

// Data - Start with EMPTY arrays
let patients = [];
let appointments = [];
let staff = [];
let clinic = { name: "", location: "", phone: "" };
let currentMode = "online";
let currentStep = 1;

// Load from storage
function loadData() {
    const saved = localStorage.getItem('rhc_data');
    if (saved) {
        let data = JSON.parse(saved);
        patients = data.patients || [];
        appointments = data.appointments || [];
        staff = data.staff || [];
        clinic = data.clinic || { name: "", location: "", phone: "" };
        currentMode = data.mode || "online";
    } else {
        patients = [
            { name: "Jean Uwimana", id: "0978345235674", age: 42, service: "General", time: "10:00 AM", status: "Waiting", date: new Date().toDateString() },
            { name: "Marie Claire", id: "86482894749372", age: 28, service: "Maternity", time: "10:30 AM", status: "Completed", date: new Date().toDateString() }
        ];
        appointments = [];
        staff = [];
        clinic = { name: "", location: "", phone: "" };
    }
}

function saveData() {
    let data = { patients, appointments, staff, clinic, mode: currentMode };
    localStorage.setItem('rhc_data', JSON.stringify(data));
}

// Mode functions
function setMode(mode) {
    currentMode = mode;
    saveData();
    
    const onlineBtn = document.getElementById('onlineBtn');
    const offlineBtn = document.getElementById('offlineBtn');
    const modeStatus = document.getElementById('modeStatus');
    const currentModeDisplay = document.getElementById('currentModeDisplay');
    
    if (mode === 'online') {
        onlineBtn.classList.add('active');
        offlineBtn.classList.remove('active');
        modeStatus.className = 'mode-status online-status';
        modeStatus.innerHTML = '✅ Online Mode - Data saving to local storage';
        if (currentModeDisplay) currentModeDisplay.innerText = 'Online';
    } else {
        offlineBtn.classList.add('active');
        onlineBtn.classList.remove('active');
        modeStatus.className = 'mode-status offline-status';
        modeStatus.innerHTML = '📡 Offline Mode - Working offline, data on this device only';
        if (currentModeDisplay) currentModeDisplay.innerText = 'Offline';
    }
}

// Helper functions
function getTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateQueueCount() {
    let waiting = patients.filter(p => p.status === "Waiting").length;
    document.getElementById('queueCount').innerText = waiting;
}

// 3-CLICK FLOW FUNCTIONS
function updateStepIndicator(step) {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    step1.classList.remove('active', 'completed');
    step2.classList.remove('active', 'completed');
    step3.classList.remove('active', 'completed');
    
    if (step === 1) {
        step1.classList.add('active');
    } else if (step === 2) {
        step1.classList.add('completed');
        step2.classList.add('active');
    } else if (step === 3) {
        step1.classList.add('completed');
        step2.classList.add('completed');
        step3.classList.add('active');
    }
}

function resetToStart() {
    currentStep = 1;
    updateStepIndicator(1);
    document.getElementById('startSection').style.display = 'block';
    document.getElementById('checkinFormContainer').style.display = 'none';
    document.getElementById('name').value = '';
    document.getElementById('contact').value = '';
    document.getElementById('age').value = '';
    document.getElementById('returning').checked = false;
}

// Staff Management
function renderStaffTable() {
    let body = document.getElementById('staffBody');
    let staffCountSpan = document.getElementById('staffCount');
    if (!body) return;
    
    if (staff.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; padding: 30px;">
                    👋 No staff members yet.<br>
                    Click <strong>"+ Add New Staff"</strong> below to add yourself.
                </td>
            </tr>
        `;
        if (staffCountSpan) staffCountSpan.innerText = '0';
        return;
    }
    
    body.innerHTML = staff.map((s, index) => `
        <tr data-id="${s.id || index}">
            <td><input type="text" class="staff-name-input" value="${escapeHtml(s.name)}" data-field="name" data-index="${index}"></td>
            <td>
                <select class="staff-role-input" data-field="role" data-index="${index}">
                    <option value="Doctor" ${s.role === 'Doctor' ? 'selected' : ''}>Doctor</option>
                    <option value="Nurse" ${s.role === 'Nurse' ? 'selected' : ''}>Nurse</option>
                    <option value="Admin" ${s.role === 'Admin' ? 'selected' : ''}>Admin</option>
                    <option value="Pharmacist" ${s.role === 'Pharmacist' ? 'selected' : ''}>Pharmacist</option>
                </select>
            </td>
            <td><input type="text" class="staff-contact-input" value="${escapeHtml(s.contact || '')}" data-field="contact" data-index="${index}"></td>
            <td>
                <button class="save-staff-btn" data-save-index="${index}">💾 Save</button>
                <button class="delete-staff-btn" data-delete-index="${index}">🗑 Delete</button>
            </td>
        </tr>
    `).join('');
    
    if (staffCountSpan) staffCountSpan.innerText = staff.length;
    
    document.querySelectorAll('.save-staff-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let idx = parseInt(btn.getAttribute('data-save-index'));
            let row = btn.closest('tr');
            let nameInput = row.querySelector('.staff-name-input');
            let roleSelect = row.querySelector('.staff-role-input');
            let contactInput = row.querySelector('.staff-contact-input');
            
            if (nameInput && nameInput.value.trim()) {
                staff[idx].name = nameInput.value.trim();
                staff[idx].role = roleSelect.value;
                staff[idx].contact = contactInput.value.trim();
                saveData();
                renderStaffTable();
                showTemporaryMessage('msg', `✅ Staff member updated`, 'success');
            }
        });
    });
    
    document.querySelectorAll('.delete-staff-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let idx = parseInt(btn.getAttribute('data-delete-index'));
            if (confirm('Remove this staff member?')) {
                staff.splice(idx, 1);
                saveData();
                renderStaffTable();
                updateAdminStats();
            }
        });
    });
}

function addNewStaffRow() {
    staff.push({ id: Date.now(), name: "", role: "Doctor", contact: "" });
    saveData();
    renderStaffTable();
}

// Render all tables
function renderRecent() {
    let body = document.getElementById('recentBody');
    if (!body) return;
    let recent = patients.slice(0, 6);
    body.innerHTML = recent.map(p => `
        <tr>
            <td>${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.id)}</td>
            <td>${p.time}</td>
            <td><span class="status-badge status-${p.status}">${p.status}</span></td>
        </tr>
    `).join('');
    if (recent.length === 0) body.innerHTML = '<tr><td colspan="4">No patients yet</td></tr>';
}

function renderPatients() {
    let body = document.getElementById('patientsBody');
    if (!body) return;
    body.innerHTML = patients.map(p => `
        <tr>
            <td>${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.id)}</td>
            <td>${p.age}</td>
            <td>${p.service}</td>
            <td><span class="status-badge status-${p.status}">${p.status}</span></td>
        </tr>
    `).join('');
}

function renderQueue() {
    let container = document.getElementById('queueList');
    if (!container) return;
    let waiting = patients.filter(p => p.status === "Waiting");
    container.innerHTML = '<h3>📋 Current Queue</h3>';
    if (waiting.length === 0) {
        container.innerHTML += '<p>No patients waiting</p>';
    } else {
        waiting.forEach((p, i) => {
            container.innerHTML += `
                <div>
                    <span><strong>#${i+1}</strong> ${escapeHtml(p.name)} - ${p.service}</span>
                    <button class="complete-btn" data-id="${p.id}">Complete</button>
                </div>
            `;
        });
    }
    
    document.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let id = btn.getAttribute('data-id');
            let patient = patients.find(p => p.id === id);
            if (patient) {
                patient.status = 'Completed';
                saveData();
                renderRecent();
                renderPatients();
                renderQueue();
                renderAppointments();
                updateAdminStats();
                updateQueueCount();
            }
        });
    });
}

function renderAppointments() {
    let container = document.getElementById('apptList');
    if (!container) return;
    container.innerHTML = '<h3>📅 Scheduled Appointments</h3>';
    if (appointments.length === 0) {
        container.innerHTML += '<p>No appointments scheduled</p>';
    } else {
        appointments.forEach(a => {
            container.innerHTML += `
                <div>
                    <span><strong>${escapeHtml(a.patientName)}</strong> - ${a.date} at ${a.time}</span>
                </div>
            `;
        });
    }
}

function updateAdminStats() {
    let today = new Date().toDateString();
    let todayPatients = patients.filter(p => p.date === today);
    let waiting = patients.filter(p => p.status === "Waiting");
    let completed = patients.filter(p => p.status === "Completed" && p.date === today);
    
    document.getElementById('todayCount').innerText = todayPatients.length;
    document.getElementById('waitingCount').innerText = waiting.length;
    document.getElementById('completedCount').innerText = completed.length;
}

function showTemporaryMessage(elementId, msg, type) {
    let el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = msg;
        el.className = type;
        setTimeout(() => {
            el.innerHTML = '';
            el.className = '';
        }, 3000);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Add check-in (Click 3)
function addCheckin(name, id, age, service, isReturning) {
    if (!name || !id) {
        showTemporaryMessage('msg', '❌ Name and ID required', 'error');
        return false;
    }
    
    let existing = patients.find(p => p.id === id);
    let time = getTime();
    let today = new Date().toDateString();
    
    if (existing && isReturning) {
        existing.status = "Waiting";
        existing.time = time;
        existing.date = today;
        showTemporaryMessage('msg', `✅ Welcome back ${name}! Queue #${patients.filter(p => p.status === "Waiting").length + 1}`, 'success');
    } else if (existing) {
        showTemporaryMessage('msg', '⚠️ Patient exists. Check "Returning patient" box', 'error');
        return false;
    } else {
        patients.unshift({
            name, id, age: age || 'N/A', service, time, status: "Waiting", date: today
        });
        let queuePosition = patients.filter(p => p.status === "Waiting").length;
        showTemporaryMessage('msg', `✅ ${name} checked in! Queue position: #${queuePosition}`, 'success');
    }
    
    saveData();
    renderRecent();
    renderPatients();
    renderQueue();
    updateAdminStats();
    updateQueueCount();
    resetToStart();
    return true;
}

// Navigation
function setupNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            let page = item.getAttribute('data-page');
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(page + 'Page').classList.add('active');
            
            if (page === 'patients') renderPatients();
            if (page === 'appointments') { renderQueue(); renderAppointments(); }
            if (page === 'clinicadmin') { updateAdminStats(); renderStaffTable(); }
            if (page === 'checkin') resetToStart();
        });
    });
}

// Live clock
function updateClock() {
    let clock = document.getElementById('liveTime');
    if (clock) {
        clock.innerText = new Date().toLocaleTimeString();
    }
}

// Initialize everything
function init() {
    loadData();
    setupNav();
    renderRecent();
    renderPatients();
    renderQueue();
    renderAppointments();
    renderStaffTable();
    updateAdminStats();
    updateQueueCount();
    setMode(currentMode);
    updateClock();
    setInterval(updateClock, 1000);
    
    // Load clinic info
    document.getElementById('clinicName').value = clinic.name || '';
    document.getElementById('clinicLocation').value = clinic.location || '';
    document.getElementById('clinicPhone').value = clinic.phone || '';
    
    // ============================================
    // 3-CLICK FLOW EVENT HANDLERS
    // ============================================
    
    // Click 1: START button
    document.getElementById('startBtn').onclick = () => {
        currentStep = 2;
        updateStepIndicator(2);
        document.getElementById('startSection').style.display = 'none';
        document.getElementById('checkinFormContainer').style.display = 'block';
        showTemporaryMessage('msg', 'Step 2: Enter patient details', 'success');
    };
    
    // Click 3: SUBMIT button
    document.getElementById('checkinBtn').onclick = () => {
        let name = document.getElementById('name').value;
        let contact = document.getElementById('contact').value;
        let age = document.getElementById('age').value;
        let service = document.getElementById('service').value;
        let returning = document.getElementById('returning').checked;
        
        if (!name || !contact) {
            showTemporaryMessage('msg', '❌ Please enter Name and ID', 'error');
            return;
        }
        
        currentStep = 3;
        updateStepIndicator(3);
        addCheckin(name, contact, age, service, returning);
    };
    
    // CANCEL button - resets to start
    document.getElementById('cancelBtn').onclick = () => {
        resetToStart();
        showTemporaryMessage('msg', 'Registration cancelled. Click Start to try again.', 'success');
    };
    
    // Search patients
    document.getElementById('searchBtn').onclick = () => {
        let term = document.getElementById('searchInput').value.toLowerCase();
        let filtered = patients.filter(p => p.name.toLowerCase().includes(term) || p.id.includes(term));
        let body = document.getElementById('patientsBody');
        if (filtered.length === 0) {
            body.innerHTML = '<tr><td colspan="5">No results found</td></tr>';
        } else {
            body.innerHTML = filtered.map(p => `
                <tr>
                    <td>${escapeHtml(p.name)}</td>
                    <td>${escapeHtml(p.id)}</td>
                    <td>${p.age}</td>
                    <td>${p.service}</td>
                    <td><span class="status-badge status-${p.status}">${p.status}</span></td>
                </tr>
            `).join('');
        }
    };
    
    // Add Staff
    document.getElementById('addStaffRowBtn').onclick = () => {
        addNewStaffRow();
    };
    
    // Mode buttons
    document.getElementById('onlineBtn').onclick = () => setMode('online');
    document.getElementById('offlineBtn').onclick = () => setMode('offline');
    document.getElementById('settingsOnlineBtn').onclick = () => setMode('online');
    document.getElementById('settingsOfflineBtn').onclick = () => setMode('offline');
    
    // Appointment modal
    const modal = document.getElementById('apptModal');
    document.getElementById('newApptBtn').onclick = () => {
        modal.style.display = 'flex';
    };
    document.getElementById('closeApptModal').onclick = () => {
        modal.style.display = 'none';
    };
    document.getElementById('saveApptBtn').onclick = () => {
        let name = document.getElementById('apptName').value;
        let id = document.getElementById('apptId').value;
        let date = document.getElementById('apptDate').value;
        let time = document.getElementById('apptTime').value;
        if (name && id && date && time) {
            appointments.push({ id: Date.now(), patientName: name, patientId: id, date, time });
            saveData();
            renderAppointments();
            modal.style.display = 'none';
            document.getElementById('apptName').value = '';
            document.getElementById('apptId').value = '';
            showTemporaryMessage('msg', '✅ Appointment scheduled!', 'success');
        } else {
            alert('Please fill all fields');
        }
    };
    
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };
    
    // Save clinic info
    document.getElementById('saveClinicBtn').onclick = () => {
        clinic.name = document.getElementById('clinicName').value;
        clinic.location = document.getElementById('clinicLocation').value;
        clinic.phone = document.getElementById('clinicPhone').value;
        saveData();
        showTemporaryMessage('msg', '✅ Clinic information saved!', 'success');
    };
    
    // Export and clear
    document.getElementById('exportBtn').onclick = () => {
        let data = { patients, appointments, staff, clinic, exportDate: new Date().toISOString() };
        let blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = `rhc_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };
    
    document.getElementById('clearBtn').onclick = () => {
        if (confirm('⚠️ WARNING: This will delete ALL data. This cannot be undone. Are you sure?')) {
            localStorage.clear();
            alert('All data cleared. Refresh the page to start fresh.');
            location.reload();
        }
    };
}

// Start
init();