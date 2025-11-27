require("dotenv").config();
const express = require("express");
const path = require("path");
const http = require("http");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const hbs = require("hbs");
const moment = require("moment"); 
const User = require("./models/User");
const Notification = require("./models/Notification");

const app = express();
const server = http.createServer(app);

const io = require("socket.io")(server, {
	withCredentials: false,
	rejectUnauthorized: false,
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});

const JWT_SECRET = process.env.JWT_SECRET || "verysecret";

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

hbs.handlebars.registerHelper("formatDate", function(date) {
  return moment(date).format("DD MMM YYYY, hh:mm A");
});
hbs.registerHelper("yesNo", function(value) {
  return value ? "Yes" : "No";
});

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/notify-demo").then(()=>console.log("Mongo connected"));

/* --- Middleware to protect routes --- */
function authMiddleware(req, res, next) {
  	const token = req.cookies.token;
  	if (!token) return res.redirect("/");
  	try {
    	const payload = jwt.verify(token, JWT_SECRET);
    	req.user = payload;
    	next();
  	} catch (e) {
    	return res.redirect("/");
  	}
}

/* --- Routes: register, login, dashboard, logout --- */
app.get("/", (req, res) => res.render("index"));
app.get("/register", (req, res) => res.render("register"));

app.post("/register", async (req, res) => {
  	const { email, password, username } = req.body;
  	const passwordHash = await bcrypt.hash(password, 10);
	try {
		const user = await User.create({ email, passwordHash, username });
		const token = jwt.sign({ id: user._id, username: user.username, email }, JWT_SECRET, { expiresIn: "7d" });
		res.cookie("token", token, { httpOnly: true });
		res.redirect("/dashboard");
	} catch (e) {
		return res.send("Error: " + e.message);
	}
});

app.post("/login", async (req, res) => {
	const { email, password } = req.body;
	const user = await User.findOne({ email });
	if (!user) return res.send("Invalid credentials");
	const ok = await bcrypt.compare(password, user.passwordHash);
	if (!ok) return res.send("Invalid credentials");
	const token = jwt.sign({ id: user._id, username: user.username, email }, JWT_SECRET, { expiresIn: "7d" });
	res.cookie("token", token, { httpOnly: true });
	res.redirect("/dashboard");
});

app.get("/dashboard", authMiddleware, async (req, res) => {
  	// fetch notifications where user is sender or receiver (latest 50)
  	const history = await Notification.find({ $or: [{from: req.user.username}, {to: req.user.username}] }).sort({createdAt:-1}).limit(50);
  	res.render("dashboard", { user: req.user.username, notifications: history });
});

app.post("/save-fcm-token", authMiddleware, async (req, res) => {
  	const { token } = req.body;
  	console.log(req.body)
  	await User.findByIdAndUpdate(req.user.id, { fcmToken: token });
  	res.json({ ok: true });
});

app.post("/logout", (req, res) => {
  	res.clearCookie("token");
  	res.redirect("/");
});

/* --- Socket.io mapping --- */
let userSockets = {}; // username -> socket.id
io.on("connection", (socket) => {
    console.log("socket connected", socket.id);
    socket.on("register-user", async ({ username }) => {
        userSockets[username] = socket.id;
        console.log("registered socket for", username, socket.id);
    });

    socket.on("send-notification", async ({ from, to, message }) => {
		console.log(from, to, message )
		// Save notification record
		const notif = await Notification.create({ from, to, message });
		// deliver via socket if online
		const toSocket = userSockets[to];
		let deliveredViaSocket = false;
		if (toSocket) {
			io.to(toSocket).emit("receive-notification", { from, message, createdAt: notif.createdAt });
			deliveredViaSocket = true;
			notif.deliveredViaSocket = true;
			await notif.save();
		}

		// send FCM push if token present
		const userTo = await User.findOne({ username: to });
		let deliveredViaPush = false;
		console.log(userTo)
		if (userTo && userTo.fcmToken) {
			try {
				await sendFirebasePush(userTo.fcmToken, { title: `Message from ${from}`, body: message });
				deliveredViaPush = true;
				notif.deliveredViaPush = true;
				await notif.save();
			} catch (e) {
					console.error("FCM send error", e);
			}
		}
    });

    socket.on("disconnect", () => {
        // remove any user mapping for this socket
        for (const u in userSockets) {
          	if (userSockets[u] === socket.id) delete userSockets[u];
        }
    });
});


const admin = require("firebase-admin");
// const serviceAccount = require("./service-account.json");

const serviceAccount = {
  "type": process.env.TYPE,
  "project_id": process.env.PROJECT_ID,
  "private_key_id": process.env.PRIVATE_KEY_ID,
  "private_key": process.env.PRIVATE_KEY,
  "client_email": process.env.CLIENT_EMAIL,
  "client_id": process.env.CLIENT_ID,
  "auth_uri": process.env.AUTH_URI,
  "token_uri": process.env.TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.AUTH_PRO_URL,
  "client_x509_cert_url": process.env.CLIENT_URL,
  "universe_domain": process.env.DOMAIN
}
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function sendFirebasePush(token, { title, body }) {
    const message = {
      	token,
      	notification: {
        	title,
        	body,
      	},
      	data: {
        	custom: "payload"
      	}
    };

    try {
        const response = await admin.messaging().send(message);
        console.log("Notification sent:", response);
        return response;
    } catch (error) {
        console.error("Error sending notification:", error);
    }
}

const PORT = process.env.PORT || 3006;
server.listen(PORT, ()=>console.log("Server running on", PORT));
