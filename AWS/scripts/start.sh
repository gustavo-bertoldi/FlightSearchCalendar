docker kill $(docker ps -q)
cd /home/ec2-user/FlightSearchCalendar
docker-compose up -d --build