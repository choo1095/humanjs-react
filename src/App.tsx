import React, { useState } from "react";
// import InitWebCam from "./components/InitWebcam";
// import RunHuman from "./components/RunHuman";
import WebcamComponent from "./components/WebcamComponent";
import IdleState from "./components/IdleState";

const App: React.FC = () => {
  const [personDetected, setPersonDetected] = useState(false);

  return (
    <div className="relative min-h-screen">
      <WebcamComponent
        onPersonDetected={() => {
          console.log("Person detected!");
          setPersonDetected(true);
        }}
        onPersonExit={() => {
          console.log("No person detected for 5 seconds, resuming...");
          setPersonDetected(false);
        }}
      />

      <div
        id="performance"
        className="absolute bottom-0 w-full p-2 text-sm font-mono"
      />

      {!personDetected ? <IdleState></IdleState> : <></>}
    </div>
  );
};

export default App;
