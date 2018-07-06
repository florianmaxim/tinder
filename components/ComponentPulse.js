import {config} from '../config'

import * as THREE from 'three';

let interval;

let scope

export default class ComponentPulse {

    constructor(){

        scope = this

        this.time = new THREE.Clock()

        this._grow     = false
        this._exploded = false
        this._started = false

        this.container = new THREE.Group();

    }

    start(){

        interval = setInterval(()=>{

            this.meshGeometry = new THREE.SphereGeometry( .2, 32, 32 );
            this.meshMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: .1,
                side: THREE.DoubleSide, 
                wireframe: false
            })

            this.container.add(new THREE.Mesh(this.meshGeometry, this.meshMaterial))

        }, 3000)

        this._started = true
    }

    stop(){
        clearInterval(interval)
    }

    getMesh(){
        return this.container
    }

    update(){

        if(this._started)
        scope.container.traverse((bubble) => {

            let f = bubble.scale.x

            if(f>config.fog.far){
                //scope.container.remove(bubble)
            }else{
                f = f + 0.01
                bubble.scale.set(f,f,f)
            }    
            

        })

    }

}