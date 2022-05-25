import { PubSub } from "graphql-subscriptions";

const pubsub = new PubSub();

const msgs = [{ id: 1, user: "yahya", content: "test" }];
const resolvers = {
	Query: {
		Messages: () => msgs,
	},
	Mutation: {
		PostMessage: (parent, { user, content }) => {
			console.log(content);
			const id = msgs.length;
			msgs.push({
				id: id,
				user: user,
				content: content,
			});
			pubsub.publish("MESSAGE_POSTED", {
				messagePosted: { id, user, content },
			});

			console.log(msgs);
			return id;
		},
		userTyping: (parent, { user }) => {
			pubsub.publish("userTyping", {
				userTyping: user,
			});
			return user;
		},
	},
	Subscription: {
		messagePosted: {
			// More on pubsub below
			subscribe: () => pubsub.asyncIterator(["MESSAGE_POSTED"]),
		},
		userTyping: {
			subscribe: () => pubsub.asyncIterator(["userTyping"]),
		},
	},
};

export default resolvers;
