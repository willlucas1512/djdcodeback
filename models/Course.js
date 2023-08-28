const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
  },
  introducao: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // This refers to the User model
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  niveis: {
    type: Object,
    required: true,
  },
  qtd_niveis: {
    type: Number,
    required: true,
  },
  colunas: {
    type: Number,
    required: true,
  },
  linhas: {
    type: Number,
    required: true,
  },
});

const Course = mongoose.model("Course", CourseSchema);

module.exports = Course;
