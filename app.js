// Import modules

const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
// Initialize Firebase Admin SDK
const serviceAccount = require('./beespoke01-40484-firebase-adminsdk-rojxs-9fe3e3a0f6.json'); 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  //databaseURL: '',
  
});
// Reference to the user_creds collection
const userCredsRef = admin.firestore().collection('user_creds');
// Reference to the catalog collection
const catalogRef = admin.firestore().collection('catalog');
// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware to parse JSON in the request body
app.use(bodyParser.json());




// API 1: User Profile Logging
app.post('/api/user-profile', async (req, res) => {

  console.log('Received POST request to /api/user-profile:', req.body);
  try {
    const { customerName, username, password, gender, preferredCategory } = req.body;

    // Validate required fields
    if (!customerName || !username || !password) {
      return res.status(400).json({ message: 'Customer Name, Username, and Password are required.' });
    }

    // Check for duplicate username
    const existingUser = await userCredsRef.where('username', '==', username).get();
    if (!existingUser.empty) {
      return res.status(409).json({ message: 'Username already exists. Choose a different username.' });
    }

    // Create user profile document
    const userProfile = {
      customerName,
      username,
      password,
      gender,
      preferredCategory,
    };

    // Add user profile to Firestore
    await userCredsRef.add(userProfile);

    res.status(201).json({ message: 'User profile created successfully.' });
  } catch (error) {
    console.error('User Profile Logging API Error:', error);
    res.status(500).json({ message: 'Internal Server Error.', error: error.message });
  }


});
// API 2: Product Search
app.get('/api/product-search', async (req, res) => {
    try {
      const { searchKeyword, priceMin, priceMax } = req.query;
  
      const query = catalogRef
        .where('product_description', '>=', searchKeyword)
        .orderBy('product_description')
        .limit(10);
  
      const snapshot = await query.get();
  
      const products = snapshot.docs.map((doc) => doc.data());
  
      res.status(200).json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error.', error: error.message });
    }
  });
  // API 3: Product Recommendation
app.get('/api/product-recommendation/:username', async (req, res) => {
    try {
      const { username } = req.params;
  
      // Check if the user exists
      const userSnapshot = await userCredsRef.where('username', '==', username).get();
  
      if (userSnapshot.empty) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      const userData = userSnapshot.docs[0].data();
      const preferredCategory = userData.preferredCategory;
  
      // Query for product recommendation
      let query;
  
      if (!preferredCategory) {
        // If preferred category is not available, return random 10 products
        query = catalogRef.orderBy('rank').limit(10);
      } else {
        // If preferred category is available, return top 10 products based on category and rank
        query = catalogRef.where('product_category', '==', preferredCategory).orderBy('rank').limit(10);
      }
  
      const recommendationSnapshot = await query.get();
  
      const recommendations = recommendationSnapshot.docs.map((doc) => doc.data());
  
      res.status(200).json(recommendations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error.', error: error.message });
    }
  });
  

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
