import { useParams } from "react-router-dom"

export default function SaleDetail() {
    const {
        code
    } = useParams()

    return (
        <div>Sale Detail Page - { code }</div>
    )
}