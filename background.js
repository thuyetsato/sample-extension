console.log('Background script running!', chrome, window)

let contentPort = null

chrome.runtime.onMessage.addListener(
  async (request, sender, sendResponse) => {
    console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
    // console.log('background sender ', sender)
    
    if (request.target === 'kda.background') {
      try {
        let users = await fetch('https://reqres.in/api/users?page=2')
        users = await users.json()
        // Handle something
        contentPort.postMessage({
          ...request,
          users,
          target: "kda.content"
        });
      } catch (error) {
        console.log(error)
      }
    }
  }
);

const getLastFocusedWindow = async () => {
  return new Promise((resolve, reject) => {
    chrome.windows.getLastFocused((windowObject) => {
      return resolve(windowObject);
    });
  });
}

const showPopup = async (payload) => {
  const lastFocused = await getLastFocusedWindow();

  let options = {
    url: chrome.runtime.getURL("home.html"),
    type: 'popup',
    top: lastFocused.top,
    left: lastFocused.left + (lastFocused.width - 360),
    width: 360,
    height: 620,
  }

  chrome.windows.create(options)
}

chrome.runtime.onConnect.addListener(async (port) => {
  console.log('Runtime Listener ', port)
  console.log('BACKGROUND listener ', payload)
  contentPort = port

  port.onMessage.addListener(async (payload) => {
    if (payload.action === 'open') {
      //TODO: handle payload
      showPopup(payload)
    }
  });
});
