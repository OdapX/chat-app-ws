import http from "http";
import express from "express";
import typeDefs from "./typeDefs";
import resolvers from "./resolvers";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { ApolloServer } from "apollo-server-express";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";

async function startApolloServer(typeDefs: any, resolvers: any) {
	const schema = makeExecutableSchema({ typeDefs, resolvers });

	const app = express();
	const httpServer = createServer(app);

	// Create our WebSocket server using the HTTP server we just set up.
	const wsServer = new WebSocketServer({
		server: httpServer,
		path: "/graphql",
	});
	// Save the returned server's info so we can shutdown this server later
	const serverCleanup = useServer({ schema }, wsServer);

	// Set up ApolloServer.
	const server = new ApolloServer({
		schema,
		csrfPrevention: true,
		plugins: [
			// Proper shutdown for the HTTP server.
			ApolloServerPluginDrainHttpServer({ httpServer }),

			// Proper shutdown for the WebSocket server.
			{
				async serverWillStart() {
					return {
						async drainServer() {
							await serverCleanup.dispose();
						},
					};
				},
			},
		],
	});
	await server.start();
	server.applyMiddleware({ app });

	const PORT = 4000;

	httpServer.listen(PORT, () => {
		console.log(
			`Server is now running on http://localhost:${PORT}${server.graphqlPath}`
		);
	});
}
startApolloServer(typeDefs, resolvers).then();
