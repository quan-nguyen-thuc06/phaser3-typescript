import { Bullet } from './bullet';
import { IImageConstructor } from '../interfaces/image.interface';

export class Player extends Phaser.GameObjects.Container {
  body: Phaser.Physics.Arcade.Body;

  // variables
  private health: number;
  private lastShoot: number;
  private speed: number;
  private texture: string;

  // children
  private barrel: Phaser.GameObjects.Image;
  private lifeBar: Phaser.GameObjects.Graphics;
  private tank: Phaser.GameObjects.Image;
  
  // game objects
  private bullets: Phaser.GameObjects.Group;
  private tween: Phaser.Tweens.Tween;
  private curosr: Phaser.GameObjects.Image;

  // input
  private rotateKeyLeft: Phaser.Input.Keyboard.Key;
  private rotateKeyRight: Phaser.Input.Keyboard.Key;
  private moveKeyUp: Phaser.Input.Keyboard.Key;
  private moveKeyDown: Phaser.Input.Keyboard.Key;

  public getBullets(): Phaser.GameObjects.Group {
    return this.bullets;
  }

  constructor(aParams: IImageConstructor) {
    super(aParams.scene, aParams.x, aParams.y);
    this.texture = aParams.texture;

    this.initContainer();
    this.scene.add.existing(this);
    // set body of container
    this.body.setOffset(-this.tank.width/2, -this.tank.height/2);
    this.body.setSize(this.tank.width, this.tank.height);
  }

  private initContainer() {
    // variables
    this.health = 1;
    this.lastShoot = 0;
    this.speed = 150;

    // image
    this.tank = this.scene.physics.add.image(0, 0, this.texture);
    this.tank.angle = 180;
    
    this.barrel = this.scene.add.image(0, 0, 'barrelBlue');
    this.barrel.setOrigin(0.5, 1);
    this.barrel.angle = 180;

    this.curosr = this.scene.physics.add.image(this.x, this.y, 'curosr')
      .setCollideWorldBounds(true)
      .setDisplaySize(64,64)
      .setDepth(2);

    this.lifeBar = this.scene.add.graphics();
    this.redrawLifebar();

    // add objects to container
    this.add([this.tank, this.lifeBar, this.barrel]);

    // game objects
    this.bullets = this.scene.add.group({
      /*classType: Bullet,*/
      active: true,
      maxSize: 10,
      runChildUpdate: true
    });

    // input
    this.rotateKeyLeft = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.A
    );
    this.rotateKeyRight = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.D
    );
    this.moveKeyUp = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.W
    );
    this.moveKeyDown = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.S
    );

    // physics
    this.scene.physics.world.enable(this);
    // input mouse
    this.initHandleInput();
  }

  private initHandleInput(){
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer)=>{
        this.curosr.x += pointer.movementX;
        this.curosr.y += pointer.movementY;
    }, this);

    this.scene.input.on('pointerdown', function () {
      if (!this.scene.input.mouse.locked && !this.curosr.visible){
        this.curosr.setVisible(true);
        this.scene.game.input.mouse.requestPointerLock();
      }else
        this.handleShooting();
    }, this);

    this.scene.input.keyboard.on('keydown-SPACE', ()=>{
      if (this.scene.input.mouse.locked){
        this.scene.input.mouse.releasePointerLock();
        this.curosr.setVisible(false);
      }
    });
    this.scene.events.on('resume', () => {
      this.curosr.setVisible(true);
    })
    
  }
  update(): void {
    // console.log('player: ' +  this.angle);
    if (this.active) {
      if (!this.scene.input.mouse.locked&&this.curosr.visible){
        this.curosr.setVisible(false);
      }
      this.barrel.rotation = Phaser.Math.Angle.Between(this.x, this.y, this.curosr.x, this.curosr.y)+ Math.PI/2;
      this.handleInput();
    } else {
      this.destroy();
      this.barrel.destroy();
      this.lifeBar.destroy();
    }
  }

  private handleInput() {
    // move tank forward
    // small corrections with (- MATH.PI / 2) to align tank correctly
    var angle: number|null;
    this.body.setVelocity(0);

    // rotate tank
    if (this.rotateKeyLeft.isDown) {
      this.body.setVelocityX(-this.speed)
    } else if (this.rotateKeyRight.isDown) {
      if(this.angle == -180)
        this.tank.angle  =179;
        this.body.setVelocityX(this.speed)
    }

    if (this.moveKeyUp.isDown) {
      this.body.setVelocityY(-this.speed)
    } else if (this.moveKeyDown.isDown) {
      this.body.setVelocityY(this.speed);
    }

    // move cursor
    var bodyCurosr = this.curosr.body as Phaser.Physics.Arcade.Body;
    bodyCurosr.setVelocity(this.body.velocity.x, this.body.velocity.y)
    
    // angle
    var angleOfVelocity = this.body.velocity.angle()*Phaser.Math.RAD_TO_DEG;
    // console.log(angleOfVelocity);
    if(angleOfVelocity>=90)
      angle = angleOfVelocity - 270;
    else {
      angle = angleOfVelocity + 90;
    }

    if((!this.tween || !this.tween.isPlaying()) && angle!=null && (this.body.velocity.x != 0 || this.body.velocity.y != 0)){
      if(this.tank.angle == 90 && angle == -180)
        angle = 180;
      // var duration = (Math.abs(this.angle - angle) / 90) * 250;
      this.tween = this.scene.tweens.add({
        targets: this.tank,
        angle: angle,
        ease: 'Sine.easeInOut',
        duration: 350,
        yoyo: false,
        repeat: 0,
      });
    }
  }

  private handleShooting(): void {
    if (this.scene.time.now > this.lastShoot) {
      this.scene.cameras.main.shake(20, 0.005);
      this.scene.tweens.add({
        targets: this,
        props: { alpha: 0.8 },
        delay: 0,
        duration: 5,
        ease: 'Power1',
        easeParams: null,
        hold: 0,
        repeat: 0,
        repeatDelay: 0,
        yoyo: true,
        paused: false
      });

      if (this.bullets.getLength() < 10) {
        this.bullets.add(
          new Bullet({
            scene: this.scene,
            rotation: this.barrel.rotation,
            x: this.x,
            y: this.y,
            texture: 'bulletBlue'
          })
        );

        this.lastShoot = this.scene.time.now + 80;
      }
    }
  }

  private redrawLifebar(): void {
    this.lifeBar.clear();
    this.lifeBar.fillStyle(0xe66a28, 1);
    this.lifeBar.fillRect(
      -this.tank.width / 2,
      this.tank.height / 2,
      this.tank.width * this.health,
      15
    );
    this.lifeBar.lineStyle(2, 0xffffff);
    this.lifeBar.strokeRect(-this.tank.width / 2, this.tank.height / 2, this.tank.width, 15);
    this.lifeBar.setDepth(1);
  }

  public updateHealth(): void {
    if (this.health > 0) {
      this.health -= 0.05;
      this.redrawLifebar();
    } else {
      this.health = 0;
      this.active = false;
      this.scene.scene.pause();
      this.curosr.setVisible(false);
      if(this.scene.input.mouse.locked)
        this.scene.input.mouse.releasePointerLock();
      this.scene.scene.launch('GameOverScene');
    }
  }
}
