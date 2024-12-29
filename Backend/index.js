import dotenv from 'dotenv';
dotenv.config();
const port = 4000;
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import cors from "cors";
import multer from "multer";
import path from 'path';
import Stripe from 'stripe';
import axios from 'axios';
import { uploadRouter } from './uploading.js';
import { createRouteHandler } from 'uploadthing/express';
import { MongoClient } from 'mongodb';


const stripe = new Stripe('sk_test_51Q8QNCLN3ffFuuHqx37c88SNzKc1X1kaSsOSxNqcr8OpDoVn8n2P40WRTczy4dnAyFQ8vh0cuHYmcfyhSsZVuqbV00cNAiEnge');


const app = express();
const router = express.Router();
// require('dotenv').config();


app.use(cors());
app.use(bodyParser.json());
app.use(
  "/api/uploadthing",
  createRouteHandler({
    router: uploadRouter,
    
  }),
);

const MONGO_URI = process.env.MONGO_URI; 
const client = new MongoClient(MONGO_URI);

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 50000, 
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("Failed to connect to MongoDB", err.message));

app.use(express.json()); 


const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Users = mongoose.model('User', UserSchema);

app.get("/", (req, res) => {
  res.send("Express App is Running Now");
});

app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // console.log('Request Body:', req.body); 

    if (!username || !email || !password) {
      console.log('Missing fields:', { username, email, password });
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    let user = await Users.findOne({ email });
    if (user) {
      console.log('User already exists:', email);
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user = new Users({
      name: username,
      email,
      password: hashedPassword
    });

    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, 'secret_ecom', { expiresIn: '1h' });

    res.json({ success: true, token });
  } catch (error) {
    console.error('Signup Error:', error.message); 
    res.status(500).send('Server error');
  }
});



app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body; 

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, error: "Wrong Email Id" });
    }

    const passCompare = await bcrypt.compare(password, user.password);
    if (!passCompare) {
      return res.status(400).json({ success: false, error: "Wrong Password" });
    }

    const data = { user: { id: user.id } };
    const token = jwt.sign(data, 'secret_ecom', { expiresIn: '1h' });

    res.json({ success: true, token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    console.log(req);
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

     const UPLOADTHING_TOKEN = process.env.UPLOADTHING_TOKEN;
    
    const response = await axios.post('https://api.uploadthing.com/upload', {
      file: req.file.buffer,
    }, {
      headers: {
        'Authorization': `Bearer ${UPLOADTHING_TOKEN}`,
        'Content-Type': req.file.mimetype,
      },
    });

    if (response.data.success) {
      res.json({
        success: true,
        image_url: response.data.url,
      });
    } else {
      res.status(500).json({ success: false, message: 'File upload failed' });
    }
  } catch (err) {
    console.error('Upload Error:', err.response ? err.response.data : err.message);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});


const ProductSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  rating: { type: Number, required: true },
  price: { type: Number, required: true },
  point: { type: Number, required: true },
  AGR: { type: Number, required: true },
  APPS: { type: Number, required: true },
  GA_TW_SV: { type: String, required: true },
  value: { type: Number, required: true },
  type: { type: String, required: true }, 

});


const Product = mongoose.model('Product', ProductSchema);

const addProductEndpoint = async (req, res) => {
  console.log("Received data:", req.body); 
  try {
    await client.connect();

    const db = client.db("beingSarangi");
    const availableCardsCollection = db.collection("available_cards");

    const existingProduct = await availableCardsCollection.findOne({ name: req.body.name });

    if (existingProduct) {
      return res.status(400).json({ success: false, message: 'Product already exists.' });
    }

    const productType = parseFloat(req.body.price) >= 10 ? 'Gold' : 'Silver';

    const newProduct = {
      id: Date.now(),
      name: req.body.name,
      image: req.body.image,
      category: req.body.category,
      rating: req.body.rating,
      price: req.body.price,
      point: req.body.point,
      AGR: req.body.AGR,
      APPS: req.body.APPS,
      GA_TW_SV: req.body.GA_TW_SV,
      value: req.body.value,
      type: productType,
    };
    const result = await availableCardsCollection.insertOne(newProduct);

    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ userId: req.body.userId });
    if (user) {
      await usersCollection.updateOne(
        { userId: req.body.userId },
        { $push: { purchasedProducts: newProduct } } 
      );
    }

    res.json({ success: true, product: newProduct });
    console.log("Product added:", newProduct);
  } catch (err) {
    console.error('Add Product Error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  } finally {
    await client.close();
  }
};
app.post('/addproduct', addProductEndpoint);


// Remove Product Endpoint
app.post('/removeproduct', async (req, res) => {
  const { id, name } = req.body;
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('beingSarangi');
    const availableCardsCollection = db.collection('available_cards');
    const result = await availableCardsCollection.deleteOne({ id: id });
    if (result.deletedCount > 0) {
      res.json({ success: true, name: name });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (err) {
    console.error('Remove Product Error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  } finally {
    await client.close();
  }
});

// Get All Products Endpoint
app.get('/allproducts', async (req, res) => {
  console.log('Received request for /allproducts');
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('beingSarangi');
    const availableCardsCollection = db.collection('available_cards');
  
    const products = await availableCardsCollection.find({}).toArray();
    
    console.log('Products retrieved:', products);
    res.send(products);
  } catch (err) {
    console.error('Get All Products Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    await client.close();
  }
});


//creating endpoint for newCards data
app.get('/newCards', async (req, res) => {
  console.log('Received request for /newCards');
  
  try {
    const { search } = req.query;
    let products;
    const client = new MongoClient(MONGO_URI);
    const db = client.db('beingSarangi');
    const availableCardsCollection = db.collection('available_cards');
    
    const query = { type: 'Gold' };

    if (search) {
      console.log("Search query:", search);
      const regex = new RegExp(search, 'i');  
      query.name = regex;  
      products = await availableCardsCollection.find(query).toArray();
      console.log("Matching Gold products with search:", products);
    } else {
      products = await availableCardsCollection.find(query).sort({ createdAt: -1 }).limit(20).toArray();
      console.log("Latest Gold products fetched:", products);
    }

    if (products.length === 0) {
      console.log("No Gold products found.");
    }

    res.json(products);
  } catch (error) {
    console.error("Error fetching Gold cards:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});




// Checkout API
router.post('/create-checkout-session', async (req, res) => {
    try {
        const { amount, email } = req.body;

        if (!amount || !email) {
            return res.status(400).json({ error: 'Missing amount or email' });
        }

        const amountInCents = amount * 100; 
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: 'Your Product Name',
                    },
                    unit_amount: amountInCents, 
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: 'http://localhost:3000/success',
            cancel_url: 'http://localhost:3000/cancel',
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session.' });
    }
});
app.use('/api', router);

app.get('/user/points/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);  
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ points: user.points });  
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch user points' });
  }
});

app.patch('/user/points/:userId', async (req, res) => {
  const { userId } = req.params;
  const { points } = req.body; 

  try {
    const user = await User.findById(userId); 
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (points < 0) {
      return res.status(400).json({ message: 'Points cannot be negative' });
    }

    user.points = points; 
    await user.save(); 

    res.json({ message: 'User points updated successfully', points: user.points });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update user points' });
  }
});


app.listen(port, () => {
  console.log(`Server running on ${port}`);
});