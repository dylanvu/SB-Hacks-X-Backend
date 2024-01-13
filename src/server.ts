import express from "express";
import serviceAccount from "../service_account.json";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// import what's needed for the firebase admin module
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { ServiceAccount } from "firebase-admin";
import { User, isUserIngredientType, Ingredient, isIngredient, isUser, Auth } from "../types/types";

// create the firebase application using the service account
initializeApp({
    credential: cert(serviceAccount as ServiceAccount)
});

// load up dotenv stuff
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("Cannot find JWT Secret");
}

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
    // const collection = db.collection("users");
    // const testDoc = collection.doc("test");

    // // get the actual data contained in the document
    // const snapshot = await testDoc.get();
    // const data = snapshot.data();

    // console.log(data);

    res.send("Hello World!");
});

// login and account system
/**
 * create an account
 */
app.post('/account', async (req, res) => {
    // parse the req
    const password = req.body.password;
    let user = req.body.user;

    // check if all fields are present to create the user
    // add a default point system
    user["points"] = 0;

    // check if user looks good enough
    if (!isUser(user)) {
        res.status(400).send("The provided user information is incomplete.");
        return;
    }

    // password
    if (!password) {
        res.status(400).send("Password was not provided.");
        return;
    }

    // check if the user already exists
    const usersCollection = db.collection("users");
    const userQuery = await usersCollection.where("id", "==", user.id).get();
    if (!userQuery.empty) {
        res.status(409).send(`"${user.id}" already exists`);
        return;
    }

    // check password validity

    if (password.length === 0) {
        res.status(400).send("Password length was 0");
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
});

app.post('/login', async (req, res) => {
    // grab the information needed
    const id = req.body.id;
    const password = req.body.password;

    if (!id || id.length === 0) {
        res.status(400).send("The user ID is missing");
        return;
    }

    if (!password || password.length === 0) {
        res.status(400).send("The user password is missing");
        return;
    }

    // load the password from the database
    const authCollection = db.collection("auth");

    const passwordQuery = await authCollection.where("id", "==", id).get();
    if (passwordQuery.empty) {
        res.status(404).send(`An account for "${id}" does not exist`);
        return;
    }

    // compare hashed password to inputted password
    // get the first user that matches
    const authData = passwordQuery.docs[0].data();
    const hashedPassword = authData.password;
    const match = await bcrypt.compare(password, hashedPassword);

    if (match) {
        // generate and return a JWT of the user id to the user
        const token = jwt.sign(id, JWT_SECRET);
        // return the token back to the user
        res.status(201).json({
            data: token
        })
    } else {
        // invalid attempt
        res.status(401).send(`The passwords did not match up to user ID ${id}`);
    }
})

// users
app.post('/users/:userId', async (req, res) => {
    console.log(req.params);
});

app.get('/users/:userId', async (req, res) => {
    console.log(req.params);
})

// user's ingredients
/**
 * get the ingredients associated with a type, for the specified user
 */
app.get('/users/:userId/ingredients/:type', async (req, res) => {
    // figure out who's asking
    const params = req.params;
    const userId = params.userId;
    const type = params.type;

    // is this a valid type?
    if (!isUserIngredientType(type)) {
        // bad type
        res.status(400).send(`"${type}" is not a valid ingredient type.`)
        return;
    }

    // who is requesting this?
    // figure out what they are asking for
    const usersCollection = db.collection("users");
    const userQuery = await usersCollection.where("id", "==", userId).get();
    if (userQuery.empty) {
        res.status(404).send(`"${userId}" was not found`);
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
    res.status(200).json({
        data: inventory
    });
})

/**
 * add a new ingredient to the ingredients associated with a type, for the specified user
 */
app.post('/users/:userId/ingredients/:type', async (req, res) => {
    // figure out who's asking
    const params = req.params;
    const userId = params.userId;
    const type = params.type;

    const ingredient = req.body.ingredient;

    // is this a valid type?
    if (!isUserIngredientType(type)) {
        // bad type
        res.status(400).send(`"${type}" is not a valid ingredient type.`)
        return;
    }

    // is this a valid formed ingredient?
    if (!isIngredient(ingredient)) {
        res.status(400).send("The provided ingredient does not have the correct attributes.")
        return;
    }

    // who is requesting this?
    // figure out what they are asking for
    const usersCollection = db.collection("users");
    const userQuery = await usersCollection.where("id", "==", userId).get();
    if (userQuery.empty) {
        res.status(404).send(`"${userId}" was not found`);
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