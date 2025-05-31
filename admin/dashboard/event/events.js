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

    // Format date for display
    function formatDisplayDate(date,timeZone) {
        return new Date(date).toLocaleDateString('en-US', {
            timeZone:timeZone,
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

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

    // Fetch events
    async function fetchEvents(page = 1) {
        try {
            console.log('Fetching events, page:', page);
            const response = await fetch(`${baseURL}/admin/event/viewEvent?page=${page}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.status !== 200) throw new Error(`Failed to fetch events: ${response.status}`);
            const result = await response.json();
            if (result.status !== 'Success' || !result.data.events) throw new Error('Invalid response');
            renderEvents(result.data.events, result.data.total, result.data.page, result.data.pages);
        } catch (error) {
            console.error('Error fetching events:', error);
            eventTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load events.</td></tr>';
        } finally {
            document.getElementById('spinner').classList.remove('show');
        }
    }

    // Render events table
    function renderEvents(events, total, page, pages) {
        eventTableBody.innerHTML = '';
        events.forEach(event => {
            const row = document.createElement('tr');
            const fromDate = formatDisplayDate(event.eventDetails.fromDate,event.eventDetails.timeZone);
            const toDate = formatDisplayDate(event.eventDetails.toDate,event.eventDetails.timeZone);
            const dateRange = fromDate === toDate ? fromDate : `${fromDate} - ${toDate}`;
            const newStatus = event.status === 'active' ? 'inactive' : 'active';
            row.innerHTML = `
                <td>${dateRange}</td>
                <td>${event.partner?.restaurantName || 'N/A'}</td>
                <td>${event.eventDetails.description || 'N/A'}</td>
                <td>${event.eventDetails.fromTime} - ${event.eventDetails.toTime}</td>
                <td>${event.eventDetails.timeZone || 'N/A'}</td>
                <td><span class="badge ${event.status === 'active' ? 'bg-success' : 'bg-warning'}">${event.status.charAt(0).toUpperCase() + event.status.slice(1)}</span></td>
                <td>
                    <a href="./view-event.html?id=${event._id}" class="btn btn-sm btn-primary"><i class="fa fa-eye"></i> View</a>
                    <button class="btn btn-sm btn-warning statusBtn" data-id="${event._id}" data-status="${newStatus}"><i class="fa fa-sync"></i> Set ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</button>
                </td>
            `;
            eventTableBody.appendChild(row);
        });

        // Update page info
        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);
        pageInfo.textContent = `Showing ${start} to ${end} of ${total} entries`;

        // Render pagination
        pagination.innerHTML = '';
        for (let i = 1; i <= pages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === page ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = i;
                fetchEvents(i);
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
        formData.set('timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);
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
            fetchEvents(currentPage);
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
            fetchEvents(currentPage);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status. Please try again.');
        }
    }

    // Initialize
    populatePartners(document.getElementById('partnerId'));
    fetchEvents();
});