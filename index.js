const express = require("express");
const cors = require("cors");


const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const verifyFirebaseToken = require("./verifyFirebaseToken");


const app = express();
const port = 3000;

// Enable CORS and JSON parsing

const admin = require("firebase-admin");
require('dotenv').config()

var serviceAccount = require("./service.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middlewares
app.use(cors());
app.use(express.json());



const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.um9bwdr.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// create middleware
const verifyToken = async (req, res, next) => {
  try {
    const AuthorizationToken = req.headers.authorization;

    if (!AuthorizationToken) {
      return res
        .status(401)
        .json({ message: "unauthorized: no token provided" });
    }

    const token = AuthorizationToken.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "unauthorized: invalid token format" });
    }

    const decodedUser = await admin.auth().verifyIdToken(token);
    req.user = decodedUser;

    next();
  } catch (error) {
    console.error("Token verify error:", error.message);
    return res
      .status(403)
      .json({ message: "forbidden: invalid or expired token" });
  }
};


// verify admin


// const verifyAdmin = async (req, res, next) => {
//   const email = req.user.email;
//   const user = await usersCollection.findOne({ email });
//   console.log("admin user", user);

//   if (user?.role !== "admin") {
//     return res.status(403).json({ message: "admin only access" });
//   }

//   next();
// };


async function run() {
  try {
    // await client.connect();
    const db = client.db("conceptual_session-1");
    const modelCollection = db.collection("conceptual_db");
    const downloadCollection = db.collection("download");
    const contributionCollection = db.collection("contributions");
    const reviewsCollection = db.collection("reviews");
    const newsletterCollection = db.collection("newsletterSubscribers");
    const usersCollection = db.collection("users");


    const verifyAdmin = async (req, res, next) => {
  const email = req.user.email;
  const user = await usersCollection.findOne({ email });
  console.log("admin user", user);

  if (user?.role !== "admin") {
    return res.status(403).json({ message: "admin only access" });
  }

  next();
};





  app.post("/users", async (req, res) => {
  const user = req.body;

  if (!user?.email) {
    return res.status(400).json({ success: false, message: "Email required" });
  }

  const exists = await usersCollection.findOne({ email: user.email });

  if (exists) {
    return res.json({ success: true, message: "User already exists" });
  }

  const result = await usersCollection.insertOne({
    name: user.displayName || "Anonymous",
    email: user.email,
    photoURL: user.photoURL || "",
    provider: user.provider,
    role: "user",
    createdAt: new Date(),
  });

  res.json({ success: true, result });
});




// GET user role by email
// GET user role by email
app.get("/users/role/:email", verifyToken, async (req, res) => {
  const email = req.params.email;

  // Optional security: only the user itself can get their role
  if (req.user.email !== email) {
    return res.status(403).json({ message: "Forbidden access" });
  }

  const user = await usersCollection.findOne({ email });

  if (!user) {
    return res.status(404).json({ role: "user" });
  }

  res.json({ role: user.role });
});
















































    app.get("/models", async (req, res) => {
      // console.log("foysal");
      const result = await modelCollection.find().toArray();
      res.send(result);
    });

    app.get("/models/latest", async (req, res) => {
      try {
        const result = await modelCollection
          .find()
          .sort({ date: -1 })
          .limit(6) 
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Something went wrong!" });
      }
    });

    // by mail

    
    app.get("/my-models",verifyToken,  async (req, res) => {
      try {
        const userEmail = req.user.email;
        const result = await modelCollection
          .find({ email: userEmail })
          .toArray();
        res.json({ success: true, result });
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch models" });
      }
    });

    app.get("/models/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      console.log(id);

      const result = await modelCollection.findOne({ _id: new ObjectId(id) });

      res.send({
        success: true,
        result,
      });
    });

    app.post("/models", async (req, res) => {
      try {
        const newModel = req.body;
        await modelCollection.insertOne(newModel);
        res.json({ message: "Model added successfully" }); 
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add model" });
      }
    });

    app.put("/models/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      console.log(id, data);

      const objId = new ObjectId(id);
      const result = await modelCollection.updateOne(
        { _id: objId },
        { $set: data } 
      );

      res.send({
        success: result.modifiedCount > 0,
        result,
      });
    });

    app.delete("/models/:id", async (req, res) => {
      const { id } = req.params;
      const result = await modelCollection.deleteOne({ _id: new ObjectId(id) });

      res.send({
        success: true,
      });
    });

    // app.post("/downloads", async (req, res) => {
    //   const data = req.body;
    //   const result = await downloadCollection.insertOne(data);
    //   res.send(result);
    // });


    // POST /contributions
app.post("/contributions", async (req, res) => {
  const contribution = req.body;
  const result = await contributionCollection.insertOne(contribution);
  res.send({ success: true, result });
});


// GET /contributions/:issueId
app.get("/contributions/:issueId", async (req, res) => {
  const issueId = req.params.issueId;
  const result = await contributionCollection.find({ issueId }).toArray();
  res.send({ success: true, result });
});

app.get("/contributions/issue/:issueId", async (req, res) => {
  const { issueId } = req.params;
  try {
    const contributions = await db.collection("contributions").find({ issueId }).toArray();
    res.json({ success: true, result: contributions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/contributions",verifyToken, async (req, res) => {
  try {
    const email = req.query.email; 

    if (!email) {
      return res.send({ success: false, message: "Email is required" });
    }

    const result = await contributionCollection.find({ email }).toArray();

    res.send({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
});

app.get("/search", async (req, res) => {
  const query = req.query.q;
  const result = await modelCollection
    .find({ title: { $regex: query, $options: "i" } })
    .toArray();
  res.send(result);
});


app.get("/reviews", async (req, res) => {
  const result = await reviewsCollection.find().toArray();
  res.send(result);
});
app.post("/reviews", async (req, res) => {
  const data = req.body;
  const result = await reviewsCollection.insertOne(data);
  res.send(result);
} );






// POST: subscribe newsletter
app.post("/newsletter", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    // prevent duplicate email
    const exists = await newsletterCollection.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "Already subscribed" });
    }

    const result = await newsletterCollection.insertOne({
      email,
      subscribedAt: new Date()
    });

    res.json({ success: true, message: "Subscribed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// for admin

app.get("/admin/analysis", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await usersCollection.countDocuments();
    const totalIssues = await modelCollection.countDocuments();
    const totalContributions = await contributionCollection.countDocuments();

    const donationAgg = await contributionCollection.aggregate([
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
    ]).toArray();
    const totalDonation = donationAgg[0]?.totalAmount || 0;

    const statusWise = await modelCollection.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]).toArray();

    const categoryWise = await modelCollection.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]).toArray();

    res.json({ totalUsers, totalIssues, totalContributions, totalDonation, statusWise, categoryWise });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Analysis failed" });
  }
});


// GET /admin/analysis/monthly-trend
app.get("/admin/analysis/monthly-trend", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const contributions = await contributionCollection.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          totalContributions: { $sum: 1 },
          totalDonation: { $sum: "$amount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]).toArray();

    res.json({ success: true, monthlyTrend: contributions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Monthly trend failed" });
  }
});













    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("My Assignment !");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});


