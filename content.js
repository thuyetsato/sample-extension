console.log('Hello page, from extension', chrome);

const scriptInjection = document.createElement('script');
scriptInjection.src = chrome.extension.getURL('injected.js');
(document.head || document.documentElement).appendChild(scriptInjection);

scriptInjection.onload = () => {
  const extensionURL = chrome.runtime.getURL("popup.html");

  const event = new CustomEvent('onloadInject', { detail: { extensionURL } });
  document.dispatchEvent(event);
};

// Long-life connection to background
const port = chrome.runtime.connect({name: 'kda.extension'})

// Listen background message
port.onMessage.addListener(async (data) => {
  console.log('CONTENT background listener: ', data)
  window.postMessage({
    ...data,
    target: 'kda.dapps'
  });
});

// Listen webpage(dapps) message
window.addEventListener('message', (event) => {
  console.log('CONTENT window listener ',event.data)
  if (event.source != window) return

  const data = event.data
  if (data.target && data.target === 'kda.content') {
    console.log('=======================================================')
    port.postMessage({
      ...data,
      target: 'kda.background'
    });
  }

}, false);
