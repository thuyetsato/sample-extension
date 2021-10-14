const TX_SUCCESS = 'success'
const TX_FAILED = 'failed'
const TX_PENDING = 'pending'

let address = document.getElementById('address')
let amount = document.getElementById('amount')
let btnSend = document.getElementById('btnSend')
let btnAccept = document.getElementById('btnAccept')
let loader = document.getElementById('loader')


let signTransaction = document.getElementById('signTransaction')
let sectionConnect = document.getElementById('sectionConnect')

//TODO: allow DOM appear with condition

let dappURL
let transactions
let currentTxId

chrome.storage.local.get('transactions', (store) => {
  if (!store.transactions) return

  let connectTrans = store.transactions.filter(trans => trans.name === 'connect')
  if (connectTrans.length) {
    let dappName = document.getElementById('dappName')
    dappName.innerText = connectTrans[0].data.origin
    dappURL = connectTrans[0].data.origin

    signTransaction.style.display = 'none'
    sectionConnect.style.display = 'block'
  } else {
    signTransaction.style.display = 'block'
    sectionConnect.style.display = 'none'

    //TODO: handle multiple transactions
    transactions = store.transactions.filter(tx => tx.status === TX_PENDING)

    address.value = transactions[0].data.to
    amount.value = transactions[0].data.amount
    currentTxId = transactions[0].id
  }
})

btnAccept.addEventListener('click', () => {
  chrome.storage.local.get('transactions', (store) => {
    if (!store.transactions) return
    
    let transactions = store.transactions.filter(trans => trans.name !== 'connect')
    chrome.storage.local.set({ transactions }, () => {
      chrome.runtime.sendMessage({
        target: "kda.background",
        action: "connect",
        data: { dappURL }
      });

      closeCurrentWindow()
    });
  })
})

btnSend.addEventListener('click', () => {
  btnSend.style.display = 'none'
  loader.style.display = 'flex'

  // TODO: handle call pact-lang api send tx
  setTimeout(() => {
    chrome.storage.local.get('transactions', (store) => {
      if (!store.transactions) return
    
      store.transactions = store.transactions.filter(tx => tx.id !== currentTxId)

      chrome.storage.local.set({ transactions: store.transactions }, () => {
        chrome.runtime.sendMessage({
          target: "kda.background",
          action: "res_sendKadena",
          data: {
            address: address.value,
            amount: amount.value
          }
        });
  
        closeCurrentWindow()
      });
    })
  }, 1500);
})

function closeCurrentWindow() {
  return chrome.windows.getCurrent((windowDetails) => {
    return chrome.windows.remove(windowDetails.id);
  });
}
