import * as config from './config'

const log = function(props){
    if(config.debug)
    console.log(props)
}

export {log}