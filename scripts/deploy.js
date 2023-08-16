// deploy to fuji testnet
async function main() {
  // const usdFactory = await ethers.getContractFactory("USDToken");
  // const usdToken = await usdFactory.deploy();
  // await usdToken.deployed();
  // console.log(
  //   "usdToken Contract deployed to: ",
  //   usdToken.address,
  //   " on fuji testnet deployed by ",
  //   JSON.stringify(usdToken.signer)
  // );
  // const usdTokenAddress = usdToken.address;
  const usdTokenAddress = "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7";

  const randomFactory = await ethers.getContractFactory(
    "RandomNumberGenerator"
  );
  const randomGenerator = await randomFactory.deploy();
  await randomGenerator.deployed();
  console.log(
    "RandomNumberGenerator Contract deployed to: ",
    randomGenerator.address,
    " on fuji testnet deployed by ",
    JSON.stringify(randomGenerator.signer)
  );

  const lottoFactory = await ethers.getContractFactory("Lotto666");
  const lotto666 = await lottoFactory.deploy(
    usdTokenAddress,
    randomGenerator.address,
    "0x67E8284440A145cd812C2A6469A600c237cbC487"
  );
  await lotto666.deployed();
  console.log(
    "Lotto666 Contract deployed to: ",
    lotto666.address,
    " on fuji testnet deployed by ",
    JSON.stringify(lotto666.signer)
  );
  await randomGenerator.transferOwnership(lotto666.address);
  console.log("randomGenerator new owner:", await randomGenerator.owner());

  process.exit(0);

  //   RandomNumberGenerator Contract deployed to:  0xbd7e5989222De959D4f3f2b14F22a581961c8607  on fuji testnet deployed by  "<SignerWithAddress 0x67E8284440A145cd812C2A6469A600c237cbC487>"
  // Lotto666 Contract deployed to:  0xF67e9ED6EbD2D1D0ff71B4BdbC0EE086ED91bc57  on fuji testnet deployed by  "<SignerWithAddress 0x67E8284440A145cd812C2A6469A600c237cbC487>"
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
