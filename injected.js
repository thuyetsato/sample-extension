let extensionURL = null;
document.addEventListener('onloadInject', (e) => {
    extensionURL = e.detail.extensionURL
});

class Listener {
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
    let listener = new Listener(name)
    listener.on(name, callback)

    // window.addEventListener('message', (event) => {
    //   console.log('INJECT received event: ', event.data)
    //   if (!event.data) return;

    //   let target = event.data.target || ''
    //   let action = event.data.action || ''
      
    //   if (action === name) {
    //     switch (target) {
    //       case 'connect':
    //         callback('Your dapps connected with Kadena wallet success!')
    //         break;
    //       case 'disconnect':
    //         callback('Your dapps connected with Kadena wallet success!')
    //         break;

    //       case 'kda.dapps':
    //         callback(event.data)
    //         break;

    //       default:
    //         console.log('failed!', target)
    //         break;
    //     }
    //   }
    // })
  },

  request: async (options) => {
    const method = options.method || ''

    switch (method) {
      case 'kda_connect':
        return openConnect()

      case 'kda_disconnect':
        return disconnect(options)

      case 'kda_requestAccounts':
        return getAccountSelected()

      case 'kda_accounts':
        return getAccounts()

      case 'kda_getBlockInfo':
        return getBlockInfo()

      case 'kda_getWallet':
        return getWallet()

      default:
          break;
    }
  }
}

const openConnect = async () => {
  let listener = new Listener('open')
  listener.send({
    target: 'kda.content',
    action: listener.name,
    data: {
      origin: window.origin
    }
  })

  let data = await listener.on('res_accounts')

  return data.accounts
}

const disconnect = async (options) => {
  let listener = new Listener('kda_disconnect')
  listener.send({
    target: 'kda.content',
    action: listener.name,
    data: options.data
  })

  return await listener.on('res_disconnect')
}

const getAccountSelected = async () => {
  let handler = (data) => {
    return data
  }

  let listener = new Listener('kda_requestAccounts', handler)
  listener.send({
    target: 'kda.content',
    action: listener.name,
    data: {}
  })

  let account = await listener.on('res_requestAccount')

  listener.send({
    action: 'PUSH_NOTIFICATION',
    target: 'kda.content'
  })

  return account
}

const getAccounts = async () => {
  let handler = (data) => {
    return data
  }

  let listener = new Listener('kda_accounts', handler)
  listener.send({
    target: 'kda.content',
    action: listener.name,
    data: {}
  })

  let data = await listener.on('res_accounts')

  // listener.send({
  //   action: 'PUSH_NOTIFICATION',
  //   target: 'kda.content'
  // })

  return data.accounts
}

const getBlockInfo = async () => {
  let handler = () => {}

  let listener = new Listener('kda_getBlockInfo', handler)
  listener.send({
    target: 'kda.content',
    action: listener.name,
    data: {}
  })

  let data = await listener.on('res_blockInfo')

  return data
}

const getWallet = async () => {
  let handler = () => {}

  let listener = new Listener('kda_getWallet', handler)
  listener.send({
    target: 'kda.content',
    action: listener.name,
    data: {}
  })

  let data = await listener.on('res_walletInfo')

  return data.block
}
