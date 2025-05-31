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


const baseURL = ' http://localhost:8000'
const partnerSubmitBtn = document.getElementById("partnerSubmitBtn");
const partnerForm = document.getElementById('partnerForm')

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

const addParnerDetails =async() => {

    try {

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim()
        const phone = document.getElementById("phone").value.trim();
        const restaurentName = document.getElementById("restaurentName").value.trim();
        const addressLine1 = document.getElementById("addressLine1").value.trim();
        const addressLine2 = document.getElementById("addressLine2").value.trim();
        const country = document.getElementById("country").value.trim();
        const thumbnailImgs = document.getElementById('thumbnail').files;
        const slideImages = document.getElementById('slideImages').files;

        const formData = new FormData()

        formData.append("ownerName",name);
        formData.append("email",email);
        formData.append("password",password);
        formData.append("phone",phone);
        formData.append("restaurantName",restaurentName);
        formData.append('address.addressLine1',addressLine1);
        formData.append('address.addressLine2',addressLine2);
        formData.append("address.country",country);

        if(thumbnailImgs) {

            for(let i=0;i<thumbnailImgs.length;i++) {
                formData.append("partner-thumbnailImg",thumbnailImgs[i])
            }
        }

        if(slideImages) {

            for(let i=0;i<slideImages.length;i++) {

                formData.append("partner-galleryImg",slideImages[i]);
            }
        }
        const addpartnerURL = `${baseURL}/admin/partner/addPartner`
        const adminToken = localStorage.getItem("adminToken")

        const resp= await fetch(addpartnerURL ,{
            method:'POST',
            body:formData,
            headers:{
                'Authorization': `Bearer ${adminToken}`
            }

        })

        const data = await resp.json();

        if(data.status === 200) {
            const message = data.data?.message;
            alert(message)
        }else{
            console.error(data);
            const message = data.data?.message;
            alert(message)
        }



    }catch(error){

        console.error("Error in addpartner details",error);
        alert(error);
    }
}

partnerForm.addEventListener('submit' , (e) =>{
    e.preventDefault()
    addParnerDetails()
})


document.addEventListener('DOMContentLoaded', () => {
    const rowsPerPage = 15;
    let currentPage = 1;
    let partners = [];
    let hasNextPage = true; // Assume there's a next page until proven otherwise
    let maxKnownPage = 1; // Track the highest page number reached

    const tableBody = document.getElementById('partnerTableBody');
    const pagination = document.getElementById('pagination');
    const pageInfo = document.getElementById('pageInfo');
    const selectAll = document.getElementById('selectAll');
    

    // Function to fetch partner data for the current page
    async function fetchPartners() {
        try {
            
            const adminToken = localStorage.getItem("adminToken")
            const skip = (currentPage - 1) * rowsPerPage;
            const getPartnerUrl = `${baseURL}/admin/partner/allPartner?skip=${skip}&limit=${rowsPerPage}`
            const response = await fetch(getPartnerUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add authorization headers if needed, e.g., 'Authorization': 'Bearer <token>'
                    'Authorization': `Bearer ${adminToken}`
                },
            });
            if (response.status !==200) throw new Error('Failed to fetch partners');
            const result = await response.json();
            partners = result.data.partners || [];
            // Determine if there's a next page based on the number of records returned
            hasNextPage = partners.length === rowsPerPage;
            // Update maxKnownPage if the current page is higher
            if (currentPage > maxKnownPage) maxKnownPage = currentPage;
            renderTable();
            renderPagination();
        } catch (error) {
            console.error('Error fetching partners:', error);
            alert('Failed to load partner data. Please try again later.');
        }
    }

    // Function to render table rows for the current page
    function renderTable() {
        tableBody.innerHTML = '';

        if (partners.length === 0 && currentPage === 1) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="8" class="text-center">No partners found</td>`;
            tableBody.appendChild(row);
        } else {
            
            partners.forEach(partner => {
                console.log("partnerrr",partner);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="row-checkbox"></td>
                    <td>${partner.ownerName || 'N/A'}</td>
                    <td>${partner.restaurantName || 'N/A'}</td>
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

        // Update page info (total is unknown)
        const start = (currentPage - 1) * rowsPerPage + 1;
        const end = start + partners.length - 1;
        pageInfo.textContent = partners.length > 0
            ? `Showing ${start} to ${end} of unknown entries`
            : `Showing 0 to 0 of unknown entries`;
    }

    // Function to render pagination controls
    function renderPagination() {
        pagination.innerHTML = '';

        // Previous button
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

        // Page numbers (show up to maxKnownPage)
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

        // Next button (enabled if hasNextPage is true)
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

    // Select All Checkbox Functionality
    selectAll.addEventListener('change', () => {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll.checked;
        });
    });

    

    // Initial fetch
    fetchPartners();
});