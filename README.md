# Flight Search Calendar App

Easiy search for flights within a date interval to find the cheapest possible prices using Amadeus APIs.

## Run with Docker
Set up your Amadeus credentials in ```./back/Dockerfile``` 

Then simply run the command ```docker-compose up``` in the root directory. App will be available by default on http://localhost:8080

## Run locally
Set up your Amadeus credentials using the environment variables ```AMADEUS_CLIENT_ID``` and ```AMADEUS_CLIENT_SECRET```.
Alternatively you can use a ```.env``` file in the ```./back``` directory to set up the variables.

To lauch the backend, in the ```back``` folder run the following commands ```npm install``` if it is the first launch, then ```npm run serve```

To lauch the frontend, in the ```front``` folder run the folllowing commands ```npm install``` if it is the first launch, then ```npm run build``` and ```npm run start```.

App will be available by default on http://localhost:8080