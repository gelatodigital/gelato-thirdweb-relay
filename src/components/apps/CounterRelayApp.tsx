import React from "react";
import { ethers } from "ethers";
import counterABI from "../../assets/abi/SimpleCounter.json";
import { GelatoRelay, CallWithSyncFeeRequest } from "@gelatonetwork/relay-sdk";

import StatusPoller from "../effects/StatusPoller";

import {
  useAddress,
  useContract,
  useContractRead,
  useChainId,
} from "@thirdweb-dev/react";

import { useEffect, useState } from "react";

const target = "0x730615186326cF8f03E34a2B49ed0f43A38c0603";

const CounterRelayApp = () => {
  // task state
  const [initiated, setInitiated] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [taskStatus, setTaskStatus] = useState("N/A");
  const [txHash, setTxHash] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  // misc state
  const [popup, setPopup] = useState(false);

  // third web blockchain hooks/data
  const address = useAddress();
  const chainId = useChainId();
  const { contract, isLoading } = useContract(target, counterABI.abi);
  const { data: counterValue, refetch } = useContractRead(contract, "counter");

  const sendRelayRequest = async () => {
    // update state
    setInitiated(true);
    setPopup(false);
    setTaskId("");
    setTxHash("");
    setStartTime(0);
    setTaskStatus("Loading...");

    // instantiating Gelato Relay SDK
    const relay = new GelatoRelay();

    // connecting to contract through front-end provider
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(target, counterABI.abi, signer);

    // relay request parameters
    const feeToken = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    const { data } = await contract.populateTransaction.increment();

    if (!chainId || !data) return;

    const request: CallWithSyncFeeRequest = {
      chainId,
      target,
      data,
      feeToken,
      isRelayContext: true,
    };

    const relayResponse = await relay.callWithSyncFee(request);
    setTaskId(relayResponse.taskId);
    setStartTime(Date.now());
  };

  useEffect(() => {
    let statusQuery: NodeJS.Timer;
    let popupTimer: NodeJS.Timer;
    if (taskId === "") return;

    const getTaskState = async (getTxHash = false) => {
      try {
        const url = `https://relay.gelato.digital/tasks/status/${taskId}`;
        const response = await fetch(url);
        const responseJson = await response.json();
        setTaskStatus(responseJson.task.taskState);
        if (getTxHash) {
          setTxHash(responseJson.task.transactionHash);
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (taskStatus !== "ExecSuccess") {
      statusQuery = setInterval(() => {
        getTaskState();
      }, 1500);
    } else {
      getTaskState(true);
      setEndTime(Date.now() - startTime);
      setPopup(true);
      setInitiated(false);
    }

    popupTimer = setTimeout(() => {
      setPopup(false);
      refetch();
    }, 3000);

    return () => {
      clearInterval(statusQuery);
      clearTimeout(popupTimer);
    };
  }, [taskId, taskStatus, startTime, endTime]);

  return (
    <div className="flex flex-row justify-center mt-5 mr-8 ml-8">
      <div className="card w-96 bg-base-100 shadow-xl basis-1/5">
        <div className="card-body">
          <div className="flex flex-col">
            <h2 className="card-title">Gasless Counter</h2>
          </div>
          <div className="mb-4 self-start">
            Current Counter Value:{" "}
            <a
              href={`https://polygonscan.com/address/${target}#readProxyContract`}
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              {" "}
              {isLoading ? "Loading..." : counterValue?.toNumber()}{" "}
            </a>
          </div>
          <div>
            <p>
              {" "}
              <b>
                {" "}
                {address && chainId === 137
                  ? ""
                  : "Connect your wallet to Polygon to begin"}{" "}
              </b>{" "}
            </p>
          </div>
          <div className="card-actions justify-center">
            <button
              className="btn btn-primary"
              disabled={!(address && chainId === 137)}
              onClick={sendRelayRequest}
            >
              {initiated && taskStatus !== "ExecSuccess"
                ? "Gelato go brr"
                : "Increment"}
            </button>
          </div>
        </div>
      </div>
      <StatusPoller
        title="Counter"
        isLoading={isLoading}
        taskId={taskId}
        taskStatus={taskStatus}
        initiated={initiated}
        endTime={endTime}
        txHash={txHash}
        popup={popup}
      />
    </div>
  );
};

export default CounterRelayApp;
