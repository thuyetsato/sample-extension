console.log("Extension script injected!");

let extensionURL = null;
document.addEventListener('onloadInject', (e) => {
    extensionURL = e.detail.extensionURL
    console.log('Detail extension URL: ', extensionURL)
});

let Listener = class {
  constructor(name, handler) {
    this.name = name;
    this.handler = handler;
  }

  send(payload) {
    window.postMessage({ action: this.name, ...payload })
  }

  on(responseName) {
    return new Promise((res, rej) => {
      window.addEventListener('message', (event) => {
        if (event.data.action === responseName) {
          if (event.data.error) {
            return rej(event.data.error)
          }

          return res(event.data)
        }
      })
    })
  }
};

/**
 * Kadena instance
 * 
 * Methods:
 * on: params(name: String, callback: Function)
 * 
 * request: params(options: Object)
 */
window.kadena = {
  isKadena: true,

  on: (name, callback) => {
    if (name === 'connect') {
      window.postMessage({
        target: 'kda.content',
        action: 'connect',
        data: {
          test: 123
        }
      })
    }

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
      case 'kda_requestAccounts':
        let handler = (data) => {
          return data
        }

        let x = new Listener('kda_requestAccounts', handler)
        x.send({
          target: 'kda.content',
          action: x.name,
          test:123
        })

        let a = await x.on('res_requestAccount')

        console.log(a)
        x.send({
          action: 'PUSH_NOTIFICATION',
          target: 'kda.content'
        })

        return a.users

      default:
          break;
    }
  }
}
