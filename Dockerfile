FROM node:8

# Copy over the app files
COPY app /app
COPY setup /setup

# Set the work directory to app
WORKDIR /app

# Prepare the environment
RUN (cd /setup; sh setup.sh)

# Install NPM packages
RUN npm install

# Start the server
CMD ["node", "app.js"]
