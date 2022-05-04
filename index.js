const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json())



const uri = "mongodb+srv://inventory:7FiIXy03LLtEUnP0@cluster0.t2vfs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
    try {
        await client.connect();
        const inventoryCollection = client.db('car-fantasy').collection('inventory');
        const ownerCollection = client.db('car-fantasy').collection('owner');
        //inventory api
        app.get('/inventory', async (req, res) => {

            const query = {};
            const cursor = inventoryCollection.find(query)
            const inventoryItems = await cursor.toArray();
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
            console.log(result);
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
            console.log('hello');
        })

        //testing
        app.get('/', (req, res) => {
            res.send("I am running")
        })

    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log("hello world");
})
//inventory
//7FiIXy03LLtEUnP0