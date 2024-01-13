import express from "express";

// import the service account correctly: https://stackoverflow.com/a/70106896
import serviceAccount from "../service_account.json";

// import what's needed for the firebase admin module
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { ServiceAccount } from "firebase-admin";

// create the firebase application using the service account
initializeApp({
    credential: cert(serviceAccount as ServiceAccount)
});

// create the firestore database access in the application
const db = getFirestore();

const app = express();
const port = 5000;

// configure some middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    const collection = db.collection("users");
    const testDoc = collection.doc("test");

    // get the actual data contained in the document
    const snapshot = await testDoc.get();
    const data = snapshot.data();

    console.log(data);

    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}`);
});