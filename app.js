"use strict";

const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const app = express();
const crypto = require('crypto');
const path = require('path');
const { title } = require("process");
const e = require("express");

app.use(bodyParser.json()); // Used to parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static(__dirname + '/public')); // Client can access '/public' directly
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(cookieParser())

app.set('view engine', 'ejs'); //Make supporting ejs
app.set("views", path.join(__dirname, "views"));

const status = {
  OK: 200,
  CREATED: 201,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

const setDynamicFavicon = (req, res, next) => {
  res.locals.faviconPath = '../favicon.png';
  next();
};
app.use(setDynamicFavicon);

const cookieMaxAge = 60000 * 30;

const API = "http://localhost:10888"

app.get('/login', (req, res) => {
  res.render("login", { title: "Login" })
})

app.post('/loginProcess', (req, res) => {
  // 參數
  const username = req.body.username
  const password = req.body.password
  const options = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: username,
      password: password
    })
  };
  const url = `${API}/user/loginVerify`;

  fetch(url, options)
    .then((res) => {
      if (res.status === status.OK) {
        return res.json();
      } else if (res.status === status.UNAUTHORIZED) {
        return res.json().then((errData) => {
          throw new Error(errData.message);
        })
      } else {
        console.log(`Failed to authenticate user`);
      }
    })
    .then((jsonData) => {
      if (jsonData.accessToken) {
        console.log("[OK] Login success with token: " + jsonData["accessToken"]);
        res.cookie("accessToken", jsonData["accessToken"], { maxAge: cookieMaxAge, httpOnly: true });
        res.cookie("role", jsonData["role"], { maxAge: cookieMaxAge, httpOnly: true });
        res.cookie("email", jsonData["email"], { maxAge: cookieMaxAge, httpOnly: true });
        res.status(status.OK).render("window", { 
          title:"Success", 
          message:"Login successful", 
          linkBtn:"/" 
        })
      } else {
        throw new Error("Login failed");
      }
    })
    .catch((err) => {
      console.error(`[ERR] ${req.originalUrl} \n${err.message}`);
      res.status(status.UNAUTHORIZED).render("login", { title: "Login", username: username, error: err.message });
    });
})

app.get('/signup', (req, res) => {
  res.render("signup", { title: "Sign Up" })
})

app.post('/signup/sendVerifyCode', (req, res) => {
  // 參數
  const username = req.body.username
  const password = req.body.password
  const email = req.body.email

  // 暫存到中間件
  req.session.username = username;
  req.session.password = password;
  req.session.email = email;

  const addUserOptions = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: username,
      email: email
    })
  };
  const url = `${API}/user/sendEmailVerifyCode`;

  fetch(url, addUserOptions)
    .then(async (res) => {
      if (res.status === status.OK) {
        return res.json();
      } else if (res.status === status.CONFLICT) {
        const errData = await res.json();
        throw new Error(errData.message);
      } else {
        throw new Error(`Failed to send verification code`);
      }
    })
    .then((jsonData) => {
      console.log(`[OK] Verification code has been sent to ${email}.`);
      res.render("verifyCode", { title: "Verification", message: jsonData.message })
    })
    .catch((err) => {
      console.error(`[ERR] ${req.originalUrl} \n${err.message}`);
      res.render("signup", { title:"Sign Up", username: username, email: email, error: err.message });
    });
})

app.post('/signupProcess', (req, res) => {
  // 參數
  const username = req.session.username
  const password = req.session.password
  const email = req.session.email
  const code = req.body.verifyCode

  const options = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: email,
      code: code
    })
  };
  const url = `${API}/user/emailVerify`;

  fetch(url, options)
    .then(async (res) => {
      if (res.status === status.OK) {
        return res.json();
      } else if (res.status === status.UNAUTHORIZED) {
        const errData = await res.json();
        throw new Error(errData.message);
      } else {
        throw new Error(`Failed to verify email`);
      }
    })
    .then((jsonData) => {
      console.log(`[OK] ${email} verification successfull.`);
      const addUserOptions = {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: username,
          password: password,
          email: email
        })
      };
      const addUserUrl = `${API}/user/add`;

      fetch(addUserUrl, addUserOptions)
        .then((res) => {
          if (res.status === status.CREATED) {
            return res.json();
          } else {
            throw new Error(`Failed to add user`);
          }
        })
        .then((jsonData) => {
          console.log(`[OK] ${username} has been added.`);
          res.render("window", { 
            title:"Success", 
            message:"Registration successful", 
            linkBtn:"/login" 
          })
        })
        .catch((err) => {
          console.error(`[ERR] ${req.originalUrl} \n${err.message}`);
          res.render("verifyCode", { title:"Sign Up", error: err.message, message:"Verify failed." });
        });
    })
    .catch((err) => {
      console.error(`[ERR] ${req.originalUrl} \n${err.message}`);
      res.render("verifyCode", { title:"Sign Up", error: err.message, message:"Please enter the correct verification code." });
    });
})

app.get("/", (req, res) => {
  if (req.cookies.accessToken) {
    res.render("index", { title: "Home" });
  } else {
    res.redirect("/login");
  }
});

app.get("/theme", (req, res) => {
  if (req.cookies.accessToken) {
    res.render("index", { title: "Theme" });
  } else {
    res.redirect("/login");
  }
});

app.get("/help", (req, res) => {
  if (req.cookies.accessToken) {
    res.render("index", { title: "Help" });
  } else {
    res.redirect("/login");
  }
});

const port = 3000; // Replit doesn’t matter which port is using
app.listen(port, () => {
  console.log(`Connected on port ${port}`);
});

// function
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
