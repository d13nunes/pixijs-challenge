import { setEngine } from "./app/getEngine";
import { LoadScreen } from "./app/screens/LoadScreen";
import { MainScreen } from "./app/screens/main/MainScreen";
// import { MainScreen } from "./app/screens/main/MainScreen";
import { FPSCounter } from "./app/ui/FPSCounter";
// import { MagicWordsScreen } from "./app/screens/magicwords/MagicWordsScreen";
import { userSettings } from "./app/utils/userSettings";
import { CreationEngine } from "./engine/engine";

/**
 * Importing these modules will automatically register there plugins with the engine.
 */
import "@pixi/sound";
// import "@esotericsoftware/spine-pixi-v8";

// Create a new creation engine instance
const engine = new CreationEngine();
setEngine(engine);

(async () => {
  // Initialize the creation engine instance
  await engine.init({
    background: "#1E1E1E",
    resizeTo: document.getElementById("pixi-container") as HTMLElement,
    resizeOptions: { minWidth: 300, minHeight: 500, letterbox: false },
    antialias: true,
    resolution: window.devicePixelRatio || 2,
    autoDensity: true,
  });

  // Initialize the user settings
  userSettings.init();

  // Show the load screen
  await engine.navigation.showScreen(LoadScreen);
  // Show the main screen once the load screen is dismissed
  await engine.navigation.showScreen(MainScreen);

  // Add FPS counter
  const fpsCounter = new FPSCounter();
  engine.stage.addChild(fpsCounter);
  engine.ticker.add(fpsCounter.update, fpsCounter);
})();
