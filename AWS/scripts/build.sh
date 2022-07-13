export PORT=3000
docker build -t flight-search-app --build-arg PORT=$PORT --no-cache=true /home/ec2-user/FlightSearchApp