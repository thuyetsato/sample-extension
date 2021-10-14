// Extension connection handler
let contentPort = null
let connectedSites = []
const API_ENDPOINT = 'https://reqres.in/api/users'

chrome.runtime.onMessage.addListener(
  async (request, sender, sendResponse) => {
    if (request.target === 'kda.background') {
      if (request.action === 'connect') {
        connectedSites.push(request.data.dappURL)

        return getAccounts(contentPort)
      }

      try {
        contentPort.postMessage({
          ...request,
          target: "kda.content"
        });
      } catch (error) {
        console.log(error)
      }
    }
  }
);

/**
 * Long-time connection
 */
chrome.runtime.onConnect.addListener(async (port) => {
  contentPort = port

  port.onMessage.addListener(async (payload) => {
    console.log('[Debug] BACKGROUND listener ', payload)

    const action = payload.action || ''
    switch (action) {
      case 'open': 
        //TODO: handle payload
        showPopup(payload)
        break;

      case 'kda_disconnect': 
        connectedSites = []
        break;

      case 'kda_requestAccounts': 
        getAccountSelected(port)
        break;

      case 'kda_accounts': 
        //TODO: handle first time ask to connect
        getAccounts(port)
        break;

      case 'kda_getBlockInfo': 
        getBlockInfo(port, payload)
        break;

      case 'kda_getWallet': 
        getWalletInfo(port, payload)
        break;
      case 'PUSH_NOTIFICATION': 
        pushNotification()
        break;
    
      default:
        break;
    }

    // if (payload.action === 'open') {
    //   //TODO: handle payload
    //   showPopup(payload)
    // }

    // if (payload.action === 'kda_disconnect') {
    //   connectedSites = []
    // }
    
    // if (payload.action === 'kda_requestAccounts') {
    //   getAccountSelected(port)
    // }
    
    // if (payload.action === 'kda_accounts') {
    //   //TODO: handle firs time ask to connect
      
    //   getAccounts(port)
    // }

    // if (payload.action === 'kda_getBlockInfo') {
    //   getBlockInfo(payload)
    // }

    // if (payload.action === 'PUSH_NOTIFICATION') {
    //   pushNotification()
    // }
  });
});

const getAccountSelected = async (port) => {
  let account = null

  new Promise((res, rej) => {
    chrome.storage.local.get(['accountSelected'], (storage) => {
      account = storage.accountSelected

      if (chrome.runtime.lastError) {
        return rej(chrome.runtime.lastError);
      }

      res(account)
    });  
  }).then(async account => {
      if (!account) {
        // TODO: change to real pact-lang api request
        user = await fetch(`${API_ENDPOINT}/1`)
        user = await user.json()

        await chrome.storage.local.set({accountSelected: user.data}, () => {});
      }

      port.postMessage({
        account,
        target: 'kda.content',
        action: 'res_requestAccount'
      });
  })
}

const getAccounts = async (port) => {
  if (!connectedSites.includes(port.sender.origin)) {
    port.postMessage({
      accounts: [],
      target: 'kda.content',
      action: 'res_accounts'
    });

    return
  }

  let accounts = null

  new Promise((res, rej) => {
    chrome.storage.local.get(['accounts'], (storage) => {
      accounts = storage.accounts

      if (chrome.runtime.lastError) {
        return rej(chrome.runtime.lastError);
      }

      res(accounts)
    });  
  }).then(async accounts => {
      let users = {}

      if (!accounts) {
        // TODO: change to real pact-lang api request
        users = await fetch(API_ENDPOINT)
        users = await users.json()

        chrome.storage.local.set({accounts: users.data}, () => {
          port.postMessage({
            accounts: users.data,
            target: 'kda.content',
            action: 'res_accounts'
          });
        });

        return
      }

      port.postMessage({
        accounts: accounts || users.data,
        target: 'kda.content',
        action: 'res_accounts'
      });
  })
}

const getBlockInfo = async (port, payload) => {
  let block = await fetch(API_ENDPOINT)
  block = await block.json()

  contentPort = port || contentPort

  contentPort.postMessage({
    block,
    target: 'kda.content',
    action: 'res_blockInfo'
  });
}

const getWalletInfo = async (port, payload) => {
  let wallet = await fetch(`${API_ENDPOINT}/2`)
  wallet = await wallet.json()

  contentPort = port || contentPort

  contentPort.postMessage({
    wallet,
    target: 'kda.content',
    action: 'res_walletInfo'
  });
}

const pushNotification = (payload = {}) => {
  chrome.notifications.create(payload.id || 'NOTFICATION_ID', {
    type: payload.type || 'basic',
    iconUrl: payload.iconUrl || 'noti.webp',
    title: payload.title || 'Kadena notify title',
    message: payload.message || 'Kadena notify message',
    priority: payload.priority || 1
  })
}

const getLastFocusedWindow = async () => {
  return new Promise((resolve, reject) => {
    chrome.windows.getLastFocused((windowObject) => {
      return resolve(windowObject);
    });
  });
}

const showPopup = async (payload) => {
  let badge = await countTransactions()
  chrome.browserAction.setBadgeText({text: `${badge}`})

  const lastFocused = await getLastFocusedWindow();

  let options = {
    url: chrome.runtime.getURL("home.html"),
    type: 'popup',
    top: lastFocused.top,
    left: lastFocused.left + (lastFocused.width - 360),
    width: 360,
    height: 620,
  }

  //TODO: implement transaction for each case
  transactions = [{
    name: 'connect',
    dappURL: payload.data.origin
  }]

  chrome.storage.local.set({ transactions }, () => {
    // chrome.browserAction.setBadgeText({text: 1})
  })

  chrome.windows.create(options)
}

const countTransactions = async () => {
  return new Promise((res, rej) => {
    chrome.storage.local.get(['transactions'], (storage) => {
      transactions = storage.transactions

      if (chrome.runtime.lastError) {
        return rej(chrome.runtime.lastError);
      }

      res(transactions)
    });  
  }).then(async transactions => {
    if (!transactions) {
      return 0
    }

    return transactions.length 
  })
}
