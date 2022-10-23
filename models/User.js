const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name_first: {
    type: String,
    required: true,
  },
  name_last: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: {
    type: String,
    required: false,
  },
  resetPasswordExpires: {
    type: Number,
    required: false,
  },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
