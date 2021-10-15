const TX_SUCCESS = 'success'
const TX_FAILED = 'failed'
const TX_PENDING = 'pending'

let accounts = []
let transactions = []
let currentAccount

const listAccountDOM = document.getElementById('listAccount')
const listTransactionDOM = document.getElementById('listTransaction')

// Long-life connection to background
const port = chrome.runtime.connect({name: 'kda.extension'})
// Listen background message
port.onMessage.addListener(async (response) => {
  console.log('[Debug] POPUP background listener: ', response)

  if (response.target !== 'kda.popup') return

  if (response.action === 'kda_reSendTransaction') {
    let txSuccessElement = document.querySelector(`li[data-id="${response.data.id}"]`)
    txSuccessElement.remove()
  }
});

chrome.storage.local.get('accounts', (store) => {
  accounts = store.accounts || []

  let listAccount = ''
  accounts.forEach(account => {
    listAccount += `<li>${account.email} <button data-id="${account.id}" class="switchBtn">Switch</button></li>`
  })

  listAccountDOM.innerHTML = listAccount
  document.querySelectorAll('.switchBtn').forEach(item => {
    item.addEventListener('click', event => {
      
      let accountSelected = accounts.filter(acc => acc.id == event.target.dataset.id)
      if (accountSelected.length) {
        chrome.storage.local.set({accountSelected: accountSelected[0]}, () => {
          chrome.runtime.sendMessage({
            account: accountSelected[0],
            target: 'kda.background',
            action: 'kda_switchAccount'
          });
        });
      }
    })
  })
})

chrome.storage.local.get('transactions', (store) => {
  transactions = store.transactions || []

  let listTransaction = ''
  transactions.forEach(transaction => {
    let button = `<button data-send='${JSON.stringify(transaction)}' class="viewDetail">Detail</button>`
    if (transaction.status === TX_FAILED) {
      button = `<button data-send='${JSON.stringify(transaction)}' class="reSend">Re-send</button>`
    }

    if (transaction.status === TX_PENDING) {
      button = `<button data-send='${JSON.stringify(transaction)}' class="reSend">Send</button>`
    }

    listTransaction += `<li data-id='${transaction.id}'>${transaction.data.to} ${button}</li>`
  })

  listTransactionDOM.innerHTML = listTransaction
  document.querySelectorAll('.reSend').forEach(item => {
    item.addEventListener('click', reSendTransaction)
  })
})

function reSendTransaction(event) {
  let tx = JSON.parse(event.target.dataset.send)
  chrome.runtime.sendMessage({
    data: tx,
    target: 'kda.background',
    action: 'kda_reSendKadena'
  });
}
