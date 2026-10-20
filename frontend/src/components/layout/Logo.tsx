import Image from "next/image";

export default function Logo() {
    return (
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden bg-brand-white shadow-sm">
            <Image
                src="/Hovuca.png"
                alt="HOVUCA logo"
                width={40}
                height={40}
                className="object-contain w-auto h-auto"
            />
        </div>
    )
}
