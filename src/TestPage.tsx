import { useCallback, useEffect, useState } from "react";
import { BigNumber, ethers } from "ethers";
import Button from "@mui/material/Button";
import React from "react";
import { Stack } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import Backdrop from "@mui/material/Backdrop";
import { testConfig, releaseConfig } from "./config";
import USDToken from "./artifacts/contracts/USD.sol/USDToken.json";
// import RandomNumberGenerator.sol from './artifacts/contracts/RandomNumberGenerator.sol.sol/RandomNumberGenerator.sol.json'
import Lotto666 from "./artifacts/contracts/Lotto.sol/Lotto666.json";
import LotterySelector from "./LotterySelector";

const config = import.meta.env.VITE_ENV === "dev" ? testConfig : releaseConfig;
// console.log(import.meta.env.VITE_ENV);

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// We need to support for input a random value.
const randomBytes = ethers.utils.randomBytes(32);

function TestPage() {
  const ethereum = (window as any).ethereum;
  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const [errorToast, setErrorToast] = React.useState("");
  const [lotteryStatus, setLotteryStatus] = useState<String[]>([]);
  const [supportedNetwork, setSupportedNetwork] = useState<Boolean | undefined>(
    undefined
  );
  const [ticketsList, setTicketsList] = useState<String[]>([]);
  const [connectedAccount, setConnectedAccount] = useState<String | undefined>(
    undefined
  );

  const [usdBalance, setUsdBalance] = useState<Number>(0);
  const [decimal, setDecimal] = useState<ethers.BigNumber | undefined>(
    undefined
  );

  const handleAccountsChanged = useCallback(
    (accounts: any) => {
      if (accounts.length === 0) {
        // MetaMask is locked or the user has not connected any accounts
        console.log("Please connect to MetaMask.");
        setConnectedAccount(undefined);
      } else if (accounts[0] !== connectedAccount) {
        setConnectedAccount(accounts[0]);
      }
    },
    [setConnectedAccount]
  );

  useEffect(() => {
    async function checkNetwork() {
      if (typeof ethereum !== "undefined") {
        await ethereum.enable();
        setSupportedNetwork(true);
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts.length > 0) {
          const account = accounts[0];
          console.log(account);
          setConnectedAccount(account);
        } else {
          setConnectedAccount(undefined);
        }
        ethereum.on("accountsChanged", handleAccountsChanged);
      } else {
        setSupportedNetwork(false);
      }
    }
    checkNetwork();

    return () => {
      if (typeof ethereum !== "undefined") {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  async function requestBalance() {
    if (typeof ethereum !== "undefined") {
      try {
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          config.USD_TOKEN_ADDRESS,
          USDToken.abi,
          signer
        );
        // console.log(connectedAccount);
        const balance = await contract.balanceOf(connectedAccount);
        if (decimal === undefined) {
          const _decimal = await contract.decimals();
          setDecimal(_decimal);
          const usdBalance = ethers.utils.formatUnits(balance, _decimal);
          setUsdBalance(Number(usdBalance));
        } else {
          const usdBalance = ethers.utils.formatUnits(balance, decimal);
          setUsdBalance(Number(usdBalance));
        }

        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.log("Error: ", error);
        const msg = error.message;
        setErrorToast(msg);
      }
    }
  }

  useEffect(() => {
    if (typeof ethereum !== "undefined" && connectedAccount) {
      requestBalance();
    }
  }, [connectedAccount]);

  async function connectMetaMask() {
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    handleAccountsChanged(accounts);
  }

  async function checkLotteryStatus() {
    if (typeof ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.LOTTO666_ADDRESS,
        Lotto666.abi,
        signer
      );
      const usdContract = new ethers.Contract(
        config.USD_TOKEN_ADDRESS,
        USDToken.abi,
        signer
      );
      try {
        setLoading(true);
        setLotteryStatus([]);
        const list: string[] = [];
        const status = await contract.status();
        // console.log("Status: ", status.toString());
        list.push("Status: " + status.toString());
        const startTime = await contract.startTime();
        // console.log("Start Time: ", startTime.toString());
        list.push("Start Time: " + startTime.toString());
        const endTime = await contract.endTime();
        // console.log("End Time: ", endTime.toString());
        list.push("End Time: " + endTime.toString());
        const endRewardTime = await contract.endRewardTime();
        // console.log("End Reward Time: ", endRewardTime.toString());
        list.push("End Reward Time: " + endRewardTime.toString());
        const rewardsBreakdown = await contract.viewRewardsBreakdown();
        // console.log("Rewards Breakdown: ", rewardsBreakdown.toString());
        list.push("Rewards Breakdown: " + rewardsBreakdown.toString());
        const ticketPrice = await contract.ticketPrice();
        // console.log("Ticket Price: ", ticketPrice.toString());
        const ticketPriceInUSD = ethers.utils.formatUnits(ticketPrice, decimal);
        list.push("Ticket Price: " + ticketPriceInUSD.toString());
        const treasuryFee = await contract.treasuryFee();
        // console.log("Treasury Fee: ", treasuryFee.toString());
        list.push("Treasury Fee: " + treasuryFee.toString());
        const jackpotAmount = await contract.jackpotAmount();
        const jackpotAmountInUSD = ethers.utils.formatUnits(
          jackpotAmount,
          decimal
        );
        list.push("Accumulated Jackpot: " + jackpotAmountInUSD.toString());

        const balanceOfLotto = await usdContract.balanceOf(
          config.LOTTO666_ADDRESS
        );
        const prizePool = balanceOfLotto.sub(jackpotAmount);
        const prizePoolInUSD = ethers.utils.formatUnits(prizePool, decimal);
        list.push("PrizePool : " + prizePoolInUSD.toString());

        const currentTicketId = await contract.currentTicketId();
        // console.log("Current Ticket Id: ", currentTicketId.toString());
        list.push("Current Ticket Id: " + currentTicketId.toString());

        if (status == "3") {
          // get the winning ticket number
          const viewResult = await contract.viewResult();
          //   console.log("viewResult: ", viewResult.toString());
          list.push("Jackpot ticket number: " + viewResult.toString());
        }

        setLotteryStatus(list);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.log("Error: ", error);
        const msg = error.message;
        setErrorToast(msg);
      }
    }
  }

  async function approveUSD() {
    if (ethereum === undefined) {
      return;
    }
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.USD_TOKEN_ADDRESS,
        USDToken.abi,
        signer
      );
      const transaction = await contract.approve(
        config.LOTTO666_ADDRESS,
        ethers.constants.MaxUint256
      );
      await transaction.wait();
      setToast("Approved Success");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error: ", error);
      const msg = error.message;
      setErrorToast(msg);
    }
  }
  async function buyTickets() {
    setAutoPickCount(0);
    setPickDialogOpen(true);
  }

  async function getRandomTicketNumber() {
    if (ethereum === undefined) {
      return;
    }
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.LOTTO666_ADDRESS,
        Lotto666.abi,
        signer
      );
      const randomValue = ethers.BigNumber.from(ethers.utils.randomBytes(32));
      const ticketNumber = await contract.getRandomTicketNumber(randomValue);
      //   console.log("Ticket Number: ", ticketNumber.toString());
      const ticketNumber666 = await contract.viewTicketNumber(ticketNumber);
      console.log("Ticket Number 666: ", ticketNumber666.toString());
      setLoading(false);
      setToast("Ticket Number: " + ticketNumber666.toString());
    } catch (error) {
      setLoading(false);
      console.log("Error: ", error);
      const msg = error.message;
      setErrorToast(msg);
    }
  }

  const generateRandomLottery = async () => {
    if (ethereum === undefined) {
      return "";
    }
    try {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.LOTTO666_ADDRESS,
        Lotto666.abi,
        signer
      );
      const randomValue = ethers.BigNumber.from(ethers.utils.randomBytes(32));
      const ticketNumber = await contract.getRandomTicketNumber(randomValue);
      //   console.log("Ticket Number: ", ticketNumber.toString());
      const ticketNumber666 = await contract.viewTicketNumber(ticketNumber);
      // console.log("Ticket Number 666: ", ticketNumber666.toString());
      // setToast("Ticket Number: " + ticketNumber666.toString());
      return ticketNumber666.toString();
    } catch (error) {
      console.log("Error: ", error);
      const msg = error.message;
      setErrorToast(msg);
    }
    return "";
  };

  async function buyARandomTicket() {
    if (ethereum === undefined) {
      return;
    }
    setAutoPickCount(1);
    setPickDialogOpen(true);
  }

  async function buyTenRandomTickets() {
    if (ethereum === undefined) {
      return;
    }
    setAutoPickCount(10);
    setPickDialogOpen(true);
  }

  async function viewOwnedTickets() {
    if (ethereum === undefined || connectedAccount === undefined) {
      return;
    }
    try {
      setLoading(true);
      setTicketsList([]);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.LOTTO666_ADDRESS,
        Lotto666.abi,
        signer
      );
      const ticketIDList = await contract.viewTicketsOfAddress(
        connectedAccount
      );
      console.log("Ticket ID List: ", ticketIDList.toString());
      const list: string[] = [];
      for (let i = 0; i < ticketIDList.length; i++) {
        const ticketNumber666 = await contract.viewTicket(ticketIDList[i]);
        console.log(
          `ticket id ${ticketIDList[
            i
          ].toString()} : ${ticketNumber666[0].toString()}`
        );
        list.push(ticketNumber666[0].toString());
      }
      setToast("Fetch Success. Count: " + list.length);
      setTicketsList(list);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error: ", error);
      const msg = error.message;
      setErrorToast(msg);
    }
  }

  async function checkClaimable() {
    if (ethereum === undefined || connectedAccount === undefined) {
      return;
    }
    try {
      setLoading(true);
      setTicketsList([]);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.LOTTO666_ADDRESS,
        Lotto666.abi,
        signer
      );
      const ticketIDList = await contract.viewClaimableTicketsOfAddress(
        connectedAccount
      );
      console.log("Ticket ID List: ", ticketIDList.toString());
      const list: string[] = [];
      for (let i = 0; i < ticketIDList.length; i++) {
        const ticketInfo = await contract.viewTicket(ticketIDList[i]);
        console.log(
          `ticket id ${ticketIDList[
            i
          ].toString()} : ${ticketInfo[0].toString()}`
        );
        list.push(
          `${ticketInfo[0].toString()} match ${1 + ticketInfo[1]} numbers`
        );
      }

      const reward = await contract.viewMyRewardsAmount();
      const rewardInUSD = ethers.utils.formatUnits(reward, decimal);
      list.push(`My reward: ${rewardInUSD.toString()} USD`);

      setTicketsList(list);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error: ", error);
      const msg = error.message;
      setErrorToast(msg);
    }
  }

  async function claimTickets() {
    if (ethereum === undefined) {
      return;
    }
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.LOTTO666_ADDRESS,
        Lotto666.abi,
        signer
      );
      const ticketIDList = await contract.viewClaimableTicketsOfAddress(
        connectedAccount
      );
      console.log("Ticket ID List: ", ticketIDList.toString());
      const transaction = await contract.claimTickets(ticketIDList);
      await transaction.wait();
      setToast("claimTickets Success! ");
      console.log("gas used: ", transaction.gasLimit.toString());
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error: ", error);
      const msg = error.message;
      setErrorToast(msg);
    }
  }
  async function resetForNewLottery() {
    if (ethereum === undefined) {
      return;
    }
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.LOTTO666_ADDRESS,
        Lotto666.abi,
        signer
      );

      const currentBlock = await provider.getBlockNumber();
      const blockTimestamp = (await provider.getBlock(currentBlock)).timestamp;
      console.log(blockTimestamp);

      const transaction = await contract.resetForNewLottery(
        blockTimestamp + 3600,
        0
      );
      await transaction.wait();

      setToast("Reset Lottery Success");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error: ", error);
      const msg = error.message;
      setErrorToast(msg);
    }
  }
  async function startLottery() {
    if (ethereum === undefined) {
      return;
    }
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.LOTTO666_ADDRESS,
        Lotto666.abi,
        signer
      );

      const transaction = await contract.startLottery();
      await transaction.wait();

      setToast("Success");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error: ", error);
      const msg = error.message;
      setErrorToast(msg);
    }
  }
  async function closeLottery() {
    if (ethereum === undefined) {
      return;
    }
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.LOTTO666_ADDRESS,
        Lotto666.abi,
        signer
      );

      const transaction = await contract.closeLottery();
      await transaction.wait();

      setToast("Success");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error: ", error);
      const msg = error.message;
      setErrorToast(msg);
    }
  }
  async function requestRandomness() {
    if (ethereum === undefined) {
      return;
    }
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.LOTTO666_ADDRESS,
        Lotto666.abi,
        signer
      );

      const randomHash = ethers.BigNumber.from(
        ethers.utils.keccak256(randomBytes)
      );
      const transaction = await contract.requestRandomness(randomHash);
      await transaction.wait();
      setToast("requestRandomness Success! ");
      console.log("gas used: ", transaction.gasLimit.toString());
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error: ", error);
      const msg = error.message;
      setErrorToast(msg);
    }
  }
  async function revealRandomness() {
    if (ethereum === undefined) {
      return;
    }
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.LOTTO666_ADDRESS,
        Lotto666.abi,
        signer
      );

      // console.log("randomBytes: ", randomBytes);
      const randomSeed = ethers.BigNumber.from(randomBytes);
      const transaction = await contract.revealRandomness(randomSeed);
      await transaction.wait();
      setToast("Draw lottery Success! ");
      console.log("gas used: ", transaction.gasLimit.toString());
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error: ", error);
      const msg = error.message;
      setErrorToast(msg);
    }
  }
  async function changeStartTime() {
    if (ethereum === undefined) {
      return;
    }
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.LOTTO666_ADDRESS,
        Lotto666.abi,
        signer
      );

      const currentBlock = await provider.getBlockNumber();
      const blockTimestamp = (await provider.getBlock(currentBlock)).timestamp;

      const transaction = await contract.setStartTime(blockTimestamp);
      await transaction.wait();

      setToast("Set Success");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error: ", error);
      const msg = error.message;
      setErrorToast(msg);
    }
  }
  async function changeEndTime() {
    if (ethereum === undefined) {
      return;
    }
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.LOTTO666_ADDRESS,
        Lotto666.abi,
        signer
      );

      const currentBlock = await provider.getBlockNumber();
      const blockTimestamp = (await provider.getBlock(currentBlock)).timestamp;

      const transaction = await contract.setEndTime(blockTimestamp);
      await transaction.wait();

      setToast("Set Success");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error: ", error);
      const msg = error.message;
      setErrorToast(msg);
    }
  }
  async function changeRewardTime() {
    if (ethereum === undefined) {
      return;
    }
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.LOTTO666_ADDRESS,
        Lotto666.abi,
        signer
      );

      const currentBlock = await provider.getBlockNumber();
      const blockTimestamp = (await provider.getBlock(currentBlock)).timestamp;

      const transaction = await contract.setEndRewardTime(blockTimestamp);
      await transaction.wait();

      setToast("Set Success");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error: ", error);
      const msg = error.message;
      setErrorToast(msg);
    }
  }

  async function changeRewardBreakdown() {
    if (ethereum === undefined) {
      return;
    }
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.LOTTO666_ADDRESS,
        Lotto666.abi,
        signer
      );

      // [0, 15, 15, 15, 15, 40];
      //   const defaultList = [
      //     ethers.BigNumber.from(0),
      //     ethers.BigNumber.from(15),
      //     ethers.BigNumber.from(15),
      //     ethers.BigNumber.from(15),
      //     ethers.BigNumber.from(15),
      //     ethers.BigNumber.from(40),
      //   ];

      const testList = [
        ethers.BigNumber.from(20),
        ethers.BigNumber.from(10),
        ethers.BigNumber.from(10),
        ethers.BigNumber.from(10),
        ethers.BigNumber.from(10),
        ethers.BigNumber.from(40),
      ];

      const transaction = await contract.setRewardsBreakdown(testList);
      await transaction.wait();

      setToast("Set Success");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error: ", error);
      const msg = error.message;
      setErrorToast(msg);
    }
  }

  const stringToTicketNumber = (str: string) => {
    const list = str.split(",").reverse();
    let ticketNumber = BigNumber.from(0);
    for (let i = 0; i < list.length; i++) {
      const num = Number(list[i]) - 1;
      ticketNumber = ticketNumber.mul(66).add(BigNumber.from(num));
    }

    return ticketNumber;
  };

  const [pickDialogOpen, setPickDialogOpen] = useState(false);
  const [autoPickCount, setAutoPickCount] = useState(0);
  const onSelectNumbers = async (numbers: string[]) => {
    setPickDialogOpen(false);
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.LOTTO666_ADDRESS,
        Lotto666.abi,
        signer
      );
      const list: ethers.BigNumber[] = numbers.map((str) =>
        stringToTicketNumber(str)
      );
      const transaction = await contract.buyTickets(list);
      await transaction.wait();
      setToast("Buy Success! ");
      console.log("gas used: ", transaction.gasLimit.toString());
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error: ", error);
      const msg = error.message;
      setErrorToast(msg);
    }
  };

  async function changePrice() {
    if (ethereum === undefined) {
      return;
    }
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        config.LOTTO666_ADDRESS,
        Lotto666.abi,
        signer
      );

      const usdContract = new ethers.Contract(
        config.USD_TOKEN_ADDRESS,
        USDToken.abi,
        signer
      );

      const decimal = await usdContract.decimals();
      const price = ethers.utils.parseUnits("2.0", decimal);
      // console.log(price.toString());

      const transaction = await contract.setTicketPrice(price);
      await transaction.wait();

      setToast("Set Success");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error: ", error);
      const msg = error.message;
      setErrorToast(msg);
    }
  }

  if (supportedNetwork === undefined) {
    return (
      <Box sx={{ display: "flex" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (supportedNetwork === false) {
    return (
      <Box sx={{ display: "flex" }}>
        <Typography variant="h4" gutterBottom>
          Can not connect to MetaMask, please install MetaMask!
        </Typography>
      </Box>
    );
  }

  if (connectedAccount == undefined) {
    return (
      <Stack direction="column" spacing={2}>
        <Button variant="contained" onClick={connectMetaMask}>
          Connect to MetaMask
        </Button>
      </Stack>
    );
  }

  return (
    <Stack direction="column" spacing={2}>
      <Typography variant="h6" gutterBottom>
        Connected Address: {connectedAccount}
      </Typography>
      <Typography variant="h6" gutterBottom>
        USD Balance: {String(usdBalance)}
      </Typography>
      {lotteryStatus.length > 0 && (
        <Typography variant="h6" gutterBottom>
          Lottery status:
        </Typography>
      )}
      {lotteryStatus.length > 0 &&
        lotteryStatus.map((status, index) => {
          return (
            <Typography variant="body1" gutterBottom key={index}>
              {status}
            </Typography>
          );
        })}
      {ticketsList.length > 0 && (
        <Typography variant="h6" gutterBottom>
          My Tickets:
        </Typography>
      )}
      {ticketsList.length > 0 &&
        ticketsList.map((ticket, index) => {
          return (
            <Typography variant="body1" gutterBottom key={index}>
              {ticket}
            </Typography>
          );
        })}
      <Button variant="contained" onClick={requestBalance}>
        Refresh USD Balance
      </Button>
      <Button variant="contained" onClick={checkLotteryStatus}>
        Refresh Lottery Status
      </Button>

      <Button variant="contained" color="success" onClick={approveUSD}>
        approve USD
      </Button>
      <Button variant="contained" color="success" onClick={buyTickets}>
        buy Tickets
      </Button>

      {/* <Button
        variant="contained"
        color="success"
        onClick={getRandomTicketNumber}
      >
        get a random ticket number
      </Button> */}
      <Button variant="contained" color="success" onClick={buyARandomTicket}>
        Buy a random ticket
      </Button>
      <Button variant="contained" color="success" onClick={buyTenRandomTickets}>
        Buy ten random tickets
      </Button>
      <Button variant="contained" color="success" onClick={viewOwnedTickets}>
        View my tickets
      </Button>
      <Button variant="contained" color="success" onClick={checkClaimable}>
        Check my tickets
      </Button>
      <Button variant="contained" color="success" onClick={claimTickets}>
        claim Tickets
      </Button>

      <Button variant="contained" color="warning" onClick={resetForNewLottery}>
        reset For NewLottery
      </Button>
      <Button variant="contained" color="warning" onClick={startLottery}>
        start Lottery
      </Button>
      <Button variant="contained" color="warning" onClick={closeLottery}>
        close Lottery
      </Button>
      <Button variant="contained" color="warning" onClick={requestRandomness}>
        request Randomness
      </Button>
      <Button variant="contained" color="warning" onClick={revealRandomness}>
        reveal Randomness
      </Button>
      <Button variant="contained" color="error" onClick={changeStartTime}>
        change StartTime to past
      </Button>
      <Button variant="contained" color="error" onClick={changeEndTime}>
        change EndTime to past
      </Button>
      <Button variant="contained" color="error" onClick={changeRewardTime}>
        change RewardTime to past
      </Button>
      <Button variant="contained" color="error" onClick={changeRewardBreakdown}>
        change prize distribution
      </Button>
      <Button variant="contained" color="error" onClick={changePrice}>
        change price
      </Button>
      <LotterySelector
        open={pickDialogOpen}
        setOpen={setPickDialogOpen}
        onFinish={onSelectNumbers}
        generateRandomLottery={generateRandomLottery}
        autoPickCount={autoPickCount}
      />
      <Snackbar
        open={errorToast !== ""}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={() => setErrorToast("")}
      >
        <Alert
          onClose={() => setErrorToast("")}
          severity="error"
          sx={{ width: "100%" }}
        >
          {errorToast}
        </Alert>
      </Snackbar>
      <Snackbar
        open={toast !== ""}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={() => setToast("")}
      >
        <Alert
          onClose={() => setToast("")}
          severity="success"
          sx={{ width: "100%" }}
        >
          {toast}
        </Alert>
      </Snackbar>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Stack>
  );
}

export default TestPage;
