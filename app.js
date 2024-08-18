"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();

const path = require("path");
const multer = require("multer");
const fs = require("fs");
const crypto = require("crypto");
const { name, render } = require("ejs");
const exp = require("constants");

app.use(bodyParser.json()); // Used to parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static(__dirname + "/public")); // Client can access '/public' directly
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));

const status = {
  OK: 200,
  CREATED: 201,
  NOT_MODIFIED: 304,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

const cookieMaxAge = 60000 * 30;

const API = "http://ooklibaioo.com:10888"

let storage = multer.diskStorage({
  destination: function (req, file, callback) {
    let folderPath = "./public/source/image/products";
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    callback(null, folderPath);
  },
  filename: function (req, file, callback) {
    const uniqueSuffix = Math.random().toString(36).substring(2, 9);
    const extname = path.extname(file.originalname);
    callback(null, uniqueSuffix + extname);
  },
});

let profileStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    let folderPath = "./public/source/image/profile/avatar";
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    callback(null, folderPath);
  },
  filename: function (req, file, callback) {
    const uniqueSuffix = Math.random().toString(36).substring(2, 9);
    const extname = path.extname(file.originalname);
    callback(null, uniqueSuffix + extname);
  },
});

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

const hashPassword = (passwd) => {
  return crypto.createHash("sha256").update(passwd).digest("hex");
};
