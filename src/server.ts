import express from "express";
import serviceAccount from "../service_account.json";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";

// import what's needed for the firebase admin module
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { ServiceAccount } from "firebase-admin";
import { isUserIngredientType, isIngredient, isUser, userIngredientType, isDish, Dish } from "../types/types";
import { getIDfromJWT } from "./util";

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
app.use(cors({
    origin: '*'
}))

app.get('/', async (req, res) => {
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
        const token = jwt.sign({ id }, JWT_SECRET, { expiresIn: "24h" });
        // return the token back to the user
        res.status(201).json({
            data: token
        })
    } else {
        // invalid attempt
        res.status(401).send(`The passwords did not match up to user ID ${id}`);
    }
});

app.get('/users/:userId', async (req, res) => {

    /**
    * handle the JWT and authentication
    */
    const token = req.headers["token"];
    if (!token) {
        res.status(401).send("Missing JWT from headers");
        return;
    }

    if (!(typeof token === "string")) {
        // malformed
        res.status(401).send("JWT is not a string");
        return;
    }
    let userId = getIDfromJWT(token, JWT_SECRET);
    if (!userId) {
        res.status(401).send("JWT is invalid");
        return;
    }
    if (typeof userId === "object") {
        userId = userId.id;
    }

    if (!userId || userId.length === 0) {
        res.status(400).send("User id is missing");
        return;
    }

    // figure out what they are asking for
    const usersCollection = db.collection("users");
    const userQuery = await usersCollection.where("id", "==", userId).get();
    if (userQuery.empty) {
        res.status(404).send(`"${userId}" was not found`);
        return;
    }

    // return the first user
    const user = userQuery.docs[0]
    const userFirestoreData = user.data();
    const userRef = user.ref;

    // obtain the user's current ingredient count
    const inventoryType: userIngredientType = "inventory"
    const ingredients = userRef.collection(inventoryType);
    const inventoryCount = (await ingredients.count().get()).data().count;


    // obtain the user's trashed count
    const trashedType: userIngredientType = "trashed"
    const trashed = userRef.collection(trashedType);
    const trashedCount = (await trashed.count().get()).data().count;

    // compute life time
    const lifetime = inventoryCount + trashedCount;

    // obtain the dishes
    const dishes = userRef.collection("dishes");
    const dishesCount = (await dishes.count().get()).data().count;

    // get all the dishes to count the ingredients for points
    // let points = 0;
    // const dishesSnapshot = await dishes.get();
    // if (dishesSnapshot.empty) {
    //     points = 0;
    // } else {
    //     dishesSnapshot.forEach(dish => {
    //         const dishData = dish.data() as Dish;
    //         points += dishData.ingredients.length;
    //     });
    // }

    // add to the userData
    const userData = {
        ...userFirestoreData,
        statistics: {
            ingredients: lifetime,
            trashed: trashedCount,
            dishes: dishesCount,
        }
    }

    // response
    res.status(200).json({
        data: userData
    });
})

// user's ingredients
/**
 * get the ingredients associated with a type, for the specified user
 */
app.get('/users/:userId/ingredients/:type', async (req, res) => {
    // figure out who's asking
    const params = req.params;
    const type = params.type;

    /**
     * handle the JWT and authentication
     */
    const token = req.headers["token"];
    if (!token) {
        res.status(401).send("Missing JWT from headers");
        return;
    }

    if (!(typeof token === "string")) {
        // malformed
        res.status(401).send("JWT is not a string");
        return;
    }
    let userId = getIDfromJWT(token, JWT_SECRET);
    if (!userId) {
        res.status(401).send("JWT is invalid");
        return;
    }
    if (typeof userId === "object") {
        userId = userId.id;
    }

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

app.delete('/users/:userId/ingredients/:type', async (req, res) => {
    // figure out who's asking
    const params = req.params;
    const type = params.type;

    // get information from the body
    const name = req.body.name;
    const exp = req.body.expiration;

    // is this a valid type?
    if (!isUserIngredientType(type)) {
        // bad type
        res.status(400).send(`"${type}" is not a valid ingredient type.`)
        return;
    }

    // check if name and exp are provided
    if (name === undefined || name.length === 0) {
        res.status(400).send("missing ingredient name");
        return;
    }

    if (exp === undefined) {
        res.status(400).send("missing expiration date to match");
        return;
    }

    /**
    * handle the JWT and authentication
    */
    const token = req.headers["token"];
    if (!token) {
        res.status(401).send("Missing JWT from headers");
        return;
    }

    if (!(typeof token === "string")) {
        // malformed
        res.status(401).send("JWT is not a string");
        return;
    }
    let userId = getIDfromJWT(token, JWT_SECRET);
    if (!userId) {
        res.status(401).send("JWT is invalid");
        return;
    }
    if (typeof userId === "object") {
        userId = userId.id;
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

    // get the ingredients that match the input
    const ingredientSnapshot = await ingredients.where("name", "==", name).where("expiration", "==", exp).get();
    if (ingredientSnapshot.empty) {
        res.status(404).send(`Ingredient "${name}" expiring on ${exp} was not found`);
        return;
    }
    // return all the ingredients
    ingredientSnapshot.forEach(async (doc) => {
        await ingredients.doc(doc.id).delete();
    });

    // return the ingredients
    res.sendStatus(202);
})

/**
 * add a new ingredient to the ingredients associated with a type, for the specified user
 */
app.post('/users/:userId/ingredients/:type', async (req, res) => {
    // figure out who's asking
    const params = req.params;
    const type = params.type;
    console.log(req.body);
    const ingredient = req.body.ingredient;

    // is this a valid type?
    if (!isUserIngredientType(type)) {
        // bad type
        res.status(400).send(`"${type}" is not a valid ingredient type.`)
        return;
    }

    // is this a valid formed ingredient?
    if (!isIngredient(ingredient)) {
        console.log(ingredient)
        res.status(400).send("The provided ingredient does not have the correct attributes.")
        return;
    }

    /**
 * handle the JWT and authentication
 */
    const token = req.headers["token"];
    if (!token) {
        res.status(401).send("Missing JWT from headers");
        return;
    }

    if (!(typeof token === "string")) {
        // malformed
        res.status(401).send("JWT is not a string");
        return;
    }
    let userId = getIDfromJWT(token, JWT_SECRET);
    if (!userId) {
        res.status(401).send("JWT is invalid");
        return;
    }
    if (typeof userId === "object") {
        userId = userId.id;
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

app.post("/users/:userId/dishes", async (req, res) => {
    // figure out who's asking
    const dish = req.body.dish;

    /**
    * handle the JWT and authentication
    */
    const token = req.headers["token"];
    if (!token) {
        res.status(401).send("Missing JWT from headers");
        return;
    }

    if (!(typeof token === "string")) {
        // malformed
        res.status(401).send("JWT is not a string");
        return;
    }
    let userId = getIDfromJWT(token, JWT_SECRET);
    if (!userId) {
        res.status(401).send("JWT is invalid");
        return;
    }
    if (typeof userId === "object") {
        userId = userId.id;
    }

    const usersCollection = db.collection("users");
    const userQuery = await usersCollection.where("id", "==", userId).get();
    if (userQuery.empty) {
        res.status(404).send(`"${userId}" was not found`);
        return;
    }

    // ensure the dish is valid
    if (!isDish(dish)) {
        res.status(400).send("The dish is missing attributes");
        return;
    }

    // get the first user that matches
    const user = userQuery.docs[0];
    const points = user.data().points;
    const userRef = user.ref
    const dishes = userRef.collection("dishes");
    const ingredients = userRef.collection("inventory")

    // delete the ingredients from the user's inventory
    for (const ingredient of dish.ingredients) {
        // get the ingredients that match the input
        const ingredientSnapshot = await ingredients.where("name", "==", ingredient.name).where("expiration", "==", ingredient.expiration).get();
        if (!ingredientSnapshot.empty) {
            // return all the ingredients
            ingredientSnapshot.forEach(async (doc) => {
                await ingredients.doc(doc.id).delete();
            });
        }
    }

    // create a new document
    await dishes.add(dish);

    // add points to the user
    await userRef.update({ points: points + dish.ingredients.length })

    res.sendStatus(201);

})

app.get("/leaderboard", async (req, res) => {
    const usersCollection = db.collection("users");
    const userPointsSorted = await usersCollection.orderBy('points', 'desc').get();

    const sortedUserObjects: any[] = [];

    userPointsSorted.forEach(doc => {
        sortedUserObjects.push(doc.data())
    });

    // return this information
    res.status(200).json({
        data: sortedUserObjects
    });
})

app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}`);
});