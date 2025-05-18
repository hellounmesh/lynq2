const baseURL = 'https://lynqdxb.onrender.com'

const adminToken = localStorage.getItem("adminToken");

if(!adminToken) {
    setTimeout( () => {
        window.location.href = '../../login/login.html'

    },3000)
}

function logout() {
    localStorage.removeItem('adminToken')
    setTimeout( () => {
        window.location.href = '../../login/login.html'

    },1000)
}

document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault()
    logout();
});

document.addEventListener('DOMContentLoaded', () => {
    const rowsPerPage = 15;
    let currentPage = 1;
    let events = [];
    let partners = [];
    let hasNextPage = true;
    let maxKnownPage = 1;
    const token = adminToken; // Replace with actual token (e.g., from localStorage)

    const tableBody = document.getElementById('eventTableBody');
    const pagination = document.getElementById('pagination');
    const pageInfo = document.getElementById('pageInfo');
    const selectAll = document.getElementById('selectAll');
    const addEventForm = document.getElementById('addEventForm');
    const editEventForm = document.getElementById('editEventForm');
    const modal = document.getElementById('editModal');
    const closeModalBtn = document.getElementById('closeModalBtn');

    // Fetch partners for dropdowns
    async function fetchPartners() {
        try {
            const partnerurl = `${baseURL}/admin/partner/allPartner?skip=0&limit=100`
            const response = await fetch(partnerurl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.status !== 200) throw new Error('Failed to fetch partners');
            const result = await response.json();
            partners = result.data.partners || [];
            populatePartnerDropdowns();
        } catch (error) {
            console.error('Error fetching partners:', error);
            alert('Failed to load partners. Please try again.');
        }
    }

    // Populate partner dropdowns
    function populatePartnerDropdowns() {
        const addPartnerSelect = document.getElementById('partnerId');
        const editPartnerSelect = document.getElementById('editPartnerId');
        addPartnerSelect.innerHTML = '<option value="">Select Partner</option>';
        editPartnerSelect.innerHTML = '<option value="">Select Partner</option>';
        partners.forEach(partner => {
            const option = `<option value="${partner._id}">${partner.restaurantName}</option>`;
            addPartnerSelect.innerHTML += option;
            editPartnerSelect.innerHTML += option;
        });
    }

    // Fetch events
    async function fetchEvents() {
        try {

            const eventUrl = `${baseURL}/admin/event/viewEvent`
            const skip = (currentPage - 1) * rowsPerPage;
            const response = await fetch(`${eventUrl}?skip=${skip}&limit=${rowsPerPage}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) console.log('Failed to fetch events');
            const result = await response.json();
            events = result.data.events || [];
            hasNextPage = events.length === rowsPerPage;
            if (currentPage > maxKnownPage) maxKnownPage = currentPage;
            renderTable();
            renderPagination();
            document.getElementById('spinner').classList.remove('show');
        } catch (error) {
            console.error('Error fetching events:', error);
            alert('Failed to load events. Please try again.');
        }
    }

    // Render table
    function renderTable() {
        tableBody.innerHTML = '';
        if (events.length === 0 && currentPage === 1) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No events found</td></tr>';
        } else {
            events.forEach(event => {
                const partner = partners.find(p => p._id === event.partnerId) || { name: 'Unknown' };
                const details = event.eventDetails.length > 50 ? event.eventDetails.substring(0, 47) + '...' : event.eventDetails;
                const statusClass = event.status === 'active' ? 'bg-success' : event.status === 'pending' ? 'bg-warning' : 'bg-danger';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="row-checkbox"></td>
                    <td>${event.date || 'N/A'}</td>
                    <td>${partner.name}</td>
                    <td>${details}</td>
                    <td>${event.time || 'N/A'}</td>
                    <td><span class="badge ${statusClass}">${event.status.charAt(0).toUpperCase() + event.status.slice(1)}</span></td>
                    <td>
                        <a class="btn btn-sm btn-primary edit-btn" href="#" data-id="${event._id}">Edit</a> |
                        <a class="btn btn-sm btn-${event.status === 'active' ? 'danger' : 'success'} status-btn" href="#" data-id="${event._id}">
                            ${event.status === 'active' ? 'Deactivate' : 'Activate'}
                        </a>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }

        // Update page info
        const start = (currentPage - 1) * rowsPerPage + 1;
        const end = start + events.length - 1;
        pageInfo.textContent = events.length > 0
            ? `Showing ${start} to ${end} of unknown entries`
            : `Showing 0 to 0 of unknown entries`;

        // Add event listeners
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const eventId = btn.getAttribute('data-id');
                const event = events.find(e => e._id === eventId);
                openEditModal(event);
            });
        });
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const eventId = btn.getAttribute('data-id');
                toggleStatus(eventId);
            });
        });
    }

    // Render pagination
    function renderPagination() {
        pagination.innerHTML = '';
        const prevItem = document.createElement('li');
        prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevItem.innerHTML = `<a class="page-link" href="#">Previous</a>`;
        prevItem.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                fetchEvents();
            }
        });
        pagination.appendChild(prevItem);

        for (let i = 1; i <= maxKnownPage; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
            pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            pageItem.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = i;
                fetchEvents();
            });
            pagination.appendChild(pageItem);
        }

        const nextItem = document.createElement('li');
        nextItem.className = `page-item ${!hasNextPage ? 'disabled' : ''}`;
        nextItem.innerHTML = `<a class="page-link" href="#">Next</a>`;
        nextItem.addEventListener('click', (e) => {
            e.preventDefault();
            if (hasNextPage) {
                currentPage++;
                fetchEvents();
            }
        });
        pagination.appendChild(nextItem);
    }

    // Select All Checkbox
    selectAll.addEventListener('change', () => {
        document.querySelectorAll('.row-checkbox').forEach(checkbox => {
            checkbox.checked = selectAll.checked;
        });
    });

    // Handle Add Event Form Submission
    addEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addEventForm);
        try {
            const response = await fetch('YOUR_BACKEND_API_ENDPOINT/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (!response.ok) throw new Error('Failed to add event');
            const result = await response.json();
            if (result.status !== 'Success') throw new Error(result.message || 'Failed to add event');
            alert('Event added successfully!');
            addEventForm.reset();
            fetchEvents();
        } catch (error) {
            console.error('Error adding event:', error);
            alert('Failed to add event. Please try again.');
        }
    });

    // Open Edit Modal
    function openEditModal(event) {
        document.getElementById('eventId').value = event._id;
        document.getElementById('editPartnerId').value = event.partnerId || '';
        document.getElementById('editDate').value = event.date || '';
        document.getElementById('editTime').value = event.time || '';
        document.getElementById('editEventDetails').value = event.eventDetails || '';
        const currentPhotosDiv = document.getElementById('currentPhotos');
        currentPhotosDiv.innerHTML = event.photo?.length > 0
            ? event.photo.map(img => `<img src="${img.path}" alt="${img.originalname || 'Event Photo'}">`).join('')
            : '<p>No current photos</p>';
        modal.style.display = 'block';
    }

    // Close Modal
    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close Modal on Outside Click
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Handle Edit Form Submission
    editEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const eventId = document.getElementById('eventId').value;
        const formData = new FormData(editEventForm);
        try {
            const response = await fetch(`YOUR_BACKEND_API_ENDPOINT/events/${eventId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (!response.ok) throw new Error('Failed to update event');
            alert('Event updated successfully!');
            modal.style.display = 'none';
            fetchEvents();
        } catch (error) {
            console.error('Error updating event:', error);
            alert('Failed to update event. Please try again.');
        }
    });

    // Toggle Event Status
    async function toggleStatus(eventId) {
        const event = events.find(e => e._id === eventId);
        const newStatus = event.status === 'active' ? 'inactive' : 'active';
        try {
            const response = await fetch(`YOUR_BACKEND_API_ENDPOINT/events/${eventId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) throw new Error('Failed to update status');
            alert(`Event ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
            fetchEvents();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status. Please try again.');
        }
    }

    // Initial fetch
    fetchPartners();
    fetchEvents();
});