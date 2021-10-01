window.kadena = {
    on: (name, callback) => {
        window.addEventListener('message', (event) => {
            console.log('INJECT received event: ', event.data)
            if (!event.data) return;

            let target = event.data.target || ''
            let listenName = event.data.action || ''
            
            if (listenName === name) {
                switch (target) {
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

    request: (options) => {
        const method = options.method || ''

        switch (method) {
            case 'get_account':
                return new Promise((res, rej) => {
                    setTimeout(() => {
                        res({data: 123456789})
                    }, 2000);
                })       
                break;
        
            default:
                break;
        }
    }
}
