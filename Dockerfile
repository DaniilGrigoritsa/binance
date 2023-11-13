# Use the official Node.js 18 image as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and yarn.lock to the container
COPY package.json yarn.lock tsconfig.json ./

# Install project dependencies with Yarn
RUN yarn install

# Copy the rest of your application code to the container
COPY ./src ./src

RUN yarn build

# Expose the port your Express server listens on (adjust as needed)
EXPOSE 8080

# Command to start your application (modify as needed)
CMD ["yarn", "dist"]
