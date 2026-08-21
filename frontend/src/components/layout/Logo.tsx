import Image from "next/image";

export default function Logo() {
    return (
        <div className="flex h-10 w-10 items-center justify-center bg-white shadow-sm overflow-hidden">
            <Image
                src="/Logos/Hovuca-cropped.png"
                alt="Hovuca logo"
                width={36}
                height={36}
                className="object-contain w-auto h-auto"
            />
        </div>
    )
}