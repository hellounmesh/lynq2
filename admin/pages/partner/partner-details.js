const baseURL = 'http://localhost:8000'

const adminToken = localStorage.getItem("adminToken");

if(!adminToken) {
    setTimeout( () => {
        window.location.href = '../index.html'

    },3000)
}
document.addEventListener('DOMContentLoaded', () => {
    const partnerDetails = document.getElementById('partnerDetails');

    // Get partner ID from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const partnerId = urlParams.get('id');

    if (!partnerId) {
        partnerDetails.innerHTML = '<p class="text-danger text-center">No partner ID provided.</p>';
        return;
    }
   
    const singlePartnerUrl = `${baseURL}/admin/partner/viewPartner/${partnerId}`
    // Function to fetch partner data
    async function fetchPartner() {
        try {
            const response = await fetch(singlePartnerUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add authorization headers if needed, e.g., 'Authorization': 'Bearer <token>'
                     'Authorization': `Bearer ${adminToken}`
        
                },
            });
            if (response.status !== 200) throw new Error(`Failed to fetch partner: ${response.status}`);
            const result = await response.json();
            if (!result.data || !result.data.partner) throw new Error('Invalid response structure');
            const partner = result.data.partner;
            renderPartner(partner);
        } catch (error) {
            console.error('Error fetching partner:', error);
            partnerDetails.innerHTML = '<p class="text-danger text-center">Failed to load partner data. Please try again later.</p>';
        }
    }

    // Function to render partner details
    function renderPartner(partner) {
        const status = partner.status.charAt(0).toUpperCase() + partner.status.slice(1);
        const thumbnailUrl = partner.thumbnailImg.length > 0 ? partner.thumbnailImg[0].path : 'img/placeholder.jpg';
        const galleryImages = partner.galleryImg.length > 0 ? partner.galleryImg : [];

        partnerDetails.innerHTML = `
            <div class="row">
                <div class="col-md-4 text-center">
                    <img src="${thumbnailUrl}" alt="Thumbnail" class="partner-img">
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
                            <p><strong>Address:</strong> ${partner.address?.addressLine1 || 'N/A'}, ${partner.address?.country || 'N/A'}</p>
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

        // Hide spinner
        document.getElementById('spinner').classList.remove('show');
    }

    // Function to open image in a new tab
    window.openImage = function (url) {
        window.open(url, '_blank');
    };

    // Fetch partner data
    fetchPartner();
});