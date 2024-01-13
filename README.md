# SB-Hacks-X-Backend

## Routes
* POST - login
    * Params:
        * username
        * password
    * Returns:
        * JWT to be saved as a cookie?
* GET - user information
    * Params:
        * user ID
        * JWT
    * Returns:
        * User object
* GET - leaderboard information
    * Params:
        * none
    * Returns:
        * Array of user's Display name and points
* PUT - user information
    * Params:
        * new user information
    * Returns:
        * status code

### Ingredients and Dishes
* GET - user ingredient information
    * Gets the ingredients in the specified collection
    * Params:
        * user ID
        * JWT
        * type (inventory or trashed)
    * Returns:
        * Array of user's ingredients in the type specified
* GET - user dish information
    * Params:
        * user ID
        * JWT
    * Returns:
        * Array of user's dishes
* POST - new ingredient
    * Creates a new ingredient in the specified collection
    * Params:
        * user ID
        * JWT
        * type (inventory or trashed)
        * new ingredient information
    * Returns:
        * status code
* POST - new dish
    * Params:
        * user ID
        * JWT
        * new dish information
    * Returns:
        * status code