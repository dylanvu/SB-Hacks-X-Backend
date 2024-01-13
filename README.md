# SB-Hacks-X-Backend

## Routes
* POST - new account
    * Endpoint: "/register"
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
    * Params:
        * user ID
        * JWT
    * Returns:
        * User object
* POST - user information
    * Endpoint: "/users/:userId"
    * Params:
        * user ID
        * JWT
    * Returns:
        * User object
* GET - leaderboard information
    * Endpoint: "/leaderboard"
    * Params:
        * none
    * Returns:
        * Array of user's Display name and points
* PUT - user information
    * Update an existing user's information
    * Endpoint: "/users/:userId"
    * Params:
        * new user information
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
    * Params:
        * user ID
        * JWT
        * new dish information
    * Returns:
        * status code