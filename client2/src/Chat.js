import React, { useEffect, useMemo } from "react";
import { useMutation, useSubscription, gql, useQuery } from "@apollo/client";
import Notifier from "react-desktop-notification";
import { useState } from "react";
import useWindowFocus from "use-window-focus";

// Quereies for apollo hooks

const Message_Posted = gql`
	subscription {
		messagePosted {
			user
			content
		}
	}
`;

const Messages_Query = gql`
	query Messages {
		Messages {
			content
			id
			user
		}
	}
`;

const User_Typing = gql`
	subscription {
		userTyping
	}
`;

// End queries

function Chat() {
	const [user, setUser] = useState("");
	const windowFocused = useWindowFocus();

	const typing = gql`
	mutation {
		userTyping(user: "${user}")
	}
`;
	const [Messages, setMessages] = useState([]);
	const { data } = useSubscription(Message_Posted);
	let { data: user_typing } = useSubscription(User_Typing);
	const [typer, setTyper] = useState();
	const { data: OldMessages } = useQuery(Messages_Query);
	const [unreadMessages, setUnreadMessages] = useState(0);
	// keep track of the new messages posted by users
	useMemo(() => {
		console.log();
		if (
			data?.messagePosted.user &&
			data?.messagePosted.user !== user &&
			!windowFocused
		) {
			Notifier.start(
				`New Messages From ${data?.messagePosted.user}`,
				`${data?.messagePosted.content}`,
				"www.google.com",
				"https://c.clc2l.com/t/g/o/google-photos-75BNHB.png"
			);
			if (!("Notification" in window)) {
				console.log(
					"This browser does not support desktop notification"
				);
			} else {
				Notification.requestPermission();
			}
		}

		if (data?.messagePosted === undefined) return;
		setMessages([...Messages, data?.messagePosted]);

		if (data?.messagePosted.user !== user)
			setUnreadMessages(unreadMessages + 1);
	}, [data]);
	const [Message, setMessage] = useState("");

	useEffect(() => {
		setTyper(user_typing);

		const timer = setTimeout(() => {
			setTyper(undefined);
		}, 2000);
		return () => clearTimeout(timer);
	}, [Message, user_typing]);

	const POST_MESSAGE = gql`
		mutation {
			PostMessage(user: "${user}", content: "${Message}")
		}
	`;

	const [PostMessage] = useMutation(POST_MESSAGE);
	const [userTyping] = useMutation(typing);

	const Send = () => {
		if (!Message || !user) return;
		PostMessage();
		setMessage("");
	};
	return (
		<div>
			{OldMessages?.Messages?.map((message, i) => (
				<div key={i}>
					{message?.content} - {message?.user}
				</div>
			))}

			{Messages?.map((message) => (
				<div>
					{message?.content} - {message?.user}
				</div>
			))}

			<div className="flex">
				<input
					type="text"
					value={Message}
					onChange={(e) => {
						setUnreadMessages(0);
						userTyping();
						setMessage(e.target.value);
					}}
				/>
				<button onClick={() => Send()}>Send</button>
			</div>
			<div>
				{typer !== undefined &&
					(typer.userTyping !== user
						? typer.userTyping + " is Typing..."
						: "")}
			</div>
			<div className="flex">
				{" "}
				<div>{unreadMessages}</div>{" "}
				<button onClick={() => setUnreadMessages(0)}>
					{" "}
					Mark as read
				</button>
			</div>
			<div className="flex">
				<input
					type="text"
					placeholder="UserName"
					onChange={(e) => setUser(e.target.value)}
				/>
			</div>
		</div>
	);
}

export default Chat;
