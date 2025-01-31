const express = require('express');
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


//middleware
app.use(cors());
app.use(express.json());

//


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j0hxo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

	//collection database name 
	const userCollection = client.db('second-bistro').collection('users');
	const menuCollection = client.db('second-bistro').collection('menu');
	const reviewCollection = client.db('second-bistro').collection('reviews');
	const cartCollection = client.db('second-bistro').collection('carts');

	//jwt related api
	app.post('/jwt', async(req , res) =>{
		const user = req.body;
		const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
			expiresIn: '1h'
		});
		res.send({token});
	});

	//middlewares
	const verifyToken = (req, res, next) =>{
		console.log('inside the verify token', req.headers);

		if(!req.headers.authorization){
			return res.status(401).send({message: 'forbidden access'});
		};
		const token = req.headers.authorization.split(' ')[1];
		jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
			if(err){
				return res.status(401).send({message: 'forbidden access'})
			};
			req.decoded = decoded;
		})
		next();
	}

	//users related api
	app.get('/users/admin/:email',  async (req, res) => {
		const email = req.params.email;
  
		if (email !== req.decoded.email) {
		  return res.status(403).send({ message: 'forbidden access' })
		}
  
		const query = { email: email };
		const user = await userCollection.findOne(query);
		let admin = false;
		if (user) {
		  admin = user?.role === 'admin';
		}
		res.send({ admin });
	  })


	app.get('/users', verifyToken, async(req, res) =>{
		console.log(req.headers);
		// const users = req.body;
		const result = await userCollection.find().toArray();
		res.send(result);
	})
	app.post('/users', async(req, res) =>{
		const user = req.body;
		//
		const query = { email: user.email};
		const existingUser = await userCollection.findOne(query);
		if(existingUser){
			return res.send({message: 'user already exists', insertedId: null});
		}
		const result = await userCollection.insertOne(user);
		res.send(result);
	});

	app.patch('/users/admin/:id', async(req, res) =>{
		const id = req.params.id;
		const filter = { _id: new ObjectId(id)};
		const updatedDoc = {
			$set: {
				role: 'admin'
			}
		};
		const result = await userCollection.updateOne(filter, updatedDoc);
		res.send(result);
	})

	app.delete('/users/:id', async(req, res) =>{
		const id = req.params.id;
		const query = { _id: new ObjectId(id)};
		const result = await userCollection.deleteOne(query);
		res.send(result);
	})
	//menu related apis

	//get all menu data
	app.get('/menu', async(req, res) =>{
		// const data = req.body;
		const result = await menuCollection.find().toArray();
		res.send(result);
	})

	//review data get
	app.get('/reviews', async(req, res)=>{
		const result = await reviewCollection.find().toArray();
		res.send(result);
	})

	//cart collection handle add to cart
	app.post('/carts', async(req, res) =>{
		const item = req.body;
		const result = await cartCollection.insertOne(item);
		res.send(result)
	});

	//get cart collection
	app.get('/carts', async(req, res) =>{
		const email = req.query.email;
		const query = { email: email}
		const result = await cartCollection.find(query).toArray();
		res.send(result);
	});

	//delete cart 
	app.delete('/carts/:id', async(req, res) =>{
		const id = req.params.id;
		const query = { _id: new ObjectId(id)};
		const result = await cartCollection.deleteOne(query);
		res.send(result);
	})



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



//routes
app.get('/', (req, res) =>{
	res.send('second bistro boss is sitting');
})


app.listen(port, ()=>{
	console.log(`boss is sitting on port ${port}`);
})