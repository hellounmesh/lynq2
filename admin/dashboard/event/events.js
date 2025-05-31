const { DateTime } = luxon;
const baseURL = 'http://localhost:8000';
const adminToken = localStorage.getItem('adminToken');

if (!adminToken) {
    alert('Please log in to access this page.');
    setTimeout(() => {
        window.location.href = '../../login/login.html';
    }, 1000);
}

function logout() {
    localStorage.removeItem('adminToken');
    setTimeout(() => {
        window.location.href = '../../login/login.html';
    }, 1000);
}

document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('events.js loaded');
    const addEventForm = document.getElementById('addEventForm');
    const eventTableBody = document.getElementById('eventTableBody');
    const pageInfo = document.getElementById('pageInfo');
    const pagination = document.getElementById('pagination');
    let currentPage = 1;
    const limit = 15;
    let allEvents = []; // Store all fetched events for local pagination

    // Fetch partners for dropdown
    async function populatePartners(selectElement) {
        try {
            const response = await fetch(`${baseURL}/admin/partner/name`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.status !== 200) throw new Error('Failed to fetch partners');
            const result = await response.json();
            if (result.status !== 'Success' || !result.data.partners) throw new Error('Invalid response');
            selectElement.innerHTML = '<option value="">Select Partner</option>';
            result.data.partners.forEach(partner => {
                const option = document.createElement('option');
                option.value = partner._id;
                option.textContent = partner.restaurantName;
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching partners:', error);
            selectElement.innerHTML = '<option value="">Error loading partners</option>';
        }
    }

    // Format date for display with better error handling
    function formatDisplayDate(date, timeZone) {
        try {
            if (!date) throw new Error('Date is undefined or null');
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) throw new Error('Invalid Date');
            return parsedDate.toLocaleDateString('en-US', {
                timeZone: timeZone || 'Asia/Kolkata', // Default to IST
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', date, 'Error:', error.message);
            return 'N/A'; // Fallback for invalid dates
        }
    }

    // Convert 24-hour time (e.g., "14:30") to 12-hour format (e.g., "2:30 PM")
    function format12Hour(time) {
        try {
            const [hours, minutes] = time.split(':').map(Number);
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        } catch (error) {
            console.error('Error formatting time:', error);
            return time; // Fallback to original if parsing fails
        }
    }

    // Convert 12-hour time (e.g., "2:30 PM") to 24-hour format (e.g., "14:30")
    function convertTo24Hour(timeStr) {
        try {
            const [time, period] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period && period.toLowerCase() === 'pm' && hours !== 12) {
                hours += 12;
            } else if (period && period.toLowerCase() === 'am' && hours === 12) {
                hours = 0;
            }
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        } catch (error) {
            console.error('Error converting time:', error);
            return timeStr; // Fallback to input if parsing fails
        }
    }

    // Fetch events with detailed debugging
    async function fetchEvents() {
        try {
            console.log('Fetching events with token:', adminToken);
            const response = await fetch(`${baseURL}/admin/event/viewEvent`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Response status:', response.status);
            if (response.status !== 200) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch events: ${response.status} - ${errorText}`);
            }
            const result = await response.json();
            console.log('Raw events response:', result);
            if (result.status !== 'Success') throw new Error(`Backend status not Success: ${result.status}`);
            if (!result.data || !result.data.events) throw new Error('Invalid response structure: missing data.events');
            allEvents = result.data.events;
            console.log('Processed events:', allEvents);
            renderEvents(currentPage);
        } catch (error) {
            console.error('Error fetching events:', error.message);
            eventTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load events: ' + error.message + '</td></tr>';
        } finally {
            document.getElementById('spinner').classList.remove('show');
        }
    }

    // Render events table with local pagination and safe field access
    function renderEvents(page) {
        eventTableBody.innerHTML = '';
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedEvents = allEvents.slice(start, end);

        paginatedEvents.forEach(event => {
            const row = document.createElement('tr');
            const fromDate = formatDisplayDate(event.fromDate, event.timeZone);
            const toDate = formatDisplayDate(event.toDate, event.timeZone);
            const dateRange = fromDate === toDate ? fromDate : `${fromDate} - ${toDate}`;
            const newStatus = event.status === 'active' ? 'inactive' : 'active';
            const partnerName = event.restaurentId?.restaurantName || event.partner?.restaurantName || 'N/A';
            row.innerHTML = `
                <td>${dateRange}</td>
                <td>${partnerName}</td>
                <td>${event.description || 'N/A'}</td>
                <td>${event.fromTime ? format12Hour(event.fromTime) : 'N/A'} - ${event.toTime ? format12Hour(event.toTime) : 'N/A'}</td>
                <td>${event.timeZone || 'N/A'}</td>
                <td><span class="badge ${event.status === 'active' ? 'bg-success' : 'bg-warning'}">${event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : 'N/A'}</span></td>
                <td>
                    <a href="./view-event.html?id=${event._id}" class="btn btn-sm btn-primary"><i class="fa fa-eye"></i> View</a>
                    <button class="btn btn-sm btn-warning statusBtn" data-id="${event._id}" data-status="${newStatus}"><i class="fa fa-sync"></i> Set ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</button>
                </td>
            `;
            eventTableBody.appendChild(row);
        });

        // Update page info
        const total = allEvents.length;
        const startIdx = Math.min(start + 1, total);
        const endIdx = Math.min(end, total);
        pageInfo.textContent = `Showing ${startIdx} to ${endIdx} of ${total} entries`;

        // Render pagination
        const totalPages = Math.ceil(total / limit);
        pagination.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === page ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = i;
                renderEvents(i);
            });
            pagination.appendChild(li);
        }

        // Attach status update listeners
        document.querySelectorAll('.statusBtn').forEach(btn => {
            btn.addEventListener('click', () => updateStatus(btn.dataset.id, btn.dataset.status));
        });
    }

    // Add event
    addEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addEventForm);
        const fromTime = document.getElementById('fromTime').value;
        const toTime = document.getElementById('toTime').value;

        if (!fromTime || !toTime) {
            alert('Please provide both from and to times.');
            return;
        }

        // Convert times to 24-hour format
        formData.set('fromTime', convertTo24Hour(fromTime));
        formData.set('toTime', convertTo24Hour(toTime));
        formData.append('timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

        try {
            console.log('Adding new event');
            const response = await fetch(`${baseURL}/admin/event/addEvent`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                },
                body: formData
            });
            if (response.status !== 200) throw new Error(`Failed to add event: ${response.status}`);
            const result = await response.json();
            if (result.status !== 'Success') throw new Error(result.message || 'Add event failed');
            alert('Event added successfully!');
            addEventForm.reset();
            fetchEvents();
        } catch (error) {
            console.error('Error adding event:', error);
            alert('Failed to add event. Please try again.');
        }
    });

    // Update status
    async function updateStatus(eventId, newStatus) {
        try {
            console.log(`Updating status for event ${eventId} to ${newStatus}`);
            const response = await fetch(`${baseURL}/admin/event/updateEvent/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.status !== 200) throw new Error(`Failed to update status: ${response.status}`);
            const result = await response.json();
            if (result.status !== 'Success') throw new Error(result.message || 'Status update failed');
            alert(`Event status updated to ${newStatus}!`);
            fetchEvents();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status. Please try again.');
        }
    }

    // Initialize
    populatePartners(document.getElementById('partnerId'));
    fetchEvents();
});