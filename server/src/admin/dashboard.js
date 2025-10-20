// MediCore Admin Dashboard JavaScript
// Manages CRUD operations for all database tables

const API_BASE = '/api';
let currentTable = 'users';
let currentData = [];
let filteredData = [];
let currentPage = 1;
let recordsPerPage = 50;
let editingRecord = null;

// Table configurations with schema definitions
const tableConfigs = {
    users: {
        title: 'Users Management',
        endpoint: `${API_BASE}/admin/users`,
        primaryKey: 'id',
        columns: ['id', 'name', 'email', 'role', 'department', 'is_active', 'created_at'],
        displayNames: {
            id: 'ID',
            name: 'Name',
            email: 'Email',
            role: 'Role',
            department: 'Department',
            is_active: 'Active',
            created_at: 'Created At'
        },
        editableFields: ['name', 'email', 'role', 'department', 'is_active'],
        fieldTypes: {
            role: 'select',
            is_active: 'checkbox',
            department: 'text'
        },
        selectOptions: {
            role: ['admin', 'doctor', 'receptionist']
        }
    },
    patients: {
        title: 'Patients Management',
        endpoint: `${API_BASE}/admin/patients`,
        primaryKey: 'id',
        columns: ['id', 'name', 'age', 'gender', 'blood_group', 'phone', 'email', 'status', 'registration_date'],
        displayNames: {
            id: 'ID',
            name: 'Name',
            age: 'Age',
            gender: 'Gender',
            blood_group: 'Blood Group',
            phone: 'Phone',
            email: 'Email',
            status: 'Status',
            registration_date: 'Registered'
        },
        editableFields: ['name', 'age', 'gender', 'blood_group', 'phone', 'email', 'address', 'emergency_contact', 'status'],
        fieldTypes: {
            gender: 'select',
            blood_group: 'select',
            status: 'select',
            age: 'number',
            address: 'textarea',
            emergency_contact: 'text'
        },
        selectOptions: {
            gender: ['Male', 'Female', 'Other'],
            blood_group: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            status: ['Active', 'Archived']
        }
    },
    appointments: {
        title: 'Appointments Management',
        endpoint: `${API_BASE}/admin/appointments`,
        primaryKey: 'id',
        columns: ['id', 'patient_id', 'doctor_id', 'date', 'time', 'duration', 'status', 'reason'],
        displayNames: {
            id: 'ID',
            patient_id: 'Patient ID',
            doctor_id: 'Doctor ID',
            date: 'Date',
            time: 'Time',
            duration: 'Duration (min)',
            status: 'Status',
            reason: 'Reason'
        },
        editableFields: ['date', 'time', 'duration', 'status', 'reason', 'notes'],
        fieldTypes: {
            date: 'date',
            time: 'time',
            duration: 'number',
            status: 'select',
            reason: 'text',
            notes: 'textarea'
        },
        selectOptions: {
            status: ['Scheduled', 'Completed', 'Cancelled', 'No Show']
        }
    },
    medical_records: {
        title: 'Medical Records Management',
        endpoint: `${API_BASE}/admin/medical-records`,
        primaryKey: 'id',
        columns: ['id', 'patient_id', 'doctor_id', 'date', 'diagnosis', 'version', 'updated_by'],
        displayNames: {
            id: 'ID',
            patient_id: 'Patient ID',
            doctor_id: 'Doctor ID',
            date: 'Date',
            diagnosis: 'Diagnosis',
            version: 'Version',
            updated_by: 'Updated By'
        },
        editableFields: ['diagnosis', 'notes', 'updated_by'],
        fieldTypes: {
            date: 'date',
            diagnosis: 'textarea',
            notes: 'textarea'
        }
    },
    invoices: {
        title: 'Invoices Management',
        endpoint: `${API_BASE}/admin/invoices`,
        primaryKey: 'id',
        columns: ['id', 'patient_id', 'date', 'due_date', 'total_amount', 'paid_amount', 'status'],
        displayNames: {
            id: 'Invoice ID',
            patient_id: 'Patient ID',
            date: 'Date',
            due_date: 'Due Date',
            total_amount: 'Total',
            paid_amount: 'Paid',
            status: 'Status'
        },
        editableFields: ['due_date', 'status', 'paid_amount', 'payment_method'],
        fieldTypes: {
            due_date: 'date',
            status: 'select',
            paid_amount: 'number',
            payment_method: 'text'
        },
        selectOptions: {
            status: ['paid', 'pending', 'overdue']
        }
    },
    invoice_items: {
        title: 'Invoice Items Management',
        endpoint: `${API_BASE}/admin/invoice-items`,
        primaryKey: 'id',
        columns: ['id', 'invoice_id', 'description', 'category', 'quantity', 'price', 'total'],
        displayNames: {
            id: 'ID',
            invoice_id: 'Invoice ID',
            description: 'Description',
            category: 'Category',
            quantity: 'Qty',
            price: 'Price',
            total: 'Total'
        },
        editableFields: ['description', 'category', 'quantity', 'price', 'total'],
        fieldTypes: {
            quantity: 'number',
            price: 'number',
            total: 'number'
        }
    },
    reports: {
        title: 'Reports Management',
        endpoint: `${API_BASE}/admin/reports`,
        primaryKey: 'id',
        columns: ['id', 'report_type', 'generated_by', 'status', 'created_at'],
        displayNames: {
            id: 'ID',
            report_type: 'Type',
            generated_by: 'Generated By',
            status: 'Status',
            created_at: 'Created At'
        },
        editableFields: ['status'],
        fieldTypes: {
            status: 'select'
        },
        selectOptions: {
            status: ['pending', 'completed', 'failed']
        }
    }
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    checkServerStatus();
    loadTableData('users');
    setInterval(checkServerStatus, 30000); // Check every 30 seconds
});

// Check server and database status
async function checkServerStatus() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();

        document.getElementById('serverStatus').textContent = '●';
        document.getElementById('serverStatus').className = 'text-green-400';
        document.getElementById('dbStatus').textContent = '●';
        document.getElementById('dbStatus').className = 'text-green-400';
    } catch (error) {
        document.getElementById('serverStatus').textContent = '●';
        document.getElementById('serverStatus').className = 'text-red-400';
        document.getElementById('dbStatus').textContent = '●';
        document.getElementById('dbStatus').className = 'text-red-400';
    }
}

// Show specific table
function showTable(tableName) {
    currentTable = tableName;
    currentPage = 1;

    // Update active sidebar link
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update title
    const config = tableConfigs[tableName];
    document.getElementById('tableTitle').textContent = config.title;

    // Load data
    loadTableData(tableName);
}

// Load table data directly from database
async function loadTableData(tableName) {
    try {
        const config = tableConfigs[tableName];

        // Fetch data from admin API
        const response = await fetch(`${API_BASE}/admin/${tableName}`);

        if (response.ok) {
            const result = await response.json();
            currentData = result.data || [];
            filteredData = [...currentData];
            renderTable();
        } else {
            throw new Error('Failed to load data');
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Failed to load data from database', 'error');
        // Fallback to sample data for demonstration
        loadSampleData(tableName);
    }
}

// Load sample data for demonstration (until database connection is established)
function loadSampleData(tableName) {
    const sampleData = {
        users: [
            { id: '1', name: 'Dr. Sarah Johnson', email: 'sarah.johnson@medicore.com', role: 'doctor', department: 'Cardiology', is_active: 1, created_at: '2024-01-01' },
            { id: '2', name: 'Dr. Michael Chen', email: 'michael.chen@medicore.com', role: 'doctor', department: 'Neurology', is_active: 1, created_at: '2024-01-01' },
            { id: '3', name: 'Emily Davis', email: 'emily.davis@medicore.com', role: 'receptionist', department: null, is_active: 1, created_at: '2024-01-01' },
            { id: '4', name: 'Admin User', email: 'admin@medicore.com', role: 'admin', department: null, is_active: 1, created_at: '2024-01-01' },
        ],
        patients: [
            { id: 'P001', name: 'John Smith', age: 45, gender: 'Male', blood_group: 'O+', phone: '+1-555-0101', email: 'john.smith@email.com', status: 'Active', registration_date: '2024-01-15' },
            { id: 'P002', name: 'Maria Garcia', age: 32, gender: 'Female', blood_group: 'A+', phone: '+1-555-0201', email: 'maria.garcia@email.com', status: 'Active', registration_date: '2024-02-20' },
        ],
        appointments: [
            { id: 'A001', patient_id: 'P001', doctor_id: '1', date: '2025-10-20', time: '09:00:00', duration: 30, status: 'Scheduled', reason: 'Routine checkup' },
            { id: 'A002', patient_id: 'P002', doctor_id: '2', date: '2025-10-20', time: '10:30:00', duration: 45, status: 'Scheduled', reason: 'Headache consultation' },
        ],
        medical_records: [
            { id: 'MR001', patient_id: 'P001', doctor_id: '1', date: '2025-10-19', diagnosis: 'Hypertension - Well Controlled', version: 1, updated_by: 'Dr. Sarah Johnson' },
        ],
        invoices: [
            { id: 'INV001', patient_id: 'P001', date: '2025-10-19', due_date: '2025-11-03', total_amount: 330.00, paid_amount: 330.00, status: 'paid' },
            { id: 'INV002', patient_id: 'P002', date: '2025-10-15', due_date: '2025-10-30', total_amount: 165.00, paid_amount: 0.00, status: 'pending' },
        ],
        invoice_items: [
            { id: 'ITEM001', invoice_id: 'INV001', description: 'Consultation - Cardiology', category: 'Consultation', quantity: 1, price: 150.00, total: 150.00 },
        ],
        reports: []
    };

    currentData = sampleData[tableName] || [];
    filteredData = [...currentData];
    renderTable();
}

// Render table
function renderTable() {
    const config = tableConfigs[currentTable];
    const headerRow = document.getElementById('tableHeader');
    const tbody = document.getElementById('tableBody');

    // Clear existing content
    headerRow.innerHTML = '';
    tbody.innerHTML = '';

    // Create header
    config.columns.forEach(col => {
        const th = document.createElement('th');
        th.className = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
        th.textContent = config.displayNames[col] || col;
        headerRow.appendChild(th);
    });

    // Add actions column
    const actionsth = document.createElement('th');
    actionsth.className = 'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider';
    actionsth.textContent = 'Actions';
    headerRow.appendChild(actionsth);

    // Create rows
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    pageData.forEach(record => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50';

        config.columns.forEach(col => {
            const td = document.createElement('td');
            td.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';

            let value = record[col];

            // Format specific types
            if (col.includes('date') || col.includes('_at')) {
                value = formatDate(value);
            } else if (col.includes('amount') || col.includes('price') || col.includes('total')) {
                value = formatCurrency(value);
            } else if (typeof value === 'boolean' || col === 'is_active') {
                value = value ? '✅ Yes' : '❌ No';
            } else if (col === 'status') {
                value = `<span class="px-2 py-1 text-xs rounded-full ${getStatusColor(value)}">${value}</span>`;
            }

            td.innerHTML = value !== null && value !== undefined ? value : '-';
            tr.appendChild(td);
        });

        // Add actions
        const actionsTd = document.createElement('td');
        actionsTd.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
        actionsTd.innerHTML = `
            <button onclick="editRecord('${record[config.primaryKey]}')" class="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
            <button onclick="deleteRecord('${record[config.primaryKey]}')" class="text-red-600 hover:text-red-900">Delete</button>
        `;
        tr.appendChild(actionsTd);

        tbody.appendChild(tr);
    });

    // Update record count
    document.getElementById('recordCount').textContent = filteredData.length;
    document.getElementById('currentPage').textContent = currentPage;
}

// Filter table based on search
function filterTable() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    if (!searchTerm) {
        filteredData = [...currentData];
    } else {
        filteredData = currentData.filter(record => {
            return Object.values(record).some(value =>
                String(value).toLowerCase().includes(searchTerm)
            );
        });
    }

    currentPage = 1;
    renderTable();
}

// Pagination
function nextPage() {
    const totalPages = Math.ceil(filteredData.length / recordsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

// Edit record
function editRecord(id) {
    const config = tableConfigs[currentTable];
    const record = currentData.find(r => r[config.primaryKey] === id);

    if (!record) return;

    editingRecord = { ...record };

    document.getElementById('modalTitle').textContent = `Edit ${config.title.replace(' Management', '')}`;

    const formFields = document.getElementById('formFields');
    formFields.innerHTML = '';

    // Create form fields
    config.editableFields.forEach(field => {
        const fieldType = config.fieldTypes?.[field] || 'text';
        const div = document.createElement('div');
        div.className = 'mb-4';

        const label = document.createElement('label');
        label.className = 'block text-sm font-medium text-gray-700 mb-2';
        label.textContent = config.displayNames[field] || field;

        let input;

        if (fieldType === 'select') {
            input = document.createElement('select');
            input.className = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500';

            const options = config.selectOptions[field] || [];
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                option.selected = record[field] === opt;
                input.appendChild(option);
            });
        } else if (fieldType === 'textarea') {
            input = document.createElement('textarea');
            input.className = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500';
            input.rows = 4;
            input.value = record[field] || '';
        } else if (fieldType === 'checkbox') {
            input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'w-4 h-4';
            input.checked = record[field];
        } else {
            input = document.createElement('input');
            input.type = fieldType;
            input.className = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500';
            input.value = record[field] || '';
        }

        input.id = `field_${field}`;
        input.name = field;

        div.appendChild(label);
        div.appendChild(input);
        formFields.appendChild(div);
    });

    document.getElementById('editModal').classList.add('active');
}

// Save record
async function saveRecord(event) {
    event.preventDefault();

    const config = tableConfigs[currentTable];
    const formData = new FormData(event.target);
    const updatedData = {};

    for (let [key, value] of formData.entries()) {
        updatedData[key] = value;
    }

    try {
        // Send update to API
        const response = await fetch(`${API_BASE}/admin/${currentTable}/${editingRecord[config.primaryKey]}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData),
        });

        if (response.ok) {
            // Reload data from database
            await loadTableData(currentTable);
            closeModal();
            showNotification('Record updated successfully!', 'success');
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update record');
        }
    } catch (error) {
        console.error('Save error:', error);
        showNotification(error.message || 'Failed to save record', 'error');
    }
}

// Delete record
async function deleteRecord(id) {
    if (!confirm('Are you sure you want to delete this record?')) return;

    const config = tableConfigs[currentTable];

    try {
        // Send delete request to API
        const response = await fetch(`${API_BASE}/admin/${currentTable}/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            // Reload data from database
            await loadTableData(currentTable);
            showNotification('Record deleted successfully!', 'success');
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete record');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification(error.message || 'Failed to delete record', 'error');
    }
}

// Show create modal
function showCreateModal() {
    alert('Create functionality coming soon! This will open a form to add new records.');
}

// Close modal
function closeModal() {
    document.getElementById('editModal').classList.remove('active');
    editingRecord = null;
}

// Refresh data
function refreshData() {
    loadTableData(currentTable);
    showNotification('Data refreshed!', 'info');
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function getStatusColor(status) {
    const colors = {
        Active: 'bg-green-100 text-green-800',
        Archived: 'bg-gray-100 text-gray-800',
        Scheduled: 'bg-blue-100 text-blue-800',
        Completed: 'bg-green-100 text-green-800',
        Cancelled: 'bg-red-100 text-red-800',
        paid: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        overdue: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function showNotification(message, type = 'info') {
    // Simple notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        'bg-blue-500'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}
