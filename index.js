const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const app = express();
const port = 5000 || process.env.PORT;
const cors = require("cors");
require("dotenv").config();
app.use(cors({
  origin :[
    'http://localhost:5173',
    "https://device-dynasty-c3c09.web.app"
  ]
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.dibths0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();
    const database = client.db("device-dynasty");
    const productsCollection = database.collection("products");
    const bannerCollection = database.collection("banner");
    app.get("/products", async (req, res) => {
        const {sort,sortByDate,minPrice,maxPrice,brand,category,page = 1, limit = 10,searchText} = req.query
        console.log(req.query)
        const query= {
            $and: [
               searchText ? {productName :{$regex :searchText, $options: 'i'}} : {},
                minPrice && maxPrice ? { price: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) } } : {},
                brand ? { productBrand: brand } : {},
                category ? { category: category } : {},
              ]
        }
        const options ={
          skip: (page - 1) * limit,
          limit: parseInt(limit),      
            sort: { 
                price: sort == 'acs' ? 1 : -1,
                productCreationDate: sortByDate == 'acs'? 1: -1,
                
            },
        }
        const totalProducts = await productsCollection.countDocuments(query);
      const result = await productsCollection.find(query,options).toArray();
      res.send({
        result,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: parseInt(page),
        totalProducts
      });
    });
    app.get("/banner", async (req, res) => {
      const result = await bannerCollection.find().toArray();
      res.send(result);
    });
    app.get('/category',async(req,res)=>{
      const params =req.query
      //console.log(params)
      const query = {category: params.category}
      const result = await productsCollection.find(query).toArray()
      res.send(result)
    })
    app.get("/products/random", async (req, res) => {
      const result = await productsCollection
        .aggregate([{ $sample: { size: 6 } }])
        .toArray();
        res.send(result)
    });
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
