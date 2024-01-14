# SB-Hacks-X-Backend

## Routes
* POST - new account
    * Endpoint: "/account"
    * Implemented
    * Params:
        * User object
        * password
    * Returns:
        * success code
* POST - login
    * Endpoint: "/login"
    * Implemented
    * Params:
        * username
        * password
    * Returns:
        * JWT to be saved as a cookie?
* GET - user information
    * Endpoint: "/users/:userId"
    * Implemented
    * Returns a user object and the count of ingredients, dishes, and trashed
    * Params:
        * user ID
        * JWT
    * Returns:
        * User object
        ```json
        {
            "data": {
                "id": "dylanvu9@gmail.com",
                "points": 0,
                "pfp": "",
                "name": "Dylan Vu",
                "statistics": {
                    "ingredients": 3,
                    "trashed": 1,
                    "dishes": 0
                }
            }
        }
        ```
* GET - leaderboard information
    * Endpoint: "/leaderboard"
    * Implemented
    * Params:
        * none
    * Returns:
        * Array of user's Display name and points
        ```json
        {
            "data": [
                {
                    "id": "dylanvu9@gmail.com",
                    "pfp": "",
                    "name": "Dylan Vu",
                    "points": 10
                },
                {
                    "name": "Steve",
                    "id": "test@gmai.com",
                    "pfp": "",
                    "points": 0
                }
            ]
        }
        ```
* PUT - user information
    * Update an existing user's information
    * Endpoint: "/users/:userId"
    * Params:
        * new user information
        * JWT
    * Returns:
        * status code

### Ingredients and Dishes
* GET - user ingredient information
    * Endpoint: "/users/:userId/ingredients/:type
    * Implemented
    * Gets the ingredients in the specified collection
    * Params:
        * user ID
        * JWT
        * type (inventory or trashed)
    * Returns:
        * Array of user's ingredients in the type specified
        ```json
        {
            "data": [
                {
                    "quantity": 3,
                    "name": "Apple",
                    "expiration": 1705765501,
                    "points": 1
                },
                {
                    "quantity": 1,
                    "name": "test",
                    "expiration": 1,
                    "points": 1
                }
            ]
        }
        ```
* POST - delete user ingredient information
    * Endpoint: "/users/:userId/ingredients/:type/delete
    * Implemented
    * Deletes the ingredients in the specified collection, and then adds it to the trashed collection
    * Gets matched by the ingredient name and expiration date
    * Params:
        * user ID (in url)
        * JWT required
        * type (inventory or trashed) (in url)
        * ingredient name to be matched exactly
        * ingredient expiration unix time stamp to be matched exactly
    * Returns
        * status code for successful deletion
* GET - user dish information
    * Endpoint: "/users/:userId/dishes"
    * Params:
        * user ID
        * JWT
    * Returns:
        * Array of user's dishes
* POST - new ingredient
    * Endpoint: "/users/:userId/ingredients/:type"
    * Implemented
    * Creates a new ingredient in the specified collection
    * Params:
        * user ID
        * JWT
        * type (inventory or trashed)
    * Body:
        * ingredient - Ingredient object
    * Returns:
        * status code
* POST - new dish
    * Endpoint: "/users/:userId/dishes"
    * Implemented
    * Params:
        * user ID
        * JWT
        * new dish information
    * Returns:
        * status code

### Nice to Haves
* Password reset route
* PUT auth (for reset password)