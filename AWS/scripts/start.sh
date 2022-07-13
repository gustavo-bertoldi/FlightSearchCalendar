export AMADEUS_ENV=test
export PORT=3000
export AMADEUS_CLIENT_ID=$(aws secretsmanager get-secret-value --region eu-west-1 --secret-id FlightSearchApp/AMADEUS_CLIENT_ID --query SecretString --output text | jq -r .AMADEUS_CLIENT_ID)
export AMADEUS_CLIENT_SECRET=$(aws secretsmanager get-secret-value --region eu-west-1 --secret-id FlightSearchApp/AMADEUS_CLIENT_SECRET --query SecretString --output text | jq -r .AMADEUS_CLIENT_SECRET)
docker run -d -e AMADEUS_CLIENT_ID -e AMADEUS_CLIENT_SECRET -e AMADEUS_ENV -p $PORT:$PORT --name flight-search-app flight-search-app