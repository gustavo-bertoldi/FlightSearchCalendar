# Flight Search Calendar App

![Build](https://github.com/gustavo-bertoldi/FlightSearchCalendar/actions/workflows/aws_ci_cd.yml/badge.svg?branch=feature-1)

Easily search for flights within a date interval to find the cheapest possible prices using Amadeus APIs.

## Run with Docker
Set up your Amadeus credentials in ```./back/Dockerfile``` 

Then simply run the command in the root directory. App will be available by default on http://localhost:5000
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

To launch the backend, in the ```back``` folder run the following commands:
```bash
npm install #To install dependencies if it's the first run
npm run serve
``` 

To launch the frontend, in the ```front``` folder run the following commands:
```bash
npm install #To install dependencies if it's the first run
npm run build
npm run start
```
App will be available by default on http://localhost:5000