import {config} from '../config'

import * as THREE from 'three';

export default class ComponentSearchBubble {

    constructor(){

        this.time = new THREE.Clock()

        this._grow     = false
        this._exploded = false


        this.meshGeometry = new THREE.SphereGeometry( 2, 32, 32 );
        
        this.meshMaterial = new THREE.MeshPhongMaterial({
            color: config.bubble.color,
            transparent: true,
            opacity: .25,
            side: THREE.DoubleSide
        })

        this.mesh = new THREE.Mesh(this.meshGeometry, this.meshMaterial)
    
    }

    getMesh(){
        return this.mesh
    }

    update(){

        if(this._grow){
            //grow
            const f = this.mesh.scale.x+0.01
            this.mesh.scale.set(f,f,f)

            if(f>config.fog.far/2)
            this._exploded = true
        }else{

            if(this._exploded) return
            //breath
            const f = Math.cos(this.time.getElapsedTime())/2 + 2
            this.mesh.scale.set(f,f,f)
        }
    }

}