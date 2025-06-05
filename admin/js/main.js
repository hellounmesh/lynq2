(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();
    
    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });

    // Sidebar Toggler
    $('.sidebar-toggler').click(function () {
        $('.sidebar, .content').toggleClass("open");
        return false;
    });

    // Progress Bar
    $('.pg-bar').waypoint(function () {
        $('.progress .progress-bar').each(function () {
            $(this).css("width", $(this).attr("aria-valuenow") + '%');
        });
    }, {offset: '80%'});

    // Calender
    $('#calender').datetimepicker({
        inline: true,
        format: 'L'
    });

    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        items: 1,
        dots: true,
        loop: true,
        nav: false
    });
})(jQuery);

const baseURL = 'https://lynqdxb.onrender.com';
const adminToken = localStorage.getItem("adminToken");

if (!adminToken) {
    alert('Please log in to access this page.');
    setTimeout(() => {
        window.location.href = './login/login.html';
    }, 3000);
}

// Format date and time for display (e.g., "Jun 6, 2025 01:15 AM")
function formatDateTime(date, timeZone) {
    try {
        if (!date || date === 'undefined' || date === 'null' || date === '' || typeof date !== 'string') {
            return 'N/A';
        }
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            console.warn('Invalid date:', date);
            return 'N/A';
        }
        return parsedDate.toLocaleString('en-US', {
            timeZone: timeZone || 'Asia/Kolkata',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        console.error('Error formatting date and time:', date, error);
        return 'N/A';
    }
}

// Format date for tables (e.g., "Jun 6, 2025")
function formatDisplayDate(date, timeZone) {
    try {
        if (!date || date === 'undefined' || date === 'null' || date === '' || typeof date !== 'string') {
            return 'N/A';
        }
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            console.warn('Invalid date:', date);
            return 'N/A';
        }
        return parsedDate.toLocaleDateString('en-US', {
            timeZone: timeZone || 'Asia/Kolkata',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', date, error);
        return 'N/A';
    }
}

// Fetch data with authentication and enhanced error handling
async function fetchData(endpoint) {
    try {
        console.log(`Fetching data from ${baseURL}${endpoint} with token: ${adminToken}`);
        const response = await fetch(`${baseURL}${endpoint}`, {
            headers: {
                "Authorization": `Bearer ${adminToken}`,
                "Content-Type": "application/json"
            }
        });
        console.log(`Response status for ${endpoint}: ${response.status}`);

        if (response.status === 401) {
            console.error("401 Unauthorized: Session expired or invalid token.");
            alert("Session expired. Please log in again.");
            logout();
            return null;
        }
        if (response.status !== 200) {
            const errorText = await response.text();
            console.error(`Failed to fetch ${endpoint}: Status ${response.status}, Response: ${errorText}`);
            throw new Error(`Failed to fetch ${endpoint}: ${response.status} - ${errorText}`);
        }
        const result = await response.json();
        console.log(`Response data for ${endpoint}:`, result);

        if (result.status !== 'Success') {
            console.error(`Backend status not Success for ${endpoint}: ${result.status}`);
            throw new Error(`Backend status not Success: ${result.status} - ${result.message || 'Unknown error'}`);
        }
        return result.data;
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error.message);
        return null;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('adminToken');
    setTimeout(() => {
        window.location.href = './login/login.html';
    }, 1000);
}

document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    logout();
});

// Profile photo click redirect
document.getElementById("profileRedirect").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent the click from triggering the dropdown toggle
    window.location.href = './dashboard/profile/adminProfile.html';
});

// Update navbar with admin's name and photo
function updateNavbar(admin) {
    const profileLink = document.getElementById('profilePhotoLink');
    const profileImg = profileLink.querySelector('img');
    const profileName = profileLink.querySelector('span.d-none.d-sm-inline-flex');

    // Update name
    profileName.textContent = admin.name || 'Admin';

    // Update photo
    const photoPath = admin.userInformation?.photo && admin.userInformation.photo.length > 0 
        ? admin.userInformation.photo[0].path 
        : 'img/user.jpg';
    profileImg.src = photoPath;
    profileImg.alt = admin.name || 'Admin';
}

// Fetch admin details
async function fetchAdmin() {
    try {
        const data = await fetchData('/admin/view');
        if (!data || !data.admin || !data.admin[0]) throw new Error('Invalid response structure: missing data.admin');
        const admin = data.admin[0];
        updateNavbar(admin); // Update navbar with admin details
        return admin;
    } catch (error) {
        console.error('Error fetching admin:', error.message);
        alert('Failed to load admin profile: ' + error.message);
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

// Load notifications
async function loadNotifications() {
    const notificationList = document.getElementById('notificationList');
    notificationList.innerHTML = '<div class="notification-item text-center">Loading notifications...</div>';

    const data = await fetchData('/admin/notification/allNotification');
    console.log('Notifications data:', data);

    if (!data) {
        notificationList.innerHTML = '<div class="notification-item text-center">Failed to load notifications.</div>';
        return;
    }

    if (!data.notifications || data.notifications.length === 0) {
        notificationList.innerHTML = '<div class="notification-item text-center">No notifications found.</div>';
        return;
    }

    notificationList.innerHTML = data.notifications.map(notification => {
        console.log('Rendering notification:', notification);
        return `
            <div class="notification-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="fw-normal mb-1">${notification.title || 'Untitled Notification'}</h6>
                        <small>${formatDateTime(notification.createdAt, 'Asia/Kolkata')}</small>
                    </div>
                    <div class="notification-actions">
                        <button class="btn btn-sm btn-primary view-btn" data-id="${notification._id}" data-title="${notification.title || 'Untitled Notification'}" data-message="${notification.message || 'No message'}" data-created-at="${notification.createdAt}">View</button>
                        <button class="btn btn-sm btn-secondary mark-read-btn" data-id="${notification._id}">Mark as Read</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners for "View" and "Mark as Read" buttons
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const notificationId = e.target.dataset.id;
            const title = e.target.dataset.title;
            const message = e.target.dataset.message;
            const createdAt = e.target.dataset.createdAt;
            showNotificationModal(notificationId, title, message, createdAt);
        });
    });

    document.querySelectorAll('.mark-read-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const notificationId = e.target.dataset.id;
            await markNotificationAsRead(notificationId);
        });
    });
}

// Show notification details in modal
function showNotificationModal(notificationId, title, message, createdAt) {
    const modal = document.getElementById('notificationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalMarkReadBtn = document.getElementById('modalMarkReadBtn');

    modalTitle.textContent = title;
    modalMessage.innerHTML = `
        <p><strong>Message:</strong> ${message}</p>
        <p><strong>Date & Time:</strong> ${formatDateTime(createdAt, 'Asia/Kolkata')}</p>
    `;
    modal.style.display = 'block';

    // Set up Mark as Read button in modal
    modalMarkReadBtn.dataset.id = notificationId;
    modalMarkReadBtn.onclick = async () => {
        await markNotificationAsRead(notificationId);
        modal.style.display = 'none';
    };

    // Close modal on click of close button
    document.getElementById('closeModalBtn').onclick = () => {
        modal.style.display = 'none';
    };

    // Close modal when clicking outside
    window.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Mark single notification as read
async function markNotificationAsRead(notificationId) {
    try {
        console.log(`Marking notification ${notificationId} as read`);
        const response = await fetch(`${baseURL}/admin/notification/updateOne/${notificationId}`, {
            method: 'PATCH',
            headers: {
                "Authorization": `Bearer ${adminToken}`,
                "Content-Type": "application/json"
            }
        });
        console.log(`Mark as read response status: ${response.status}`);

        if (response.status !== 200) throw new Error(`Failed to mark notification as read: ${response.status}`);
        const result = await response.json();
        console.log('Mark as read response:', result);

        if (result.status !== 'Success') throw new Error(result.message || 'Mark as read failed');
        loadNotifications(); // Refresh notifications
    } catch (error) {
        console.error('Error marking notification as read:', error.message);
        alert('Failed to mark notification as read.');
    }
}

// Mark all notifications as read
document.getElementById('markAllReadBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        console.log('Marking all notifications as read');
        const response = await fetch(`${baseURL}/admin/notification/updateAll`, {
            method: 'PATCH',
            headers: {
                "Authorization": `Bearer ${adminToken}`,
                "Content-Type": "application/json"
            }
        });
        console.log(`Mark all as read response status: ${response.status}`);

        if (response.status !== 200) throw new Error(`Failed to mark all notifications as read: ${response.status}`);
        const result = await response.json();
        console.log('Mark all as read response:', result);

        if (result.status !== 'Success') throw new Error(result.message || 'Mark all as read failed');
        loadNotifications(); // Refresh notifications
    } catch (error) {
        console.error('Error marking all notifications as read:', error.message);
        alert('Failed to mark all notifications as read.');
    }
});

// Populate Pending Members Table
async function loadPendingMembers() {
    const data = await fetchData('/admin/user/allUser?status=pending&skip=0&limit=5');
    const tbody = document.getElementById('pendingMembersTable');
    if (!data || !data.users || data.users.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4'>No pending members</td></tr>";
        return;
    }
    tbody.innerHTML = data.users.map(member => `
        <tr>
            <td>${member.name || "N/A"}</td>
            <td>${member.email || "N/A"}</td>
            <td>${formatDisplayDate(member.createdAt, 'Asia/Kolkata')}</td>
            <td><a class="btn btn-sm btn-primary" href="./dashboard/member/view_member.html?id=${member._id}">Review</a></td>
        </tr>
    `).join('');
}

// Populate Pending Bookings Table
async function loadPendingBookings() {
    const data = await fetchData('/admin/booking/allBooking?status=pending&skip=0&limit=5');
    const tbody = document.getElementById('pendingBookingsTable');
    if (!data || !data.bookings || data.bookings.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4'>No pending bookings</td></tr>";
        return;
    }
    tbody.innerHTML = data.bookings.map(booking => `
        <tr>
            <td>${booking._id || "N/A"}</td>
            <td>${booking.user?.name || "N/A"}</td>
            <td>${formatDisplayDate(booking.fromDate, booking.timeZone)}</td>
            <td><a class="btn btn-sm btn-primary" href="./dashboard/booking/pending-booking.html?id=${booking._id}">Review</a></td>
        </tr>
    `).join('');
}

// Populate Upcoming Events Table
async function loadUpcomingEvents() {
    const data = await fetchData('/admin/event/viewEvent?status=active&skip=0&limit=5');
    const tbody = document.getElementById('upcomingEventsTable');
    if (!data || !data.events || data.events.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4'>No upcoming events</td></tr>";
        return;
    }
    // Filter events to show only those with fromDate >= today
    const today = new Date();
    const upcomingEvents = data.events.filter(event => new Date(event.fromDate) >= today);
    if (upcomingEvents.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4'>No upcoming events</td></tr>";
        return;
    }
    tbody.innerHTML = upcomingEvents.map(event => `
        <tr>
            <td>${event.description || "N/A"}</td>
            <td>${formatDisplayDate(event.fromDate, event.timeZone)}</td>
            <td>${event.partner?.address?.addressLine1 || "N/A"}</td>
            <td><a class="btn btn-sm btn-primary" href="./dashboard/event/view-event.html?id=${event._id}">Details</a></td>
        </tr>
    `).join('');
}

// Populate Pending Events Table
async function loadPendingEvents() {
    const data = await fetchData('/admin/event/viewEvent?status=pending&skip=0&limit=5');
    const tbody = document.getElementById('pendingEventsTable');
    if (!data || !data.events || data.events.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4'>No pending events</td></tr>";
        return;
    }
    tbody.innerHTML = data.events.map(event => `
        <tr>
            <td>${event.description || "N/A"}</td>
            <td>${formatDisplayDate(event.fromDate, event.timeZone)}</td>
            <td>${event.partner?.address?.addressLine1 || "N/A"}</td>
            <td><a class="btn btn-sm btn-primary" href="./dashboard/event/view-event.html?id=${event._id}">Review</a></td>
        </tr>
    `).join('');
}

// Initialize all data on page load
window.onload = async () => {
    console.log('index.js loaded');
    // Test Bootstrap dropdown functionality
    if (typeof bootstrap === 'undefined' || !bootstrap.Dropdown) {
        console.error('Bootstrap JavaScript is not loaded properly.');
    } else {
        console.log('Bootstrap JavaScript is loaded successfully.');
    }

    await Promise.all([
        fetchAdmin(), // Fetch admin details and update navbar
        loadPendingMembers(),
        loadPendingBookings(),
        loadUpcomingEvents(),
        loadPendingEvents(),
        loadNotifications()
    ]);
};