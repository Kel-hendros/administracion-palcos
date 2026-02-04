// State
let state = {
    selectedEvent: null,
    asignaciones: [],
    reservas: [],
    fileAsignaciones: null,
    fileReservas: null
};

// DOM Elements
const eventSelector = document.getElementById('eventSelector');
const eventDropdown = document.getElementById('eventDropdown');
const selectedEventText = document.getElementById('selectedEvent');
const eventContent = document.getElementById('eventContent');
const emptyState = document.getElementById('emptyState');
const inheritBanner = document.getElementById('inheritBanner');
const inheritFrom = document.getElementById('inheritFrom');

// Metrics
const metricAsignados = document.getElementById('metricAsignados');
const metricReservados = document.getElementById('metricReservados');
const metricUsuarios = document.getElementById('metricUsuarios');
const metricSecciones = document.getElementById('metricSecciones');

// Tables
const asignacionesTable = document.getElementById('asignacionesTable');
const reservasTable = document.getElementById('reservasTable');

// Search
const searchInput = document.getElementById('searchInput');

// File uploads
const dropzoneAsignaciones = document.getElementById('dropzoneAsignaciones');
const dropzoneReservas = document.getElementById('dropzoneReservas');
const fileAsignaciones = document.getElementById('fileAsignaciones');
const fileReservas = document.getElementById('fileReservas');
const fileInfoAsig = document.getElementById('fileInfoAsig');
const fileInfoRes = document.getElementById('fileInfoRes');
const btnCargarAsignaciones = document.getElementById('btnCargarAsignaciones');
const btnCargarReservas = document.getElementById('btnCargarReservas');

// Modals
const modalOverlay = document.getElementById('modalOverlay');
const confirmModal = document.getElementById('confirmModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const confirmInputWrapper = document.getElementById('confirmInputWrapper');
const confirmInput = document.getElementById('confirmInput');
const modalCancel = document.getElementById('modalCancel');
const modalConfirm = document.getElementById('modalConfirm');

const resultModalOverlay = document.getElementById('resultModalOverlay');
const resultTitle = document.getElementById('resultTitle');
const resultIcon = document.getElementById('resultIcon');
const resultSummary = document.getElementById('resultSummary');
const resultErrors = document.getElementById('resultErrors');
const resultClose = document.getElementById('resultClose');

// Toast container
const toastContainer = document.getElementById('toastContainer');

// Initialize Lucide icons
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initEventListeners();
});

function initEventListeners() {
    // Event selector dropdown
    eventSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        eventDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        eventDropdown.classList.remove('show');
    });

    // Event selection
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const type = item.dataset.type;
            const id = item.dataset.id;
            const name = item.textContent;
            selectEvent({ type, id, name });
        });
    });

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            switchTab(tabId);
        });
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        renderAsignaciones(e.target.value);
    });

    // File upload - Asignaciones
    setupDropzone(dropzoneAsignaciones, fileAsignaciones, (file) => {
        state.fileAsignaciones = file;
        fileInfoAsig.textContent = `📄 ${file.name}`;
        fileInfoAsig.classList.add('has-file');
        btnCargarAsignaciones.disabled = false;
    });

    // File upload - Reservas
    setupDropzone(dropzoneReservas, fileReservas, (file) => {
        state.fileReservas = file;
        fileInfoRes.textContent = `📄 ${file.name}`;
        fileInfoRes.classList.add('has-file');
        btnCargarReservas.disabled = false;
    });

    // Cargar buttons
    btnCargarAsignaciones.addEventListener('click', () => {
        if (state.fileAsignaciones) {
            processCSV(state.fileAsignaciones, 'asignaciones');
        }
    });

    btnCargarReservas.addEventListener('click', () => {
        if (state.fileReservas) {
            processCSV(state.fileReservas, 'reservas');
        }
    });

    // Download templates
    document.getElementById('downloadTemplateAsig').addEventListener('click', () => {
        downloadTemplate('asignaciones');
    });

    document.getElementById('downloadTemplateRes').addEventListener('click', () => {
        downloadTemplate('reservas');
    });

    // Export
    document.getElementById('exportBtn').addEventListener('click', exportAsignaciones);

    // Modal events
    modalCancel.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    confirmInput.addEventListener('input', (e) => {
        modalConfirm.disabled = e.target.value !== 'CONFIRMAR';
    });

    resultClose.addEventListener('click', closeResultModal);
    resultModalOverlay.addEventListener('click', (e) => {
        if (e.target === resultModalOverlay) closeResultModal();
    });
}

function setupDropzone(dropzone, fileInput, onFile) {
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            onFile(file);
        } else {
            showToast('Por favor selecciona un archivo CSV', 'error');
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            onFile(file);
        }
    });
}

function selectEvent(event) {
    state.selectedEvent = event;
    selectedEventText.textContent = event.name;
    eventDropdown.classList.remove('show');

    // Show content
    eventContent.classList.remove('hidden');
    emptyState.classList.add('hidden');

    // Show/hide inherit banner
    if (event.type === 'evento') {
        inheritBanner.classList.remove('hidden');
        inheritFrom.textContent = 'Abono Clausura 2025';
    } else {
        inheritBanner.classList.add('hidden');
    }

    // Reset data
    state.asignaciones = [];
    state.reservas = [];
    updateMetrics();
    renderAsignaciones();
    renderReservas();

    lucide.createIcons();
}

function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabId}`);
    });

    lucide.createIcons();
}

function updateMetrics() {
    const uniqueUsers = new Set(state.asignaciones.map(a => a.email));
    const uniqueSections = new Set([
        ...state.asignaciones.map(a => a.section_code),
        ...state.reservas.map(r => r.section_code)
    ]);

    metricAsignados.textContent = state.asignaciones.length;
    metricReservados.textContent = state.reservas.length;
    metricUsuarios.textContent = uniqueUsers.size;
    metricSecciones.textContent = uniqueSections.size;
}

function renderAsignaciones(searchTerm = '') {
    if (state.asignaciones.length === 0) {
        asignacionesTable.innerHTML = `
            <div class="empty-state">
                <i data-lucide="inbox"></i>
                <p>No hay asignaciones para este evento</p>
                <span>Carga un archivo CSV en la pestaña "Cargar datos"</span>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    // Filter by search
    let filtered = state.asignaciones;
    if (searchTerm) {
        filtered = state.asignaciones.filter(a =>
            a.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Group by user
    const grouped = groupByUser(filtered);

    let html = '';
    for (const [email, items] of Object.entries(grouped)) {
        const isAbono = items[0].origen === 'abono';
        const initials = getInitials(email);
        const count = items.length;

        html += `
            <div class="user-group">
                <div class="user-header ${isAbono ? 'abono' : 'direct'}">
                    <div class="user-info">
                        <div class="user-avatar ${isAbono ? 'abono' : 'direct'}">${initials}</div>
                        <span class="user-email">${email}</span>
                        <span class="user-badge ${isAbono ? 'abono' : 'direct'}">
                            ${count} asiento${count > 1 ? 's' : ''} · ${isAbono ? 'Abono Clausura' : 'Directo'}
                        </span>
                    </div>
                    ${isAbono
                        ? '<span class="inherited-label">Heredado de abono</span>'
                        : `<button class="btn btn-danger-outline btn-sm" onclick="confirmDeleteAll('${email}')">
                            <i data-lucide="trash-2"></i>
                            <span>Eliminar todos</span>
                           </button>`
                    }
                </div>
                ${items.map(item => `
                    <div class="table-row">
                        <div class="td td-user"></div>
                        <div class="td td-seccion">${item.section_code}</div>
                        <div class="td td-asiento">${item.seat}</div>
                        <div class="td td-fecha">${item.fecha}</div>
                        <div class="td td-acciones">
                            ${isAbono
                                ? '<span class="no-action">—</span>'
                                : `<button class="delete-btn" onclick="confirmDeleteSingle('${email}', '${item.section_code}', '${item.seat}')">
                                    <i data-lucide="trash-2"></i>
                                   </button>`
                            }
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    asignacionesTable.innerHTML = html;
    lucide.createIcons();
}

function renderReservas() {
    if (state.reservas.length === 0) {
        reservasTable.innerHTML = `
            <div class="empty-state">
                <i data-lucide="inbox"></i>
                <p>No hay reservas para este evento</p>
                <span>Carga un archivo CSV en la pestaña "Cargar datos"</span>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    let html = state.reservas.map(item => `
        <div class="table-row">
            <div class="td td-seccion">${item.section_code}</div>
            <div class="td td-asiento">${item.seat}</div>
            <div class="td td-user">${item.email}</div>
            <div class="td td-fecha">${item.fecha}</div>
        </div>
    `).join('');

    reservasTable.innerHTML = html;
}

function groupByUser(asignaciones) {
    return asignaciones.reduce((groups, item) => {
        const key = item.email;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

function getInitials(email) {
    const name = email.split('@')[0];
    const parts = name.split(/[._-]/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function processCSV(file, type) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Validate headers
        const requiredHeaders = ['email', 'section_code', 'seat'];
        const hasAllHeaders = requiredHeaders.every(h => headers.includes(h));

        if (!hasAllHeaders) {
            showToast('El archivo CSV no tiene las columnas requeridas: email, section_code, seat', 'error');
            return;
        }

        const emailIdx = headers.indexOf('email');
        const sectionIdx = headers.indexOf('section_code');
        const seatIdx = headers.indexOf('seat');

        const results = { success: 0, errors: [] };
        const newItems = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length < 3) continue;

            const email = values[emailIdx]?.trim();
            const section_code = values[sectionIdx]?.trim();
            const seat = values[seatIdx]?.trim();

            // Validate
            if (!email || !section_code || !seat) {
                results.errors.push({ row: i + 1, email, section_code, seat, error: 'Campos vacíos' });
                continue;
            }

            if (!email.includes('@')) {
                results.errors.push({ row: i + 1, email, section_code, seat, error: 'Email inválido' });
                continue;
            }

            // Check for duplicates
            const isDuplicate = type === 'asignaciones'
                ? state.asignaciones.some(a => a.section_code === section_code && a.seat === seat)
                : state.reservas.some(r => r.section_code === section_code && r.seat === seat);

            if (isDuplicate) {
                results.errors.push({ row: i + 1, email, section_code, seat, error: 'Asiento ya ocupado' });
                continue;
            }

            newItems.push({
                email,
                section_code,
                seat,
                fecha: new Date().toLocaleDateString('es-ES'),
                origen: 'directo'
            });
            results.success++;
        }

        // Add to state
        if (type === 'asignaciones') {
            state.asignaciones = [...state.asignaciones, ...newItems];
            renderAsignaciones();
        } else {
            state.reservas = [...state.reservas, ...newItems];
            renderReservas();
        }

        updateMetrics();
        showResultModal(results, type);

        // Reset file input
        if (type === 'asignaciones') {
            state.fileAsignaciones = null;
            fileInfoAsig.textContent = '';
            fileInfoAsig.classList.remove('has-file');
            btnCargarAsignaciones.disabled = true;
            fileAsignaciones.value = '';
        } else {
            state.fileReservas = null;
            fileInfoRes.textContent = '';
            fileInfoRes.classList.remove('has-file');
            btnCargarReservas.disabled = true;
            fileReservas.value = '';
        }

        // Switch to corresponding tab
        switchTab(type === 'asignaciones' ? 'asignaciones' : 'reservas');
    };
    reader.readAsText(file);
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

function downloadTemplate(type) {
    const csv = 'email,section_code,seat\nusuario@ejemplo.com,PALCO_VIP_A,A-01\nusuario@ejemplo.com,PALCO_VIP_A,A-02';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla_${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Plantilla descargada', 'success');
}

function exportAsignaciones() {
    if (state.asignaciones.length === 0) {
        showToast('No hay datos para exportar', 'error');
        return;
    }

    const headers = ['email', 'section_code', 'seat', 'fecha', 'origen'];
    const rows = state.asignaciones.map(a =>
        [a.email, a.section_code, a.seat, a.fecha, a.origen].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asignaciones_${state.selectedEvent.name.replace(/\s/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Asignaciones exportadas', 'success');
}

// Delete functions
let pendingDelete = null;

function confirmDeleteSingle(email, section_code, seat) {
    pendingDelete = { type: 'single', email, section_code, seat };
    modalTitle.textContent = 'Eliminar asignación';
    modalMessage.innerHTML = `
        ¿Estás seguro de eliminar la asignación del asiento <strong>${section_code}-${seat}</strong>
        para el usuario <strong>${email}</strong>?<br><br>
        Esta acción eliminará el ticket del usuario. No se puede deshacer.
    `;
    confirmInputWrapper.classList.add('hidden');
    modalConfirm.disabled = false;
    modalConfirm.onclick = executeDelete;
    modalOverlay.classList.add('show');
}

function confirmDeleteAll(email) {
    const count = state.asignaciones.filter(a => a.email === email && a.origen !== 'abono').length;
    pendingDelete = { type: 'all', email };
    modalTitle.textContent = '⚠️ ATENCIÓN: Acción destructiva';
    modalMessage.innerHTML = `
        Estás a punto de eliminar <strong>TODAS</strong> las asignaciones directas del usuario
        <strong>${email}</strong> para este evento:<br><br>
        • <strong>${count}</strong> asientos serán liberados<br>
        • <strong>${count}</strong> tickets serán eliminados de la cuenta del usuario<br><br>
        Esta acción NO afecta asignaciones heredadas de abonos.<br>
        Esta acción NO se puede deshacer.
    `;
    confirmInputWrapper.classList.remove('hidden');
    confirmInput.value = '';
    modalConfirm.disabled = true;
    modalConfirm.onclick = executeDelete;
    modalOverlay.classList.add('show');
}

function executeDelete() {
    if (!pendingDelete) return;

    if (pendingDelete.type === 'single') {
        state.asignaciones = state.asignaciones.filter(a =>
            !(a.email === pendingDelete.email &&
              a.section_code === pendingDelete.section_code &&
              a.seat === pendingDelete.seat)
        );
        showToast('Asignación eliminada correctamente', 'success');
    } else if (pendingDelete.type === 'all') {
        state.asignaciones = state.asignaciones.filter(a =>
            a.email !== pendingDelete.email || a.origen === 'abono'
        );
        showToast(`Todas las asignaciones de ${pendingDelete.email} fueron eliminadas`, 'success');
    }

    updateMetrics();
    renderAsignaciones(searchInput.value);
    closeModal();
    pendingDelete = null;
}

function closeModal() {
    modalOverlay.classList.remove('show');
    pendingDelete = null;
}

function showResultModal(results, type) {
    const typeLabel = type === 'asignaciones' ? 'asignaciones' : 'reservas';

    if (results.errors.length === 0) {
        resultIcon.setAttribute('data-lucide', 'check-circle');
        resultIcon.classList.remove('error', 'warning');
        resultIcon.classList.add('success');
        resultTitle.textContent = 'Carga completada';
        resultSummary.innerHTML = `<p>✅ <strong>${results.success}</strong> ${typeLabel} creadas exitosamente</p>`;
        resultSummary.classList.remove('has-errors');
        resultErrors.innerHTML = '';
    } else {
        resultIcon.setAttribute('data-lucide', 'alert-circle');
        resultIcon.classList.remove('success');
        resultIcon.classList.add('warning');
        resultTitle.textContent = 'Carga completada con errores';
        resultSummary.innerHTML = `
            <p>✅ ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} creadas exitosamente: <strong>${results.success}</strong></p>
            <p>⚠️ Filas con errores: <strong>${results.errors.length}</strong></p>
        `;
        resultSummary.classList.add('has-errors');

        resultErrors.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Fila</th>
                        <th>Email</th>
                        <th>Sección</th>
                        <th>Asiento</th>
                        <th>Error</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.errors.map(err => `
                        <tr>
                            <td>${err.row}</td>
                            <td>${err.email || '-'}</td>
                            <td>${err.section_code || '-'}</td>
                            <td>${err.seat || '-'}</td>
                            <td>${err.error}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    lucide.createIcons();
    resultModalOverlay.classList.add('show');
}

function closeResultModal() {
    resultModalOverlay.classList.remove('show');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'}"></i>
        <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Demo data - add some sample data for testing
function loadDemoData() {
    state.asignaciones = [
        { email: 'maria.lopez@email.com', section_code: 'PALCO_VIP_B', seat: 'B-01', fecha: '02/02/2025', origen: 'directo' },
        { email: 'maria.lopez@email.com', section_code: 'PALCO_VIP_B', seat: 'B-02', fecha: '02/02/2025', origen: 'directo' },
        { email: 'maria.lopez@email.com', section_code: 'PALCO_VIP_B', seat: 'B-03', fecha: '02/02/2025', origen: 'directo' },
        { email: 'maria.lopez@email.com', section_code: 'PALCO_VIP_B', seat: 'B-04', fecha: '02/02/2025', origen: 'directo' },
        { email: 'maria.lopez@email.com', section_code: 'PALCO_VIP_B', seat: 'B-05', fecha: '02/02/2025', origen: 'directo' },
        { email: 'carlos.garcia@email.com', section_code: 'PALCO_VIP_A', seat: 'A-01', fecha: '01/02/2025', origen: 'abono' },
        { email: 'carlos.garcia@email.com', section_code: 'PALCO_VIP_A', seat: 'A-02', fecha: '01/02/2025', origen: 'abono' },
        { email: 'juan.martinez@email.com', section_code: 'PALCO_C', seat: 'C-12', fecha: '03/02/2025', origen: 'directo' },
    ];

    state.reservas = [
        { email: 'reservas-atlas@fanki.co', section_code: 'PLATEA_A', seat: 'PA-101', fecha: '01/02/2025' },
        { email: 'reservas-atlas@fanki.co', section_code: 'PLATEA_A', seat: 'PA-102', fecha: '01/02/2025' },
        { email: 'reservas-atlas@fanki.co', section_code: 'PLATEA_B', seat: 'PB-050', fecha: '01/02/2025' },
    ];

    updateMetrics();
    renderAsignaciones();
    renderReservas();
}

// Add a button to load demo data (optional)
window.loadDemoData = loadDemoData;
