const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "twitterClone.db");
let db = null;
const InitializeAndStartServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`${e.message}`);
    process.exit(1);
  }
};

InitializeAndStartServer();
//register

app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const availUser = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(availUser);
  if (dbUser === undefined) {
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const addUser = `INSERT INTO user(username,password,name,gender) VALUES('${username}','${hashedPassword}','${name}','${gender}');`;
      await db.run(addUser);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const availabilityUser = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(availabilityUser);
  if (dbUser !== undefined) {
    const passwordMatch = await bcrypt.compare(password, dbUser.password);
    if (passwordMatch) {
      const jwtToken = jwt.sign(username, "MY_SECRET");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

//middleware function

const AuthenticateUser = async (request, response, next) => {
  let token;
  const jwttoken = request.headers["authorization"];
  if (jwttoken !== undefined) {
    token = jwttoken.split(" ")[1];
  }
  if (token === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    const tokenVerification = await jwt.verify(
      token,
      "MY_SECRET",
      (error, payload) => {
        if (error) {
          response.status(401);
          response.send("Invalid JWT Token");
        } else {
          request.username = payload;
          next();
        }
      }
    );
  }
};

//Recent tweets

app.get("/user/tweets/feed/", AuthenticateUser, async (request, response) => {
  try {
    const { username } = request;
    console.log(username);
    const feedQuery = `SELECT user.username,tweet.tweet,tweet.date_time AS dateTime FROM (user INNER JOIN tweet ON user.user_id=tweet.user_id)AS t1 INNER JOIN follower ON t1.user_id=follower.follower_user_id WHERE user.username='${username}' ORDER BY tweet.date_time DESC LIMIT 4;`;
    const dbResponse = await db.all(feedQuery);
    response.send(dbResponse);
  } catch (e) {
    console.log(`${e.message}`);
  }
});

//user following
app.get("/user/following/", AuthenticateUser, async (request, response) => {
  try {
    const { username } = request;
    const userIdQuery = `SELECT user_id FROM user WHERE username='${username}';`;
    const userId = await db.get(userIdQuery);
    //console.log(userId);

    const followingQuery = `SELECT DISTINCT user.name FROM user INNER JOIN follower ON user.user_id=follower.following_user_id WHERE follower.follower_user_id=${userId.user_id};`;
    const Response = await db.all(followingQuery);
    response.send(Response);
  } catch (e) {
    console.log(`${e.message}`);
  }
});

//user followers

app.get("/user/followers/", AuthenticateUser, async (request, response) => {
  try {
    const { username } = request;
    const userIdQuery = `SELECT user_id FROM user WHERE username='${username}';`;
    const userId = await db.get(userIdQuery);
    //console.log(userId);
    const followingQuery = `SELECT DISTINCT user.name FROM user INNER JOIN follower ON user.user_id=follower.following_user_id WHERE follower.following_user_id=${userId.user_id};`;
    const Response = await db.all(followingQuery);
    response.send(Response);
  } catch (e) {
    console.log(`${e.message}`);
  }
});

//tweets user
app.get("/tweet/:tweetId/", AuthenticateUser, async (request, response) => {
  const { username } = request;
  const { tweetId } = request.params;
  const userIdQuery = `SELECT user_id FROM user WHERE username='${username}';`;
  const userId = await db.get(userIdQuery);
  const tweetUserQuery = `SELECT user_id FROM tweet WHERE tweet_id=${tweetId};`;
  const tweetUser = await db.get(tweetUserQuery);
  //user following tweets
  const tweetsQuery = `SELECT `;
});
