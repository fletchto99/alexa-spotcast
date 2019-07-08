# Get libspotify from modipy
wget -q -O - https://apt.mopidy.com/mopidy.gpg | apt-key add -
wget -q -O /etc/apt/sources.list.d/mopidy.list https://apt.mopidy.com/stretch.list

apt-get update -y
apt-get -y install libspotify-dev
