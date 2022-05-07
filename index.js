const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t2vfs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Access forbidden' })

        }
        req.decoded = decoded;
        next()
    })

}


async function run() {
    try {
        await client.connect();
        const inventoryCollection = client.db('car-fantasy').collection('inventory');
        const ownerCollection = client.db('car-fantasy').collection('owner');

        //jsw apply
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send(accessToken)
        })

        //inventory api
        app.get('/inventory', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const query = {};
            const cursor = inventoryCollection.find(query)
            let inventoryItems;
            if (page || size) {
                inventoryItems = await cursor.skip(page * size).limit(size).toArray()
            }
            else {
                inventoryItems = await cursor.toArray();

            }
            res.send(inventoryItems)

        })

        //manage item API
        app.get('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await inventoryCollection.findOne(query)
            res.send(result)
        })
        // update items
        app.put('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const updateItems = req.body;
            const filter = { _id: ObjectId(id) };
            const options = {
                upsert: true
            }
            const updateDoc = {
                $set: {
                    quantity: updateItems.number
                }
            }
            const result = await inventoryCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })
        //post Item
        app.post('/inventory', async (req, res) => {
            const newService = req.body;
            const result = await inventoryCollection.insertOne(newService)
        })
        //delete items
        app.delete('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await inventoryCollection.deleteOne(query);
            if (result.deletedCount === 1) {
                res.send(result)
            }
        })
        //owner data
        app.get('/owner', async (req, res) => {
            const query = {};
            const cursor = ownerCollection.find(query);
            const owner = await cursor.toArray();
            res.send(owner)
        })

        //testing
        app.get('/', (req, res) => {
            res.send("I am running")
        })
        // get my Items
        app.get('/myItems', verifyJwt, async (req, res) => {
            const decodedEmail = req.decoded?.email;
            const user = req.query.email;
            if (user === decodedEmail) {
                const query = { email: user };
                const cursor = inventoryCollection.find(query)
                const myItems = await cursor.toArray();
                res.send(myItems)
            }
            else {
                return res.status(403).send({ message: 'Access forbidden' })
            }
        })
        //pagination
        app.get('/inventoryCount', async (req, res) => {
            const count = await inventoryCollection.estimatedDocumentCount();
            res.send({ count });

        })



    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log("hello world");
})