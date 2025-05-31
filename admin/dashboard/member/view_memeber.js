const baseURL = 'http://localhost:8000'


document.addEventListener('DOMContentLoaded', () => {
    const memberDetails = document.getElementById('memberDetails');
    const statusBtn = document.getElementById('statusBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const token = localStorage.getItem('adminToken'); // Replace with actual token (e.g., localStorage.getItem('token'))
    let member = null;

    // Get member ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const memberId = urlParams.get('id');
    if (!memberId) {
        alert('No member ID provided.');
        window.location.href = 'member.html';
        return;
    }

    // Fetch member details
    async function fetchMember() {
        try {
            const response = await fetch(`${baseURL}/admin/user/viewUser/${memberId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.status != 200) throw new Error('Failed to fetch member');
            const result = await response.json();
            if (result.status !== 'Success' || !result.data.user) {
                throw new Error(result.message || 'Member not found');
            }
            console.log("result",result)
            member = result.data.user;
            renderMemberDetails();
            updateStatusButton();
            document.getElementById('spinner').classList.remove('show');
        } catch (error) {
            console.error('Error fetching member:', error);
            alert('Failed to load member details. Please try again.');
            window.location.href = 'member.html';
        }
    }

    // Render member details
    function renderMemberDetails() {
        const createdAt = new Date(member.createdAt).toLocaleString();
        const updatedAt = new Date(member.updatedAt).toLocaleString();
        const dob = member.userInformation?.dob ? new Date(member.userInformation.dob).toLocaleDateString() : 'N/A';
        const statusClass = member.status === 'active' ? 'bg-success' : member.status === 'pending' ? 'bg-warning' : 'bg-danger';
        const isDeleted = member.isDeleted ? '<span class="badge bg-danger">Deleted</span>' : '<span class="badge bg-success">Active</span>';

        memberDetails.innerHTML = `
            <div class="detail-card">
                <h5>Basic Information</h5>
                <p><strong>Name:</strong> ${member.name || 'N/A'}</p>
                <p><strong>Email:</strong> ${member.email || 'N/A'}</p>
                <p><strong>Mobile:</strong> ${member.mobile || 'N/A'}</p>
                <p><strong>Insta ID:</strong> ${member.instaId || 'N/A'}</p>
                <p><strong>Role:</strong> ${member.role || 'N/A'}</p>
                <p><strong>Status:</strong> <span class="badge ${statusClass}">${member.status.charAt(0).toUpperCase() + member.status.slice(1)}</span></p>
                <p><strong>Account Status:</strong> ${isDeleted}</p>
                <p><strong>Approved By:</strong> ${member.approvedBy?.name || member.approvedBy || 'N/A'}</p>
                <p><strong>Created At:</strong> ${createdAt}</p>
                <p><strong>Updated At:</strong> ${updatedAt}</p>
            </div>
            <div class="detail-card">
                <h5>User Information</h5>
                <p><strong>Description:</strong> ${member.userInformation?.description || 'N/A'}</p>
                <p><strong>Date of Birth:</strong> ${dob}</p>
                <p><strong>Interested In:</strong> ${member.userInformation?.interested || 'N/A'}</p>
                <p><strong>Profession:</strong> ${member.userInformation?.profession || 'N/A'}</p>
                <p><strong>Gender:</strong> ${member.userInformation?.gender || 'N/A'}</p>
                <div class="profile-photo">
                    <strong>Profile Photo:</strong><br>
                    ${member.userInformation?.photo?.path ? `<img src="${member.userInformation.photo.path}" alt="Profile Photo">` : 'No photo'}
                </div>
                <div class="gallery">
                    <strong>Gallery:</strong><br>
                    ${member.userInformation?.gallery?.length > 0 
                        ? member.userInformation.gallery.map(img => `<img src="${img.path}" alt="${img.originalname || 'Gallery Image'}">`).join('')
                        : 'No gallery images'}
                </div>
            </div>
            <div class="detail-card">
                <h5>Address</h5>
                <p><strong>Address Line 1:</strong> ${member.address?.addressLine1 || 'N/A'}</p>
                <p><strong>Address Line 2:</strong> ${member.address?.addressLine2 || 'N/A'}</p>
                <p><strong>Country:</strong> ${member.address?.country || 'N/A'}</p>
            </div>
            <div class="detail-card">
                <h5>Device Tokens</h5>
                <p><strong>Web:</strong> ${member.deviceToken?.web?.length > 0 ? member.deviceToken.web.join(', ') : 'None'}</p>
                <p><strong>Android:</strong> ${member.deviceToken?.android?.length > 0 ? member.deviceToken.android.join(', ') : 'None'}</p>
                <p><strong>iOS:</strong> ${member.deviceToken?.ios?.length > 0 ? member.deviceToken.ios.join(', ') : 'None'}</p>
            </div>
        `;
    }

    // Update status button text and class
    function updateStatusButton() {
        if (member.isDeleted) {
            statusBtn.disabled = true;
            statusBtn.textContent = 'Member Deleted';
            statusBtn.className = 'btn btn-sm btn-secondary';
        } else {
            statusBtn.disabled = false;
            statusBtn.textContent = member.status === 'active' ? 'Deactivate Member' : 'Activate Member';
            statusBtn.className = `btn btn-sm btn-${member.status === 'active' ? 'danger' : 'success'}`;
        }
    }

    // Toggle member status
    statusBtn.addEventListener('click', async () => {
        if (member.isDeleted) return;
        const newStatus = member.status === 'active' ? 'inactive' : 'active';
        if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this member?`)) return;
        try {
            const response = await fetch(`${baseURL}/admin/user/activate/${memberId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.status !== 200) throw new Error('Failed to update status');
            alert(`Member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
            fetchMember();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status. Please try again.');
        }
    });

    // Delete member
    deleteBtn.addEventListener('click', async () => {
        if (member.isDeleted) {
            alert('Member is already deleted.');
            return;
        }
        if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) return;
        try {
            const response = await fetch(`${baseURL}/admin/user/deleteUser/${memberId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.status !==200) throw new Error('Failed to delete member');
            alert('Member deleted successfully!');
            window.location.href = 'member.html';
        } catch (error) {
            console.error('Error deleting member:', error);
            alert('Failed to delete member. Please try again.');
        }
    });

    // Initial fetch
 fetchMember();
});