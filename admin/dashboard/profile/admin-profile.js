const baseURL = 'https://lynqdxb.onrender.com';
const adminToken = localStorage.getItem('adminToken');

if (!adminToken) {
    alert('Please log in to access this page.');
    setTimeout(() => {
        window.location.href = '../../login/login.html';
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('admin-profile.js loaded');
    // Test Bootstrap dropdown functionality
    if (typeof bootstrap === 'undefined' || !bootstrap.Dropdown) {
        console.error('Bootstrap JavaScript is not loaded properly.');
    } else {
        console.log('Bootstrap JavaScript is loaded successfully.');
    }

    const adminDetails = document.getElementById('adminDetails');
    const editBtn = document.getElementById('editBtn');
    const editModal = document.getElementById('editModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const editAdminForm = document.getElementById('editAdminForm');
    const currentPhoto = document.getElementById('currentPhoto');
    const currentGallery = document.getElementById('currentGallery');
    const spinner = document.getElementById('spinner');

    // Profile photo click redirect
    document.getElementById("profileRedirect").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = './adminProfile.html';
    });

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Format date and time for notifications (e.g., "Jun 6, 2025 01:03 AM")
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

    // Format date for display (e.g., "Jun 6, 2025")
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

    // Fetch data with authentication
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
            window.location.href = '../../login/login.html';
        }, 1000);
    }

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
            : '../../img/user.jpg';
        profileImg.src = photoPath;
        profileImg.alt = admin.name || 'Admin';
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
                            <button style="width: 50px;" class="btn btn-sm btn-primary view-btn" data-id="${notification._id}" data-title="${notification.title || 'Untitled Notification'}" data-message="${notification.message || 'No message'}" data-created-at="${notification.createdAt}">View</button>
                            <button style="width: 50px;" class="btn btn-sm btn-secondary mark-read-btn" data-id="${notification._id}">Mark as Read</button>
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
        document.getElementById('closeModalBtnNotif').onclick = () => {
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

    // Fetch admin details
    async function fetchAdmin() {
        try {
            const data = await fetchData('/admin/view');
            if (!data || !data.admin || !data.admin[0]) throw new Error('Invalid response structure: missing data.admin');
            const admin = data.admin[0];
            displayAdminDetails(admin);
            updateNavbar(admin); // Update navbar with admin details
            return admin;
        } catch (error) {
            console.error('Error fetching admin:', error.message);
            adminDetails.innerHTML = '<p class="text-danger">Failed to load admin profile: ' + error.message + '</p>';
            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 2000);
        } finally {
            spinner.classList.remove('show');
        }
    }

    // Display admin details
    function displayAdminDetails(admin) {
        const dob = formatDisplayDate(admin.userInformation?.dob, 'Asia/Kolkata');

        adminDetails.innerHTML = `
            <p><strong>Name:</strong> ${admin.name || 'N/A'}</p>
            <p><strong>Email:</strong> ${admin.email || 'N/A'}</p>
            <p><strong>Mobile:</strong> ${admin.mobile || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="badge ${admin.status === 'active' ? 'bg-success' : 'bg-secondary'}">${admin.status ? admin.status.charAt(0).toUpperCase() + admin.status.slice(1) : 'N/A'}</span></p>
            <p><strong>Description:</strong> ${admin.userInformation?.description || 'N/A'}</p>
            <p><strong>Date of Birth:</strong> ${dob}</p>
            <p><strong>Interests:</strong> ${admin.userInformation?.interested || 'N/A'}</p>
            <p><strong>Profession:</strong> ${admin.userInformation?.profession || 'N/A'}</p>
            <p><strong>Gender:</strong> ${admin.userInformation?.gender || 'N/A'}</p>
            <p><strong>Profile Photo:</strong></p>
            <div id="photoDisplay" class="current-photos">
                ${admin.userInformation?.photo && admin.userInformation.photo.length > 0 ? admin.userInformation.photo.map(photo => `
                    <div class="photo-container">
                        <img src="${photo.path}" alt="${photo.originalname}" class="admin-img">
                        <span class="remove-img" data-id="${photo._id}" data-fieldname="photo">×</span>
                    </div>
                `).join('') : '<p>No profile photo available.</p>'}
            </div>
            <p><strong>Gallery Images:</strong></p>
            <div id="galleryDisplay" class="gallery-grid">
                ${admin.userInformation?.gallery && admin.userInformation.gallery.length > 0 ? admin.userInformation.gallery.map(img => `
                    <div class="photo-container">
                        <img src="${img.path}" alt="${img.originalname}" class="gallery-img">
                        <span class="remove-img" data-id="${img._id}" data-fieldname="gallery">×</span>
                    </div>
                `).join('') : '<p>No gallery images available.</p>'}
            </div>
        `;

        // Add event listeners for remove image buttons
        document.querySelectorAll('.remove-img').forEach(button => {
            button.addEventListener('click', async (e) => {
                const fileId = e.target.dataset.id;
                const fieldname = e.target.dataset.fieldname;
                if (!confirm(`Are you sure you want to delete this ${fieldname === 'photo' ? 'profile photo' : 'gallery image'}?`)) return;
                await deleteImage(fileId, fieldname);
            });
        });
    }

    // Populate edit modal form
    function populateEditForm(admin) {
        document.getElementById('adminId').value = admin._id;
        document.getElementById('name').value = admin.name || '';
        document.getElementById('email').value = admin.email || '';
        document.getElementById('mobile').value = admin.mobile || '';
        document.getElementById('description').value = admin.userInformation?.description || '';
        document.getElementById('dob').value = formatDateForInput(admin.userInformation?.dob);
        document.getElementById('interested').value = admin.userInformation?.interested || '';
        document.getElementById('profession').value = admin.userInformation?.profession || '';
        document.getElementById('gender').value = admin.userInformation?.gender || '';

        // Populate current profile photo
        currentPhoto.innerHTML = '';
        if (admin.userInformation?.photo && admin.userInformation.photo.length > 0) {
            admin.userInformation.photo.forEach(photo => {
                const container = document.createElement('div');
                container.className = 'photo-container';
                container.innerHTML = `
                    <img src="${photo.path}" alt="${photo.originalname}">
                    <span class="remove-img" data-id="${photo._id}" data-fieldname="photo">×</span>
                `;
                currentPhoto.appendChild(container);
            });
        } else {
            currentPhoto.innerHTML = '<p>No profile photo uploaded.</p>';
        }

        // Populate current gallery images
        currentGallery.innerHTML = '';
        if (admin.userInformation?.gallery && admin.userInformation.gallery.length > 0) {
            admin.userInformation.gallery.forEach(img => {
                const container = document.createElement('div');
                container.className = 'photo-container';
                container.innerHTML = `
                    <img src="${img.path}" alt="${img.originalname}">
                    <span class="remove-img" data-id="${img._id}" data-fieldname="gallery">×</span>
                `;
                currentGallery.appendChild(container);
            });
        } else {
            currentGallery.innerHTML = '<p>No gallery images uploaded.</p>';
        }

        // Add event listeners for remove image buttons in modal
        document.querySelectorAll('.remove-img').forEach(button => {
            button.addEventListener('click', async (e) => {
                const fileId = e.target.dataset.id;
                const fieldname = e.target.dataset.fieldname;
                if (!confirm(`Are you sure you want to delete this ${fieldname === 'photo' ? 'profile photo' : 'gallery image'}?`)) return;
                await deleteImage(fileId, fieldname);
                // Remove the image from the modal
                e.target.parentElement.remove();
            });
        });
    }

    // Delete image
    async function deleteImage(fileId, fieldname) {
        try {
            const response = await fetch(`${baseURL}/admin/deleteFile/${fileId}?fieldname=${fieldname}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.status !== 200) throw new Error(`Failed to delete image: ${response.status}`);
            const result = await response.json();
            if (result.status !== 'Success') throw new Error(result.message || 'Delete failed');
            alert('Image deleted successfully!');
            const admin = await fetchAdmin(); // Refresh the profile and navbar
            updateNavbar(admin); // Ensure navbar updates after image deletion
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Failed to delete image. Please try again.');
        }
    }

    // Show edit modal
    editBtn.addEventListener('click', async () => {
        try {
            const data = await fetchData('/admin/view');
            if (!data || !data.admin || !data.admin[0]) throw new Error('Invalid response');
            const admin = data.admin[0];
            populateEditForm(admin);
            editModal.style.display = 'block';
        } catch (error) {
            console.error('Error loading admin for edit:', error);
            alert('Failed to load admin profile for editing.');
        }
    });

    // Close edit modal
    closeModalBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    // Close edit modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });

    // Update admin profile
    editAdminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(editAdminForm);

        // Handle file inputs
        const adminPhoto = document.getElementById('adminPhoto').files;
        const adminGallery = document.getElementById('adminGallery').files;

        if (adminPhoto.length > 0) {
            formData.append('adminPhoto', adminPhoto[0]);
        }

        for (let i = 0; i < adminGallery.length; i++) {
            formData.append('adminGallery', adminGallery[i]);
        }

        try {
            const response = await fetch(`${baseURL}/admin/update`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                },
                body: formData
            });
            if (response.status !== 200) throw new Error(`Failed to update admin: ${response.status}`);
            const result = await response.json();
            if (result.status !== 'Success') throw new Error(result.message || 'Update failed');
            alert('Admin profile updated successfully!');
            editModal.style.display = 'none';
            const admin = await fetchAdmin();
            updateNavbar(admin); // Update navbar after profile update
        } catch (error) {
            console.error('Error updating admin:', error);
            alert('Failed to update admin profile. Please try again.');
        }
    });

    // Initialize
    async function initialize() {
        await Promise.all([
            fetchAdmin(),
            loadNotifications()
        ]);
    }

    initialize();
});