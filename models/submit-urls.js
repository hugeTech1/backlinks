const mongoose = require("mongoose");

const submitUrlSchema = mongoose.Schema({
  url: { type: String, required: true },
  status: {
    type: String,
    enum: ["indexed", "not indexed"],
    default: "not indexed",
  },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SubmitUrl", submitUrlSchema);
