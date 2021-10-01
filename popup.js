// Long-life connection to background
// const port = chrome.runtime.connect({name: 'kda.extension'})

let address = document.getElementById('address')
let amount = document.getElementById('amount')
let btnSend = document.getElementById('btnSend')

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

    // port.postMessage({
    //   target: "kda.background",
    //   action: "transfer",
    //   data: {
    //     address: address.value,
    //     amount: amount.value
    //   }
    // });

    closeCurrentWindow()
  }, 2000);
})

function closeCurrentWindow() {
  return chrome.windows.getCurrent((windowDetails) => {
    return chrome.windows.remove(windowDetails.id);
  });
}