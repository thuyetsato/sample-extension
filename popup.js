let accounts = []
let currentAccount

const listAccountDOM = document.getElementById('listAccount')

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
