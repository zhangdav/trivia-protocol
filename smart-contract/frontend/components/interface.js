import { useState } from "react"
import $u from "../utils/$u.js"
import { ethers } from "ethers"

const wc = require("../circuit/witness_calculator.js")

// Avalanche fuji
// 0x309EDfE14Cb366C5b5E2501B01FfA0F95A8FbB13
// 0xc0332e9c202d7ceD6ef7927394eee0E5e50b3F67
// 0x5574e61FE92d315Af0715AC3e3db6F61CD7934E7

const triviaAddress = "0x5574e61FE92d315Af0715AC3e3db6F61CD7934E7"
const usdcAddress = "0xCaC7Ffa82c0f43EBB0FC11FCd32123EcA46626cf"

const triviaJSON = require("../json/Trivia.json")
const triviaABI = triviaJSON.abi
const triviaInterface = new ethers.utils.Interface(triviaABI)

const usdcJSON = require("../json/Usdc.json")
const usdcABI = usdcJSON

const ButtonState = { Normal: 0, Loading: 1, Disabled: 2 }

const Interface = () => {
    const [account, updateAccount] = useState(null)
    const [proofElements, updateProofElements] = useState(null)
    const [proofStringEl, updateProofStringEl] = useState(null)
    const [textArea, updateTextArea] = useState(null)
    const [depositAmount, setDepositAmount] = useState("")

    // interface states
    const [section, updateSection] = useState("Deposit")
    const [displayCopiedMessage, updateDisplayCopiedMessage] = useState(false)
    const [withdrawalSuccessful, updateWithdrawalSuccessful] = useState(false)
    const [metamaskButtonState, updateMetamaskButtonState] = useState(ButtonState.Normal)
    const [depositButtonState, updateDepositButtonState] = useState(ButtonState.Normal)
    const [withdrawButtonState, updateWithdrawButtonState] = useState(ButtonState.Normal)

    const connectMetamask = async () => {
        try {
            updateMetamaskButtonState(ButtonState.Disabled)
            if (!window.ethereum) {
                alert("Please install Metamask to use this app.")
                throw "no-metamask"
            }

            var accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
            var chainId = window.ethereum.networkVersion

            if (chainId != 43113) {
                alert("Please switch to Avalanche fuji Testnet")
                throw "wrong-chain"
            }

            var activeAccount = accounts[0]
            var balance = await window.ethereum.request({
                method: "eth_getBalance",
                params: [activeAccount, "latest"],
            })
            balance = $u.moveDecimalLeft(ethers.BigNumber.from(balance).toString(), 18)

            var newAccountState = {
                chainId: chainId,
                address: activeAccount,
                balance: balance,
            }
            updateAccount(newAccountState)
        } catch (e) {
            console.log(e)
        }

        updateMetamaskButtonState(ButtonState.Normal)
    }

    const approveUSDC = async (amount) => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            const usdcContract = new ethers.Contract(usdcAddress, usdcABI, signer)

            const allowance = await usdcContract.allowance(account.address, triviaAddress)
            if (allowance.lt(amount)) {
                const tx = await usdcContract.approve(triviaAddress, amount)
                await tx.wait()
                console.log("USDC approved")
            }
        } catch (error) {
            console.error("USDC approval failed", error)
        }
    }

    const depositUSDC = async () => {
        updateDepositButtonState(ButtonState.Disabled)
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()

        const amount = ethers.utils.parseUnits(depositAmount, 6) // USDC typically has 6 decimals
        await approveUSDC(amount)

        const secret = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString()
        const nullifier = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString()

        const input = {
            secret: $u.BN256ToBin(secret).split(""),
            nullifier: $u.BN256ToBin(nullifier).split(""),
        }

        var res = await fetch("/deposit.wasm")
        var buffer = await res.arrayBuffer()
        var depositWC = await wc(buffer)

        const r = await depositWC.calculateWitness(input, 0)

        const commitment = r[1]
        const nullifierHash = r[2]

        const contract = new ethers.Contract(triviaAddress, triviaABI, signer)

        const estimatedGas = await contract.estimateGas.deposit(amount, commitment)
        console.log("Estimated Gas:", estimatedGas.toString())

        // const tx = {
        //     to: triviaAddress,
        //     from: account.address,
        //     data: triviaInterface.encodeFunctionData("deposit", [amount, commitment]),
        //     gasLimit: estimatedGas.add(ethers.BigNumber.from(100000)),
        // }

        try {
            // const txResponse = await signer.sendTransaction(tx)
            // const receipt = await txResponse.wait()
            // const txHash = receipt.transactionHash

            const txResponse = await contract.deposit(amount, commitment, {
                gasLimit: estimatedGas.add(ethers.BigNumber.from(100000)),
            })

            const receipt = await txResponse.wait()
            const txHash = receipt.transactionHash

            const proofElements = {
                nullifierHash: `${nullifierHash}`,
                secret: secret,
                nullifier: nullifier,
                commitment: `${commitment}`,
                txHash: txHash,
            }

            console.log(proofElements)

            updateProofElements(btoa(JSON.stringify(proofElements)))
        } catch (e) {
            console.log(e)
        }

        updateDepositButtonState(ButtonState.Normal)
    }

    const copyProof = () => {
        if (!!proofStringEl) {
            flashCopiedMessage()
            navigator.clipboard.writeText(proofStringEl.innerHTML)
        }
    }

    const withdraw = async () => {
        updateWithdrawButtonState(ButtonState.Disabled)
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()

        if (!textArea || !textArea.value) {
            alert("Please input the proof of deposit string.")
        }

        try {
            const proofString = textArea.value
            const proofElements = JSON.parse(atob(proofString))

            receipt = await window.ethereum.request({
                method: "eth_getTransactionReceipt",
                params: [proofElements.txHash],
            })
            if (!receipt) {
                throw "empty-receipt"
            }

            const log = receipt.logs[11]
            console.log("Log data:", log.data)
            console.log("Log topics:", log.topics)

            const decodedData = triviaInterface.decodeEventLog("Deposit", log.data, log.topics)
            console.log(decodedData)

            const SnarkJS = window["snarkjs"]

            const proofInput = {
                root: $u.BNToDecimal(decodedData.root),
                nullifierHash: proofElements.nullifierHash,
                recipient: $u.BNToDecimal(account.address),
                secret: $u.BN256ToBin(proofElements.secret).split(""),
                nullifier: $u.BN256ToBin(proofElements.nullifier).split(""),
                hashPairings: decodedData.hashPairings.map((n) => $u.BNToDecimal(n)),
                hashDirections: decodedData.pairDirection,
            }

            const { proof, publicSignals } = await SnarkJS.groth16.fullProve(
                proofInput,
                "/withdraw.wasm",
                "/setup_final.zkey",
            )

            const callInputs = [
                proof.pi_a.slice(0, 2).map($u.BN256ToHex),
                proof.pi_b.slice(0, 2).map((row) => $u.reverseCoordinate(row.map($u.BN256ToHex))),
                proof.pi_c.slice(0, 2).map($u.BN256ToHex),
                publicSignals.slice(0, 2).map($u.BN256ToHex),
            ]

            // const callData = triviaInterface.encodeFunctionData("withdraw", [0, ...callInputs])
            // const tx = {
            //     to: triviaAddress,
            //     from: account.address,
            //     data: callData,
            // }
            // const txHash = await window.ethereum.request({
            //     method: "eth_sendTransaction",
            //     params: [tx],
            // })

            const contract = new ethers.Contract(triviaAddress, triviaABI, signer)

            const estimatedGas = await contract.estimateGas.withdraw(0, ...callInputs)
            console.log("Estimated Gas:", estimatedGas.toString())

            const tx = {
                to: triviaAddress,
                from: account.address,
                data: triviaInterface.encodeFunctionData("withdraw", [0, ...callInputs]),
                gasLimit: estimatedGas.add(ethers.BigNumber.from(100000)),
            }

            try {
                const txResponse = await signer.sendTransaction(tx)
                const receipt = await txResponse.wait()
                // const txHash = receipt.transactionHash
            } catch (e) {
                console.log(e)
            }

            var receipt
            while (!receipt) {
                receipt = await window.ethereum.request({
                    method: "eth_getTransactionReceipt",
                    params: [txHash],
                })
                await new Promise((resolve, reject) => {
                    setTimeout(resolve, 1000)
                })
            }

            if (!!receipt) {
                updateWithdrawalSuccessful(true)
            }
        } catch (e) {
            console.log(e)
        }

        updateWithdrawButtonState(ButtonState.Normal)
    }

    const flashCopiedMessage = async () => {
        updateDisplayCopiedMessage(true)
        setTimeout(() => {
            updateDisplayCopiedMessage(false)
        }, 1000)
    }

    return (
        <div>
            <nav className="navbar navbar-nav fixed-top bg-dark text-light">
                {!!account ? (
                    <div className="container">
                        <div className="navbar-left">
                            <span>
                                <strong>ChainId:</strong>
                            </span>
                            <br />
                            <span>{account.chainId}</span>
                        </div>
                        <div className="navbar-right">
                            <span>
                                <strong>{account.address.slice(0, 12) + "..."}</strong>
                            </span>
                            <br />
                            <span className="small">
                                {account.balance.slice(0, 10) +
                                    (account.balance.length > 10 ? "..." : "")}{" "}
                                ETH
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="container">
                        <div className="navbar-left">
                            <h5>Trivia-Dex</h5>
                        </div>
                        <div className="navbar-right">
                            <button
                                className="btn btn-primary"
                                onClick={connectMetamask}
                                disabled={metamaskButtonState == ButtonState.Disabled}
                            >
                                Connect Metamask
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            <div style={{ height: "60px" }}></div>

            <div className="container" style={{ marginTop: 60 }}>
                <div className="card mx-auto" style={{ maxWidth: 450 }}>
                    {section == "Deposit" ? (
                        <img className="card-img-top" src="/img/deposit.png" />
                    ) : (
                        <img className="card-img-top" src="/img/withdraw.png" />
                    )}
                    <div className="card-body">
                        <div className="btn-group" style={{ marginBottom: 20 }}>
                            {section == "Deposit" ? (
                                <button className="btn btn-primary">Deposit</button>
                            ) : (
                                <button
                                    onClick={() => {
                                        updateSection("Deposit")
                                    }}
                                    className="btn btn-outline-primary"
                                >
                                    Deposit
                                </button>
                            )}
                            {section == "Deposit" ? (
                                <button
                                    onClick={() => {
                                        updateSection("Withdraw")
                                    }}
                                    className="btn btn-outline-primary"
                                >
                                    Withdraw
                                </button>
                            ) : (
                                <button className="btn btn-primary">Withdraw</button>
                            )}
                        </div>

                        {section == "Deposit" && !!account && (
                            <div>
                                {!!proofElements ? (
                                    <div>
                                        <div className="alert alert-success">
                                            <span>
                                                <strong>Proof of Deposit:</strong>
                                            </span>
                                            <div className="p-1" style={{ lineHeight: "12px" }}>
                                                <span
                                                    style={{ fontSize: 10 }}
                                                    ref={(proofStringEl) => {
                                                        updateProofStringEl(proofStringEl)
                                                    }}
                                                >
                                                    {proofElements}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <button className="btn btn-success" onClick={copyProof}>
                                                <span className="small">Copy Proof String</span>
                                            </button>
                                            {!!displayCopiedMessage && (
                                                <span className="small" style={{ color: "green" }}>
                                                    <strong> Copied!</strong>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="form-group">
                                            <label>Deposit Amount (USDC):</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={depositAmount}
                                                onChange={(e) => setDepositAmount(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            className="btn btn-success"
                                            onClick={depositUSDC}
                                            disabled={depositButtonState == ButtonState.Disabled}
                                        >
                                            <span className="small">Deposit USDC</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {section != "Deposit" && !!account && (
                            <div>
                                {withdrawalSuccessful ? (
                                    <div>
                                        <div className="alert alert-success p-3">
                                            <div>
                                                <span>
                                                    <strong>Success!</strong>
                                                </span>
                                            </div>
                                            <div style={{ marginTop: 5 }}>
                                                <span className="text-secondary">
                                                    Withdrawal successful. You can check your wallet
                                                    to verify your funds.
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="form-group">
                                            <label>Proof of Deposit:</label>
                                            <textarea
                                                className="form-control"
                                                style={{ resize: "none" }}
                                                ref={(ta) => {
                                                    updateTextArea(ta)
                                                }}
                                            ></textarea>
                                        </div>
                                        <button
                                            className="btn btn-primary"
                                            onClick={withdraw}
                                            disabled={withdrawButtonState == ButtonState.Disabled}
                                        >
                                            <span className="small">Withdraw</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {!account && (
                            <div>
                                <p>Please connect your wallet to use the sections.</p>
                            </div>
                        )}
                    </div>

                    <div className="card-footer p-4" style={{ lineHeight: "15px" }}>
                        <span className="small text-secondary" style={{ fontSize: "12px" }}>
                            <strong>Disclaimer:</strong> Products intended for educational purposes
                            are <i>not</i> to be used with commercial intent. NFTA, the organization
                            who sponsored the development of this project, explicitly prohibits and
                            assumes no responsibilities for losses due to such use.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Interface
