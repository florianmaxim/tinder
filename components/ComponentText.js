import {config} from '../config'

import * as THREE from 'three';

export default class ComponentText {

    constructor(){

        this.time = new THREE.Clock()

        this._grow     = false
        this._exploded = false

        var loader = new THREE.FontLoader();

        let container = new THREE.Group()

        loader.load( 'fonts/helvetiker_regular.typeface.json', function ( font ) {

            let geometry = new THREE.TextGeometry('There is no one around you.', {
                font: font,
                size: .075,
                height: .001,
                curveSegments: 12,
                bevelEnabled: false,
            } );

            let material = new THREE.MeshBasicMaterial({
                color: config.text.color,
                transparent: true,
                opacity: .85,
                side: THREE.DoubleSide
            })
    
    
            let mesh = new THREE.Mesh(geometry, material)

            let box = new THREE.Box3().setFromObject(mesh);
    
            mesh.position.set(-box.getSize().x/2,0,-1)
           

            container.add(mesh)

            geometry = new THREE.TextGeometry('Open your arms to see more people.', {
                font: font,
                size: .055,
                height: .001,
                curveSegments: 12,
                bevelEnabled: false,
            } );

            material = new THREE.MeshBasicMaterial({
                color: config.text.color,
                transparent: true,
                opacity: .85,
                side: THREE.DoubleSide
            })
    
    
            mesh = new THREE.Mesh(geometry, material)

            box = new THREE.Box3().setFromObject(mesh);
    
            mesh.position.set(-box.getSize().x/2,-.125,-1)
           
            container.add(mesh)


            //Logo
            geometry = new THREE.PlaneGeometry(.1,.1 );

            material = new THREE.MeshBasicMaterial({
                color: config.text.color,
                transparent: true,
                opacity: .85,
                side: THREE.DoubleSide
            })
    
    
            mesh = new THREE.Mesh(geometry, material)

            box = new THREE.Box3().setFromObject(mesh);
    
            mesh.position.set(-box.getSize().x/2,.125,-1)
           
           // container.add(mesh)
          

        } );

        return container

    }

    update(){


    }

}