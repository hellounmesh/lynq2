const { DateTime } = luxon;
const baseURL = 'https://lynqdxb.onrender.com';
const adminToken = localStorage.getItem('adminToken');

if (!adminToken) {
    alert('Please log in to access this page.');
    setTimeout(() => {
        window.location.href = '../../login/login.html';
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('view-event.js loaded');
    const eventDetails = document.getElementById('eventDetails');
    const partnerDetails = document.getElementById('partnerDetails');
    const editBtn = document.getElementById('editBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const editModal = document.getElementById('editModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const editEventForm = document.getElementById('editEventForm');
    const currentPhotos = document.getElementById('currentPhotos');
    const spinner = document.getElementById('spinner');

    // Get event ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    if (!eventId) {
        alert('No event ID provided.');
        window.location.href = './event.html';
        return;
    }

    // Initialize Flatpickr for time inputs (12-hour format)
    flatpickr('#fromTime', { enableTime: true, noCalendar: true, dateFormat: 'h:i K', time_24hr: false });
    flatpickr('#toTime', { enableTime: true, noCalendar: true, dateFormat: 'h:i K', time_24hr: false });

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('adminToken');
        setTimeout(() => {
            window.location.href = '../../login/login.html';
        }, 1000);
    });

    // Fetch partners for dropdown
    async function populatePartners(selectElement, currentPartnerId) {
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
                option.selected = partner._id === currentPartnerId;
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching partners:', error);
            selectElement.innerHTML = '<option value="">Error loading partners</option>';
        }
    }

    // Format date for display (e.g., "May 31, 2025")
    function formatDisplayDate(date, timeZone) {
        try {
            if (!date) return 'N/A';
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) return 'N/A';
            return parsedDate.toLocaleDateString('en-US', {
                timeZone: timeZone || 'Asia/Kolkata',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'N/A';
        }
    }

    // Format date for input (YYYY-MM-DD)
    function formatDateForInput(date) {
        try {
            if (!date) return '';
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) return '';
            return parsedDate.toISOString().split('T')[0];
        } catch (error) {
            console.error('Error formatting date for input:', error);
            return '';
        }
    }

    // Convert 24-hour time (e.g., "14:30") to 12-hour format (e.g., "2:30 PM")
    function format12Hour(time) {
        try {
            if (!time) return 'N/A';
            const [hours, minutes] = time.split(':').map(Number);
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        } catch (error) {
            console.error('Error formatting time:', error);
            return 'N/A';
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
            return timeStr;
        }
    }

    // Fetch event details
    async function fetchEvent() {
        try {
            const response = await fetch(`${baseURL}/admin/event/viewEvent/${eventId}`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.status !== 200) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch event: ${response.status} - ${errorText}`);
            }
            const result = await response.json();
            console.log('Event response:', result);
            if (result.status !== 'Success') throw new Error(`Backend status not Success: ${result.status}`);
            if (!result.data || !result.data.events) throw new Error('Invalid response structure: missing data.event');
            const event = result.data.events[0];
            displayEventDetails(event);
        } catch (error) {
            console.error('Error fetching event:', error.message);
            eventDetails.innerHTML = '<p class="text-danger">Failed to load event: ' + error.message + '</p>';
            partnerDetails.innerHTML = '';
            setTimeout(() => {
                window.location.href = './event.html';
            }, 2000);
        } finally {
            spinner.classList.remove('show');
        }
    }

    // Display event and partner details
    function displayEventDetails(event) {
        const partnerName = event.partner?.restaurantName || event.restaurentId?.restaurantName || 'N/A';
        const fromDate = formatDisplayDate(event.fromDate, event.timeZone);
        const toDate = formatDisplayDate(event.toDate, event.timeZone);
        const fromTime = format12Hour(event.fromTime);
        const toTime = format12Hour(event.toTime);

        eventDetails.innerHTML = `
            <p><strong>Partner:</strong> ${partnerName}</p>
            <p><strong>From:</strong> ${fromDate} ${fromTime}</p>
            <p><strong>To:</strong> ${toDate} ${toTime}</p>
            <p><strong>Time Zone:</strong> ${event.timeZone || 'N/A'}</p>
            <p><strong>Description:</strong> ${event.description || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="badge ${event.status === 'active' ? 'bg-success' : event.status === 'pending' ? 'bg-warning' : 'bg-secondary'}">${event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : 'N/A'}</span></p>
            <p><strong>Photos:</strong></p>
            <div class="gallery-grid">
                ${event.photo && event.photo.length > 0 ? event.photo.map(photo => `
                    <img src="${photo.path}" alt="${photo.originalname}" class="gallery-img">
                `).join('') : '<p>No photos available.</p>'}
            </div>
        `;

        const partner = event.partner || event.restaurentId || {};
        partnerDetails.innerHTML = `
            <p><strong>Restaurant Name:</strong> ${partner.restaurantName || 'N/A'}</p>
            <p><strong>Phone:</strong> ${partner.phone || 'N/A'}</p>
            <p><strong>Email:</strong> ${partner.email || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="badge ${partner.status === 'active' ? 'bg-success' : partner.status === 'pending' ? 'bg-warning' : 'bg-secondary'}">${partner.status ? partner.status.charAt(0).toUpperCase() + partner.status.slice(1) : 'N/A'}</span></p>
            <p><strong>Thumbnail Image:</strong></p>
            <div>
                ${partner.thumbnailImg && partner.thumbnailImg.length > 0 ? `
                    <img src="${partner.thumbnailImg[0].path}" alt="${partner.thumbnailImg[0].originalname}" class="partner-img">
                ` : '<p>No thumbnail available.</p>'}
            </div>
            <p><strong>Gallery Images:</strong></p>
            <div class="gallery-grid">
                ${partner.galleryImg && partner.galleryImg.length > 0 ? partner.galleryImg.map(img => `
                    ${!img.isDeleted ? `<img src="${img.path}" alt="${img.originalname}" class="gallery-img">` : ''}
                `).join('') : '<p>No gallery images available.</p>'}
            </div>
        `;
    }

    // Populate edit modal form
    function populateEditForm(event) {
        document.getElementById('eventId').value = event._id;
        document.getElementById('partnerId').value = event.partner?._id || event.restaurentId?._id || '';
        document.getElementById('fromDate').value = formatDateForInput(event.fromDate);
        document.getElementById('toDate').value = formatDateForInput(event.toDate);
        document.getElementById('fromTime').value = event.fromTime ? format12Hour(event.fromTime) : '';
        document.getElementById('toTime').value = event.toTime ? format12Hour(event.toTime) : '';
        document.getElementById('timeZone').value = event.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        document.getElementById('description').value = event.description || '';
        document.getElementById('status').value = event.status || 'pending';

        // Populate current photos
        currentPhotos.innerHTML = '';
        if (event.photo && event.photo.length > 0) {
            event.photo.forEach(photo => {
                const img = document.createElement('img');
                img.src = photo.path;
                img.alt = photo.originalname;
                currentPhotos.appendChild(img);
            });
        } else {
            currentPhotos.innerHTML = '<p>No photos uploaded.</p>';
        }

        // Populate partner dropdown
        const partnerId = event.partner?._id || event.restaurentId?._id;
        populatePartners(document.getElementById('partnerId'), partnerId);
    }

    // Show edit modal
    editBtn.addEventListener('click', async () => {
        try {
            const response = await fetch(`${baseURL}/admin/event/viewEvent/${eventId}`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.status !== 200) throw new Error(`Failed to fetch event: ${response.status}`);
            const result = await response.json();
            if (result.status !== 'Success' || !result.data.events) throw new Error('Invalid response');
            const event = result.data.events[0];
            populateEditForm(event);
            editModal.style.display = 'block';
        } catch (error) {
            console.error('Error loading event for edit:', error);
            alert('Failed to load event for editing.');
        }
    });

    // Close modal
    closeModalBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });

    // Update event
    editEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(editEventForm);
        const fromTime = document.getElementById('fromTime').value;
        const toTime = document.getElementById('toTime').value;

        if (fromTime) formData.set('fromTime', convertTo24Hour(fromTime));
        if (toTime) formData.set('toTime', convertTo24Hour(toTime));

        try {
            const response = await fetch(`${baseURL}/admin/event/updateEvent/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                },
                body: formData
            });
            if (response.status !== 200) throw new Error(`Failed to update event: ${response.status}`);
            const result = await response.json();
            if (result.status !== 'Success') throw new Error(result.message || 'Update failed');
            alert('Event updated successfully!');
            editModal.style.display = 'none';
            fetchEvent();
        } catch (error) {
            console.error('Error updating event:', error);
            alert('Failed to update event. Please try again.');
        }
    });

    // Delete event
    deleteBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        try {
            const response = await fetch(`${baseURL}/admin/event/deleteEvent/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.status !== 200) throw new Error(`Failed to delete event: ${response.status}`);
            const result = await response.json();
            if (result.status !== 'Success') throw new Error(result.message || 'Delete failed');
            alert('Event deleted successfully!');
            window.location.href = './event.html';
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event. Please try again.');
        }
    });

    // Initialize
    fetchEvent();
});