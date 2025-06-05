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
            
            // Back to Top Button
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
            
        })(jQuery);

        const baseURL = 'https://lynqdxb.onrender.com';
        const partnerSubmitBtn = document.getElementById("partnerSubmitBtn");
        const partnerForm = document.getElementById('partnerForm');
        const adminToken = localStorage.getItem("adminToken");

        if (!adminToken) {
            alert('Please log in to access this page.');
            setTimeout(() => {
                window.location.href = '../../login/login.html';
            }, 3000);
        }

        function logout() {
            localStorage.removeItem('adminToken');
            setTimeout(() => {
                window.location.href = '../../login/login.html';
            }, 1000);
        }

        document.getElementById("logoutBtn").addEventListener("click", (e) => {
            e.preventDefault();
            logout();
        });

        document.getElementById("profileRedirect").addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = '../profile/adminProfile.html';
        });

        // Format date and time for display (e.g., "Jun 6, 2025 01:52 AM")
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

        // Fetch data with authentication
        async function fetchData(endpoint) {
            try {
                const response = await fetch(`${baseURL}${endpoint}`, {
                    headers: {
                        "Authorization": `Bearer ${adminToken}`,
                        "Content-Type": "application/json"
                    }
                });
                if (response.status === 401) {
                    alert("Session expired. Please log in again.");
                    logout();
                    return null;
                }
                if (response.status !== 200) throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
                const result = await response.json();
                if (result.status !== 'Success') throw new Error(`Backend status not Success: ${result.status}`);
                return result.data;
            } catch (error) {
                console.error(`Error fetching ${endpoint}:`, error.message);
                return null;
            }
        }

        // Update navbar with admin's name and photo
        function updateNavbar(admin) {
            const profileLink = document.getElementById('profilePhotoLink');
            const profileImg = profileLink.querySelector('img');
            const profileName = profileLink.querySelector('span.d-none.d-sm-inline-flex');
            profileName.textContent = admin.name || 'Admin';
            const photoPath = admin.userInformation?.photo && admin.userInformation.photo.length > 0 
                ? admin.userInformation.photo[0].path 
                : '../../img/user.jpg';
            profileImg.src = photoPath;
            profileImg.alt = admin.name || 'Admin';
        }

        // Fetch admin details
        async function fetchAdmin() {
            try {
                const data = await fetchData('/admin/view');
                if (!data || !data.admin || !data.admin[0]) throw new Error('Invalid response structure');
                const admin = data.admin[0];
                updateNavbar(admin);
                return admin;
            } catch (error) {
                console.error('Error fetching admin:', error.message);
                alert('Failed to load admin profile: ' + error.message);
                setTimeout(() => { window.location.href = '../../index.html'; }, 2000);
            }
        }

        // Load notifications
        async function loadNotifications() {
            const notificationList = document.getElementById('notificationList');
            notificationList.innerHTML = '<div class="notification-item text-center">Loading notifications...</div>';
            const data = await fetchData('/admin/notification/allNotification');
            if (!data) {
                notificationList.innerHTML = '<div class="notification-item text-center">Failed to load notifications.</div>';
                return;
            }
            if (!data.notifications || data.notifications.length === 0) {
                notificationList.innerHTML = '<div class="notification-item text-center">No notifications found.</div>';
                return;
            }
            notificationList.innerHTML = data.notifications.map(notification => `
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
            `).join('');
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
            modalMarkReadBtn.dataset.id = notificationId;
            modalMarkReadBtn.onclick = async () => {
                await markNotificationAsRead(notificationId);
                modal.style.display = 'none';
            };
            document.getElementById('closeModalBtn').onclick = () => { modal.style.display = 'none'; };
            window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
        }

        // Mark single notification as read
        async function markNotificationAsRead(notificationId) {
            try {
                const response = await fetch(`${baseURL}/admin/notification/updateOne/${notificationId}`, {
                    method: 'PATCH',
                    headers: {
                        "Authorization": `Bearer ${adminToken}`,
                        "Content-Type": "application/json"
                    }
                });
                if (response.status !== 200) throw new Error(`Failed to mark notification as read: ${response.status}`);
                const result = await response.json();
                if (result.status !== 'Success') throw new Error(result.message || 'Mark as read failed');
                loadNotifications();
            } catch (error) {
                console.error('Error marking notification as read:', error.message);
                alert('Failed to mark notification as read.');
            }
        }

        // Mark all notifications as read
        document.getElementById('markAllReadBtn').addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch(`${baseURL}/admin/notification/updateAll`, {
                    method: 'PATCH',
                    headers: {
                        "Authorization": `Bearer ${adminToken}`,
                        "Content-Type": "application/json"
                    }
                });
                if (response.status !== 200) throw new Error(`Failed to mark all notifications as read: ${response.status}`);
                const result = await response.json();
                if (result.status !== 'Success') throw new Error(result.message || 'Mark all as read failed');
                loadNotifications();
            } catch (error) {
                console.error('Error marking all notifications as read:', error.message);
                alert('Failed to mark all notifications as read.');
            }
        });

        const addParnerDetails = async () => {
            try {
                const name = document.getElementById("name").value.trim();
                const email = document.getElementById("email").value.trim();
                const password = document.getElementById("password").value.trim();
                const phone = document.getElementById("phone").value.trim();
                const restaurentName = document.getElementById("restaurentName").value.trim();
                const propertyType = document.getElementById("propertyType").value;
                const addressLine1 = document.getElementById("addressLine1").value.trim();
                const addressLine2 = document.getElementById("addressLine2").value.trim();
                const country = document.getElementById("country").value.trim();
                const thumbnailImgs = document.getElementById('thumbnail').files;
                const slideImages = document.getElementById('slideImages').files;

                const formData = new FormData();
                formData.append("ownerName", name);
                formData.append("email", email);
                formData.append("password", password);
                formData.append("phone", phone);
                formData.append("restaurantName", restaurentName);
                formData.append("proprtyType", propertyType);
                formData.append('address.addressLine1', addressLine1);
                formData.append('address.addressLine2', addressLine2);
                formData.append("address.country", country);

                if (thumbnailImgs) {
                    for (let i = 0; i < thumbnailImgs.length; i++) {
                        formData.append("partner-thumbnailImg", thumbnailImgs[i]);
                    }
                }

                if (slideImages) {
                    for (let i = 0; i < slideImages.length; i++) {
                        formData.append("partner-galleryImg", slideImages[i]);
                    }
                }

                const addpartnerURL = `${baseURL}/admin/partner/addPartner`;
                const resp = await fetch(addpartnerURL, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                });

                const data = await resp.json();
                if (data.status === 200) {
                    const message = data.data?.message;
                    alert(message);
                    window.location.reload(); // Refresh to show new partner
                } else {
                    console.error(data);
                    const message = data.data?.message;
                    alert(message);
                }
            } catch (error) {
                console.error("Error in addpartner details", error);
                alert(error);
            }
        };

        partnerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addParnerDetails();
        });

        document.addEventListener('DOMContentLoaded', async () => {
            const rowsPerPage = 15;
            let currentPage = 1;
            let partners = [];
            let hasNextPage = true;
            let maxKnownPage = 1;
            let searchQuery = '';
            let propertyTypeFilter = '';

            const tableBody = document.getElementById('partnerTableBody');
            const pagination = document.getElementById('pagination');
            const pageInfo = document.getElementById('pageInfo');

            async function fetchPartners() {
                try {
                    const adminToken = localStorage.getItem("adminToken");
                    const skip = (currentPage - 1) * rowsPerPage;
                    let getPartnerUrl = `${baseURL}/admin/partner/allPartner?skip=${skip}&limit=${rowsPerPage}`;
                    if (searchQuery) getPartnerUrl += `&ownerName=${searchQuery}&restaurantName=${searchQuery}&email=${searchQuery}`;
                    if (propertyTypeFilter) getPartnerUrl += `&type=${propertyTypeFilter}`;
                    const response = await fetch(getPartnerUrl, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${adminToken}`
                        },
                    });
                    if (response.status !== 200) throw new Error('Failed to fetch partners');
                    const result = await response.json();
                    partners = result.data.partners || [];
                    hasNextPage = partners.length === rowsPerPage;
                    if (currentPage > maxKnownPage) maxKnownPage = currentPage;
                    renderTable();
                    renderPagination();
                } catch (error) {
                    console.error('Error fetching partners:', error);
                    alert('Failed to load partner data. Please try again later.');
                }
            }

            function renderTable() {
                tableBody.innerHTML = '';
                if (partners.length === 0 && currentPage === 1) {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td colspan="8" class="text-center">No partners found</td>`;
                    tableBody.appendChild(row);
                } else {
                    partners.forEach(partner => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${partner.ownerName || 'N/A'}</td>
                            <td>${partner.restaurantName || 'N/A'}</td>
                            <td>${partner.proprtyType || 'N/A'}</td>
                            <td>${partner.email || 'N/A'}</td>
                            <td>${partner.phone || 'N/A'}</td>
                            <td>${partner.password ? '••••••••' : 'N/A'}</td>
                            <td>
                                <span class="badge ${partner.status === 'Active' ? 'bg-success' : 'bg-warning'}">
                                    ${partner.status || 'Pending'}
                                </span>
                            </td>
                            <td>
                                <a class="btn btn-sm btn-primary" href="viewPartner.html?id=${partner._id}">Detail</a>
                            </td>
                        `;
                        tableBody.appendChild(row);
                    });
                }
                const start = (currentPage - 1) * rowsPerPage + 1;
                const end = start + partners.length - 1;
                pageInfo.textContent = partners.length > 0
                    ? `Showing ${start} to ${end} of unknown entries`
                    : `Showing 0 to 0 of unknown entries`;
            }

            function renderPagination() {
                pagination.innerHTML = '';
                const prevItem = document.createElement('li');
                prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
                prevItem.innerHTML = `<a class="page-link" href="#">Previous</a>`;
                prevItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                        currentPage--;
                        fetchPartners();
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
                        fetchPartners();
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
                        fetchPartners();
                    }
                });
                pagination.appendChild(nextItem);
            }

            const searchForm = document.getElementById('searchForm');
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                searchQuery = document.getElementById('searchInput').value.trim();
                propertyTypeFilter = document.getElementById('propertyTypeFilter').value;
                currentPage = 1;
                fetchPartners();
            });

            console.log('partner.js loaded');
            if (typeof bootstrap === 'undefined' || !bootstrap.Dropdown) {
                console.error('Bootstrap JavaScript is not loaded properly.');
            } else {
                console.log('Bootstrap JavaScript is loaded successfully.');
            }

            await Promise.all([
                fetchAdmin(),
                loadNotifications(),
                fetchPartners()
            ]);
        });