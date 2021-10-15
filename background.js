// Extension connection handler
const TX_SUCCESS = 'success'
const TX_FAILED = 'failed'
const TX_PENDING = 'pending'
let contentPort = null
let connectedSites = localStorage.getItem('connectedSites')
connectedSites = connectedSites ? JSON.parse(connectedSites) : []
const API_ENDPOINT = 'https://reqres.in/api'

/**
 * One-time connection
 */
chrome.runtime.onMessage.addListener(
  async (request, sender, sendResponse) => {
    if (request.target === 'kda.background') {
      // Update badge
      updateBadge()

      if (request.action === 'connect') {
        connectedSites.push(request.data.dappURL)

        localStorage.setItem('connectedSites', JSON.stringify(connectedSites))

        return getAccounts(contentPort)
      }

      if (request.action === 'kda_reSendKadena') {
        return reSendKadena(contentPort, request)
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

  updateBadge()

  port.onMessage.addListener(async (payload) => {
    console.log('[Debug] BACKGROUND listener ', payload)

    const action = payload.action || ''

    if (action !== 'open' && !connectedSites.includes(port.sender.origin)) {
      return
    }

    switch (action) {
      case 'open': 
        //TODO: handle payload
        payload.name = 'connect'
        showPopup(payload)
        break;

      case 'kda_disconnect': 
        connectedSites = [] // Change logic to remove site out of list
        localStorage.setItem('connectedSites', [])
        chrome.storage.local.set({accountSelected: null}, () => {});
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

      case 'kda_sendKadena': 
        sendKadena(port, payload)
        break;

      case 'kda_sendKadenaFail': 
        sendKadenaFail(port, payload)
        break;

      case 'kda_reSendKadena': 
        reSendKadena(port, payload)
        break;

      case 'PUSH_NOTIFICATION': 
        pushNotification(payload)
        break;
    
      default:
        break;
    }
  });
});

/**
 * Get current account selected
 * 
 * @param {Object} port 
 */
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
        user = await fetch(`${API_ENDPOINT}/users/1`)
        user = await user.json()

        chrome.storage.local.set({accountSelected: user.data}, () => {
          port.postMessage({
            account: user.data,
            target: 'kda.content',
            action: 'res_requestAccount'
          });
        });

        return
      }

      port.postMessage({
        account,
        target: 'kda.content',
        action: 'res_requestAccount'
      });
  })
}

/**
 * Get all accounts available
 * 
 * @param {Object} port 
 * 
 * @return
 */
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
        users = await fetch(`${API_ENDPOINT}/users`)
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

/**
 * TODO: implement with pact-lang api
 * Get blockchain info
 * 
 * @param {Object} port 
 * @param {Object} payload 
 */
const getBlockInfo = async (port, payload) => {
  let block = await fetch(`${API_ENDPOINT}/users`)
  block = await block.json()

  contentPort = port || contentPort

  contentPort.postMessage({
    block,
    target: 'kda.content',
    action: 'res_blockInfo'
  });
}

/**
 * TODO: implement with pact-lang api
 * Get wallet info
 * 
 * @param {Object} port 
 * @param {Object} payload 
 */
const getWalletInfo = async (port, payload) => {
  let wallet = await fetch(`${API_ENDPOINT}/users/2`)
  wallet = await wallet.json()

  contentPort = port || contentPort

  contentPort.postMessage({
    wallet: wallet.data,
    target: 'kda.content',
    action: 'res_walletInfo'
  });
}

const sendKadena = async (port, payload) => {
  contentPort = port || contentPort

  payload.name = 'kda_sendKadena'
  showPopup(payload)

  // TODO: implement send transaction with pact-lang api
  // let result = await fetch(`${API_ENDPOINT}/2`)
  // result = await result.json()

  // contentPort.postMessage({
  //   transaction: result.data,
  //   target: 'kda.content',
  //   action: 'res_sendKadena'
  // });
}

const sendKadenaFail = async (port, payload) => {
  contentPort = port || contentPort

  //TODO: handle show popup send transaction
  // showPopup(payload)

  let transactions = await getTransactions()
  let failTxId = new Date().getTime()
  transactions.push({
    id: failTxId,
    status: TX_PENDING,
    name: payload.name || 'kda_sendKadenaFail',
    data: payload.data,
  })

  chrome.storage.local.set({ transactions }, updateBadge)

  try {
    // TODO: implement send transaction with pact-lang api
    let result = await fetch(`${API_ENDPOINT}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: ``
    })
    result = await result.json()

    transactions = transactions.map(tx => {
      if (tx.id === failTxId) {
        tx.status = TX_FAILED
      }

      return tx
    })

    chrome.storage.local.set({ transactions }, updateBadge)

    contentPort.postMessage({
      transaction: { error: result.error },
      target: 'kda.content',
      action: 'res_sendKadenaFail'
    }); 
  } catch (error) {
    console.log('error ', error)
  }
}

const reSendKadena = async (port, payload) => {
  contentPort = port || contentPort

  chrome.storage.local.get(['transactions'], (storage) => {
    let transactions = storage.transactions || []

    if (chrome.runtime.lastError) return

    //TODO: handle re-send transaction, remove fail item
    transactions = transactions.filter(tx => tx.id !== payload.data.id)

    chrome.storage.local.set({ transactions }, () => {
      updateBadge()
      pushNotification()

      contentPort.postMessage({
        data: payload.data,
        target: 'kda.popup',
        action: 'kda_reSendTransaction'
      });
    })
  });  
}

/**
 * Browser push notify
 * 
 * @param {Object} payload 
 */
const pushNotification = (payload = {}) => {
  chrome.notifications.create(payload.id || 'NOTFICATION_ID', {
    type: payload.type || 'basic',
    iconUrl: payload.iconUrl || 'noti.webp',
    title: payload.title || 'Kadena notify title',
    message: payload.message || 'Kadena notify message',
    priority: payload.priority || 1
  })
}

/**
 * Get last window focus info
 * 
 * @return {Object}
 */
const getLastFocusedWindow = async () => {
  return new Promise((resolve, reject) => {
    chrome.windows.getLastFocused((windowObject) => {
      return resolve(windowObject);
    });
  });
}

/**
 * Show extension notify popup
 * 
 * @param {Object} payload 
 */
const showPopup = async (payload = {}) => {
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
  let transactions = await getTransactions()
  transactions.push({
    id: new Date().getTime(),
    status: TX_PENDING,
    name: payload.name || '',
    data: payload.data,
  })

  chrome.storage.local.set({ transactions }, updateBadge)

  chrome.windows.create(options)
}

/**
 * Calculate total transactions
 * 
 * @return {Number}
 */
const countTransactions = async () => {
  let transactions = await getTransactions()

  return transactions.length 
}

/**
 * Update badge
 */
const updateBadge = async () => {
  let badge = await countTransactions()
  chrome.browserAction.setBadgeText({text: `${badge || ''}`})
}

/**
 * Get all transactions
 * 
 * @return {Array}
 */
const getTransactions = async (status = null) => {
  return new Promise((res, rej) => {
    chrome.storage.local.get(['transactions'], (storage) => {
      transactions = storage.transactions

      if (chrome.runtime.lastError) {
        return rej(chrome.runtime.lastError);
      }

      res(transactions)
    });  
  }).then(async transactions => {
    if (!transactions) return []

    if (status) {
      transactions = transactions.filter(tx => tx.status === status)
    }

    return transactions 
  })
}
