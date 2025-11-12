const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const verifyFirebaseToken = require("./verifyFirebaseToken");
const app = express();
const port = 3000;

// Enable CORS and JSON parsing

const admin = require("firebase-admin");

var serviceAccount = require("./service.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});











// Middlewares
app.use(cors());
app.use(express.json());

// 3D_model
// vItpsmBYYU96qsXE

const uri =
  "mongodb+srv://3D_model:vItpsmBYYU96qsXE@cluster0.um9bwdr.mongodb.net/?appName=Cluster0";

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
      return res.status(401).json({ message: "unauthorized: no token provided" });
    }

    const token = AuthorizationToken.split(" ")[1];

    
    if (!token) {
      return res.status(401).json({ message: "unauthorized: invalid token format" });
    }

    
    const decodedUser = await admin.auth().verifyIdToken(token);
    req.user = decodedUser; 

    next();

  } catch (error) {
    console.error("Token verify error:", error.message);
    return res.status(403).json({ message: "forbidden: invalid or expired token" });
  }
};



async function run() {
  try {
    await client.connect();
    const db = client.db("conceptual_session-1");
    const modelCollection = db.collection("conceptual_db");
    const downloadCollection = db.collection('download')

    app.get("/models",  async (req, res) => {
      console.log("foysal")
      const result = await modelCollection.find().toArray();
      res.send(result);
    });


       app.get('/models/latest', async (req, res) => {
  try {
    const result = await modelCollection
      .find()
      .sort({ created_at: -1 }) // latest first
      .limit(6) // show only 6 items (change if needed)
      .toArray();

    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Something went wrong!" });
  }
});


// by mail

// Fetch models by logged-in user's email
app.get('/my-models', verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email; 
    const result = await modelCollection.find({ created_by: userEmail }).toArray();
    res.json({ success: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch models" });
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
        res.json({ message: "Model added successfully" }); // <-- JSON response
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
        { _id: objId }, // filter
        { $set: data } // update fields
      );

      res.send({
        success: result.modifiedCount > 0,
        result,
      });
    });



    app.delete('/models/:id', async(req, res) =>{
      const {id} = req.params;
      const  result = await modelCollection.deleteOne({_id: new ObjectId(id)})

      res.send(
        {
          success: true
        }
      )
    });



 
app.post('/downloads',async(req, res) =>{
  const data = req.body;
  const result = await downloadCollection.insertOne(data);
  res.send(result)


} );


app.get("/my-downloads", verifyToken, async (req, res) => {
  try {
    const email = req.query.email; // query parameter থেকে email নাও
    if (!email) {
      return res.status(400).json({ success: false, message: "Email parameter missing" });
    }

    const result = await downloadCollection.find({ downloaded_by: email }).toArray();

    res.json({ success: true, result }); // এখন frontend ঠিকভাবে পাবো
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch downloads" });
  }
});










    await client.db("admin").command({ ping: 1 });
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
  res.send("Hello Worldddd!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
