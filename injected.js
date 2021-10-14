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
          if (this.handler) {
            this.handler(event.data)
          }

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

  on: async (name, callback) => {
    let listener = new Listener(name, callback)
    return await listener.on(name)
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

      case 'kda_sendKadena':
        return sendKadena(options.data)

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
   let listener = new Listener('kda_requestAccounts')
  listener.send({
    target: 'kda.content',
    action: listener.name,
    data: {}
  })

  let { account } = await listener.on('res_requestAccount')

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
  let { id, email } = data.wallet

  return { id, email }
}

const sendKadena = async (params) => {
  let handler = (data) => {
    listener.send({
      action: 'PUSH_NOTIFICATION',
      target: 'kda.content',
      title: 'Kadena notification',
      message: 'Send transaction successfully!'
    })
  }

  let listener = new Listener('kda_sendKadena', handler)
  listener.send({
    target: 'kda.content',
    action: listener.name,
    data: params
  })

  let { data } = await listener.on('res_sendKadena')

  return data
}
