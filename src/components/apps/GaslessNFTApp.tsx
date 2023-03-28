import { ethers } from "ethers";
import NFTDropABI from "../../assets/abi/NFTDrop.json";
import {
  GelatoRelay,
  CallWithERC2771Request,
} from "@gelatonetwork/relay-sdk";
import StatusPoller from "../effects/StatusPoller";

import {
  useAddress,
  useContract,
  useChainId,
  useNFTs,
} from "@thirdweb-dev/react";
import { NFT, NFTDrop } from "@thirdweb-dev/sdk";

import { useEffect, useState } from "react";

// Make sure to deploy a target contract address for your NFT Drop using Thirdweb's dashboard!
const target = "";

const GaslessNFTApp = () => {
  const [initiated, setInitiated] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [txHash, setTxHash] = useState("");
  const [taskStatus, setTaskStatus] = useState("N/A");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  // misc state
  const [popup, setPopup] = useState(false);
  const [nextNFTUrl, setNextNFTUrl] = useState("");

  // third web blockchain hooks/data
  const address = useAddress();
  const chainId = useChainId();

  // contract object instantiate
  const { contract, isLoading } = useContract(target, "nft-drop");
  const { data: nfts, refetch } = useNFTs(contract, { start: 0, count: 20 });

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

    // relay request parameters
    const feeToken = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    const iface = new ethers.utils.Interface(NFTDropABI);
    const allowListProof = [
      [ethers.constants.HashZero],
      ethers.constants.MaxUint256,
      0,
      feeToken,
    ];
    const data = iface.encodeFunctionData("claim", [
      address,
      1,
      feeToken,
      0,
      allowListProof,
      ethers.constants.HashZero,
    ]);

    if (!chainId || !data) return;

    // INPUT SPONSOR API KEY HERE TO MAKE SURE THAT YOU CAN GET GOING!
    // HEAD OVER TO https://relay.gelato.network TO GET STARTED!
    const sponsorAPIkey = "tVkBUHGVkp_3_Snfs1ZHiupyEjoA_vrNOJNhLjlQAvA_";

    const request: CallWithERC2771Request = {
      chainId,
      target,
      data,
      user: address as string,
    };

    const relayResponse = await relay.sponsoredCallERC2771(
      request,
      provider,
      sponsorAPIkey
    );
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
  }, [taskId, taskStatus, startTime, endTime, refetch]);

  useEffect(() => {
    const getNextNFT = async (contract: NFTDrop, nfts: NFT[]) => {
      const claimedNFTCount = await contract.totalClaimedSupply();
      const nextNFTIndex = claimedNFTCount.toNumber();
      setNextNFTUrl(nfts[nextNFTIndex].metadata.image!);
    };

    getNextNFT(contract!, nfts!);

    console.log("nextNFTUrl: " + nextNFTUrl);
  }, [address, contract, nfts, nextNFTUrl]);

  return (
    <div className="flex flex-row justify-center mt-5 mr-8 ml-8">
      <div className="card w-96 bg-base-100 shadow-xl basis-1/5">
        <div className="card-body">
          <div className="flex flex-col">
            <h2 className="card-title">Gasless NFT Drop</h2>
          </div>
          {address && chainId === 137 ? (
            <div className="grid">
              <div className="mb-4 place-self-start">Next available NFT: </div>
              {isLoading ? (
                "Getting NFT data, please wait a moment..."
              ) : (
                <img
                  className="rounded-full"
                  src={nextNFTUrl}
                  alt="Gasless NFT"
                />
              )}
            </div>
          ) : (
            <p className="pt-2"></p>
          )}
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
              className="btn btn-primary mt-2"
              disabled={!(address && chainId === 137)}
              onClick={sendRelayRequest}
            >
              {initiated && taskStatus !== "ExecSuccess"
                ? "Gelato go brr"
                : "Claim NFT"}
            </button>
          </div>
        </div>
      </div>
      <StatusPoller
        title="NFT"
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

export default GaslessNFTApp;
