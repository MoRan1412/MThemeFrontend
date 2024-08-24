
// Sign Up
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

// Basic Feature
function goBack() {
    window.history.back();
}

function loadPage(route, loadTarget, TargetEle) {
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            document.getElementById(TargetEle).innerHTML = loadTarget
        }
    }
    xhttp.open("GET", "/" + route, true)
    xhttp.send()
}

function showKLWPDetail() {
    const productDetail = document.getElementById("productDetailContent")
    const productComment = document.getElementById("productDetailComment")
    const productDetailSelect = document.getElementById("productDetailSelect")
    const productCommentSelect = document.getElementById("productCommentSelect")
    productCommentSelect.classList.remove('productDetailSelect')
    productDetailSelect.classList.add('productDetailSelect')
    productDetail.classList.remove('hidden')
    productComment.classList.add('hidden')
    console.log("Show Product Detail")
}

function showKLWPComment() {
    const productComment = document.getElementById("productDetailComment")
    const productDetail = document.getElementById("productDetailContent")
    const productDetailSelect = document.getElementById("productDetailSelect")
    const productCommentSelect = document.getElementById("productCommentSelect")
    productCommentSelect.classList.add('productDetailSelect')
    productDetailSelect.classList.remove('productDetailSelect')
    productComment.classList.remove('hidden')
    productDetail.classList.add('hidden')
    console.log("Show Product Comment")
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    section.scrollIntoView({ behavior: 'smooth' });
}