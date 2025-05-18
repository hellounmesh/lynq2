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