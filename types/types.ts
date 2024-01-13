export interface User {
    /**
     * unique id/identifier for each user
     * this will be email for now
     */
    id: string,
    /**
     * number of points they have for the leader
     */
    points: number,
    /**
     * a string that is the user profile picture
     */
    pfp: string,

    /**
     * display name
     */
    name: string,

    /**
     * password/passphrase
     */
    password: string,


    /**
     * what's currently in the user's fridge
     */
    inventory: Ingredient[],
    /**
     * ingredients thrown away
     */
    trashed: Ingredient[],
    // calculate additional statistics as needed: number of ingredients bought (history), number of dishes cooked (look through other document), number of ingredients trashed
}

export interface Dish {
    /**
     * name of the dish
     */
    name: string,
    /**
     * the user id that cooked it
     */
    user: string,
    /**
     * list of ingredients used to make it
     */
    ingredients: string[],
    /**
     * a picture of the dish
     */
    img: string,
    /**
     * unix time stamp of when this dish was cooked
     */
    date: number,
}

export interface Ingredient {
    /**
     * name of the ingredient
     */
    name: string,
    /**
     * number
     */
    quantity: number,
    /**
     * unix time stamp of when this item should expire
     */
    expiration: number,
    /**
     * the number of points this is worth, individually
     */
    points: number,
}

const userIngredientTypeArray = ["inventory", "trashed"] as const;
export type userIngredientType = (typeof userIngredientTypeArray)[number];
export function isUserIngredientType(value: any): value is userIngredientType {
    return userIngredientTypeArray.includes(value);
}