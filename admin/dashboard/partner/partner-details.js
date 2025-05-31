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
    console.log('partner-details.js loaded');
    const partnerDetails = document.getElementById('partnerDetails');
    const editBtn = document.getElementById('editBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const modal = document.getElementById('editModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const editPartnerForm = document.getElementById('editPartnerForm');
    let currentGalleryImages = []; // Track existing gallery images
    let removeGalleryImages = []; // Images to remove

    // Get partner ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const partnerId = urlParams.get('id');

    if (!partnerId) {
        console.error('No partner ID provided in URL');
        partnerDetails.innerHTML = '<p class="text-danger text-center">No partner ID provided.</p>';
        document.getElementById('spinner').classList.remove('show');
        return;
    }

    const singlePartnerUrl = `${baseURL}/admin/partner/viewPartner/${partnerId}`;

    // Fetch partner data
    async function fetchPartner() {
        try {
            console.log('Fetching partner:', partnerId);
            const response = await fetch(singlePartnerUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            console.log('Response status:', response.status);
            if (!response.ok) throw new Error(`Failed to fetch partner: ${response.status}`);
            const result = await response.json();
            console.log('Response body:', result);
            if (!result.data || !result.data.partner) throw new Error('Invalid response structure');
            const partner = result.data.partner;
            currentGalleryImages = partner.galleryImg || [];
            renderPartner(partner);
        } catch (error) {
            console.error('Error fetching partner:', error.message);
            partnerDetails.innerHTML = '<p class="text-danger text-center">Failed to load partner data. Please try again later.</p>';
        } finally {
            document.getElementById('spinner').classList.remove('show');
        }
    }

    // Render partner details
    function renderPartner(partner) {
        console.log('Rendering partner:', partner._id);
        const status = partner.status.charAt(0).toUpperCase() + partner.status.slice(1);
        const thumbnailUrl = partner.thumbnailImg?.length > 0 ? partner.thumbnailImg[0].path : '../../img/placeholder.jpg';
        const galleryImages = partner.galleryImg?.length > 0 ? partner.galleryImg : [];

        partnerDetails.innerHTML = `
            <div class="row">
                <div class="col-md-4 text-center">
                    ${partner.thumbnailImg?.length > 0
                        ? `<img src="${thumbnailUrl}" alt="Thumbnail" class="partner-img">`
                        : `<p class="text-muted">No thumbnail available</p>`}
                    <h6 class="mt-2">Thumbnail Image</h6>
                </div>
                <div class="col-md-8">
                    <h4>${partner.restaurantName || 'N/A'}</h4>
                    <p class="text-muted">Owned by ${partner.ownerName || 'N/A'}</p>
                    <hr>
                    <div class="row">
                        <div class="col-sm-6">
                            <p><strong>Email:</strong> ${partner.email || 'N/A'}</p>
                            <p><strong>Phone:</strong> ${partner.phone || 'N/A'}</p>
                            <p><strong>Status:</strong> 
                                <span class="badge ${partner.status.toLowerCase() === 'active' ? 'bg-success' : 'bg-warning'}">${status}</span>
                            </p>
                        </div>
                        <div class="col-sm-6">
                            <p><strong>Address:</strong> ${
                                partner.address
                                    ? `${partner.address.addressLine1 || 'N/A'}, ${partner.address.addressLine2 || ''}, ${partner.address.country || 'N/A'}`
                                    : 'No address provided'
                            }</p>
                        </div>
                    </div>
                    <hr>
                    <h6>Gallery Images</h6>
                    <div class="gallery-grid">
                        ${galleryImages.length > 0 ? galleryImages.map(img => `
                            <img src="${img.path}" alt="${img.originalname}" class="gallery-img" onclick="openImage('${img.path}')">
                        `).join('') : '<p class="text-muted">No gallery images available.</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    // Open image in new tab
    window.openImage = function (url) {
        window.open(url, '_blank');
    };

    // Open edit modal
    editBtn.addEventListener('click', async () => {
        try {
            console.log('Opening edit modal for partner:', partnerId);
            const response = await fetch(singlePartnerUrl, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error(`Failed to fetch partner: ${response.status}`);
            const result = await response.json();
            if (!result.data?.partner) throw new Error('Invalid response structure');
            const partner = result.data.partner;

            // Populate form
            document.getElementById('partnerId').value = partner._id;
            document.getElementById('restaurantName').value = partner.restaurantName || '';
            document.getElementById('ownerName').value = partner.ownerName || '';
            document.getElementById('email').value = partner.email || '';
            document.getElementById('phone').value = partner.phone || '';
            document.getElementById('addressLine1').value = partner.address?.addressLine1 || '';
            document.getElementById('addressLine2').value = partner.address?.addressLine2 || '';
            document.getElementById('country').value = partner.address?.country || '';
            document.getElementById('status').value = partner.status || 'pending';

            // Display current thumbnail
            const currentThumbnail = document.getElementById('currentThumbnail');
            currentThumbnail.innerHTML = partner.thumbnailImg?.length > 0
                ? `<img src="${partner.thumbnailImg[0].path}" alt="Current Thumbnail">`
                : '<p>No current thumbnail</p>';

            // Display current gallery with remove option
            const currentGallery = document.getElementById('currentGallery');
            currentGallery.innerHTML = ''; // Corrected from currentGalleryDiv
            removeGalleryImages = [];
            if (partner.galleryImg?.length > 0) {
                partner.galleryImg.forEach((img, index) => {
                    const imgElement = document.createElement('div');
                    imgElement.className = 'd-inline-block position-relative';
                    imgElement.innerHTML = `
                        <img src="${img.path}" alt="${img.originalname}" class="current-img">
                        <span class="remove-img" data-index="${index}" data-path="${img.path}">Remove</span>
                    `;
                    currentGallery.appendChild(imgElement);
                });
                // Add remove event listeners
                currentGallery.querySelectorAll('.remove-img').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const index = parseInt(btn.getAttribute('data-index'));
                        const path = btn.getAttribute('data-path');
                        removeGalleryImages.push(path);
                        currentGalleryImages.splice(index, 1);
                        btn.parentElement.remove();
                    });
                });
            } else {
                currentGallery.innerHTML = '<p>No current gallery images</p>';
            }

            modal.style.display = 'block';
        } catch (error) {
            console.error('Error loading edit form:', error);
            alert('Failed to load partner details for editing.');
        }
    });

    // Close modal
    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        removeGalleryImages = [];
    });

    // Close modal on outside click
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            removeGalleryImages = [];
        }
    });

    // Handle edit form submission
    editPartnerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(editPartnerForm);
        if (removeGalleryImages.length > 0) {
            formData.append('removeGalleryImages', JSON.stringify(removeGalleryImages));
        }
        try {
            console.log('Submitting update for partner:', partnerId);
            const response = await fetch(`${baseURL}/admin/partner/updatePartner/${partnerId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                },
                body: formData
            });
            console.log('Update response status:', response.status);
            if (!response.ok) throw new Error(`Failed to update partner: ${response.status}`);
            const result = await response.json();
            if (result.status !== 'Success') throw new Error(result.message || 'Update failed');
            alert('Partner updated successfully!');
            modal.style.display = 'none';
            removeGalleryImages = [];
            fetchPartner();
        } catch (error) {
            console.error('Error updating partner:', error.message);
            alert('Failed to update partner. Please try again.');
        }
    });

    // Handle delete partner
deleteBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete this partner?')) return;
    try {
        console.log('Deleting partner:', partnerId);
        const response = await fetch(`${baseURL}/admin/partner/deletePartner/${partnerId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Delete response status:', response.status);
        if (!response.ok) throw new Error(`Failed to delete partner: ${response.status}`);
        const result = await response.json();
        if (result.status !== 'Success') throw new Error(result.message || 'Delete failed');
        alert('Partner deleted successfully!');
        window.location.href = './partner.html';
    } catch (error) {
        console.error('Error deleting partner:', error.message);
        alert('Failed to delete partner. Please try again.');
    }
});

    // Initial fetch
    fetchPartner();
});