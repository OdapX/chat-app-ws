import { gql } from "apollo-server-express";
const typeDefs = gql`
	type Message {
		id: ID!
		user: String!
		content: String!
	}

	type Query {
		Messages: [Message!]
	}
	type Mutation {
		PostMessage(user: String!, content: String!): ID!
		userTyping(user: String!): String!
	}
	type Subscription {
		messagePosted: Message
		userTyping: String!
	}
`;
export default typeDefs;
