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
    let members = [];
    let hasNextPage = true;
    let maxKnownPage = 1;

    const tableBody = document.getElementById('memberTableBody');
    const pagination = document.getElementById('pagination');
    const pageInfo = document.getElementById('pageInfo');
    const selectAll = document.getElementById('selectAll');
    const modal = document.getElementById('editModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const editForm = document.getElementById('editForm');

    async function fetchMembers() {
        try {
            const skip = (currentPage - 1) * rowsPerPage;
            const partnersUrl = `${baseURL}/admin/user/allUser?skip=${skip}&limit=${rowsPerPage}`
            
            const response = await fetch(partnersUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Brearer ${adminToken}`
                },
            });
            if (response.status !== 200) throw new Error('Failed to fetch members');
            const result = await response.json();
            members = result.data.users || [];
            hasNextPage = members.length === rowsPerPage;
            if (currentPage > maxKnownPage) maxKnownPage = currentPage;
            renderTable();
            renderPagination();
            document.getElementById('spinner').classList.remove('show');
        } catch (error) {
            console.error('Error fetching members:', error);
            alert('Failed to load member data. Please try again later.');
        }
    }

    function renderTable() {
        tableBody.innerHTML = '';
        if (members.length === 0 && currentPage === 1) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No members found</td></tr>';
        } else {
            members.forEach(member => {
                const row = document.createElement('tr');
                const createdAt = new Date(member.createdAt).toLocaleString();
                const statusClass = member.status === 'active' ? 'bg-success' : member.status === 'pending' ? 'bg-warning' : 'bg-danger';
                // In renderTable function
row.innerHTML = `
    <td><input type="checkbox" class="row-checkbox"></td>
    <td>${createdAt || 'N/A'}</td>
    <td>${member.name || 'N/A'}</td>
    <td>${member.mobile || 'N/A'}</td>
    <td>${member.email || 'N/A'}</td>
    <td>${member.instaId || 'N/A'}</td>
    <td><span class="badge ${statusClass}">${member.status.charAt(0).toUpperCase() + member.status.slice(1)}</span></td>
    <td>
        <a class="btn btn-sm btn-primary" href="view_member.html?id=${member._id}">View</a> |
        <a class="btn btn-sm btn-${member.status === 'active' ? 'danger' : 'success'} deactivate-btn" href="#" data-id="${member._id}">
            ${member.status === 'active' ? 'Deactivate' : 'Activate'}
        </a>
    </td>
`;
                tableBody.appendChild(row);
            });
        }
        const start = (currentPage - 1) * rowsPerPage + 1;
        const end = start + members.length - 1;
        pageInfo.textContent = members.length > 0
            ? `Showing ${start} to ${end} of unknown entries`
            : `Showing 0 to 0 of unknown entries`;

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const memberId = btn.getAttribute('data-id');
                const member = members.find(m => m._id === memberId);
                openEditModal(member);
            });
        });
        document.querySelectorAll('.deactivate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const memberId = btn.getAttribute('data-id');
                toggleStatus(memberId);
            });
        });
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
                fetchMembers();
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
                fetchMembers();
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
                fetchMembers();
            }
        });
        pagination.appendChild(nextItem);
    }

    selectAll.addEventListener('change', () => {
        document.querySelectorAll('.row-checkbox').forEach(checkbox => {
            checkbox.checked = selectAll.checked;
        });
    });

    function openEditModal(member) {
        document.getElementById('memberId').value = member._id;
        document.getElementById('name').value = member.name || '';
        document.getElementById('email').value = member.email || '';
        document.getElementById('mobile').value = member.mobile || '';
        document.getElementById('instaId').value = member.instaId || '';
        document.getElementById('password').value = '';
        document.getElementById('role').value = member.role || 'member';
        document.getElementById('description').value = member.userInformation?.description || '';
        document.getElementById('dob').value = member.userInformation?.dob ? new Date(member.userInformation.dob).toISOString().split('T')[0] : '';
        document.getElementById('interested').value = member.userInformation?.interested || '';
        document.getElementById('profession').value = member.userInformation?.profession || '';
        document.getElementById('gender').value = member.userInformation?.gender || 'female';
        document.getElementById('addressLine1').value = member.address?.addressLine1 || '';
        document.getElementById('addressLine2').value = member.address?.addressLine2 || '';
        document.getElementById('country').value = member.address?.country || '';
        document.getElementById('status').value = member.status || 'pending';

        const currentPhotoDiv = document.getElementById('currentPhoto');
        currentPhotoDiv.innerHTML = member.userInformation?.photo?.path
            ? `<img src="${member.userInformation.photo.path}" alt="Current Photo">`
            : '<p>No current photo</p>';

        const currentGalleryDiv = document.getElementById('currentGallery');
        currentGalleryDiv.innerHTML = member.userInformation?.gallery?.length > 0
            ? member.userInformation.gallery.map(img => `<img src="${img.path}" alt="${img.originalname || 'Gallery Image'}">`).join('')
            : '<p>No gallery images</p>';

        modal.style.display = 'block';
    }

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const memberId = document.getElementById('memberId').value;
        const formData = new FormData();

        formData.append('name', document.getElementById('name').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('mobile', document.getElementById('mobile').value);
        formData.append('instaId', document.getElementById('instaId').value);
        const password = document.getElementById('password').value;
        if (password) formData.append('password', password);
        formData.append('role', document.getElementById('role').value);
        formData.append('description', document.getElementById('description').value);
        const dob = document.getElementById('dob').value;
        if (dob) formData.append('dob', dob);
        formData.append('interested', document.getElementById('interested').value);
        formData.append('profession', document.getElementById('profession').value);
        formData.append('gender', document.getElementById('gender').value);
        formData.append('addressLine1', document.getElementById('addressLine1').value);
        formData.append('addressLine2', document.getElementById('addressLine2').value);
        formData.append('country', document.getElementById('country').value);
        formData.append('status', document.getElementById('status').value);

        const photoFile = document.getElementById('photo').files[0];
        if (photoFile) formData.append('photo', photoFile);
        const galleryFiles = document.getElementById('gallery').files;
        for (let file of galleryFiles) {
            formData.append('gallery', file);
        }

        try {
            const response = await fetch(`YOUR_BACKEND_API_ENDPOINT/members/${memberId}`, {
                method: 'PATCH',
                body: formData,
            });
            if (!response.ok) throw new Error('Failed to update member');
            alert('Member updated successfully!');
            modal.style.display = 'none';
            fetchMembers();
        } catch (error) {
            console.error('Error updating member:', error);
            alert('Failed to update member. Please try again.');
        }
    });

    async function toggleStatus(memberId) {
        const member = members.find(m => m._id === memberId);
        const newStatus = member.status === 'active' ? 'inactive' : 'active';

        try {
            const userStatusUrl = `${baseURL}/admin/user/activate/${memberId}`
            const response = await fetch(userStatusUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) throw new Error('Failed to update status');
            alert(`Member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
            fetchMembers();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status. Please try again.');
        }
    }

    fetchMembers();
});