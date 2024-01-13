import express from "express";
import serviceAccount from "../service_account.json";

// import what's needed for the firebase admin module
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { ServiceAccount } from "firebase-admin";
import { User, isUserIngredientType, Ingredient, isIngredient } from "../types/types";

// create the firebase application using the service account
initializeApp({
    credential: cert(serviceAccount as ServiceAccount)
});

// create the firestore database access in the application
export const db = getFirestore();

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

// users
app.post('/users/:userId', async (req, res) => {
    console.log(req.params);
});

app.get('/users/:userId', async (req, res) => {
    console.log(req.params);
})

// user's ingredients
app.get('/users/:userId/ingredients/:type', async (req, res) => {
    // figure out who's asking
    const params = req.params;
    const userId = params.userId;
    const type = params.type;

    // is this a valid type?
    if (!isUserIngredientType(type)) {
        // bad type
        res.statusCode = 400;
        res.send(`"${type}" is not a valid ingredient type.`)
        return;
    }

    // who is requesting this?
    // figure out what they are asking for
    const usersCollection = db.collection("users");
    const userQuery = await usersCollection.where("id", "==", userId).get();
    if (userQuery.empty) {
        res.statusCode = 404;
        res.send(`"${userId}" was not found`);
        return;
    }

    // get the first user that matches
    const user = userQuery.docs[0].ref;
    const ingredients = user.collection(type);

    const ingredientSnapshot = await ingredients.get();

    // return all the ingredients
    const inventory: any[] = [];
    ingredientSnapshot.forEach(doc => {
        inventory.push(doc.data());
    });

    // return the ingredients
    res.send(inventory);
})

app.post('/users/:userId/ingredients/:type', async (req, res) => {
    // figure out who's asking
    const params = req.params;
    const userId = params.userId;
    const type = params.type;

    const ingredient = req.body.ingredient;

    // is this a valid type?
    if (!isUserIngredientType(type)) {
        // bad type
        res.statusCode = 400;
        res.send(`"${type}" is not a valid ingredient type.`)
        return;
    }

    // is this a valid formed ingredient?
    if (!isIngredient(ingredient)) {
        res.statusCode = 400;
        res.send("The provided ingredient does not have the correct attributes.")
        return;
    }

    // who is requesting this?
    // figure out what they are asking for
    const usersCollection = db.collection("users");
    const userQuery = await usersCollection.where("id", "==", userId).get();
    if (userQuery.empty) {
        res.statusCode = 404;
        res.send(`"${userId}" was not found`);
        return;
    }

    // get the first user that matches
    const user = userQuery.docs[0].ref;
    const ingredients = user.collection(type);

    // create a new document here
    await ingredients.add(ingredient)

    // successfully posted
    res.sendStatus(201);
})

app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}`);
});