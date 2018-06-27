import * as config from './config.json'

const log = function(props){
    if(config.debug)
    console.log(props)
}

export {log}