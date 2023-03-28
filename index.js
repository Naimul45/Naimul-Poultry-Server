const express = require('express')
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');


// middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f21lusd.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const usersCollection = client.db("poultryFarm").collection('users')
const servicesCollection = client.db("poultryFarm").collection("services");
const formCollection = client.db('poultryFarm').collection("form")
const reviewCollection = client.db('poultryFarm').collection("review");
const addServiceCollection = client.db('poultryFarm').collection('addService')
const formInfoCollection = client.db('poultryFarm').collection('formInfo')


function verifyJWT(req, res, next) {
  // console.log('token inside verify jwt', req.headers.authorization);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).send('unauthorized access');
  }
  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'forbidden access' })
    }
    req.decoded = decoded;
    next()
  })
}
app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.post('/review', async (req, res) => {
  const data = req.body;
  const result = await reviewCollection.insertOne(data)
  res.send(result)

})
app.get('/review', async (req, res) => {
  const query = {}
  const result = await reviewCollection.find(query).toArray();
  res.send(result)
})
app.get('/services', async (req, res) => {
  const query = {};
  const result = await servicesCollection.find(query).toArray();
  res.send(result)

})
app.get('/jwt', async (req, res) => {
  const email = req.query.email;
  const query = { email: email }
  const user = await usersCollection.findOne(query);
  // console.log(user)
  if (user) {
    const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
    return res.send({ accessToken: token })
  }
  res.status(403).send({ accessToken: '' })
})
app.get('/users', async (req, res) => {
  const query = {};
  const result = await usersCollection.find(query).toArray();
  res.send(result)
})
app.get('/users/admin/:email', async (req, res) => {
  const email = req.params.email;
  const query = { email }
  const user = await usersCollection.findOne(query);
  res.send({ isAdmin: user?.role === 'admin' })
})
app.put('/users/admin/:id', verifyJWT, async (req, res) => {
  const decodedEmail = req.decoded.email
  const query = { email: decodedEmail }
  const user = await usersCollection.findOne(query);
  if (user?.role !== 'admin') {
    return res.status(403).send({ message: 'forbidden access' })
  }
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const options = { upsert: true };
  const updatedDoc = {
    $set: {
      role: 'admin'
    }
  }
  const result = await usersCollection.updateOne(filter, updatedDoc, options);
  res.send(result);
})
app.post('/formInfo', async (req, res) => {
  const data = req.body;
  const result = await formInfoCollection.insertOne(data)
  res.send(result)
})
app.post('/booking', async (req, res) => {
  const data = req.body
  // console.log(data)
  const result = await formCollection.insertOne(data);
  res.send(result)
})
app.post('/addservice', async (req, res) => {
  const data = req.body;
  const result = await addServiceCollection.insertOne(data)
  res.send(result)
})
app.get('/addservice', async (req, res) => {
  const query = {}
  const result = await addServiceCollection.find(query).toArray();
  res.send(result)
})
app.get('/booking', verifyJWT, async (req, res) => {
  const email = req.query.email;
  const decodedEmail = req.decoded.email;

  if (email !== decodedEmail) {
    return res.status(403).send({ message: 'forbidden access' });
  }
  const query = { email: email }
  const result = await formCollection.find(query).toArray();
  res.send(result)
})
app.delete('/users/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const result = await usersCollection.deleteOne(filter)
  res.send(result)
})

app.listen(port, () => {
  console.log(`The server is running on  ${port}`)
})