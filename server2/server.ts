import http from "http";
import express from "express";
import path from "path";
import webpush from "web-push";
import bodyParser from "body-parser";
import * as dotenv from "dotenv";
import typeDefs from "./typeDefs";
import resolvers from "./resolvers";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { ApolloServer } from "apollo-server-express";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";

dotenv.config({ path: path.join(__dirname, ".env") });

webpush.setVapidDetails(
	process.env.WEB_PUSH_CONTACT,
	process.env.PUBLIC_VAPID_KEY,
	process.env.PRIVATE_VAPID_KEY
);
async function startApolloServer(typeDefs: any, resolvers: any) {
	const schema = makeExecutableSchema({ typeDefs, resolvers });

	const app = express();
	app.use(bodyParser.json());
	const allowCrossDomain = function (req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
		res.header("Access-Control-Allow-Headers", "Content-Type");
		next();
	};

	app.use(allowCrossDomain);
	app.post("/notifications/subscribe", (req, res) => {
		const subscription = JSON.parse(req.body.subscription);
		const payload = req.body.payload;
		if (payload === null) return;

		webpush
			.sendNotification(subscription, payload)
			.then((result) => console.log(result))
			.catch((e) => console.log(e.stack));

		res.status(200).json({ success: true });
	});
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
