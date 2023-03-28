import React from "react";
import CounterRelayApp from "./apps/CounterRelayApp";
import GaslessNFTApp from "./apps/GaslessNFTApp";

const AppContainer = () => {
  return (
    <div>
      <CounterRelayApp />
      <GaslessNFTApp />
    </div>
  );
};

export default AppContainer;
