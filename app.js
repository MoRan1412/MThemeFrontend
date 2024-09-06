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

const cookieMaxAge = 60000 * 30;

const API = "http://localhost:10888"

const commentStatus = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected'
}

const setDynamicFavicon = (req, res, next) => {
  res.locals.faviconPath = '../favicon.png';
  next();
};

app.use(setDynamicFavicon);

// Authentication System
app.get('/login', (req, res) => {
  if (req.cookies.accessToken) {
    res.redirect('/')
  } else {
    res.render("authentication", { title: "Login" })
    console.log(`[OK] ${req.originalUrl}`)
  }
})

app.get('/signup', (req, res) => {
  res.render("authentication", { title: "Sign Up" })
  console.log(`[OK] ${req.originalUrl}`)
})

app.post('/loginProcess', (req, res) => {
  if (req.cookies.accessToken) {
    res.redirect('/')
  } else {
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
        res.cookie("username", jsonData["username"], { maxAge: cookieMaxAge, httpOnly: true });
        res.cookie("userid", jsonData["id"], { maxAge: cookieMaxAge, httpOnly: true });
        res.cookie("useravatar", jsonData["avatar"], { maxAge: cookieMaxAge, httpOnly: true });
        res.cookie("language", jsonData["language"], { maxAge: cookieMaxAge, httpOnly: true });
        res.cookie("role", jsonData["role"], { maxAge: cookieMaxAge, httpOnly: true });
        res.cookie("email", jsonData["email"], { maxAge: cookieMaxAge, httpOnly: true });
        res.status(status.OK).render("window", {
          title: "Success",
          message: "Login successful",
          linkBtn: "/"
        })
      } else {
        throw new Error("Login failed");
      }
    })
    .catch((err) => {
      console.error(`[ERR] ${req.originalUrl} \n${err.message}`);
      res.status(status.UNAUTHORIZED).render("authentication", {
        title: "Login",
        username: username,
        error: err.message
      });
    });
  }
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
      res.render("authentication", {
        title: "Verification",
        message: jsonData.message
      })
    })
    .catch((err) => {
      console.error(`[ERR] ${req.originalUrl} \n${err.message}`);
      res.render("authentication", {
        title: "Sign Up",
        username: username,
        email: email,
        error: err.message
      });
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
          req.session.destroy()
          res.render("window", {
            title: "Success",
            message: "Registration successful",
            linkBtn: "/login"
          })
        })
        .catch((err) => {
          console.error(`[ERR] ${req.originalUrl} \n${err.message}`);
          res.render("authentication", {
            title: "Sign Up",
            error: err.message,
            message: "Verify failed."
          });
        });
    })
    .catch((err) => {
      console.error(`[ERR] ${req.originalUrl} \n${err.message}`);
      res.render("authentication", {
        title: "Sign Up",
        error: err.message,
        message: "Please enter the correct verification code."
      });
    });
})

app.get('/signout', (req, res) => {
  res.clearCookie('accessToken')
  res.clearCookie('username')
  res.clearCookie('useravatar')
  res.clearCookie('userid')
  res.clearCookie('role')
  res.clearCookie('language')
  res.clearCookie('email')
  res.redirect('/')
})

app.get('/passwordChangeConfirm', (req, res) => {
  if (req.cookies.accessToken) {
    console.log(`[OK] [${req.cookies.username}] ${req.originalUrl}`)
    res.render("window", {
      title: "Change Password",
      message: "Are you sure want to change your password?",
      linkBtn: "/passwordChange",
      backBtn: true
    });
  } else {
    res.redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
})

app.get('/passwordChange', (req, res) => {
  if (req.cookies.accessToken) {
    const username = req.cookies.username
    const email = req.cookies.email
    const options = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: username,
        email: email
      })
    };
    const url = `${API}/user/passwordVerifyCode`;

    fetch(url, options)
      .then(async (res) => {
        if (res.status === status.OK) {
          return res.json();
        } else {
          throw new Error(`Failed to send verification code`);
        }
      })
      .then((jsonData) => {
        console.log(`[OK] [${req.cookies.username}] Verification code has been sent to ${email}.`);
        res.render("authentication", {
          title: "Change Password",
          message: jsonData.message
        })
      }).catch((err) => {
        console.error(`[ERR] [${req.cookies.username}] ${req.originalUrl} \n${err.message}`);
        res.render("window", {
          title: "Error",
          message: err.message,
          linkBtn: "/"
        });
      });
  } else {
    res.redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
})

app.post('/passwordChangeProcess', (req, res) => {
  if (req.cookies.accessToken) {
    const code = req.body.verifyCode
    const userId = req.cookies.userid
    const email = req.cookies.email
    const password = req.body.password
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
        console.log(`[OK] [${req.cookies.username}] ${email} verification successfull.`);

        const updateUserOptions = {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            password: password
          })
        };
        const updateUserUrl = `${API}/user/update/${userId}`;
        fetch(updateUserUrl, updateUserOptions)
          .then((res) => {
            if (res.status === status.OK) {
              return res.json();
            } else {
              throw new Error(`Failed to update user`);
            }
          })
          .then((jsonData) => {
            console.log(`[OK] [${req.cookies.username}] Password has been updated.`);
            req.session.destroy()
            res.render("window", {
              title: "Success",
              message: "Update successful",
              linkBtn: "/"
            })
          })
          .catch((err) => {
            console.error(`[ERR] [${req.cookies.username}] ${req.originalUrl} \n${err.message}`);
            res.render("authentication", {
              title: "Change Password",
              error: err.message,
              message: "Verify failed."
            });
          });
      })
      .catch((err) => {
        console.error(`[ERR] [${req.cookies.username}] ${req.originalUrl} \n${err.message}`);
        res.render("authentication", {
          title: "Change Password",
          error: err.message,
          message: "Please enter the correct verification code."
        });
      });
  } else {
    res.redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
})

// Product System
app.get("/product", (req, res) => {
  if (req.cookies.accessToken) {
    const options = {
      method: "GET",
      headers: { "content-type": "application/json" },
    };
    const url = `${API}/product/get`;
    fetch(url, options)
      .then((res) => {
        if (res.status === status.OK) {
          return res.json();
        } else {
          throw new Error(`Failed to get product`);
        }
      })
      .then((jsonData) => {
        res.render("index/product", { title: "Product", product: jsonData });
        console.log(`[OK] [${req.cookies.username}] ${req.originalUrl}`);
      })
      .catch((err) => {
        console.error(`[ERR] [${req.cookies.username}] ${req.originalUrl} \n${err.message}`);
        res.render("window", {
          title: "Error",
          message: "Failed to get product",
          linkBtn: "/"
        });
      });
  } else {
    res.redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
});

app.get('/product/detail/:id', (req, res) => {
  if (req.cookies.accessToken) {
    const productId = req.params.id;
    const options = {
      method: "GET",
      headers: { "content-type": "application/json" }
    };
    const productUrl = `${API}/product/get/${productId}`;
    const commentUrl = `${API}/comment/get`;

    Promise.all([
      fetch(productUrl, options),
      fetch(commentUrl, options)
    ])
      .then(([productRes, commentRes]) => {
        if (productRes.status === status.OK && commentRes.status === status.OK) {
          return Promise.all([productRes.json(), commentRes.json()]);
        } else {
          throw new Error(`Failed to get product or comment detail`);
        }
      })
      .then(([productData, commentData]) => {
        commentData = commentData.filter(comment => comment.productId === productId);
        commentData = commentData.filter(comment => comment.status === commentStatus.approved);
        res.render("productDetail", { title: productData.name, productData, commentData });
        console.log(`[OK] [${req.cookies.username}] ${req.originalUrl}`);
      })
      .catch((err) => {
        console.error(`[ERR] [${req.cookies.username}] ${req.originalUrl} \n${err.message}`);
        res.render("window", {
          title: "Error",
          message: err.message,
          linkBtn: "/"
        });
      });
  } else {
    res.redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
})

// Personal Center System
app.get("/personalCenter", (req, res) => {
  if (req.cookies.accessToken) {
    res.render("personalCenter", {
      title: "Personal Center",
      username: req.cookies.username,
      userid: req.cookies.userid,
      role: req.cookies.role,
      useravatar: req.cookies.useravatar
    });
    console.log(`[OK] [${req.cookies.username}] ${req.originalUrl}`);
  } else {
    res.status(status.UNAUTHORIZED).redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
});

app.get("/personalCenter/profile", (req, res) => {
  if (req.cookies.accessToken) {
    res.render("personalCenter", {
      title: "Personal Information",
      username: req.cookies.username,
      userid: req.cookies.userid,
      email: req.cookies.email,
      role: req.cookies.role,
      useravatar: req.cookies.useravatar
    });
    console.log(`[OK] [${req.cookies.username}] ${req.originalUrl}`);
  } else {
    res.redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
});

app.get("/personalCenter/usernameChange", (req, res) => {
  if (req.cookies.accessToken) {
    res.render("personalCenter", {
      title: "Change Username"
    });
    console.log(`[OK] [${req.cookies.username}] ${req.originalUrl}`);
  } else {
    res.redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
})

app.post("/personalCenter/usernameChangeProcess", (req, res) => {
  if (req.cookies.accessToken) {
    const username = req.body.username
    const userId = req.cookies.userid
    const updateUserOptions = {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: username
      })
    }
    const updateUserUrl = `${API}/user/update/${userId}`;
    fetch(updateUserUrl, updateUserOptions)
      .then((res) => {
        if (res.status === status.OK) {
          return res.json();
        } else {
          throw new Error(`Failed to update username`);
        }
      })
      .then((jsonData) => {
        console.log(`[OK] [${req.cookies.username}] User's username has been updated`);
        res.cookie("username", username);
        res.render("window", {
          title: "Success",
          message: "Update username successful",
          linkBtn: "/"
        })
      })
      .catch((err) => {
        console.error(`[ERR] ${req.originalUrl} \n${err.message}`);
        res.render("authentication", {
          title: "Change Username",
          error: err.message,
          message: "Update failed"
        });
      });
  } else {
    res.redirect("/login");
    console.log(`[ERR] Require login account`);
  }
})

app.get("/admin/userManage", (req, res) => {
  if (req.cookies.accessToken) {
    const options = {
      method: "GET",
      headers: { "content-type": "application/json" }
    };
    const url = `${API}/user/get`;
    fetch(url, options)
      .then((res) => {
        if (res.status === status.OK) {
          return res.json();
        } else {
          throw new Error(`Failed to get user`);
        }
      })
      .then((jsonData) => {
        jsonData = jsonData.filter(user => user.role !== "admin");
        res.render("personalCenter", { title: "User Manage", user: jsonData });
        console.log(`[OK] [${req.cookies.username}] ${req.originalUrl}`);
      })
      .catch((err) => {
        console.error(`[ERR] [${req.cookies.username}] ${req.originalUrl} \n${err.message}`);
        res.render("window", {
          title: "Error",
          message: "Failed to get user",
          linkBtn: "/"
        });
      });
  } else {
    res.redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
})

app.get("/admin/userManage/:id", (req, res) => {
  if (req.cookies.accessToken) {
    const userId = req.params.id
    const options = {
      method: "GET",
      headers: { "content-type": "application/json" }
    };
    const url = `${API}/user/get/${userId}`;
    fetch(url, options)
      .then((res) => {
        if (res.status === status.OK) {
          return res.json();
        } else {
          throw new Error(`Failed to get user`);
        }
      })
      .then((jsonData) => {
        res.render("personalCenter", { title: "User Detail", user: jsonData });
        console.log(`[OK] [${req.cookies.username}] ${req.originalUrl}`);
      })
      .catch((err) => {
        console.error(`[ERR] [${req.cookies.username}] ${req.originalUrl} \n${err.message}`);
        res.render("window", {
          title: "Error",
          message: "Failed to get user",
          linkBtn: "/"
        });
      });
  } else {
    res.redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
})

app.post("/admin/userManageUpdate/:id", (req, res) => {
  if (req.cookies.accessToken) {
    const userId = req.params.id
    const username = req.body.username
    const email = req.body.email
    const userOptions = {
      method: "GET",
      headers: { "content-type": "application/json" }
    }
    const userUrl = `${API}/user/get`;
    const updateUserOptions = {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: username,
        email: email
      })
    }
    const updateUserUrl = `${API}/user/update/${userId}`;
    fetch(userUrl, userOptions)
      .then((res) => {
        if (res.status === status.OK) {
          return res.json();
        } else {
          throw new Error(`Failed to get user`);
        }
      })
      .then((jsonData) => {
        const usernameCheck = jsonData.find(user => user.username === username);
        if (usernameCheck) {
          throw new Error(`Username already exists`);
        }
        const userEmailCheck = jsonData.find(user => user.email === email);
        if (userEmailCheck) {
          throw new Error(`Email already exists`);
        }
        return fetch(updateUserUrl, updateUserOptions);
      })
      .then((res) => {
        if (res.status === status.OK) {
          return res.json();
        } else {
          throw new Error(`Failed to update user`);
        }
      })
      .then((jsonData) => {
        console.log(`[OK] [${req.cookies.username}] ${req.originalUrl}`);
        res.redirect("/admin/userManage");
      })
      .catch((err) => {
        console.error(`[ERR] [${req.cookies.username}] ${req.originalUrl} \n${err.message}`);
        res.render("window", {
          title: "Error",
          message: err.message,
          linkBtn: "javascript:goBack()",
          cssPathChangeTitle: "adminUserUpdate"
        });
      });
  } else {
    res.redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
})

app.get("/admin/userManage/delete", (req, res) => {
  if (req.cookies.accessToken) {
    const userId = req.query.id
    const options = {
      method: "DELETE",
      headers: { "content-type": "application/json" }
    };
    const url = `${API}/user/delete/${userId}`;
    fetch(url, options)
      .then((res) => {
        if (res.status === status.OK) {
          return res.json();
        } else {
          throw new Error(`Failed to delete user`);
        }
      })
      .then((jsonData) => {
        console.log(`[OK] [${req.cookies.username}] ${req.originalUrl}`);
        res.redirect("/admin/userManage");
      })
      .catch((err) => {
        console.error(`[ERR] [${req.cookies.username}] ${req.originalUrl} \n${err.message}`);
        res.render("window", {
          title: "Error",
          message: "Failed to delete user",
          linkBtn: "/"
        });
      });
  } else {
    res.redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
})

app.get("/admin/productManage", (req, res) => {
  if (req.cookies.accessToken) {
    const options = {
      method: "GET",
      headers: { "content-type": "application/json" }
    };
    const url = `${API}/product/get`;
    fetch(url, options)
      .then((res) => {
        if (res.status === status.OK) {
          return res.json();
        } else {
          throw new Error(`Failed to get product`);
        }
      })
      .then((jsonData) => {
        res.render("personalCenter", { title: "Product Manage", product: jsonData });
        console.log(`[OK] [${req.cookies.username}] ${req.originalUrl}`);
      })
      .catch((err) => {
        console.error(`[ERR] [${req.cookies.username}] ${req.originalUrl} \n${err.message}`);
        res.render("window", {
          title: "Error",
          message: "Failed to get product",
          linkBtn: "/"
        });
      });
  } else {
    res.redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
})

app.get("/admin/productManage/:id", (req, res) => {
  if(req.cookies.accessToken) {
    const productId = req.params.id
    const options = {
      method: "GET",
      headers: { "content-type": "application/json" }
    };
    const url = `${API}/product/get/${productId}`;
    fetch(url, options)
      .then((res) => {
        if (res.status === status.OK) {
          return res.json();
        } else {
          throw new Error(`Failed to get product`);
        }
      })
      .then((jsonData) => {
        res.render("personalCenter", { title: "Product Detail", product: jsonData });
        console.log(`[OK] [${req.cookies.username}] ${req.originalUrl}`);
      })
      .catch((err) => {
        console.error(`[ERR] [${req.cookies.username}] ${req.originalUrl} \n${err.message}`);
        res.render("window", {
          title: "Error",
          message: "Failed to get product",
          linkBtn: "/"
        });
      });
  } else {
    res.redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
})

app.get("/admin/commentManage", (req, res) => {
  if (req.cookies.accessToken) {
    const options = {
      method: "GET",
      headers: { "content-type": "application/json" }
    };
    const url = `${API}/comment/get`;
    fetch(url, options)
      .then((res) => {
        if (res.status === status.OK) {
          return res.json();
        } else {
          throw new Error(`Failed to get comment`);
        }
      })
      .then((jsonData) => {
        res.render("personalCenter", { title: "Comment Manage", comment: jsonData });
        console.log(`[OK] [${req.cookies.username}] ${req.originalUrl}`);
      })
      .catch((err) => {
        console.error(`[ERR] [${req.cookies.username}] ${req.originalUrl} \n${err.message}`);
        res.render("window", {
          title: "Error",
          message: "Failed to get comment",
          linkBtn: "/"
        });
      });
  } else {
    res.redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
})

app.get("/admin/commentManage/:id", (req, res) => {
  if (req.cookies.accessToken) {
    const commentId = req.params.id
    const options = {
      method: "GET",
      headers: { "content-type": "application/json" }
    };
    const url = `${API}/comment/get/${commentId}`;
    fetch(url, options)
      .then((res) => {
        if (res.status === status.OK) {
          return res.json();
        } else {
          throw new Error(`Failed to get comment`);
        }
      })
      .then((jsonData) => {
        res.render("personalCenter", { title: "Comment Detail", comment: jsonData });
        console.log(`[OK] [${req.cookies.username}] ${req.originalUrl}`);
      })
      .catch((err) => {
        console.error(`[ERR] [${req.cookies.username}] ${req.originalUrl} \n${err.message}`);
        res.render("window", {
          title: "Error",
          message: "Failed to get comment",
          linkBtn: "/"
        });
      });
  } else {
    res.redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
})

// Page
app.get("/", (req, res) => {
  if (req.cookies.accessToken) {
    res.render("index", { title: "Home" });
    console.log(`[OK] [${req.cookies.username}] ${req.originalUrl}`);
  } else {
    res.status(status.UNAUTHORIZED).redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
});

app.get("/home", (req, res) => {
  if (req.cookies.accessToken) {
    res.render("index/home", { title: "Home" });
    console.log(`[OK] [${req.cookies.username}] ${req.originalUrl}`);
  } else {
    res.status(status.UNAUTHORIZED).redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
})

app.get("/help", (req, res) => {
  if (req.cookies.accessToken) {
    res.render("index/help", { title: "Help" });
    console.log(`[OK] [${req.cookies.username}] ${req.originalUrl}`);
  } else {
    res.status(status.UNAUTHORIZED).redirect("/login");
    console.log(`[ERR] Require login account.`);
  }
});

// Test
app.get('/window', (req, res) => {
  res.render("window", {
    title: "Test",
    message: "This is a test message.",
    linkBtn: "/"
  })
})

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
