import Interface from "../components/interface"
import Script from "next/script"

const Index = () => {
    return (
        <div>
            <link rel="stylesheet" href="/css/bootstrap.min.css"></link>
            <Script src="/js/snarkjs.min.js" />
            <Interface />
        </div>
    )
}

export default Index
