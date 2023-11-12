const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');
// Initialize Firebase Admin SDK
const serviceAccount = require('./beespoke01-40484-firebase-adminsdk-rojxs-9fe3e3a0f6.json'); 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  //databaseURL: '', 
});
// Reference to the catalog collection
const catalogRef = admin.firestore().collection('catalog');
// Read data from CSV and add to Firestore
fs.createReadStream('./Product catalog.csv') 
  .pipe(csv())
  .on('data', (row) => {
    
    catalogRef.add(row);
  })
  .on('end', () => {
    console.log('Data import complete.');
  });
