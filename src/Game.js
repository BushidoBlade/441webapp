BasicGame.Game = function (game) {

  // When a State is added to Phaser it automatically has the
  // following properties set on it, even if they already exist:

  this.game;       //  a reference to the currently running game
  this.add;        //  used to add sprites, text, groups, etc
  this.camera;     //  a reference to the game camera
  this.cache;      //  the game cache
  this.input;      //  the global input manager (you can access
                   //  this.input.keyboard, this.input.mouse, as well
                   //  from it)
  this.load;       //  for preloading assets
  this.math;       //  lots of useful common math operations
  this.sound;      //  the sound manager - add a sound, play one,
                   //  set-up markers, etc
  this.stage;      //  the game stage
  this.time;       //  the clock
  this.tweens;     //  the tween manager
  this.world;      //  the game world
  this.particles;  //  the particle manager
  this.physics;    //  the physics manager
  this.rnd;        //  the repeatable random number generator

 //  You can use any of these from any function within this State.
 //  But do consider them as being 'reserved words', i.e. don't create
 //  a property for your own game called "world" or you'll over-write
 //  the world reference.

  this.player;
  this.aliens;
  this.bullets;
  this.bulletTime = 0;
  this.cursors;
  this.enemybullets;
  this.fireButton;
  this.explosions;
  this.starfield;
  this.score = 0;
  this.scoreString = '';
  this.scoreText;
  this.lives;
  this.enemyBullet;
  this.firingTimer = 0;
  this.stateText;
  this.livingEnemies = [];
  this.tween;

  // audio variables
  this.backgroundmusic;
  this.bulletsound;
  this.lasersound;
  this.playerlosesound;
  this.playerwinsound;
  this.playerbadaboom;
  this.enemybadaboom;
  this.enemydeathsound;

  this.autofire = false;

  // these variables allow for increasing difficulty
  this.alientweenspeed = 0;
  this.aliendescendspeed = 0;

  // screen bounds for dragging
  this.screenbounds;

  // screen bounds for keyboard
  this.playerxbounds_left = false;
  this.playerxbounds_right = false;
  this.playerybounds_upper = false;
  this.playerybounds_lower = false;

  // control variable for offscreen enemy check
  this.offscreenEnemiesCheck = true;

};



BasicGame.Game.prototype = {

  create: function () {

    this.physics.startSystem(Phaser.Physics.ARCADE);

    //  The scrolling starfield background
    this.starfield = this.add.tileSprite(0, 0, 800, 600, 'starfield');

    //  Our bullet group
    this.bullets = this.add.group();
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.bullets.createMultiple(30, 'bullet');
    this.bullets.setAll('anchor.x', 0.5);
    this.bullets.setAll('anchor.y', 1);
    this.bullets.setAll('outOfBoundsKill', true);
    this.bullets.setAll('checkWorldBounds', true);

    // The enemy's bullets
    this.enemybullets = this.add.group();
    this.enemybullets.enableBody = true;
    this.enemybullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemybullets.createMultiple(30, 'enemyBullet');
    this.enemybullets.setAll('anchor.x', 0.5);
    this.enemybullets.setAll('anchor.y', 1);
    this.enemybullets.setAll('outOfBoundsKill', true);
    this.enemybullets.setAll('checkWorldBounds', true);

    //  The hero!
    this.player = this.add.sprite(400, 500, 'ship');
    this.player.anchor.setTo(0.5, 0.5);
    this.physics.enable(this.player, Phaser.Physics.ARCADE);
    this.player.inputEnabled = true;
    this.player.input.enableDrag();
    this.screenbounds = new Phaser.Rectangle(20, 20, this.game.width-8, this.game.height-8);
    this.player.input.boundsRect = this.screenbounds;
    this.player.events.onDragStart.add(this.onDragStart, this);
    this.player.events.onDragStop.add(this.onDragStop, this);

    //  The baddies!
    this.aliens = this.add.group();
    this.aliens.enableBody = true;
    this.aliens.physicsBodyType = Phaser.Physics.ARCADE;
    this.createaliens();
    this.aliens.setAll('outOfBoundsKill', true);
    this.aliens.setAll('checkWorldBounds', true);

    //  The this.score
    this.scoreString = 'score : ';
    this.scoreText = this.add.text(10, 10, this.scoreString + this.score, { font: '34px Arial', fill: '#fff' });

    //  this.lives
    this.lives = this.add.group();
    this.add.text(this.world.width - 100, 10, 'lives : ', { font: '34px Arial', fill: '#fff' });

    for (var i = 0; i < 3; i++) 
    {
      var ship = this.lives.create(this.world.width - 100 + (30 * i), 60, 'ship');
      ship.anchor.setTo(0.5, 0.5);
      ship.angle = 90;
      ship.alpha = 0.4;
    }

    //  Text
    this.stateText = this.add.text(this.world.centerX,this.world.centerY,' ', { font: '84px Arial', fill: '#fff' });
    this.stateText.anchor.setTo(0.5, 0.5);
    this.stateText.visible = false;

    //  An explosion pool
    this.explosions = this.add.group();
    this.explosions.createMultiple(30, 'kaboom');
    this.explosions.forEach(this.setupInvader, this);

    //  And some controls to play the game with
    this.cursors = this.input.keyboard.createCursorKeys();
    this.fireButton = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    // Fullscreen button anchored to lower right of screen
    var fullscreen =  this.add.button(this.game.width-8, this.game.height-8,
                                      'fullscreen',
                                      BasicGame.toggleFullscreen,
                                      this,
                                      'over', 'up', 'down');
    fullscreen.pivot.x = fullscreen.width;
    fullscreen.pivot.y = fullscreen.height;

    // background music
    this.backgroundmusic = this.add.audio('music');
    this.backgroundmusic.play('', 0, 0.2, true);

    // sound effects
    this.bulletsound = this.add.audio('enemyfireaudio', 0.2);
    this.lasersound = this.add.audio('playerfireaudio', 0.1);
    this.playerlosesound = this.add.audio('playerdeathaudio', 0.4);
    this.playerwinsound = this.add.audio('victorysound', 0.4);
    this.playerbadaboom = this.add.audio('playerexplosionaudio', 0.3);
    this.enemybadaboom = this.add.audio('enemyexplosionaudio', 0.1);

  },

  createaliens: function () {

    for (var y = 0; y < 4; y++)
    {
      for (var x = 0; x < 10; x++)
      {
        var alien = this.aliens.create(x * 48, y * 50, 'invader');
        alien.anchor.setTo(0.5, 0.5);
        alien.animations.add('fly', [ 0, 1, 2, 3 ], 20, true);
        alien.play('fly');
        alien.body.moves = false;
      }
    }

    this.aliens.x = 100;
    this.aliens.y = 50;

    //  All this does is basically start the invaders moving. Notice we're moving the Group they belong to, rather than the invaders directly.
    this.tween = this.add.tween(this.aliens).to( { x: 200 }, 2000 + this.alientweenspeed, Phaser.Easing.Linear.None, true, 0, 1000, true);

    //  When the tween loops it calls descend
    this.tween.onLoop.add(this.descend, this);

  },

  setupInvader: function (invader) {

    invader.anchor.x = 0.5;
    invader.anchor.y = 0.5;
    invader.animations.add('kaboom');

  },

  descend: function () {

    this.aliens.y += 10 + this.aliendescendspeed;

  },

  update: function () {

    //  Scroll the background
    this.starfield.tilePosition.y += 2;

    if (this.player.alive)
    {

      //  Reset the player, then check for movement keys
      this.player.body.velocity.setTo(0, 0);

      this.checkplayerbounds();

      if (this.cursors.left.isDown && this.playerxbounds_left)
      {
        this.player.body.velocity.x = -200;
      }
      else if (this.cursors.right.isDown && this.playerxbounds_right)
      {
        this.player.body.velocity.x = 200;
      }

      if (this.cursors.up.isDown && this.playerybounds_upper)
      {
        this.player.body.velocity.y = -200;
      }
      else if (this.cursors.down.isDown && this.playerybounds_lower)
      {
        this.player.body.velocity.y = 200;
      }

      //  Firing?
      if (this.fireButton.isDown || this.autofire)
      {
        this.fireBullet();
      }

      if (this.time.now > this.firingTimer)
      {
        this.enemyFires();
      }

      //  Run collision
      this.physics.arcade.overlap(this.bullets, this.aliens, this.collisionHandler, null, this);
      this.physics.arcade.overlap(this.enemybullets, this.player, this.enemyHitsplayer, null, this);
      this.physics.arcade.overlap(this.aliens, this.player, this.enemyCollideplayer, null, this);
      
    }
      // see if all enemies offscreen
      if (this.offscreenEnemiesCheck)
        this.checkenemybounds();

  },

  checkplayerbounds: function () {

    // keeps the player in the game world

    if(this.player.x <= 20)
      this.playerxbounds_left = false;
    else
      this.playerxbounds_left = true;

    if(this.player.x >= this.game.width-20)
      this.playerxbounds_right = false;
    else
      this.playerxbounds_right = true;

    if(this.player.y <= 20)
      this.playerybounds_upper = false;
    else
      this.playerybounds_upper = true;

    if(this.player.y >= this.game.height-20)
      this.playerybounds_lower = false;
    else 
      this.playerybounds_lower = true;

  },

  checkenemybounds: function () {

    // if all enemies offscreen before player kills them, player loses

    if (this.aliens.countLiving() == 0)
    {
      this.player.kill();
      this.enemybullets.callAll('kill');
      
      this.playerlosesound.play();

      this.stateText.text=" GAME OVER \n Click to restart";
      this.stateText.visible = true;

      // stop futher offscreen checks
      this.offscreenEnemiesCheck = false;

      //  The "click to restart" handler
      this.input.onTap.addOnce(this.restart,this);
    }
    
  },

  onDragStart: function (player, pointer) {

    this.autofire = true;

  },

  onDragStop: function (player, pointer) {

    this.autofire = false;

  },

  enemyCollideplayer: function (player, alien) {

    //  Kill the alien the this.player collided with
    alien.kill();

    //  Create explosion
    var explosion = this.explosions.getFirstExists(false);
    explosion.reset(this.player.body.x, this.player.body.y);
    explosion.play('kaboom', 30, false, true);

    // play explosions for enemy and player
    this.enemybadaboom.play();
    this.playerbadaboom.play();

    //  Reduce player lives by 1
    live = this.lives.getFirstAlive();

    if (live)
    {
      live.kill();
    }

    //  If this collision killed the player
    if (this.lives.countLiving() < 1)
    {
      this.player.kill();
      this.enemybullets.callAll('kill');

      this.playerlosesound.play();
      
      this.stateText.text=" GAME OVER \n Click to restart";
      this.stateText.visible = true;

      // stop futher offscreen checks
      this.offscreenEnemiesCheck = false;

      //  The "click to restart" handler
      this.input.onTap.addOnce(this.restart,this);
    }

    // if this collision killed the last enemy
    if (this.aliens.countLiving() == 0)
    {
      this.score += 1000;
      this.scoreText.text = this.scoreString + this.score;

      //  fix for persisting bullets
      this.enemybullets.callAll('kill');
      
      this.stateText.text = " You Won, \n Click to restart";
      this.stateText.visible = true;

      this.playerwinsound.play();

      // make the aliens faster
      this.alientweenspeed -= 200;
      this.aliendescendspeed += 5;

      // stop futher offscreen checks
      this.offscreenEnemiesCheck = false;

      //  The "click to restart" handler
      this.input.onTap.addOnce(this.restart,this);

    }
	
  },

  collisionHandler: function (bullet, alien) {

    //  When a bullet hits an alien we kill them both
    bullet.kill();
    alien.kill();

    //  Increase the this.score
    this.score += 20;
    this.scoreText.text = this.scoreString + this.score;

    //  And create an explosion :)
    var explosion = this.explosions.getFirstExists(false);
    explosion.reset(alien.body.x, alien.body.y);
    explosion.play('kaboom', 30, false, true);
    this.enemybadaboom.play();

    if (this.aliens.countLiving() == 0)
    {
      this.score += 1000;
      this.scoreText.text = this.scoreString + this.score;

      //  fix for persisting bullets
      this.enemybullets.callAll('kill');
      
      this.stateText.text = " You Won, \n Click to restart";
      this.stateText.visible = true;
      this.playerwinsound.play();

      // make the aliens faster
      this.alientweenspeed -= 200;
      this.aliendescendspeed += 5;

      this.offscreenEnemiesCheck = false;

      //  The "click to restart" handler
      this.input.onTap.addOnce(this.restart,this);

    }

  },

  enemyHitsplayer: function (player,bullet) {
    
    bullet.kill();

    live = this.lives.getFirstAlive();

    if (live)
    {
      live.kill();
    }

    //  And create an explosion :)
    var explosion = this.explosions.getFirstExists(false);
    explosion.reset(this.player.body.x, this.player.body.y);
    explosion.play('kaboom', 30, false, true);
    this.playerbadaboom.play();

    // When the this.player dies
    if (this.lives.countLiving() < 1)
    {
      this.player.kill();
      this.enemybullets.callAll('kill');
      
      this.playerlosesound.play();

      this.stateText.text=" GAME OVER \n Click to restart";
      this.stateText.visible = true;

      // stop futher offscreen checks
      this.offscreenEnemiesCheck = false;

      //  The "click to restart" handler
      this.input.onTap.addOnce(this.restart,this);
    }

  },

  enemyFires: function () {

    //  Grab the first bullet we can from the pool
    this.enemyBullet = this.enemybullets.getFirstExists(false);

    this.livingEnemies.length=0;

    this.aliens.forEachAlive(function(alien){

      //  Put every living enemy in an array
      this.livingEnemies.push(alien);
    }, this);


    if (this.enemyBullet && this.livingEnemies.length > 0)
    {
        
      var random=this.rnd.integerInRange(0,this.livingEnemies.length-1);

      //  Randomly select one of them
      var shooter=this.livingEnemies[random];
      //  And fire the bullet from this enemy
      this.enemyBullet.reset(shooter.body.x, shooter.body.y);
      this.bulletsound.play();
      this.physics.arcade.moveToObject(this.enemyBullet,this.player,120);
      this.firingTimer = this.time.now + 2000;
    }

  },

  fireBullet: function () {

    //  To avoid them being allowed to fire too fast we set a time limit
    if (this.time.now > this.bulletTime)
    {
      //  Grab the first bullet we can from the pool
      bullet = this.bullets.getFirstExists(false);

      if (bullet)
      {
        //  And fire it
        bullet.reset(this.player.x, this.player.y + 8);
        bullet.body.velocity.y = -400;
        this.bulletTime = this.time.now + 200;
        this.lasersound.play();
      }
    }

  },

  resetBullet: function (bullet) {

    //  Called if the bullet goes out of the screen
    bullet.kill();

  },

  restart: function () {

    //  A new level starts
    
    //  Resets the life count
    this.lives.callAll('revive');

    // this fixes a bug with onLoop where aliens descend mid-tween on successive restarts
    this.tween.stop();

    // fixes persisting player bullets
    this.bullets.callAll('kill');

 
    // resets player position and sets alive, exists, visible and renderable all to true
    this.player.reset(400, 500);

    //  And brings the this.aliens back from the dead :)
    this.aliens.removeAll();
    this.createaliens();
    this.aliens.setAll('outOfBoundsKill', true);
    this.aliens.setAll('checkWorldBounds', true);

    // reset control variable
    this.offscreenEnemiesCheck = true;

    //  Hides the text
    this.stateText.visible = false;

  },

  quitGame: function (pointer) {

    this.state.start('MainMenu');
  }

};
