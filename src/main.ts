import './style.css';
import { Colors, Config } from './config';
import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { Game } from './scenes/Game';
import { CutScene } from './scenes/CutScene';
import { GameOver } from './scenes/GameOver';
import 'phaser/plugins/spine4.1/dist/SpinePlugin';

const config = {
  type: Phaser.WEBGL,
  width: Config.screen.width,
  height: Config.screen.height,
  parent: 'game-container',
  backgroundColor: Colors.BACKGROUND,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: Config.screen.width,
    height: Config.screen.height,
    zoom: 1 / Config.DPR,
  },
  scene: [
    Boot,
    Preloader,
    MainMenu,
    Game,
    CutScene,
    GameOver
  ],
  plugins: {
    scene: [
      { key: 'SpinePlugin', plugin: window.SpinePlugin, mapping: 'spine' }
    ]
  }
};

declare var FontFaceObserver: any;

const paroliObserver = new FontFaceObserver('paroli');
const dovetailObserver = new FontFaceObserver('dovetail-mvb');

Promise.all([
  paroliObserver.load(),
  dovetailObserver.load(),
]).then(() => {
  // console.log('All font loaded');
  new Phaser.Game(config);
}, () => {
  // console.log('Some fonts not loaded');
  new Phaser.Game(config);
});
