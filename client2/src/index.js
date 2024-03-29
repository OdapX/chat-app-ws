import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import { split, HttpLink } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import { subscribeUser } from "./subscription";

const httpLink = new HttpLink({
	uri: "http://localhost:4000/graphql",
});

const wsLink = new GraphQLWsLink(
	createClient({
		url: "ws://localhost:4000/graphql",
	})
);

const splitLink = split(
	({ query }) => {
		const definition = getMainDefinition(query);
		return (
			definition.kind === "OperationDefinition" &&
			definition.operation === "subscription"
		);
	},
	wsLink,
	httpLink
);

const client = new ApolloClient({
	link: splitLink,
	cache: new InMemoryCache(),
});
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<ApolloProvider client={client}>
			<App />
		</ApolloProvider>
	</React.StrictMode>
);
serviceWorkerRegistration.register();
subscribeUser();
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
