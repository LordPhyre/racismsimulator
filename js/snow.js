import * as THREE from "three";

export class snow {
    constructor(camera, scene, options = {}) {
        const defaults = {
            snowflakeCount: 2000,
            snowSpeed: 0.05,
            snowflakeSize: 0.05,
            distance: 20,
            height: 20,
        };

        this.camera = camera;
        this.scene = scene;
        this.settings = { ...defaults, ...options };
        this.snowflakeGeometry = new THREE.BufferGeometry();
        this.snowflakeMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: this.settings.snowflakeSize,
            transparent: true,
        });

        const distance = this.settings.distance;
        const height = this.settings.height;

        this.positions = [];
        this.drift = [];
        for (let i = 0; i < this.settings.snowflakeCount; i++) {
            this.positions.push(
                Math.random() * distance * 2 - distance + this.camera.position.x,
                Math.random() * height,
                Math.random() * distance * 2 - distance + this.camera.position.z
            );
            this.drift.push(
                Math.random() * 0.02 - 0.01,
                Math.random() * 0.02 - 0.01,
                Math.random() * 0.02 - 0.01
            )
        }

        this.snowflakeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(this.positions, 3));
        this.snowflakes = new THREE.Points(this.snowflakeGeometry, this.snowflakeMaterial);
        this.scene.add(this.snowflakes);
        this.snowflakes.frustumCulled = false;
    }

    update() {
        const positions = this.snowflakeGeometry.attributes.position.array;
        const distance = this.settings.distance;
        const height = this.settings.height;
        const drift = this.drift;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += drift[i];
            positions[i + 1] -= this.settings.snowSpeed - drift[i + 1];
            positions[i + 2] += drift[i + 2];

            if (positions[i + 1] <= 0) {
                positions[i] = this.camera.position.x + Math.random() * distance * 2 - distance;
                positions[i + 1] = height;
                positions[i + 2] = this.camera.position.z + Math.random() * distance * 2 - distance;
            }

            if (Math.abs(this.camera.position.x - positions[i]) >= distance) {
                positions[i] = this.camera.position.x + this.camera.position.x - positions[i];
            }
            if (Math.abs(this.camera.position.z - positions[i + 2]) >= distance) {
                positions[i + 2] = this.camera.position.z + this.camera.position.z - positions[i + 2];
            }

        }

        this.snowflakeGeometry.attributes.position.needsUpdate = true;
    }
}