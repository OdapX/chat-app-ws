self.addEventListener("push", (event) => {
	const data = event.data.json();
	console.log("New notification", data);
	const options = {
		body: data.body,
	};
	event.waitUntil(self.registration.showNotification(data.title, options));
});

// THIS CODE HAS NOT ACCESS AT ANY "DOM" FEATURE!!!!
// SO NO ALERT, NOT document.GetElementById
