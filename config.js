const config = {
    
    simulation: true,

    debug : true,

    API : {
        BASE_URL : "http://192.168.178.126:8888",
        TOKEN : "33b04764-dfcf-456a-b5e3-9d7db8d8bbef",

        tinder : {
            ACCESS_TOKEN : "33b04764-dfcf-456a-b5e3-9d7db8d8bbef"
        },

        facebook : {
            USER_ID : 1
        }
    },

    space : {
        grid : false,
        shadow: true
    },

    fog : {
        far :10
    },

    world : {
        gravity : {
            x : 0,
            y : -2.5,
            z : 0
        }
    },

    ground : {
        body : true,
        opacity : 0
    },

    picture : {
        frame : false,
        rotatinon: false,

        caption: false,
        browse: true,

        fixedScale : false,

        containerOpacity : 0.25,
        containerWireframe : false,
        containerColor : 0xff0000
    },

    fetch: {
        ItemsPerCall : 16,
        interval : 30000
    },

    bubble: {
        color : 0xff0000
    },

    text: {

        start: "Open your arms.",
        color : 0x333333

    },

    distanceHandsStart: .85
}

export {config}