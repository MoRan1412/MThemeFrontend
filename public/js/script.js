'use strict'

// Index Load Page
function loadPage(page) {
    // Menu Class Change
    if (page == 'home') {
        $('#homeBtn').addClass('active');
        $('#productBtn').removeClass('active');
        $('#helpBtn').removeClass('active');
        $('#personalCenterBtn').removeClass('active')
    } else if (page == 'product') {
        $('#homeBtn').removeClass('active');
        $('#productBtn').addClass('active');
        $('#helpBtn').removeClass('active');
        $('#personalCenterBtn').removeClass('active')
    } else if (page == 'help') {
        $('#homeBtn').removeClass('active');
        $('#productBtn').removeClass('active');
        $('#helpBtn').addClass('active');
        $('#personalCenterBtn').removeClass('active')
    } else if (page == 'personalCenter') {
        $('#homeBtn').removeClass('active');
        $('#productBtn').removeClass('active');
        $('#helpBtn').removeClass('active');
        $('#personalCenterBtn').addClass('active')
    } else {
        // Default
    }

    // 显示进度条
    $('#progress-bar').show().css('width', '0%');

    // 模拟进度条加载
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
        } else {
            width++;
            $('#progress-bar').css('width', width + '%');
        }
    }, 10); // 每 10 毫秒增加1%

    $('#page').load(`/${page}`, function (response, status, xhr) {
        clearInterval(interval); // 清除进度条定时器
        $('#progress-bar').css('width', '100%'); // 填满进度条

        // 隐藏进度条
        setTimeout(() => {
            $('#progress-bar').fadeOut();
        }, 300); // 300 毫秒后隐藏
    });
}

function loadPage2(page) {
    $('#page2').show().css('left', '100%')

    $('#page2').animate({ left: '0%' }, 300, function() {
        // 加载新页面
        $('#page2').load(`/${page}`, function (response, status, xhr) {
        });
    });

}

function closePage2() {
    $('#page2').css('left', '0%')
    $('#page2').animate({ left: '100%' }, 300, function() {
        $('#page2').hide()
    });
}

// 初始加载 Home 页面内容
$(document).ready(function () {
    loadPage('home'); // 可选，直接加载内容
});

// Check AccessToken
function checkAccessToken() {
    $.ajax({
        url: '/accessTokenAuth',
        method: 'GET',
        dataType: 'json',
        success: function(response, status, xhr) {
            console.log('Check accessToken response:', response);
            console.log('Status code:', xhr.status);
            
            if (!response.isAuthenticated) {
                window.location.replace('/login'); // 重定向到登录页面
            }
        },
        error: function(xhr) {
            console.error('Check accessToken failed:', xhr);
            console.log('Error status code:', xhr.status);
            
            // 处理 401 错误
            if (xhr.status === 401) {
                console.warn('User is not authenticated, redirecting to login.');
                window.location.replace('/login'); // 重定向到登录页面
            } else {
                console.error('An unexpected error occurred.');
            }
        }
    });
}


// Sign Up Checking
function signupValidateForm() {
    const errWindow = document.getElementById("alertWindow")
    const errMessage = document.getElementById("errMessage")
    const errConfirm = document.getElementById("errConfirm")

    // 
    const username = document.getElementById("username").value;
    const usernameRequire = `
    Username Requirement: <br>
    - At least 3 characters long <br>
    - Start with a letter <br>
    - Only contain letters, numbers, underscores, and hyphens.
    `
    const usernameRegex = /^[a-zA-Z_][a-zA-Z0-9_-]{2,}$/;
    if (!usernameRegex.test(username)) {
        errWindow.style.display = "flex"
        errWindow.style.zIndex = "1"
        errMessage.innerHTML = usernameRequire;
        errConfirm.addEventListener("click", function () {
            errWindow.style.display = "none";
        });
        return false;
    }

    // 
    const password = document.getElementById("password").value;
    const confirm_password = document.getElementById("confirmPassword").value;
    const passRequire = `
    Password Requirement: <br>
    - At least 8 characters long. <br>
    - At least one digit. <br>
    - At least one special character (!@#$%^&*).
    `
    // 
    if (!/[!@#$%^&*]/.test(password) || !/\d/.test(password) || password.length < 8) {
        errWindow.style.display = "flex"
        errWindow.style.zIndex = "1"
        errMessage.innerHTML = passRequire
        errConfirm.addEventListener("click", function () {
            errWindow.style.display = "none";
        });
        return false;
    }
    // 
    if (password !== confirm_password) {
        errWindow.style.display = "flex"
        errWindow.style.zIndex = "1"
        errMessage.innerHTML = "Passwords do not match. Please try again."
        errConfirm.addEventListener("click", function () {
            errWindow.style.display = "none";
        });
        return false;
    }

    // 
    const email = document.getElementById("email").value;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        errWindow.style.display = "flex"
        errWindow.style.zIndex = "1"
        errMessage.innerHTML = "Invalid email format. Please enter a valid email address."
        errConfirm.addEventListener("click", function () {
            errWindow.style.display = "none";
        });
        return false;
    }

    // 
    return true;
}

// Password Checking
function passwordChangeValidateForm() {
    const errWindow = document.getElementById("alertWindow")
    const errMessage = document.getElementById("errMessage")
    const errConfirm = document.getElementById("errConfirm")

    // 
    const password = document.getElementById("password").value;
    const confirm_password = document.getElementById("confirmPassword").value;
    const passRequire = `
    Password Requirement: <br>
    - At least 8 characters long. <br>
    - At least one digit. <br>
    - At least one special character (!@#$%^&*).
    `
    // 
    if (!/[!@#$%^&*]/.test(password) || !/\d/.test(password) || password.length < 8) {
        errWindow.style.display = "flex"
        errWindow.style.zIndex = "1"
        errMessage.innerHTML = passRequire
        errConfirm.addEventListener("click", function () {
            errWindow.style.display = "none";
        });
        console.log(`Invalid password`)
        return false;
    }
    // 
    if (password !== confirm_password) {
        errWindow.style.display = "flex"
        errWindow.style.zIndex = "1"
        errMessage.innerHTML = "Passwords do not match. Please try again."
        errConfirm.addEventListener("click", function () {
            errWindow.style.display = "none";
        });
        console.log(`Two password not match`)
        return false;
    }

    return true;
}

// Username Checking
function usernameValidateForm() {
    const errWindow = document.getElementById("alertWindow")
    const errMessage = document.getElementById("errMessage")
    const errConfirm = document.getElementById("errConfirm")

    // 
    const username = document.getElementById("username").value;
    const usernameRequire = `
    Username Requirement: <br>
    - At least 3 characters long <br>
    - Start with a letter <br>
    - Only contain letters, numbers, underscores, and hyphens.
    `
    const usernameRegex = /^[a-zA-Z_][a-zA-Z0-9_-]{2,}$/;
    if (!usernameRegex.test(username)) {
        errWindow.style.display = "flex"
        errWindow.style.zIndex = "1"
        errMessage.innerHTML = usernameRequire;
        errConfirm.addEventListener("click", function () {
            errWindow.style.display = "none";
        });
        return false;
    }

    return true;
}

function emailValidateForm() {
    const errWindow = document.getElementById("alertWindow")
    const errMessage = document.getElementById("errMessage")
    const errConfirm = document.getElementById("errConfirm")

    //
    const email = document.getElementById("email").value;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        errWindow.style.display = "flex"
        errWindow.style.zIndex = "1"
        errMessage.innerHTML = "Invalid email format. Please enter a valid email address."
        errConfirm.addEventListener("click", function () {
            errWindow.style.display = "none";
        });
        return false;
    }

    return true;
}

// Slide
// function slideInAndRedirect(url) {
//     const slide = document.getElementById('slide');
//     slide.classList.add('show');
//     setTimeout(() => {
//         window.location.href = url;
//     }, 500); // 与动画时间一致
// }


// window.history.pushState(null, null, url);

// Basic Feature
function goBack() {
    window.history.back();
}

function scrollToSection(id) {
    const element = document.getElementById(id);
    const headerElement = document.getElementById("productDetailMenu");
    const headerHeight = headerElement.offsetHeight;
    const elementDistance = element.offsetTop;
    const distance = elementDistance - headerHeight;
    console.log(distance)
    window.scrollTo({
        top: distance,
        behavior: 'smooth'
    });
}