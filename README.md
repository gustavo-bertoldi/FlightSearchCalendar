# Flight Search Calendar App

Easiy search for flights within a date interval to find the cheapest possible prices using Amadeus APIs.

## Run with Docker
Set up your Amadeus credentials in ```./back/Dockerfile``` 

Then simply run the command in the root directory. App will be available by default on http://localhost:8080
```bash
docker-compose up
``` 

## Run locally
Set up your Amadeus credentials using the environment variables.
```bash
AMADEUS_CLIENT_ID=YOUR_CLIENT_ID
AMADEUS_CLIENT_SECRET=YOUR_SECRET
```

Alternatively you can use a ```.env``` file in the ```./back``` directory to set up the variables.

To lauch the backend, in the ```back``` folder run the following commands:
```bash
npm install #To install dependencie if it's the first run
npm run serve
``` 

To lauch the frontend, in the ```front``` folder run the folllowing commands:
```bash
npm install #To install dependencie if it's the first run
npm run build
npm run start
```
App will be available by default on http://localhost:8080