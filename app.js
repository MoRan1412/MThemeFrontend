"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const app = express();
const crypto = require('crypto');
const path = require('path')
 
app.use(bodyParser.json()); // Used to parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static(__dirname + '/public')); // Client can access '/public' directly
app.use(cookieParser())

app.set('view engine', 'ejs'); //Make supporting ejs
app.set("views", path.join(__dirname, "views"));

const status = {
  OK: 200,
  CREATED: 201,
  NOT_MODIFIED: 304,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

const cookieMaxAge = 60000 * 30;
const signUpHolding = []

const API = "http://localhost:10888"

app.get('/login', (req, res) => {
  res.render("login", {title: "Login"})
})

app.post('/loginProcess', (req, res) => {
  const options = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: req.body.username,
      password: req.body.password
    })
  };
  const url = `${API}/user/loginVerify`;

  fetch(url, options).then((res) => {
      if (res.status === status.OK) {
        return res.json();
      }
    })
    .then((jsonData) => {
      if (jsonData.accessToken) {
        console.log("[OK] Login success with token: " + jsonData["accessToken"]);
        res.cookie("accessToken", jsonData["accessToken"], { maxAge: cookieMaxAge, httpOnly: true });
        res.cookie("role", jsonData["role"], { maxAge: cookieMaxAge, httpOnly: true });
        res.cookie("email", jsonData["email"], { maxAge: cookieMaxAge, httpOnly: true });
        res.status(status.OK).redirect("/")
      } else {
        throw new Error("Incorrect username or password");
      }
    })
    .catch((err) => {
      console.error(`[ERR] ${req.originalUrl} \n${err}`);
      res.status(status.INTERNAL_SERVER_ERROR).render("login", { error: err });
    });
})

app.get('/signup', (req, res) => {
  res.render("signup", {title: "Sign Up"})
})

app.post('/signup/sendVerifyCode', (req, res) => {
  
})

app.get("/", (req, res) => {
  res.render("index");
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
