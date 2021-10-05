console.log("Extension script injected!");

let extensionURL = null;
document.addEventListener('onloadInject', (e) => {
    extensionURL = e.detail.extensionURL
    console.log('Detail extension URL: ', extensionURL)
});

/**
 * Kadena instance
 * 
 * Methods:
 * on: params(name: String, callback: Function)
 * 
 * request: params(options: Object)
 */
window.kadena = {
  on: (name, callback) => {
    window.addEventListener('message', (event) => {
      console.log('INJECT received event: ', event.data)
      if (!event.data) return;

      let target = event.data.target || ''
      let action = event.data.action || ''
      
      if (action === name) {
        switch (target) {
          case 'connect':
            callback('Your dapps connected with Kadena wallet success!')
            break;
          case 'disconnect':
            callback('Your dapps connected with Kadena wallet success!')
            break;

          case 'kda.dapps':
            callback(event.data)
            break;
          
          default:
            console.log('failed!', target)
            break;
        }
      }
    })
  },

  request: async (options) => {
    const method = options.method || ''

    switch (method) {
      case 'kda_getAccount':
        let users = await fetch('https://reqres.in/api/users?page=2')
        users = await users.json()

        return new Promise((res, rej) => {
          setTimeout(() => {
            window.postMessage({
                action: 'PUSH_NOTIFICATION',
                target: 'kda.content'
            })

            res({data: { name: 'aaaa', balance: 1234 }, users})
          }, 2000);
        })
  
      default:
          break;
    }
  }
}
