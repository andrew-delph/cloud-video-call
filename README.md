## Project Overview

This project is a chat application similar to Omegle. Users can join the application, update their details, and start searching for other users to chat with. The application allows users to apply filters such as age, gender, language, and distance to limit their search.

An AI pipeline progressively runs to create embeddings based on conversation metrics. These embeddings are saved in a vector database, and cosine similarity is used for link prediction to match users.

## Features

- User registration and profile update
- User search with filter options (age, gender, language, distance)
- Real-time chat functionality
- AI pipeline for creating embeddings and user matching

## Technologies Used

- **Flutter**: The application is built using Flutter, which allows us to compile for Android, iOS, and web from a single codebase.
- **Firebase**: Firebase is used for user authentication.
- **WebRTC**: Used for real-time communication between users.
- **Kubernetes**: Used for automating deployment, scaling, and management of the application.
- **RabbitMQ**: Used as a message broker for the application.
- **Milvus**: Used for creating embeddings and saving them in a vector database.
- **Neo4j**: Used as a graph database for storing user data and relationships.
- **Redis**: Used as an in-memory data structure store, used as a database and cache.
