const mongoose = require("mongoose");
const NotificationSchema = new mongoose.Schema({
  from: String,
  to: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
  deliveredViaSocket: { type: Boolean, default: false },
  deliveredViaPush: { type: Boolean, default: false }
});
module.exports = mongoose.model("Notification", NotificationSchema);
