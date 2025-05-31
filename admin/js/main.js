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
        nav : false
    });

    
})(jQuery);


const baseURL = ' http://localhost:8000'

const adminToken = localStorage.getItem("adminToken");

if(!adminToken) {
    setTimeout( () => {
        window.location.href = './login/login.html'

    },3000)
}

function logout() {
    localStorage.removeItem('adminToken')
    setTimeout( () => {
        window.location.href = './login/login.html'

    },1000)
}

document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault()
    logout();
});

// Fetch data with authentication
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${baseURL}${endpoint}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
                "Content-Type": "application/json"
            }
        });
        if (response.status === 401) {
            alert("Session expired. Please log in again.");
            logout();
        }
        const data = await response.json();
        return data.data.users || [];
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return [];
    }
}

// Populate Pending Members Table
async function loadPendingMembers() {
    const members = await fetchData("/admin/user/allUser?status=pending&skip=0&limit=10");
    const tbody = document.getElementById("pendingMembersTable");
    tbody.innerHTML = members.length ? members.map(member => `
        <tr>
            <td><input class="form-check-input" type="checkbox"></td>
            <td>${member.name || "N/A"}</td>
            <td>${member.email || "N/A"}</td>
            <td>${new Date(member.createdAt).toLocaleDateString() || "N/A"}</td>
            <td><a class="btn btn-sm btn-primary" href="./dashboard/member/view_member.html?id=${member._id}">Review</a></td>
        </tr>
    `).join("") : "<tr><td colspan='5'>No pending members</td></tr>";
}



 // Populate Pending Bookings Table
 async function loadPendingBookings() {
    const bookings = await fetchData("/public/pending-bookings");
    const tbody = document.getElementById("pendingBookingsTable");
    tbody.innerHTML = bookings.length ? bookings.map(booking => `
        <tr>
            <td><input class="form-check-input" type="checkbox"></td>
            <td>${booking.bookingId || "N/A"}</td>
            <td>${booking.customer || "N/A"}</td>
            <td>${new Date(booking.date).toLocaleDateString() || "N/A"}</td>
            <td><a class="btn btn-sm btn-primary" href="pending-booking.html?id=${booking._id}">Review</a></td>
        </tr>
    `).join("") : "<tr><td colspan='5'>No pending bookings</td></tr>";
}

// Populate Upcoming Events Table
async function loadUpcomingEvents() {
    const events = await fetchData("/public/upcoming-events");
    const tbody = document.getElementById("upcomingEventsTable");
    tbody.innerHTML = events.length ? events.map(event => `
        <tr>
            <td><input class="form-check-input" type="checkbox"></td>
            <td>${event.name || "N/A"}</td>
            <td>${new Date(event.date).toLocaleDateString() || "N/A"}</td>
            <td>${event.location || "N/A"}</td>
            <td><a class="btn btn-sm btn-primary" href="event.html?id=${event._id}">Details</a></td>
        </tr>
    `).join("") : "<tr><td colspan='5'>No upcoming events</td></tr>";
}

// Populate Pending Events Table
async function loadPendingEvents() {
    const events = await fetchData("/public/pending-events");
    const tbody = document.getElementById("pendingEventsTable");
    tbody.innerHTML = events.length ? events.map(event => `
        <tr>
            <td><input class="form-check-input" type="checkbox"></td>
            <td>${event.name || "N/A"}</td>
            <td>${new Date(event.date).toLocaleDateString() || "N/A"}</td>
            <td>${event.location || "N/A"}</td>
            <td><a class="btn btn-sm btn-primary" href="event.html?id=${event._id}&status=pending">Review</a></td>
        </tr>
    `).join("") : "<tr><td colspan='5'>No pending events</td></tr>";
}



window.onload = async() => {
    await loadPendingMembers();
}

