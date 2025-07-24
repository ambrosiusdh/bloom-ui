import { LoaderCircle } from "lucide-react";

export function Loader() {
    return (
        <div className="bloom-loader fixed w-full h-screen bg-white opacity-[0.5] top-0 left-0 z-50 flex items-center justify-center">
            <LoaderCircle className="blom-loader--icon animate-spin duration-300 w-12 h-12" />
        </div>
    )
}