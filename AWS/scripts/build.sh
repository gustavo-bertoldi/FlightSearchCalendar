export AMADEUS_ENV=test
export PORT=3000
export AMADEUS_CLIENT_ID=$(aws secretsmanager get-secret-value --region eu-west-1 --secret-id FlightSearchApp/AMADEUS_CLIENT_ID --query SecretString --output text | jq -r .AMADEUS_CLIENT_ID)
export AMADEUS_CLIENT_SECRET=$(aws secretsmanager get-secret-value --region eu-west-1 --secret-id FlightSearchApp/AMADEUS_CLIENT_SECRET --query SecretString --output text | jq -r .AMADEUS_CLIENT_SECRET)
docker build -t flight-search-app --build-arg PORT=$PORT --no-cache=true /home/ec2-user/FlightSearchApp