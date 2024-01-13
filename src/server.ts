import express from "express";
import serviceAccount from "../service_account.json";
import bcrypt from "bcrypt";

// import what's needed for the firebase admin module
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { ServiceAccount } from "firebase-admin";
import { User, isUserIngredientType, Ingredient, isIngredient, isUser } from "../types/types";

// create the firebase application using the service account
initializeApp({
    credential: cert(serviceAccount as ServiceAccount)
});

// create the firestore database access in the application
export const db = getFirestore();

const app = express();
const port = 5000;

// password and salting
const saltRounds = 10;

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

// login and account system
app.post('/account', async (req, res) => {
    // parse the req
    const password = req.body.password;
    let user = req.body.user;

    // check if all fields are present to create the user
    // add a default point system
    user["points"] = 0;

    // check if user looks good enough
    if (!isUser(user)) {
        res.statusCode = 400;
        res.send("The provided user information is incomplete.");
        return;
    }

    // password
    if (!password) {
        res.statusCode = 400;
        res.send("Password was not provided.");
        return;
    }

    // check if the user already exists
    const usersCollection = db.collection("users");
    const userQuery = await usersCollection.where("id", "==", user.id).get();
    if (!userQuery.empty) {
        res.statusCode = 409;
        res.send(`"${user.id}" already exists`);
        return;
    }

    // check password validity

    if (password.length === 0) {
        res.statusCode = 400;
        res.send("Password length was 0");
        return;
    }

    // generate the hashed password
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // create the user
    await usersCollection.add(user);

    // create the auth document
    const authCollection = db.collection("auth");
    await authCollection.add({
        id: user.id,
        password: hashedPassword
    });

    res.sendStatus(201);
})

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