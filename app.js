const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const session = require("express-session");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const {
  MONGO_URI,
  PORT,
  EMAIL_USERNAME,
  EMAIL_PASSWORD,
  FRONT_PROD_URI,
} = require("./config/config.env");
const app = express();
const User = require("./models/User");

//----------------------------------------- END OF IMPORTS---------------------------------------------------
const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("connected to database");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

connectDatabase();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors()
  // {
  //  origin: process.env.FRONT_PROD_URI, // <-- location of the react app were connecting to
  // credentials: true,
  // }
);
// app.options("*", cors());
app.use(
  session({
    secret: "secretcode",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(cookieParser("secretcode"));
require("./config/passport")(passport);
app.use(passport.initialize());
app.use(passport.session());

//----------------------------------------- END OF MIDDLEWARE---------------------------------------------------
// Email
const transporter = nodemailer.createTransport(
  smtpTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  })
);

// Routes

app.post("/reset-pass", (req, res) => {
  if (req.body.password === req.body.confirmPassword) {
    User.findOne(
      {
        resetPasswordToken: req.body.token,
        resetPasswordExpires: { $gt: Date.now() },
      },
      (err, user) => {
        if (err) throw err;
        if (!user)
          return res.status(400).json({
            message: "Link de reset de senha é inválido ou já expirou.",
          });
        if (user) {
          updateUserResetPassword({
            body: {
              email: user.email,
              password: req.body.password,
            },
          });
          res.status(200).json({ message: "Senha atualizada!" });
        }
      }
    );
  } else {
    return res.status(400).json({ message: "Senhas não são iguais." });
  }
});

function updateUserResetPassword(req, res) {
  User.findOne({ email: req.body.email }, async (err, user) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.save();
  });
}

function updateUserToken(req, res) {
  User.findOne({ email: req.body.email }, (err, user) => {
    user.resetPasswordToken = req.body.token;
    user.resetPasswordExpires = req.body.expires;
    user.save();
  });
}

app.post("/recover", (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) throw err;
    if (!user)
      return res
        .status(400)
        .json({ message: "Não existe um usuário cadastrado para este email." });
    if (user) {
      const token = crypto.randomBytes(20).toString("hex");
      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: req.body.email,
        subject: "Recuperação de senha",
        text:
          "Olá,  \n" +
          "Acesse o link abaixo para alterar a senha de acesso no DJDcodE: \n" +
          `http://localhost:3000/reset-pass/${token} \n` +
          "Caso não tenha solicitado a alteração de senha, favor ignorar esta mensagem.",
      };
      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.log(error);
        } else {
          updateUserToken({
            body: {
              email: user.email,
              token: token,
              expires: Date.now() + 360000,
            },
          });
          res.status(200).json({ message: "Email enviado com sucesso!" });
        }
      });
    }
  });
});

app.post("/login", (req, res, next) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) throw err;
    if (!user)
      return res
        .status(400)
        .json({ message: "Não existe um usuário cadastrado para este email." });
    bcrypt.compare(req.body.password, user.password, (err, result) => {
      if (err) throw err;
      if (result) {
        res.send(user);
      } else {
        return res.status(401).json({ message: "Senha ou email incorreto." });
      }
    });
  });
});
app.post("/register", (req, res) => {
  User.findOne({ email: req.body.email }, async (err, doc) => {
    if (err) throw err;
    if (doc)
      res.status(400).json({ message: "Usuário já existe. Faça o login." });
    if (!doc) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      const newUser = new User({
        name_first: req.body.name_first,
        name_last: req.body.name_last,
        email: req.body.email,
        password: hashedPassword,
      });
      await newUser.save();
      res.status(200).json({ message: "Conta criada com sucesso!" });
    }
  });
});
app.get("/user", (req, res) => {
  res.send(req.user); // The req.user stores the entire user that has been authenticated inside of it.
});
app.get("/", (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: {
      name: "name of your app",
      version: "0.1.0",
    },
  });
});
//----------------------------------------- END OF ROUTES---------------------------------------------------
//Start Server
app.listen(process.env.PORT || 4000, () => {
  console.log("Server Has Started");
});
