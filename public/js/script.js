'use strict';

// 加载页面函数
function loadPage(page) {
    const pathname = page;
    
    // 更新菜单中的激活按钮
    $('#homeBtn, #productBtn, #helpBtn, #personalCenterBtn').removeClass('active');
    $(`#${pathname}Btn`).addClass('active');

    // 显示并重置进度条
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
    }, 10); // 每10毫秒增加1%

    // 加载页面内容
    $('#page').load(`/${pathname}`, function (response, status, xhr) {
        clearInterval(interval); // 清除定时器
        $('#progress-bar').css('width', '100%'); // 填满进度条

        // 隐藏进度条
        setTimeout(() => {
            $('#progress-bar').fadeOut();
        }, 300); // 300毫秒后隐藏
    });
}

// 加载第二页内容并显示动画
function loadPage2(page) {
    $('#page2').show().css('left', '100%');
    $('#page2').animate({ left: '0%' }, 300, function () {
        $('#page2').load(`/${page}`, function () {
            history.pushState({ page: 'page2' }, '', `/${page}`);
        });
    });
}

// 关闭第二页
function closePage2() {
    $('#page2').animate({ left: '100%' }, 300, function () {
        $('#page2').hide();
    });
}

// 监听返回按钮事件
window.onpopstate = function (event) {
    const page = window.location.pathname.split('/')[1];
    
    if (event.state) {
        if (event.state.page === 'page1') {
            closePage2();
            loadPage(page);
        } else if (event.state.page === 'page2') {
            loadPage2(page);
        }
    } else {
        console.log('State is null, returning to the initial page.');
        closePage2();
    }
};

// 初始加载首页内容
$(document).ready(function () {
    loadPage('home');
});

// 验证 AccessToken
function checkAccessToken() {
    $.ajax({
        url: '/accessTokenAuth',
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            if (!response.isAuthenticated) {
                window.location.replace('/login');
            }
        },
        error: function (xhr) {
            if (xhr.status === 401) {
                window.location.replace('/login');
            } else {
                console.error('An unexpected error occurred.');
            }
        }
    });
}

// 注册表单验证
function signupValidateForm() {
    const errWindow = document.getElementById("alertWindow");
    const errMessage = document.getElementById("errMessage");
    const errConfirm = document.getElementById("errConfirm");

    const username = document.getElementById("username").value;
    const usernameRegex = /^[a-zA-Z_][a-zA-Z0-9_-]{2,}$/;
    const usernameRequire = `用户名要求：<br> - 至少 3 个字符<br> - 以字母开头<br> - 仅包含字母、数字、下划线和连字符`;

    if (!usernameRegex.test(username)) {
        showError(errWindow, errMessage, errConfirm, usernameRequire);
        return false;
    }

    const password = document.getElementById("password").value;
    const confirm_password = document.getElementById("confirmPassword").value;
    const passRequire = `密码要求：<br> - 至少 8 个字符<br> - 至少包含一个数字<br> - 至少包含一个特殊字符 (!@#$%^&*)`;

    if (!/[!@#$%^&*]/.test(password) || !/\d/.test(password) || password.length < 8) {
        showError(errWindow, errMessage, errConfirm, passRequire);
        return false;
    }

    if (password !== confirm_password) {
        showError(errWindow, errMessage, errConfirm, "密码不一致，请重新输入。");
        return false;
    }

    const email = document.getElementById("email").value;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        showError(errWindow, errMessage, errConfirm, "邮箱格式无效，请输入正确的邮箱地址。");
        return false;
    }

    return true;
}

// 显示错误提示
function showError(errWindow, errMessage, errConfirm, message) {
    errWindow.style.display = "flex";
    errWindow.style.zIndex = "1";
    errMessage.innerHTML = message;
    errConfirm.addEventListener("click", function () {
        errWindow.style.display = "none";
    });
}

// 密码验证表单
function passwordChangeValidateForm() {
    const errWindow = document.getElementById("alertWindow");
    const errMessage = document.getElementById("errMessage");
    const errConfirm = document.getElementById("errConfirm");

    const password = document.getElementById("password").value;
    const confirm_password = document.getElementById("confirmPassword").value;
    const passRequire = `密码要求：<br> - 至少 8 个字符<br> - 至少包含一个数字<br> - 至少包含一个特殊字符 (!@#$%^&*)`;

    if (!/[!@#$%^&*]/.test(password) || !/\d/.test(password) || password.length < 8) {
        showError(errWindow, errMessage, errConfirm, passRequire);
        return false;
    }

    if (password !== confirm_password) {
        showError(errWindow, errMessage, errConfirm, "密码不一致，请重新输入。");
        return false;
    }

    return true;
}

// 用户名验证
function usernameValidateForm() {
    const errWindow = document.getElementById("alertWindow");
    const errMessage = document.getElementById("errMessage");
    const errConfirm = document.getElementById("errConfirm");

    const username = document.getElementById("username").value;
    const usernameRegex = /^[a-zA-Z_][a-zA-Z0-9_-]{2,}$/;
    const usernameRequire = `用户名要求：<br> - 至少 3 个字符<br> - 以字母开头<br> - 仅包含字母、数字、下划线和连字符`;

    if (!usernameRegex.test(username)) {
        showError(errWindow, errMessage, errConfirm, usernameRequire);
        return false;
    }

    return true;
}

// 邮箱验证
function emailValidateForm() {
    const errWindow = document.getElementById("alertWindow");
    const errMessage = document.getElementById("errMessage");
    const errConfirm = document.getElementById("errConfirm");

    const email = document.getElementById("email").value;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
        showError(errWindow, errMessage, errConfirm, "邮箱格式无效，请输入正确的邮箱地址。");
        return false;
    }

    return true;
}

// 返回上一步
function goBack() {
    window.history.back();
}

// 滑动到特定页面部分
function scrollToSection(id) {
    const element = document.getElementById(id);
    const headerElement = document.getElementById("productDetailMenu");
    const headerHeight = headerElement.offsetHeight;
    const elementDistance = element.offsetTop;
    const distance = elementDistance - headerHeight;
    window.scrollTo({
        top: distance,
        behavior: 'smooth'
    });
}
