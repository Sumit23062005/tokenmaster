import { useEffect, useState } from 'react'
import { ethers } from 'ethers'

// Components
import Navigation from './components/Navigation'
import Sort from './components/Sort'
import Card from './components/Card'
import SeatChart from './components/SeatChart'

// ABIs
import TokenMaster from './abis/TokenMaster.json'

// Config
import config from './config.json';

function App() {
  const [provider, setProvider] = useState(null)
  const [account, setAccount] = useState(null)
  const [tokenMaster, setTokenMaster] = useState(null)
  const [occasions, setOccasions] = useState([])
  const [occasion, setOccasion] = useState({})
  const [toggle, setToggle] = useState(false)

  const loadBlockchainData = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      setProvider(provider)

      // Prompt user to connect wallet
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      if (accounts.length > 0) {
        setAccount(ethers.utils.getAddress(accounts[0]))
      }

      const network = await provider.getNetwork()
      const chainId = String(network.chainId)
      const address = config[chainId]?.TokenMaster?.address

      console.log("Chain ID:", chainId);
      console.log("Config for chain:", config[chainId]);
      console.log("All config:", config);

      if (!address) {
        alert('Contract address not found for this network. Please connect MetaMask to the Hardhat local network.')
        return
      }

      // Use the correct ABI
      const tokenMaster = new ethers.Contract(address, TokenMaster.abi, provider)
      setTokenMaster(tokenMaster)

      const totalOccasions = await tokenMaster.totalOccasions()
      const occasions = []


      for (let i = 1; i <= totalOccasions; i++) {
        const occasion = await tokenMaster.getOccasion(i)
        occasions.push(occasion)
      }

      setOccasions(occasions)
    } catch (err) {
      console.error('Failed to load blockchain data:', err)
    }
  }

  useEffect(() => {
    loadBlockchainData()

    // Listen for account changes
    window.ethereum?.on('accountsChanged', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      if (accounts.length > 0) {
        setAccount(ethers.utils.getAddress(accounts[0]))
      } else {
        setAccount(null)
      }
    })

    // Cleanup listener on unmount
    return () => {
      window.ethereum?.removeAllListeners('accountsChanged')
    }
  }, [])

  return (
    <div>
      <header>
        <Navigation account={account} setAccount={setAccount} />
        <h2 className="header__title"><strong>Event</strong> Tickets</h2>
      </header>
      <Sort />
      <div className='cards'>
        {occasions.map((occasion, index) => (
          <Card
            occasion={occasion}
            id={index + 1}
            tokenMaster={tokenMaster}
            provider={provider}
            account={account}
            toggle={toggle}
            setToggle={setToggle}
            setOccasion={setOccasion}
            key={index}
          />
        ))}
      </div>
      {toggle && (
        <SeatChart
          occasion={occasion}
          tokenMaster={tokenMaster}
          provider={provider}
          setToggle={setToggle}
        />
      )}
    </div>
  )
}
console.log("App loaded!");
export default App