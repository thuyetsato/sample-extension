console.log(chrome)
let address = document.getElementById('address')
let amount = document.getElementById('amount')
let btnSend = document.getElementById('btnSend')
let btnAccept = document.getElementById('btnAccept')


let sectionAbc = document.getElementById('sectionAbc')
let sectionConnect = document.getElementById('sectionConnect')

//TODO: allow DOM appear with condition
sectionAbc.style.display = 'none'


let dappURL
chrome.storage.local.get('transactions', (store) => {
  if (!store.transactions) return

  let connectTrans = store.transactions.filter(trans => trans.name === 'connect')
  if (connectTrans.length) {
    let dappName = document.getElementById('dappName')
    dappName.innerText = connectTrans[0].dappURL
    dappURL = connectTrans[0].dappURL
  }
})

btnAccept.addEventListener('click', () => {
  chrome.runtime.sendMessage({
    target: "kda.background",
    action: "connect",
    data: { dappURL }
  });

  closeCurrentWindow()
})

btnSend.addEventListener('click', () => {
  setTimeout(() => {
    chrome.runtime.sendMessage({
      target: "kda.background",
      action: "transfer",
      data: {
        address: address.value,
        amount: amount.value
      }
    });

    closeCurrentWindow()
  }, 2000);
})

function closeCurrentWindow() {
  return chrome.windows.getCurrent((windowDetails) => {
    return chrome.windows.remove(windowDetails.id);
  });
}