# Amadeus Flight Search

![Build](https://github.com/gustavo-bertoldi/FlightSearchCalendar/actions/workflows/aws_ci_cd.yml/badge.svg?branch=AWS)

Easily search for flights within a date interval to find the cheapest possible prices using Amadeus APIs.

## Run with Docker
First you need to setup some environment variables so the app can function correctly.
The easiest way to do so is by creating a `.env` file in the project's `/back`. This file contains your API secrets, make sure not to include in commits.
You can also do so using docker's command line arguments for environment variables. [See here](https://docs.docker.com/engine/reference/commandline/run/)

```bash
# Required
AMADEUS_CLIENT_ID="YOUR_CLIENT_ID"
AMADEUS_CLIENT_SECRET="YOUR_SECRET"

# Optionals
AMADEUS_ENV="ENV" # Values can be 'production' or 'test'. Default is test.
PORT=SOME_PORT # Port to which the app will listen. Default is 3000.
```

Once the variables are set simply run the following commands. App will be available by default on http://localhost:3000.

```bash
docker build -t "amadeus-flight-search" --name "Amadeus Flight Search"
docker run "amadeus-flight-search"
``` 

## Run locally
Set up your Amadeus credentials using an `.env` file in the `/back` directory or your terminal. See section ***Run with docker***.
First build the frontend running the following commands in the `/front` directory:
```bash
npm install
npm run build
```
Then start the app by running the following commands in the `/back` directory:

```bash
npm install
npm run serve
``` 

App will be available by default on http://localhost:3000