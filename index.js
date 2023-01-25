/*
    Importing the required modules
    *   Express - For creating a server
    *   Cors    - To allow for making request from a different domain
    *   Axios   - Allows for HTTP request form other applucations
    *   Redis   - Caching fof data 
 */

// importong express
const express = require('express');

// importing cors
const cors = require('cors');

// importing axios
const axios = require('axios');

// importing redis
const redis = require("redis");

const app = express();

// for reading values in .env files
require('dotenv').config()



const PORT = process.env.APP_PORT;

// enable cors
app.use(cors());
app.options('*', cors());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

const EXPIRATION_TIME = 3600; // seconds 


let client;

const createRedisClient = async () => {

    // create a client connection
    client = redis.createClient();

    // on the connection
    client.on("connect", () => console.log("Connected to Redis"));

    await client.connect();
}

//  run the function
createRedisClient();



// getting the data from the api without caching
app.get('/with/:username', async (req, res) => {
    // Get the username from the params
    const username = req.params.username;

    // checking if the username exist alraedy in the Redis database
    const getName = await client.get(`username=${username}`);

    // declaring the data variable to send the response back to the user
    let data;

    if (getName) {
        data = getName;
        console.log("Request gotten from cache");
    } else {
        data = await axios.get(`https://api.github.com/users/${username}`);
        data = data.data.public_repos;

        await client.set(`username=${username}`, JSON.stringify(data));
    }
    res.status(200).json(data);  
});

app.get('/without/:username', async (req, res) => {
    const username = req.params.username;
    let data = await axios.get(`https://api.github.com/users/${username}`);
    console.log("Request gotten from API");
    data = data.data.public_repos;
    res.status(200).json(data);  
});

app.listen(PORT || 5000, () => {
    console.log(`Listening to port ${PORT}`);
});